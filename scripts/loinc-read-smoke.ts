// One live Gemini read of a synthetic exam with the LOINC list, exactly as healthapp-extract-exam sends it (MIN-4689):
// the same system prompt, schema, parts, budget and retry, then the server's own build() validation. No deploy, no
// database write. The list is 020's seed (the table equals it: 020 refuses to commit otherwise). Prints counts, the
// chosen codes and timings, never a word of the document. Synthetic documents only (tests/synthetic/docs).
//   HEALTHAPP_GEMINI_API_KEY=... [LOINC_DROP=code,code] deno run --allow-env --allow-net --allow-read scripts/loinc-read-smoke.ts <synthetic.jpg>
import { bytesToBase64 } from "../supabase/functions/_shared/b64.ts";
import { build, EXTRACT_SYSTEM, type LoincRow, loincListText, ModelExtract } from "../supabase/functions/_shared/extract.ts";
import { generateJson, ModelError } from "../supabase/functions/_shared/model.ts";
import { READ_BUDGET_MS } from "../supabase/functions/healthapp-extract-exam/handler.ts";

const path = Deno.args[0];
if (!/tests\/synthetic\//.test(path)) throw new Error("synthetic documents only (tests/synthetic/...)");
const sql = await Deno.readTextFile(new URL("../supabase/sql/020_lab_loinc.sql", import.meta.url));
const T = String.raw`'((?:[^']|'')*)'`;
const row = new RegExp(String.raw`^  \('([0-9]{1,7}-[0-9])', ${T}, (?:${T}|null), (?:${T}|null), (?:'[a-z0-9_]+'|null), '[0-9.]+'\)`, "gm");
const un = (s: string | undefined) => (s === undefined ? null : s.replaceAll("''", "'"));
const list: LoincRow[] = [...sql.matchAll(row)].map((m) => ({ loinc: m[1], name_en: un(m[2])!, name_el: un(m[3]), ucum: un(m[4]) }))
  .sort((a, b) => (a.loinc < b.loinc ? -1 : 1))
  // LOINC_DROP=789-8,777-3 leaves those codes off the list: their rows then stand for tests the list does not cover
  .filter((r) => !(Deno.env.get("LOINC_DROP") ?? "").split(",").includes(r.loinc));
const data = bytesToBase64(await Deno.readFile(path));
const t0 = Date.now();
try {
  const r = await generateJson({
    system: EXTRACT_SYSTEM,
    parts: [{ inline_data: { mime_type: "image/jpeg", data } }, { text: "Read this document." }, { text: loincListText(list) }],
    schema: ModelExtract,
    timeoutMs: READ_BUDGET_MS,
    maxAttempts: 2,
    model: Deno.env.get("HEALTHAPP_GEMINI_MODEL") ?? undefined,
  }, { apiKey: Deno.env.get("HEALTHAPP_GEMINI_API_KEY") });
  const b = build(r.data, new Set(list.map((x) => x.loinc)));
  if (!b.ok) {
    console.log(`synthetic: status=refused reason=${b.reason} model=${r.model} attempts=${r.attempts} ms=${Date.now() - t0}`);
  } else {
    const coded = b.draft.results.filter((x) => x.loinc).map((x) => x.loinc);
    console.log(
      `synthetic (does not count toward the goal): list=${list.length} model=${r.model} attempts=${r.attempts} ms=${Date.now() - t0} ` +
        `within_budget=${Date.now() - t0 <= READ_BUDGET_MS} results=${b.draft.results.length} with_code=${b.loinc.coded} ` +
        `dropped=${b.loinc.dropped} without_code=${b.draft.results.length - b.loinc.coded} codes=${coded.join(",")}`,
    );
  }
} catch (e) {
  console.log(`synthetic: status=error ${e instanceof ModelError ? `${e.kind} ${e.status ?? ""} attempts=${e.attempts}` : (e as Error).name}`);
  Deno.exit(1);
}
