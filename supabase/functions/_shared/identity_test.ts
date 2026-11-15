import { assertEquals } from "jsr:@std/assert@1";
import { type IdentityProfile, matchIdentity, mismatchMessage, nameTokens, sameName } from "./identity.ts";

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
  // MIN-4630: a printed number never refuses; the name decides. A different number is ignored.
  ["doc 8: her name, a different ID (ignored)", "PAPADOPOULOU MARIA", "AK987654", MARIA, "name_only"],
  ["MIN-4630: her exact name + a lab code printed as the ID", "ΠΑΠΑΔΟΠΟΥΛΟΥ ΜΑΡΙΑ", "LAB-0042731", MARIA, "name_only"],
  ["the ID letters printed as Greek lookalikes", "ΠΑΠΑΔΟΠΟΥΛΟΥ ΜΑΡΙΑ", "ΑΚ123456", MARIA, "match"],
  ["the ID with spaces and a dash", "PAPADOPOULOU MARIA", "ak 123-456", MARIA, "match"],
  ["accents and lower case", "Μαρία Παπαδοπούλου", "AK123456", MARIA, "match"],
  ["surname first with a comma", "PAPADOPOULOU, MARIA", "AK123456", MARIA, "match"],
  ["a middle initial", "Maria K. Papadopoulou", "AK123456", MARIA, "match"],
  ["a father's name added", "ΠΑΠΑΔΟΠΟΥΛΟΥ ΜΑΡΙΑ ΤΟΥ ΓΕΩΡΓΙΟΥ", "AK123456", MARIA, "match"],
  // MIN-4478 widening: extra printed words pass only with the printed ID present and exact.
  ["surname first + father's name + matching ID", "ΠΑΠΑΔΟΠΟΥΛΟΥ ΜΑΡΙΑ ΓΕΩΡΓΙΟΥ", "AK123456", MARIA, "match"],
  ["surname first + father's name + a different ID (ignored, one extra part)", "ΠΑΠΑΔΟΠΟΥΛΟΥ ΜΑΡΙΑ ΓΕΩΡΓΙΟΥ", "AK987654", MARIA, "name_only"],
  // MIN-4614: one extra printed part with no checkable ID is name_only (the strict rule already takes a bare 2-part name with no ID).
  ["extra printed word, no ID printed", "ΠΑΠΑΔΟΠΟΥΛΟΥ ΜΑΡΙΑ ΓΕΩΡΓΙΟΥ", null, MARIA, "name_only"],
  ["extra printed word, empty ID", "ΠΑΠΑΔΟΠΟΥΛΟΥ ΜΑΡΙΑ ΓΕΩΡΓΙΟΥ", "  ", MARIA, "name_only"],
  ["extra printed word, profile has no ID", "ΠΑΠΑΔΟΠΟΥΛΟΥ ΜΑΡΙΑ ΓΕΩΡΓΙΟΥ", "AK123456", NO_ID, "name_only"],
  ["father's name with ΤΟΥ, Greek, no ID (the marker is not a part)", "ΠΑΠΑΔΟΠΟΥΛΟΥ ΜΑΡΙΑ ΤΟΥ ΓΕΩΡΓΙΟΥ", null, MARIA, "name_only"],
  ["father's name with TOU, Latin, no ID", "PAPADOPOULOU MARIA TOU GEORGIOU", null, MARIA, "name_only"],
  ["two extra parts, no ID", "ΠΑΠΑΔΟΠΟΥΛΟΥ ΜΑΡΙΑ ΓΕΩΡΓΙΟΥ ΑΙΚΑΤΕΡΙΝΗΣ", null, MARIA, "name_mismatch"],
  ["two extra parts, matching ID", "ΠΑΠΑΔΟΠΟΥΛΟΥ ΜΑΡΙΑ ΓΕΩΡΓΙΟΥ ΑΙΚΑΤΕΡΙΝΗΣ", "AK123456", MARIA, "match"],
  ["two extra parts, a different ID", "ΠΑΠΑΔΟΠΟΥΛΟΥ ΜΑΡΙΑ ΓΕΩΡΓΙΟΥ ΑΙΚΑΤΕΡΙΝΗΣ", "AK987654", MARIA, "name_mismatch"],
  ["two extra parts, profile has no ID (a printed ID cannot be checked)", "ΠΑΠΑΔΟΠΟΥΛΟΥ ΜΑΡΙΑ ΓΕΩΡΓΙΟΥ ΑΙΚΑΤΕΡΙΝΗΣ", "AK123456", NO_ID, "name_mismatch"],
  ["the markers never stand in for a profile part", "ΠΑΠΑΔΟΠΟΥΛΟΥ ΤΟΥ ΓΕΩΡΓΙΟΥ", null, MARIA, "name_mismatch"],
  ["the markers never stand in for a profile part, even with the ID", "ΠΑΠΑΔΟΠΟΥΛΟΥ ΤΟΥ ΓΕΩΡΓΙΟΥ", "AK123456", MARIA, "name_mismatch"],
  ["a marker plus two extra parts is still two extra parts", "ΠΑΠΑΔΟΠΟΥΛΟΥ ΜΑΡΙΑ ΤΗΣ ΕΛΕΝΗΣ ΓΕΩΡΓΙΟΥ", null, MARIA, "name_mismatch"],
  ["a relative: same surname, other first name, father's name, no ID", "ΠΑΠΑΔΟΠΟΥΛΟΥ ΕΛΕΝΗ ΓΕΩΡΓΙΟΥ", null, MARIA, "name_mismatch"],
  ["a relative with the same-looking ID is still a different name", "ΠΑΠΑΔΟΠΟΥΛΟΥ ΕΛΕΝΗ ΓΕΩΡΓΙΟΥ", "AK123456", MARIA, "name_mismatch"],
  ["printed name lacks a profile part (the old reverse subset)", "ΜΑΡΙΑ", "AK123456", MARIA, "name_mismatch"],
  ["the Latin profile name matches the extra-word print", "PAPADOPOULOU MARIA GEORGIOU", "AK123456", MARIA, "match"],
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

