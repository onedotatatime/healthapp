// The real GrantStore (MIN-4484): Postgres over SUPABASE_DB_URL, not PostgREST. healthapp_<env> is not
// in the Data API's exposed schemas, and this keeps working whether or not it ever is. It runs as the
// database owner, so RLS does not apply to it: every statement below ties the row to the caller
// (patient_id or doctor_id = the verified session user), and the handler has already checked the role.
// Every transition is one atomic statement under a row lock, and "now" is always the database's.
// The schema name comes from the validated env (dev | demo), never from input. Values are parameters.
import postgres from "npm:postgres@3.4.5";
import { adminClient } from "./admin.ts";
import type { GrantView, HealthappEnv } from "./contract.ts";
import type { Auth, GrantStore, Role } from "./grants.ts";

type Sql = postgres.Sql;
let _sql: Sql | null = null;
function db(): Sql {
  if (!_sql) {
    const url = Deno.env.get("SUPABASE_DB_URL");
    if (!url) throw new Error("SUPABASE_DB_URL missing");
    _sql = postgres(url, { max: 1, prepare: false, idle_timeout: 20, connect_timeout: 10 });
  }
  return _sql;
}
const schema = (env: HealthappEnv) => (env === "demo" ? "healthapp_demo" : "healthapp_dev");
// deno-lint-ignore no-explicit-any
type Q = { unsafe: (q: string, p?: any[]) => any };

const iso = (d: Date | string | null) => (d === null ? null : new Date(d).toISOString());

const VIEW = (S: string) =>
  `select g.id, g.status, g.requested_at, g.approved_at, g.expires_at, g.revoked_at,
          p.id as p_id, p.full_name as p_name, p.specialty as p_spec,
          d.id as d_id, d.full_name as d_name, d.specialty as d_spec, clock_timestamp() as server_now
     from ${S}.grants g
     join ${S}.profiles p on p.id = g.patient_id
     join ${S}.profiles d on d.id = g.doctor_id`;

// deno-lint-ignore no-explicit-any
function toView(r: any): { grant: GrantView; server_now: string } {
  const now = new Date(r.server_now).getTime();
  // Lazy expiry as a second line: whatever the stored status, past expires_at it is over.
  const over = (r.status === "pending" || r.status === "active") && r.expires_at && new Date(r.expires_at).getTime() <= now;
  return {
    server_now: iso(r.server_now)!,
    grant: {
      grant_id: r.id,
      status: over ? "expired" : r.status,
      requested_at: iso(r.requested_at)!,
      approved_at: iso(r.approved_at),
      expires_at: iso(r.expires_at),
      revoked_at: iso(r.revoked_at),
      patient: { id: r.p_id, full_name: r.p_name, specialty: r.p_spec ?? null },
      doctor: { id: r.d_id, full_name: r.d_name, specialty: r.d_spec ?? null },
    },
  };
}

async function envelope(tx: Q, S: string, grantId: string) {
  const rows = await tx.unsafe(`${VIEW(S)} where g.id = $1`, [grantId]);
  return toView(rows[0]);
}

/** Ends this person's stale grants (lazy expiry). Realtime sees the update. */
async function endStale(tx: Q, S: string, uid: string) {
  await tx.unsafe(
    `update ${S}.grants set status = 'expired'
      where (patient_id = $1 or doctor_id = $1) and status in ('pending', 'active') and expires_at <= now()`,
    [uid],
  );
}

