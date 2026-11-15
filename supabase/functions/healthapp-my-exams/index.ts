import { auth, blobs } from "../_shared/blobs.ts";
import { pgStore } from "../_shared/pgstore.ts";
import { safely } from "../_shared/http.ts";
import { makeHandler } from "./handler.ts";

Deno.serve(safely(makeHandler({ auth, store: pgStore, blobs, log: (l) => console.log(JSON.stringify(l)), now: () => Date.now() }), "my-exams"));
