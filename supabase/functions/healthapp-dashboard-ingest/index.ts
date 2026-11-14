import { adminClient } from "../_shared/admin.ts";
import { BUCKET, guardedEnv, OBJECT_PATH } from "../_shared/dashboard.ts";
import { makeHandler } from "./handler.ts";

Deno.serve(makeHandler({
  env: guardedEnv((n) => Deno.env.get(n)),
  now: () => new Date(),
  store: {
    async put(json) {
      // The bucket only accepts images and PDF (MIN-4452). The snapshot is stored under a stand-in
      // type and always served by the feed as application/json.
      const { error } = await adminClient().storage.from(BUCKET).upload(OBJECT_PATH, new TextEncoder().encode(json), {
        upsert: true,
        cacheControl: "0",
        contentType: "application/pdf",
      });
      if (error) throw new Error("upload failed");
    },
    get: () => Promise.reject(new Error("ingest does not read")),
  },
}));
