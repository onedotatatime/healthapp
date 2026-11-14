// Static boundaries for healthapp-over-time (MIN-4551; CTO decision on MIN-4548): no model, nothing written,
// the assistant's live-grant loader, the doctor role checked first, five integers in the log.
import { assertEquals } from "jsr:@std/assert@1";

const ROOT = new URL("../", import.meta.url);
const code = (p: string) =>
  Deno.readTextFileSync(new URL(p, ROOT)).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "").replace(/\s\/\/.*$/gm, "");
const FILES = ["healthapp-over-time/handler.ts", "healthapp-over-time/index.ts", "_shared/overtime.ts"];

Deno.test("the over-time function does not import the model module, or anything that calls a model", () => {
  for (const f of FILES) {
    const src = code(f);
    assertEquals(/model\.ts|generateJson|GEMINI|fetch\(/.test(src), false, f);
    // a side-effect import or a dynamic import could name it too; list every import path and check it
    for (const m of src.matchAll(/(?:from\s+|import\s*\(?\s*)["']([^"']+)["']/g)) {
      assertEquals(["../_shared/model.ts", "./model.ts"].includes(m[1]) || /model/.test(m[1]), false, `${f}: ${m[1]}`);
    }
  }
});

Deno.test("nothing is written: no insert, update, delete or DDL anywhere in its files, and it reads through the assistant's loader", () => {
  for (const f of FILES) assertEquals(/\b(insert|update|delete|truncate|alter|create|drop)\b\s+(into|from|table|set)?/i.test(code(f).replace(/\bcreate\w*\(/g, "")), false, f);
  assertEquals(code("healthapp-over-time/index.ts").includes("...assistantPg"), true);
});

Deno.test("env reads: only SUPABASE_* names, by literal; the function reads none itself", () => {
  for (const f of FILES) for (const m of code(f).matchAll(/Deno\.env\.get\(\s*([^)]*)\)/g)) assertEquals(/^"SUPABASE_[A-Z_]+"$/.test(m[1].trim()), true, `${f}: ${m[1]}`);
});

Deno.test("the handler checks the session and the doctor role before it reads anything", () => {
  const src = code("healthapp-over-time/handler.ts");
  const auth = src.indexOf('authenticate(req, deps, ["doctor"])');
  assertEquals(auth > 0, true);
  for (const m of src.matchAll(/deps\.store\.\w+\(/g)) assertEquals((m.index ?? 0) > auth, true, m[0]);
});

Deno.test("the log carries only fn and the five counts, taken from the counts object", () => {
  const src = code("healthapp-over-time/handler.ts");
  const body = src.match(/deps\.log\(\{([\s\S]*?)\}\)/)![1];
  assertEquals(body.replace(/\s+/g, " ").trim(), 'fn: "over-time", records_read: c.records_read, values_with_series: c.values_with_series, projections_computed: c.projections_computed, series_excluded: c.series_excluded, errors: c.errors,');
});

Deno.test("the response contract has no range-crossing field and no verdict word", () => {
  const src = code("_shared/contract.ts").split("healthapp-over-time")[1].split("Possible matches")[0];
  assertEquals(/cross|score|rank|rising|falling|improv|worsen|trend|cause|advice|diagnos/i.test(src), false);
});
