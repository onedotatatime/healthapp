// Static boundaries from the CTO's decision 2 (MIN-4456): what the dashboard functions may read and touch.
import { assertEquals } from "jsr:@std/assert@1";

const ROOT = new URL("../", import.meta.url);
const FILES = [
  "_shared/admin.ts",
  "_shared/dashboard.ts",
  "healthapp-dashboard-ingest/handler.ts",
  "healthapp-dashboard-ingest/index.ts",
  "healthapp-dashboard-feed/handler.ts",
  "healthapp-dashboard-feed/index.ts",
];

function code(path: string): string {
  // strip comments so the scan sees executable text only
  return Deno.readTextFileSync(new URL(path, ROOT)).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "").replace(/\s\/\/.*$/gm, "");
}

Deno.test("environment reads: only HEALTHAPP_DASHBOARD_* and SUPABASE_*, by literal name", () => {
  for (const f of FILES) {
    const src = code(f);
    for (const m of src.matchAll(/Deno\.env\.get\(\s*([^)]*)\)/g)) {
      const arg = m[1].trim();
      // the only non-literal read is the pass-through `Deno.env.get(n)` in index.ts, wrapped by guardedEnv
      if (arg === "n") {
        assertEquals(/env:\s*guardedEnv\(\(n\) => Deno\.env\.get\(n\)\)/.test(src), true, `${f}: unguarded env pass-through`);
        continue;
      }
      assertEquals(/^"(HEALTHAPP_DASHBOARD_|SUPABASE_)[A-Z_]*"$/.test(arg), true, `${f}: ${arg}`);
    }
    assertEquals(/Deno\.env\.(toObject|has|set)\b/.test(src), false, `${f}: env enumeration`);
    for (const m of src.matchAll(/\benv\(\s*"([^"]+)"\s*\)/g)) {
      assertEquals(/^(HEALTHAPP_DASHBOARD_|SUPABASE_)/.test(m[1]), true, `${f}: env(${m[1]})`);
    }
  }
});

Deno.test("no table, no RPC, no demo bucket, no env header, no logging of values", () => {
  for (const f of FILES) {
    const src = code(f);
    assertEquals(/\.rpc\(|\.schema\(|\.from\(\s*["'`][a-z_]+["'`]\s*\)\.(select|insert|update|delete|upsert)/.test(src), false, `${f}: table access`);
    assertEquals(/healthapp-demo|healthapp_demo|x-healthapp-env/i.test(src), false, `${f}: demo or env header`);
    for (const m of src.matchAll(/console\.\w+\(([^)]*)\)/g)) {
      assertEquals(/req\.|headers|body|text|raw|doc\b|key/i.test(m[1]), false, `${f}: logs ${m[1]}`);
    }
  }
  // storage only, on the fixed constants
  const idx = ["healthapp-dashboard-ingest/index.ts", "healthapp-dashboard-feed/index.ts"].map(code).join("\n");
  assertEquals((idx.match(/\.storage\.from\(BUCKET\)/g) ?? []).length, 2);
  assertEquals(/\.from\(\s*["'`]/.test(idx), false);
  const shared = Deno.readTextFileSync(new URL("_shared/dashboard.ts", ROOT));
  assertEquals(shared.includes('export const BUCKET = "healthapp-dev";'), true);
  assertEquals(shared.includes('export const OBJECT_PATH = "dashboard/snapshot.json";'), true);
});

Deno.test("both handlers send every key comparison through keysMatch (no === on a key)", () => {
  for (const f of ["healthapp-dashboard-ingest/handler.ts", "healthapp-dashboard-feed/handler.ts"]) {
    const src = code(f);
    assertEquals(src.includes("keysMatch("), true);
    assertEquals(/KEY_HEADER\)\s*[!=]==|[!=]==\s*keys\.(push|view)/.test(src), false, `${f}: direct key compare`);
  }
});
