// Static boundaries for healthapp-diagnoses (MIN-4662; CTO decision on MIN-4660 §3, §4): who is asked first, what it
// reads, what it logs, which environment names it reads, and where the model is called. A scan of executable text
// (comments stripped), not behaviour.
import { assertEquals } from "jsr:@std/assert@1";

const ROOT = new URL("../", import.meta.url);
const code = (p: string) =>
  Deno.readTextFileSync(new URL(p, ROOT)).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "").replace(/\s\/\/.*$/gm, "");
const FILES = ["healthapp-diagnoses/handler.ts", "healthapp-diagnoses/index.ts", "_shared/diagnoses.ts"];

Deno.test("env reads: only SUPABASE_*, the two HEALTHAPP_GEMINI_* names and HEALTHAPP_DIAGNOSES_ENVS, by literal", () => {
  let seen = 0;
  for (const f of FILES) {
    for (const m of code(f).matchAll(/Deno\.env\.get\(\s*([^)]*)\)/g)) {
      seen++;
      assertEquals(/^"(SUPABASE_[A-Z_]+|HEALTHAPP_GEMINI_API_KEY|HEALTHAPP_GEMINI_MODEL|HEALTHAPP_DIAGNOSES_ENVS)"$/.test(m[1].trim()), true, `${f}: ${m[1]}`);
    }
  }
  assertEquals(seen >= 3, true); // the scan found the reads it is meant to police
  assertEquals(code("healthapp-diagnoses/index.ts").includes('Deno.env.get("HEALTHAPP_DIAGNOSES_ENVS")'), true);
  assertEquals(/Deno\.env/.test(code("healthapp-diagnoses/handler.ts") + code("_shared/diagnoses.ts")), false); // pure files read no env
});

Deno.test("the handler checks the session and the doctor role before it reads, decides the environment switch or calls anything", () => {
  const src = code("healthapp-diagnoses/handler.ts");
  const auth = src.indexOf('authenticate(req, deps, ["doctor"])');
  assertEquals(auth > 0, true);
  for (const m of src.matchAll(/deps\.(store|generate|enabledEnvs)\.?\w*\(/g)) assertEquals((m.index ?? 0) > auth, true, m[0]);
});

Deno.test("the switch is decided before any read and any model call", () => {
  const src = code("healthapp-diagnoses/handler.ts");
  const off = src.indexOf("deps.enabledEnvs()");
  assertEquals(off > 0, true);
  for (const m of src.matchAll(/deps\.(store|generate)\.?\w*\(/g)) assertEquals((m.index ?? 0) > off, true, m[0]);
  assertEquals(src.includes('answer("off", [], false, ZERO)'), true);
});

Deno.test("the record comes from the assistant's loader (the live-grant predicate), and nothing is written", () => {
  assertEquals(code("healthapp-diagnoses/index.ts").includes("...assistantPg"), true);
  for (const f of FILES) assertEquals(/\b(insert|update|delete|truncate|alter|create|drop)\b\s+(into|from|table|set)?/i.test(code(f).replace(/\bcreate\w*\(/g, "")), false, f);
  assertEquals(/\bpostgres\b|\.unsafe\(|\bsql`/.test(FILES.map(code).join("\n")), false); // no query of its own
});

Deno.test("the context sent to the model is built by buildFacts and holds no name, ID, patient or row uuid field", () => {
  const guard = code("_shared/diagnoses.ts");
  const prompt = guard.slice(guard.indexOf("export const DIAGNOSES_SYSTEM"), guard.indexOf("const NAME_RANK"));
  assertEquals(prompt.length > 500, true); // the scan found the prompt section
  assertEquals(/full_name|printed_|national_id|patient_id|\.id\b/.test(prompt), false);
  const h = code("healthapp-diagnoses/handler.ts");
  assertEquals(h.includes("buildFacts(rec)"), true);
  const generate = h.slice(h.indexOf("deps.generate({"), h.indexOf("});", h.indexOf("deps.generate({")));
  assertEquals(generate.replace(/\s+/g, " ").trim(), "deps.generate({ system: DIAGNOSES_SYSTEM, parts: diagnosesParts(facts, failures), schema: ModelDiagnoses, timeoutMs: Math.max(5_000, left - 1_000), maxAttempts: 2,");
});

Deno.test("the log carries codes and counts, never text: every log call is built from the counts and the fixed keys", () => {
  const src = code("healthapp-diagnoses/handler.ts");
  const body = src.match(/deps\.log\(\{([\s\S]*?)\}\)/)![1];
  assertEquals(
    body.replace(/\s+/g, " ").trim(),
    'fn: "diagnoses", env: who.env, status, facts: c.facts, items: c.items, citations: c.citations, guard_drops: c.guard_drops, attempts, model, ...extra, ms: deps.now() - started,',
  );
  for (const m of src.matchAll(/\blog\(\s*("[a-z_]+")[^;]*;/g)) {
    assertEquals(/\.name\b|\.text\b|\.fits\b|\.cites\b|not_in_record|items\[|\bitems\.map|failures|best\.items/.test(m[0]), false, m[0].slice(0, 80));
  }
  assertEquals(/\{\s*kind,\s*http:/.test(src), true); // the only extra: a code and an HTTP status
});

Deno.test("the contract has no number, rank or probability field and no verdict word in the diagnoses block", () => {
  const src = code("_shared/contract.ts");
  const block = src.slice(src.indexOf("export const DIAGNOSES_MAX_ITEMS"), src.indexOf("export type DiagnosesResponse"));
  assertEquals(block.includes("z.strictObject({"), true);
  assertEquals(/score|rank|probab|likelih|confidence|percent|severity|urgen|advice/i.test(block), false);
  assertEquals((block.match(/z\.object\(/g) ?? []).length, 0); // every object is strict
  assertEquals((block.match(/z\.number\(\)/g) ?? []).length, 5); // only the five counts are numbers
});

Deno.test("only the diagnoses function imports the diagnoses guard; no other function, and no patient-facing one, can reach it", () => {
  const users: string[] = [];
  for (const e of Deno.readDirSync(ROOT)) {
    if (!e.isDirectory || !e.name.startsWith("healthapp-")) continue;
    for (const f of Deno.readDirSync(new URL(`${e.name}/`, ROOT))) {
      if (!f.name.endsWith(".ts") || f.name.endsWith("_test.ts")) continue;
      if (/diagnoses\.ts/.test(code(`${e.name}/${f.name}`))) { users.push(e.name); break; }
    }
  }
  assertEquals(users, ["healthapp-diagnoses"]);
});
