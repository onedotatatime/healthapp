// MIN-4674: wiring only. The fetch-only entry of the boxd SDK (the default entry needs Node's http2 and does not load here).
// The key is read here, once per request, and goes nowhere but the SDK's Authorization exchange.
import { Boxd } from "npm:@boxd-sh/sdk@0.3.2/web";
import { auth } from "../_shared/blobs.ts";
import { safely } from "../_shared/http.ts";
import { allowTry, pgStore, releaseSimulateLock, takeSimulateLock } from "../_shared/pgstore.ts";
import { type BoxdPort, makeHandler } from "./handler.ts";

/** One deadline for every boxd call (8 s, no retry): the run as a whole stops at 20 s. */
const CALL_MS = 8000;

function sdkPort(apiKey: string): BoxdPort {
  const { machines } = new Boxd({ apiKey, timeout: CALL_MS, maxRetries: 0 });
  return {
    async create(p) {
      const m = await machines.create({ name: p.name, shared: p.shared, deleteAfter: p.deleteAfter });
      return { id: m.id, name: m.name, region: m.region, vcpu: m.resources.vcpu, memoryBytes: m.resources.memoryBytes };
    },
    async waitUntilReady(id) {
      await machines.waitUntilReady(id, { timeout: CALL_MS });
    },
    async exec(id, command) {
      const r = await machines.exec(id, { command, timeout: CALL_MS });
      return { exitCode: r.exitCode, stdout: r.stdout };
    },
    async upload(id, path, content) {
      await machines.files.upload(id, path, new TextEncoder().encode(content));
    },
    download: (id, path) => machines.files.download(id, path),
    remove: (id) => machines.delete(id),
  };
}

Deno.serve(safely(makeHandler({
  auth,
  store: { roleOf: pgStore.roleOf },
  setting: () => Deno.env.get("HEALTHAPP_SIMULATE_LIVE") ?? undefined,
  boxd: () => {
    const key = Deno.env.get("HEALTHAPP_BOXD_API_KEY");
    return key ? sdkPort(key) : null;
  },
  takeLock: takeSimulateLock,
  releaseLock: releaseSimulateLock,
  // One pool of credit for both environments: the lock and the cap always live in healthapp_dev.rate_events.
  allowDay: (key, max, seconds) => allowTry("dev", key, max, seconds),
  now: () => Date.now(),
  background: (work) => {
    // deno-lint-ignore no-explicit-any
    const rt = (globalThis as any).EdgeRuntime as { waitUntil(p: Promise<unknown>): void } | undefined;
    if (rt) rt.waitUntil(work);
    else void work; // local serve: runs to completion with the process
  },
  log: (l) => console.log(JSON.stringify(l)),
}), "simulate-live"));
