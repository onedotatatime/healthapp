// Static boundaries for healthapp-assistant (MIN-4487): what it reads, what it logs, what it asks first.
// A scan of executable text (comments stripped), not behaviour.
import { assertEquals } from "jsr:@std/assert@1";

const ROOT = new URL("../", import.meta.url);
const code = (p: string) =>
  Deno.readTextFileSync(new URL(p, ROOT)).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "").replace(/\s\/\/.*$/gm, "");
const FILES = ["healthapp-assistant/handler.ts", "healthapp-assistant/index.ts", "_shared/assistant.ts", "_shared/assistant_pg.ts"];

Deno.test("env reads: only SUPABASE_* and the two HEALTHAPP_GEMINI_* names, by literal", () => {
  for (const f of FILES) {
    for (const m of code(f).matchAll(/Deno\.env\.get\(\s*([^)]*)\)/g)) {
      assertEquals(/^"(SUPABASE_[A-Z_]+|HEALTHAPP_GEMINI_API_KEY|HEALTHAPP_GEMINI_MODEL)"$/.test(m[1].trim()), true, `${f}: ${m[1]}`);
    }
  }
});

Deno.test("the handler checks the session and the doctor role before it reads or calls anything", () => {
  const src = code("healthapp-assistant/handler.ts");
  const auth = src.indexOf('authenticate(req, deps, ["doctor"])');
  assertEquals(auth > 0, true);
  for (const m of src.matchAll(/deps\.(store|generate)\.?\w*\(/g)) assertEquals((m.index ?? 0) > auth, true, m[0]);
});

Deno.test("the record is read only through the live-grant predicate, with the grant and the doctor as parameters", () => {
  const pg = code("_shared/assistant_pg.ts");
  const [grantPart, recordPart] = pg.split("async record(");
  const live = "status = 'active' and revoked_at is null and expires_at > now()";
  assertEquals([grantPart.includes(live), recordPart.includes(live)], [true, true]); // in grantState and, inside the same transaction, in record
  assertEquals(pg.includes("d.status = 'confirmed'"), true);
  assertEquals(pg.includes('env === "demo" ? "healthapp_demo" : "healthapp_dev"'), true);
  assertEquals(/\$\{(?!S\}|schema|ROW_CAP|DIARY_TZ)[a-zA-Z.]+\}/.test(pg.replace(/`[^`]*\$\{S\}[^`]*`/g, "")), false);
});

Deno.test("the context sent to the model has no name, ID, patient or row uuid field", () => {
  const src = code("_shared/assistant.ts");
  assertEquals(/full_name|printed_|national_id|patient_id|\.id\b/.test(src.split("export function buildFacts")[1].split("export const ASK_SYSTEM")[0].replace(/factOf\([^)]*\.id,/g, "")), false);
});

Deno.test("logs carry codes and counts, never the question, the record or the answer", () => {
  for (const m of code("healthapp-assistant/handler.ts").matchAll(/log\(\s*(\{[\s\S]*?\})\s*\)/g)) {
    assertEquals(/question|text|segments:|answer|rec\b|facts:\s*[^s]/.test(m[1].replace(/segments: out\.segments\.length|facts: facts\.size/g, "")), false, m[1].slice(0, 80));
  }
});