export const grantStore: GrantStore = {
  async roleOf(env, uid) {
    const rows = await db().unsafe(`select role from ${schema(env)}.profiles where id = $1`, [uid]);
    const role = rows[0]?.role;
    return role === "patient" || role === "doctor" ? (role as Role) : null;
  },

  async createToken(env, patientId, jti, shortCode, ttlSeconds) {
    const S = schema(env);
    try {
      return await db().begin(async (tx) => {
        await tx.unsafe(
          `update ${S}.handshake_tokens set expires_at = now()
            where patient_id = $1 and used_at is null and expires_at > now()`,
          [patientId],
        );
        const rows = await tx.unsafe(
          `insert into ${S}.handshake_tokens (jti, short_code, patient_id, expires_at)
           values ($1, $2, $3, now() + make_interval(secs => $4::double precision))
           returning expires_at, clock_timestamp() as server_now`,
          [jti, shortCode, patientId, ttlSeconds],
        );
        return { expires_at: iso(rows[0].expires_at)!, server_now: iso(rows[0].server_now)! };
      });
    } catch (e) {
      if ((e as { code?: string }).code === "23505") return "taken";
      throw e;
    }
  },

  async failedClaims(env, doctorKey, windowSeconds) {
    const rows = await db().unsafe(
      `select count(*)::int as n from ${schema(env)}.rate_events
        where kind = 'handshake_claim' and key = $1 and at >= now() - make_interval(secs => $2::double precision)`,
      [doctorKey, windowSeconds],
    );
    return rows[0].n as number;
  },

  async recordFailedClaim(env, doctorKey) {
    await db().unsafe(`insert into ${schema(env)}.rate_events (kind, key) values ('handshake_claim', $1)`, [doctorKey]);
  },

  claim(env, doctorId, key, pendingSeconds) {
    const S = schema(env);
    return db().begin(async (tx) => {
      const [col, val] = "jti" in key ? ["jti", key.jti] : ["short_code", key.short_code];
      const t = (await tx.unsafe(
        `select jti, patient_id, used_at is not null as used, expires_at <= now() as lapsed
           from ${S}.handshake_tokens where ${col} = $1 for update`,
        [val],
      ))[0];
      if (!t) return { kind: "invalid" as const };
      if (t.used) return { kind: "used" as const };
      if (t.lapsed) return { kind: "expired" as const };
      await tx.unsafe(`update ${S}.handshake_tokens set used_at = now(), used_by = $1 where jti = $2`, [doctorId, t.jti]);
      // A stale open row of this pair would block the unique index: end it first.
      await tx.unsafe(
        `update ${S}.grants set status = 'expired'
          where patient_id = $1 and doctor_id = $2 and status in ('pending', 'active') and expires_at <= now()`,
        [t.patient_id, doctorId],
      );
      const open = (await tx.unsafe(
        `select id, status from ${S}.grants
          where patient_id = $1 and doctor_id = $2 and status in ('pending', 'active') for update`,
        [t.patient_id, doctorId],
      ))[0];
      let gid: string;
      if (open) {
        gid = open.id;
        // Same pair, request still open: give it a fresh window instead of stacking a second row.
        if (open.status === "pending") {
          await tx.unsafe(
            `update ${S}.grants set expires_at = now() + make_interval(secs => $2::double precision) where id = $1`,
            [gid, pendingSeconds],
          );
        }
      } else {
        const ins = await tx.unsafe(
          `insert into ${S}.grants (patient_id, doctor_id, status, expires_at)
           values ($1, $2, 'pending', now() + make_interval(secs => $3::double precision)) returning id`,
          [t.patient_id, doctorId, pendingSeconds],
        );
        gid = ins[0].id;
      }
      return { kind: "ok" as const, envelope: await envelope(tx, S, gid) };
    });
  },

  decide(env, patientId, grantId, approve, grantSeconds) {
    const S = schema(env);
    return db().begin(async (tx) => {
      const g = (await tx.unsafe(
        `select status, expires_at <= now() as lapsed from ${S}.grants where id = $1 and patient_id = $2 for update`,
        [grantId, patientId],
      ))[0];
      if (!g) return { kind: "not_found" as const };
      const open = g.status === "pending" || g.status === "active";
      if (open && g.lapsed) {
        await tx.unsafe(`update ${S}.grants set status = 'expired' where id = $1`, [grantId]);
        return { kind: "ended" as const };
      }
      if (g.status === "pending") {
        if (approve) {
          await tx.unsafe(
            `update ${S}.grants set status = 'active', approved_at = now(),
                    expires_at = now() + make_interval(secs => $2::double precision), revoked_at = null
              where id = $1`,
            [grantId, grantSeconds],
          );
        } else {
          await tx.unsafe(`update ${S}.grants set status = 'refused' where id = $1`, [grantId]);
        }
        return { kind: "ok" as const, envelope: await envelope(tx, S, grantId) };
      }
      if (g.status === "active" && approve) return { kind: "ok" as const, envelope: await envelope(tx, S, grantId) };
      if (g.status === "refused" && !approve) return { kind: "ok" as const, envelope: await envelope(tx, S, grantId) };
      if (g.status === "active") return { kind: "wrong_state" as const };
      return { kind: "ended" as const };
    });
  },

  revoke(env, patientId, grantId) {
    const S = schema(env);
    return db().begin(async (tx) => {
      const g = (await tx.unsafe(
        `select status, expires_at <= now() as lapsed from ${S}.grants where id = $1 and patient_id = $2 for update`,
        [grantId, patientId],
      ))[0];
      if (!g) return { kind: "not_found" as const };
      const open = g.status === "pending" || g.status === "active";
      if (open && g.lapsed) {
        await tx.unsafe(`update ${S}.grants set status = 'expired' where id = $1`, [grantId]);
        return { kind: "ended" as const };
      }
      if (open) {
        await tx.unsafe(`update ${S}.grants set status = 'revoked', revoked_at = now() where id = $1`, [grantId]);
        return { kind: "ok" as const, envelope: await envelope(tx, S, grantId) };
      }
      if (g.status === "revoked") return { kind: "ok" as const, envelope: await envelope(tx, S, grantId) };
      return { kind: "ended" as const };
    });
  },

  status(env, uid, grantId) {
    const S = schema(env);
    return db().begin(async (tx) => {
      await endStale(tx, S, uid);
      const rows = grantId
        ? await tx.unsafe(`${VIEW(S)} where g.id = $1 and (g.patient_id = $2 or g.doctor_id = $2)`, [grantId, uid])
        : await tx.unsafe(
          `${VIEW(S)} where g.status in ('pending', 'active') and (g.patient_id = $1 or g.doctor_id = $1)
            order by g.requested_at desc limit 1`,
          [uid],
        );
      if (rows.length === 0) {
        if (grantId) return { kind: "not_found" as const };
        const t = await tx.unsafe(`select clock_timestamp() as server_now`);
        return { kind: "ok" as const, grant: null, server_now: iso(t[0].server_now)! };
      }
      const v = toView(rows[0]);
      return { kind: "ok" as const, grant: v.grant, server_now: v.server_now };
    });
  },
};

export const sessionAuth: Auth = {
  async verify(token) {
    const { data, error } = await adminClient().auth.getUser(token);
    return error || !data.user ? null : data.user.id;
  },
};