// MIN-4630: the verdict is never id_mismatch (the code stays in the contract and the DB for old rows only).
// Over every row of the table, and over every name crossed with every kind of printed number.
Deno.test("identity: nothing returns id_mismatch, over the whole table and every name x ID", () => {
  const seen = new Set<string>();
  const check = (profile: IdentityProfile, name: string, id: string | null) => {
    const v = matchIdentity(profile, name, id);
    const got = v.ok ? v.status : v.reason;
    seen.add(got);
    assertEquals((got as string) === "id_mismatch", false, `${name} / ${id}`);
  };
  for (const [, name, id, profile] of TABLE) check(profile, name, id);
  const ids = [null, "", "  ", "AK123456", "AK987654", "LAB-0042731", "ΑΚ123456", "12345678901"];
  for (const profile of [MARIA, NO_ID]) {
    for (const [, name] of TABLE) for (const id of ids) check(profile, name, id);
  }
  // the sweep reaches every verdict that remains, so the assertion above is not vacuous
  assertEquals([...seen].sort(), ["match", "name_mismatch", "name_only"]);
});

Deno.test("identity: a printed number that is not the profile's changes nothing but the upgrade to match", () => {
  for (const [, name, , profile] of TABLE) {
    const noId = matchIdentity(profile, name, null);
    const other = matchIdentity(profile, name, "LAB-0042731");
    assertEquals(other.ok ? other.status : other.reason, noId.ok ? noId.status : noId.reason, name);
  }
});

Deno.test("identity: a refusal names the two values that differ", () => {
  const n = matchIdentity(MARIA, "ΠΑΠΑΔΟΠΟΥΛΟΣ ΓΕΩΡΓΙΟΣ", "AB654321");
  assertEquals(n.ok, false);
  if (n.ok) return;
  assertEquals([n.printed, n.profile], ["ΠΑΠΑΔΟΠΟΥΛΟΣ ΓΕΩΡΓΙΟΣ", "Μαρία Παπαδοπούλου"]);
  assertEquals(
    mismatchMessage(n),
    "The name on it (ΠΑΠΑΔΟΠΟΥΛΟΣ ΓΕΩΡΓΙΟΣ) doesn't match your profile (Μαρία Παπαδοπούλου). Nothing was saved.",
  );
  // MIN-4630: the same name with another number is no longer a refusal.
  const i = matchIdentity(MARIA, "PAPADOPOULOU MARIA", "AK987654");
  assertEquals(i, { ok: true, status: "name_only" });
});

Deno.test("identity: Latin and Greek spellings of the same name meet", () => {
  assertEquals(sameName("ΕΛΕΝΗ ΔΗΜΗΤΡΙΟΥ", "Eleni Dimitriou"), true);
  assertEquals(sameName("ELENI DIMITRIOU", "Μαρία Παπαδοπούλου"), false);
});

