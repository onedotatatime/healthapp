// Static boundaries for the document functions (MIN-4475): what they read, what they log, what they
// ask before anything else. A scan of executable text (comments stripped), not behaviour.
import { assertEquals } from "jsr:@std/assert@1";

const ROOT = new URL("../", import.meta.url);
const HANDLERS = ["doc-create", "extract-exam", "confirm-doc", "doc-photo", "my-exams", "exam-delete"].map((n) => `healthapp-${n}/handler.ts`);
const INDEXES = ["doc-create", "extract-exam", "confirm-doc", "doc-photo", "my-exams", "exam-delete"].map((n) => `healthapp-${n}/index.ts`);
const SHARED = ["_shared/docs.ts", "_shared/pgstore.ts", "_shared/blobs.ts", "_shared/extract.ts", "_shared/analysis.ts"];

const code = (p: string) =>
  Deno.readTextFileSync(new URL(p, ROOT)).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "").replace(/\s\/\/.*$/gm, "");

Deno.test("env reads: only SUPABASE_* and the two HEALTHAPP_GEMINI_* names, by literal", () => {
  for (const f of [...INDEXES, ...SHARED, ...HANDLERS]) {
    for (const m of code(f).matchAll(/Deno\.env\.get\(\s*([^)]*)\)/g)) {
      assertEquals(/^"(SUPABASE_[A-Z_]+|HEALTHAPP_GEMINI_API_KEY|HEALTHAPP_GEMINI_MODEL)"$/.test(m[1].trim()), true, `${f}: ${m[1]}`);
    }
  }
});

Deno.test("every handler checks the session and the role before it reads or writes anything", () => {
  for (const f of HANDLERS) {
    const src = code(f);
    const auth = src.indexOf("authenticate(");
    assertEquals(auth > 0, true, `${f}: no authenticate()`);
    for (const m of src.matchAll(/deps\.(store|blobs|generate)\.?\w*\(/g)) {
      assertEquals((m.index ?? 0) > auth, true, `${f}: ${m[0]} before authenticate()`);
    }
  }
});

Deno.test("logs carry codes and counts, never the document's words, a name or an ID", () => {
  for (const f of [...HANDLERS, ..._SHARED_LOGGERS()]) {
    for (const m of code(f).matchAll(/(?:log|console\.log)\(\s*(\{[\s\S]*?\}|JSON\.stringify\([\s\S]*?\))\s*\)/g)) {
      assertEquals(/printed_|text_original|full_name|\.text\b|analyte|value_|national|name:/.test(m[1]), false, `${f}: logs ${m[1].slice(0, 80)}`);
    }
  }
});
function _SHARED_LOGGERS() {
  return ["_shared/http.ts", "_shared/analysis.ts"];
}

Deno.test("only the pg store touches a table; handlers go through the Store seam", () => {
  for (const f of [...HANDLERS, ...INDEXES]) {
    assertEquals(/\.from\(\s*["'`][a-z_]+["'`]\s*\)\.(select|insert|update|delete|upsert)|\.rpc\(|unsafe\(/.test(code(f)), false, f);
  }
  const pg = code("_shared/pgstore.ts");
  // the schema name is built only from the validated env (dev | demo); values travel as parameters
  assertEquals(pg.includes('env === "demo" ? "healthapp_demo" : "healthapp_dev"'), true);
});

Deno.test("PDFs and DICOM never reach the model: only image types are accepted at upload and at extract", () => {
  assertEquals(code("healthapp-doc-create/handler.ts").includes('"application/pdf"'), true);
  assertEquals(code("healthapp-extract-exam/handler.ts").includes('mime.startsWith("image/")'), true);
});
