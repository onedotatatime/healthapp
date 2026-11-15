// MIN-4674: the three scripts the edge function uploads to the boxd machine are exactly the ones in scripts/synthetic/
// and exactly the ones the recorded run (data/synthetic/run-5000.json) was made with. Run
// `node scripts/synthetic/embed_scripts.mjs` after editing any of them. SYNTHETIC data only.
import { assertEquals } from "jsr:@std/assert@1";
import { sha256Hex } from "./http.ts";
import { SIMULATE_SCRIPTS } from "./simulate_scripts.ts";

const root = new URL("../../../", import.meta.url);
const NAMES = ["build_run.py", "generate.py", "match.py"];

Deno.test("the embedded scripts are the three files in scripts/synthetic/, byte for byte", () => {
  assertEquals(Object.keys(SIMULATE_SCRIPTS).sort(), NAMES);
  for (const n of NAMES) {
    assertEquals(SIMULATE_SCRIPTS[n], Deno.readTextFileSync(new URL(`scripts/synthetic/${n}`, root)), `${n} drifted: run scripts/synthetic/embed_scripts.mjs`);
  }
});

Deno.test("their SHA-256 equals the script_sha256 the recorded boxd run reported for the same three files", async () => {
  const recorded = JSON.parse(Deno.readTextFileSync(new URL("data/synthetic/run-5000.json", root))).vm.script_sha256;
  assertEquals(Object.keys(recorded).sort(), NAMES);
  for (const n of NAMES) assertEquals(await sha256Hex(SIMULATE_SCRIPTS[n]), recorded[n], n);
});

Deno.test("the size and the sarcoid pattern of a live run are the recorded run's (n 5000, rare_sarcoid_like 6)", () => {
  const rec = JSON.parse(Deno.readTextFileSync(new URL("data/synthetic/run-5000.json", root)));
  assertEquals([rec.n, rec.seeded.rare_sarcoid_like, rec.synthetic], [5000, 6, true]);
});