// Each group is one name spelled the ways a Greek lab and a profile might. All must fold to the same parts.
const FOLDS: [string, string[]][] = [
  ["EI and I", ["ΔΕΙΝΑ", "DINA", "DEINA"]],
  ["AI and E", ["ΑΙΜΙΛΙΑ", "EMILIA", "AIMILIA"]],
  ["MP and B", ["ΜΠΑΡΜΠΑ", "BARBA", "MPARMPA"]],
  ["NT and D", ["ΝΤΙΝΑ", "DINA", "NTINA"]],
  ["PH and F", ["ΦΙΛΟΣ", "FILOS", "PHILOS"]],
  ["KS and X", ["ΞΑΝΘΗ", "XANTHI", "KSANTHI"]],
  ["C and K", ["CARA", "KARA", "ΚΑΡΑ"]],
  ["H and I", ["ELENH", "ELENI", "ΕΛΕΝΗ"]],
  ["OU, U and ΟΥ", ["ΟΥΡΑΝΟΣ", "URANOS", "OURANOS"]],
  ["Χ, CH and X", ["ΧΡΙΣΤΟΣ", "CHRISTOS", "XRISTOS"]],
];
for (const [label, spellings] of FOLDS) {
  Deno.test(`identity fold: ${label}`, () => {
    const want = nameTokens(spellings[0]);
    for (const w of spellings.slice(1)) assertEquals(nameTokens(w), want, w);
  });
}

Deno.test("identity fold: different names stay different", () => {
  assertEquals(nameTokens("ΜΑΡΙΑ")[0] === nameTokens("ΜΑΡΙΟΣ")[0], false);
  assertEquals(nameTokens("DINA")[0] === nameTokens("TINA")[0], false);
});

Deno.test("identity fold: a Latin print of a Greek profile passes through the folds end to end", () => {
  const p: IdentityProfile = { full_name: "Ξάνθη Μπαρμπά", full_name_latin: null, national_id_norm: "AK123456" };
  const v = matchIdentity(p, "BARBA XANTHI NTINAS", "AK123456");
  assertEquals(v.ok ? v.status : v.reason, "match");
  const n = matchIdentity(p, "BARBA XANTHI NTINAS", null);
  assertEquals(n.ok ? n.status : n.reason, "name_only"); // MIN-4614: one extra part, no ID
  const n2 = matchIdentity(p, "BARBA XANTHI NTINAS ELENI", null);
  assertEquals(n2.ok ? n2.status : n2.reason, "name_mismatch"); // two extra parts need the ID
  const s = matchIdentity(p, "BARBA XANTHI", null);
  assertEquals(s.ok ? s.status : s.reason, "name_only");
});

// MIN-4614: a refusal reports counts only, so the owner's re-scan can be diagnosed from the logs without a name.
Deno.test("identity: a refusal carries counts and no word of either name or ID", () => {
  const n = matchIdentity(MARIA, "ΠΑΠΑΔΟΠΟΥΛΟΥ ΜΑΡΙΑ ΓΕΩΡΓΙΟΥ ΑΙΚΑΤΕΡΙΝΗΣ", null);
  if (n.ok) throw new Error("expected a refusal");
  assertEquals(n.counts, { profile_parts: 2, profile_parts_found: 2, printed_parts: 4, extra_parts: 2, id_printed: false, id_equal: false });
  const lacking = matchIdentity(MARIA, "ΠΑΠΑΔΟΠΟΥΛΟΥ ΤΟΥ ΓΕΩΡΓΙΟΥ", "AK123456");
  if (lacking.ok) throw new Error("expected a refusal");
  assertEquals(lacking.counts, { profile_parts: 2, profile_parts_found: 1, printed_parts: 2, extra_parts: 1, id_printed: true, id_equal: true });
  const id = matchIdentity(MARIA, "ΠΑΠΑΔΟΠΟΥΛΟΥ ΜΑΡΙΑ ΓΕΩΡΓΙΟΥ ΑΙΚΑΤΕΡΙΝΗΣ", "AK987654");
  if (id.ok) throw new Error("expected a refusal");
  assertEquals([id.reason, id.counts], ["name_mismatch", { profile_parts: 2, profile_parts_found: 2, printed_parts: 4, extra_parts: 2, id_printed: true, id_equal: false }]);
  for (const v of [n, lacking, id]) {
    const all = JSON.stringify(v.counts);
    for (const word of ["ΠΑΠΑΔΟΠΟΥΛΟΥ", "PAPADOPOULOU", "AK123456", "AK987654", "ΜΑΡΙΑ", "Μαρία"]) assertEquals(all.includes(word), false, word);
    for (const x of Object.values(v.counts)) assertEquals(["number", "boolean"].includes(typeof x), true);
  }
});
