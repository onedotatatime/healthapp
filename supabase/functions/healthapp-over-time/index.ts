import { auth } from "../_shared/blobs.ts";
import { assistantPg } from "../_shared/assistant_pg.ts";
import { pgStore } from "../_shared/pgstore.ts";
import { safely } from "../_shared/http.ts";
import { makeHandler } from "./handler.ts";

Deno.serve(safely(makeHandler({
  auth,
  store: { roleOf: pgStore.roleOf, ...assistantPg },
  log: (l) => console.log(JSON.stringify(l)),
}), "over-time"));
