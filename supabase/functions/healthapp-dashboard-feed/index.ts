import { adminClient } from "../_shared/admin.ts";
import { BUCKET, guardedEnv, OBJECT_PATH } from "../_shared/dashboard.ts";
import { makeHandler } from "./handler.ts";

Deno.serve(makeHandler({
  env: guardedEnv((n) => Deno.env.get(n)),
  now: () => new Date(),
  store: {
    put: () => Promise.reject(new Error("feed does not write")),
    async get() {
      const { data, error } = await adminClient().storage.from(BUCKET).download(OBJECT_PATH);
      if (error) {
        const status = (error as { status?: number; statusCode?: string | number }).status ??
          Number((error as { statusCode?: string | number }).statusCode);
        if (status === 404 || /not found/i.test(error.message)) return null;
        throw new Error("download failed");
      }
      return await data.text();
    },
  },
}));
