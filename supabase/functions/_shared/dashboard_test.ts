import { assertEquals } from "jsr:@std/assert@1";
import { guardedEnv } from "./dashboard.ts";

Deno.test("guardedEnv passes HEALTHAPP_DASHBOARD_* and SUPABASE_* and hides everything else", () => {
  const all: Record<string, string> = {
    HEALTHAPP_DASHBOARD_PUSH_KEY: "a",
    SUPABASE_URL: "b",
    SUPABASE_SERVICE_ROLE_KEY: "c",
    HOME: "d",
    PATH: "e",
    HEALTHAPP_DEMO_SECRET: "f",
    HEALTHAPP_DASHBOARDX: "g",
    "SUPABASE_URL;HOME": "h",
    lowercase_supabase_url: "i",
  };
  const asked: string[] = [];
  const env = guardedEnv((n) => (asked.push(n), all[n]));
  assertEquals(env("HEALTHAPP_DASHBOARD_PUSH_KEY"), "a");
  assertEquals(env("SUPABASE_URL"), "b");
  assertEquals(env("SUPABASE_SERVICE_ROLE_KEY"), "c");
  for (const n of ["HOME", "PATH", "HEALTHAPP_DEMO_SECRET", "HEALTHAPP_DASHBOARDX", "SUPABASE_URL;HOME", "lowercase_supabase_url", ""]) {
    assertEquals(env(n), undefined, n);
  }
  assertEquals(asked, ["HEALTHAPP_DASHBOARD_PUSH_KEY", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"], "the reader is never asked for a hidden name");
});
