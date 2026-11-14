import { auth, blobs } from "../_shared/blobs.ts";
import { generateJson } from "../_shared/model.ts";
import { pgStore } from "../_shared/pgstore.ts";
import { safely } from "../_shared/http.ts";
import { makeHandler } from "./handler.ts";

Deno.serve(safely(makeHandler({
  auth,
  store: pgStore,
  blobs,
  generate: (call) =>
    generateJson({ ...call, model: Deno.env.get("HEALTHAPP_GEMINI_MODEL") ?? undefined }, {
      apiKey: Deno.env.get("HEALTHAPP_GEMINI_API_KEY"),
    }),
  log: (l) => console.log(JSON.stringify(l)),
  now: () => Date.now(),
}), "extract-exam"));
