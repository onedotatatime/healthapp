// One live call through the model wrapper on a synthetic document (MIN-4471 acceptance).
// Prints status, attempts, time and counts only, never the answer's content.
//   HEALTHAPP_GEMINI_API_KEY=... deno run --allow-env --allow-net --allow-read scripts/model-smoke.ts <synthetic.png>
import { z } from "npm:zod@4.6.7";
import { generateJson, ModelError } from "../supabase/functions/_shared/model.ts";

const Extract = z.object({
  readable: z.boolean(),
  document_kind: z.enum(["blood_test", "imaging_report", "doctor_letter", "other"]),
  exam_date: z.string(),
  printed_name: z.string(),
  printed_id: z.string(),
  results: z.array(z.object({ analyte: z.string(), value: z.string(), unit: z.string(), ref_text: z.string() })),
});

const path = Deno.args[0];
const data = btoa(String.fromCharCode(...await Deno.readFile(path)));
try {
  const r = await generateJson({
    system: "Copy exactly what is printed. Dates as YYYY-MM-DD. Never add an opinion.",
    parts: [{ inline_data: { mime_type: "image/png", data } }, { text: "Extract this exam." }],
    schema: Extract,
    model: Deno.env.get("HEALTHAPP_GEMINI_MODEL") ?? undefined,
  }, { apiKey: Deno.env.get("HEALTHAPP_GEMINI_API_KEY") });
  console.log(`status=ok schema_valid=true model=${r.model} attempts=${r.attempts} ms=${r.ms} results=${r.data.results.length}`);
} catch (e) {
  console.log(`status=error ${e instanceof ModelError ? `${e.kind} ${e.status ?? ""} attempts=${e.attempts}` : "unexpected"}`);
  Deno.exit(1);
}
