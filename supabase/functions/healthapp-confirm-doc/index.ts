import { auth } from "../_shared/blobs.ts";
import { pgStore } from "../_shared/pgstore.ts";
import { safely } from "../_shared/http.ts";
import { makeHandler } from "./handler.ts";

Deno.serve(safely(makeHandler({ auth, store: pgStore, log: (l) => console.log(JSON.stringify(l)) }), "confirm-doc"));
