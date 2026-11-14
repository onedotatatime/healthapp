import postgres from "npm:postgres@3.4.5";
import { allowTry } from "../_shared/pgstore.ts";
import { safely } from "../_shared/http.ts";
import { makeHandler, type ResetCounts } from "./handler.ts";
import { RESET_SQL } from "./sql.ts";

Deno.serve(safely(makeHandler({
  secret: (name) => Deno.env.get(name),
  allowTry,
  async reset() {
    const url = Deno.env.get("SUPABASE_DB_URL");
    if (!url) throw new Error("SUPABASE_DB_URL missing");
    const sql = postgres(url, { max: 1, prepare: false, connect_timeout: 10 });
    try {
      const rows = await sql.begin((tx) => tx.unsafe(RESET_SQL));
      return rows[0] as unknown as ResetCounts;
    } finally {
      await sql.end({ timeout: 2 });
    }
  },
}), "demo-reset"));
