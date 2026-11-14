import { guarded } from "../_shared/grants.ts";
import { grantStore, sessionAuth } from "../_shared/pggrants.ts";
import { makeHandler } from "./handler.ts";

Deno.serve(guarded(makeHandler({ auth: sessionAuth, store: grantStore }), "handshake-create"));
