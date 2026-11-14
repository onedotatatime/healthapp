// deno-lint-ignore-file no-explicit-any
// Runs the file analysis (MIN-4549, direction 3) once over the files a synthetic dev patient already has stored:
// signs in through healthapp-demo-login (dev passcode), lists the patient's documents that have a stored file,
// and calls healthapp-extract-exam { doc_id, analyse_only: true } for each. Prints counts and error codes only,
// never a value, a word of a file or a path. DEV ONLY: on demo nobody runs this; the founder's files arrive after
// the gate and each is analysed on upload (CTO, MIN-4548 §4).
//
//   SUPABASE_ANON_KEY=... HEALTHAPP_DEMO_PASSCODE=... deno run --node-modules-dir=none --allow-env --allow-net \
//     scripts/analyse-files.ts [--persona patient|patient2]
const args = Deno.args;
const persona = args.includes("--persona") ? args[args.indexOf("--persona") + 1] : "patient";
if (persona !== "patient" && persona !== "patient2") throw new Error("persona must be patient or patient2");
const ENV = "dev";
const URL_ = Deno.env.get("SUPABASE_URL") ?? "https://fnbnhvgrnkrbsrwhgcgc.supabase.co";
const ANON = Deno.env.get("SUPABASE_ANON_KEY"), CODE = Deno.env.get("HEALTHAPP_DEMO_PASSCODE");
if (!ANON || !CODE) throw new Error("SUPABASE_ANON_KEY and HEALTHAPP_DEMO_PASSCODE are required");

const login = await fetch(`${URL_}/functions/v1/healthapp-demo-login`, {
  method: "POST", headers: { apikey: ANON, "content-type": "application/json", "x-healthapp-env": ENV },
  body: JSON.stringify({ persona, passcode: CODE }),
});
const token = (await login.json()).access_token as string | undefined;
if (!token) throw new Error(`sign-in failed: ${login.status}`);

const list = await fetch(`${URL_}/rest/v1/documents?select=id&storage_path=not.is.null`, {
  headers: { apikey: ANON, authorization: `Bearer ${token}`, "accept-profile": `healthapp_${ENV}` },
});
if (!list.ok) throw new Error(`list failed: ${list.status}`);
const docs = (await list.json()) as { id: string }[];

const outcome: Record<string, number> = {};
let items = 0;
for (const d of docs) {
  const t0 = performance.now();
  const r = await fetch(`${URL_}/functions/v1/healthapp-extract-exam`, {
    method: "POST",
    headers: { apikey: ANON, authorization: `Bearer ${token}`, "content-type": "application/json", "x-healthapp-env": ENV },
    body: JSON.stringify({ doc_id: d.id, analyse_only: true }),
  });
  const j: any = await r.json().catch(() => null);
  const key = r.status === 200 ? `${j.status}${j.error_code ? `:${j.error_code}` : ""}` : `http_${r.status}`;
  outcome[key] = (outcome[key] ?? 0) + 1;
  items += j?.items_count ?? 0;
  console.log(`${key}  items=${j?.items_count ?? "-"}  ${Math.round(performance.now() - t0)} ms`);
}
console.log(JSON.stringify({ files: docs.length, outcome, items_total: items }));
