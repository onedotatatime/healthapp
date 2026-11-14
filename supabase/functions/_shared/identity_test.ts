import { assertEquals } from "jsr:@std/assert@1";
import { type IdentityProfile, matchIdentity, mismatchMessage, sameName } from "./identity.ts";

const MARIA: IdentityProfile = { full_name: "Μαρία Παπαδοπούλου", full_name_latin: "Maria Papadopoulou", national_id_norm: "AK123456" };
const NO_ID: IdentityProfile = { ...MARIA, national_id_norm: null };

// [what the page prints (name, id), profile, expected verdict]. The synthetic set's documents are named.
type Want = "match" | "name_only" | "name_mismatch" | "id_mismatch";
const TABLE: [string, string, string | null, IdentityProfile, Want][] = [
  ["doc 1: Greek capitals, ID", "ΠΑΠΑΔΟΠΟΥΛΟΥ ΜΑΡΙΑ", "AK123456", MARIA, "match"],
  ["doc 3: Latin capitals, ID", "PAPADOPOULOU MARIA", "AK123456", MARIA, "match"],
  ["doc 6: her husband (other name, other ID)", "ΠΑΠΑΔΟΠΟΥΛΟΣ ΓΕΩΡΓΙΟΣ", "AB654321", MARIA, "name_mismatch"],
  ["doc 7: name, no ID printed", "ΠΑΠΑΔΟΠΟΥΛΟΥ ΜΑΡΙΑ", null, MARIA, "name_only"],
  ["doc 7 with an empty ID", "ΠΑΠΑΔΟΠΟΥΛΟΥ ΜΑΡΙΑ", "  ", MARIA, "name_only"],
  ["doc 8: her name, a different ID", "PAPADOPOULOU MARIA", "AK987654", MARIA, "id_mismatch"],
  ["the ID letters printed as Greek lookalikes", "ΠΑΠΑΔΟΠΟΥΛΟΥ ΜΑΡΙΑ", "ΑΚ123456", MARIA, "match"],
  ["the ID with spaces and a dash", "PAPADOPOULOU MARIA", "ak 123-456", MARIA, "match"],
  ["accents and lower case", "Μαρία Παπαδοπούλου", "AK123456", MARIA, "match"],
  ["surname first with a comma", "PAPADOPOULOU, MARIA", "AK123456", MARIA, "match"],
  ["a middle initial", "Maria K. Papadopoulou", "AK123456", MARIA, "match"],
  ["a father's name added", "ΠΑΠΑΔΟΠΟΥΛΟΥ ΜΑΡΙΑ ΤΟΥ ΓΕΩΡΓΙΟΥ", "AK123456", MARIA, "match"],
  ["same surname, other first name", "ΠΑΠΑΔΟΠΟΥΛΟΥ ΕΛΕΝΗ", "AK123456", MARIA, "name_mismatch"],
  ["first name only is not a match", "ΜΑΡΙΑ", "AK123456", MARIA, "name_mismatch"],
  ["another person, same ID digits", "DIMITRIOU ELENI", "AK123456", MARIA, "name_mismatch"],
  ["profile has no ID: a printed ID cannot be checked", "PAPADOPOULOU MARIA", "AK123456", NO_ID, "name_only"],
];

for (const [label, name, id, profile, want] of TABLE) {
  Deno.test(`identity: ${label} -> ${want}`, () => {
    const v = matchIdentity(profile, name, id);
    assertEquals(v.ok ? v.status : v.reason, want);
  });
}

Deno.test("identity: a refusal names the two values that differ", () => {
  const n = matchIdentity(MARIA, "ΠΑΠΑΔΟΠΟΥΛΟΣ ΓΕΩΡΓΙΟΣ", "AB654321");
  assertEquals(n.ok, false);
  if (n.ok) return;
  assertEquals([n.printed, n.profile], ["ΠΑΠΑΔΟΠΟΥΛΟΣ ΓΕΩΡΓΙΟΣ", "Μαρία Παπαδοπούλου"]);
  assertEquals(
    mismatchMessage(n),
    "The name on it (ΠΑΠΑΔΟΠΟΥΛΟΣ ΓΕΩΡΓΙΟΣ) doesn't match your profile (Μαρία Παπαδοπούλου). Nothing was saved.",
  );
  const i = matchIdentity(MARIA, "PAPADOPOULOU MARIA", "AK987654");
  if (i.ok) throw new Error("expected a refusal");
  assertEquals([i.reason, i.printed, i.profile], ["id_mismatch", "AK987654", "AK123456"]);
});

Deno.test("identity: Latin and Greek spellings of the same name meet", () => {
  assertEquals(sameName("ΕΛΕΝΗ ΔΗΜΗΤΡΙΟΥ", "Eleni Dimitriou"), true);
  assertEquals(sameName("ELENI DIMITRIOU", "Μαρία Παπαδοπούλου"), false);
});
