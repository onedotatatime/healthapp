import { assert, assertEquals, assertThrows } from "jsr:@std/assert@1";
import { bytesToBase64 } from "./b64.ts";

const fromB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const pattern = (n: number) => Uint8Array.from({ length: n }, (_, i) => i % 256);

Deno.test("b64: a 1.5 MB buffer with every byte value round-trips exactly", () => {
  const big = pattern(1_500_000);
  const back = fromB64(bytesToBase64(big));
  assertEquals(back.length, big.length);
  assert(back.every((b, i) => b === big[i]));
});

Deno.test("b64: the old one-line encoding throws RangeError on that same buffer", () => {
  const big = pattern(1_500_000);
  assertThrows(() => btoa(String.fromCharCode(...big)), RangeError);
});

Deno.test("b64: known vectors", () => {
  assertEquals(bytesToBase64(new Uint8Array(0)), "");
  assertEquals(bytesToBase64(new TextEncoder().encode("hello")), "aGVsbG8=");
});

Deno.test("b64: the 0x8000 chunk edge round-trips", () => {
  for (const n of [0x8000, 0x8001]) {
    const buf = pattern(n);
    assertEquals(fromB64(bytesToBase64(buf)), buf);
  }
});
