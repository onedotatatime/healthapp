-- Per env. Rendered by `scripts/hdb render <env> 020_lab_loinc.sql` (__SCHEMA__ -> healthapp_<env>).
-- LOINC step 1 (MIN-4689, CTO decision on MIN-4688): lab values carry a LOINC code, and matching decides which test a
-- result row is by its code. Needs 014 (refuses to run without it). Additive: a reference table, a nullable column and
-- three functions; no row of a patient is read, changed or backfilled.
--  1. lab_loinc: 95 hand-checked LOINC terms (code, Long Common Name verbatim, example UCUM unit, LOINC version) with
--     our own Greek name and the extraction / match_lab_defs key. All 19 match_lab_defs keys are covered; a test printed
--     in two units has one code per unit (HbA1c % and mmol/mol). The seed is 006's pattern: upsert every row of the
--     file, delete any row the file no longer holds, and refuse to commit unless the table equals the file
--     (count and md5 below; `supabase/sql/checks/lab_loinc_check.sql` prints the same fingerprint).
--  2. results.loinc: the code the reading chose from that list (healthapp-extract-exam validates it against this
--     table; a code that is not on the list is never stored). Null on every row read before the deploy: no backfill.
--  3. Matching: match_marker(analyte, analyte_key, loinc) is new. A code in lab_loinc decides the marker only when it
--     has a key and 014's whole answer (the alias, then the extraction's key) is empty or that same key; a listed code
--     with no key, or one 014 contradicts, decides nothing (never a wrong marker; CTO amendment, MIN-4690 §3); no
--     code, or a code not on the list, keeps 014's answer.
--     match_codes_from reads a new `l` field; match_patient_codes passes the row's code. Thresholds, codes, k,
--     min_shared, the cohort, 018's RPC and the one empty answer do not change. match_marker(text, text) stays.
-- Rollback: supabase/sql/rollback/020_down.sql (`scripts/hdb down <env> 020_down.sql`): 014's two functions come back;
-- the table and the column stay (dropping them on demo would delete data).
-- Idempotent; applied in one transaction.
--
-- This material contains content from LOINC (http://loinc.org). LOINC is copyright © Regenstrief Institute, Inc. and
-- the Logical Observation Identifiers Names and Codes (LOINC) Committee and is available at no cost under the license
-- at http://loinc.org/license. LOINC® is a registered United States trademark of Regenstrief Institute, Inc.
-- (verbatim in supabase/sql/LOINC-NOTICE.md, with where the rows were copied from)

do $$
begin
  if not exists (select 1 from __SCHEMA__._applied where file = '014_match_coding.sql') then
    raise exception '020_lab_loinc.sql needs 014_match_coding.sql';
  end if;
end $$;

-- 1. The lookup table. Reference data, no patient rows.
create table if not exists __SCHEMA__.lab_loinc (
  loinc         text primary key check (loinc ~ '^[0-9]{1,7}-[0-9]$'),
  name_en       text not null,   -- LOINC Long Common Name, verbatim
  name_el       text,            -- our Greek name as Greek labs print it (not LOINC content)
  ucum          text,            -- LOINC example UCUM unit; null for ordinal or qualitative tests
  analyte_key   text,            -- the extract.ts / match_lab_defs key; several codes may share one; null = no key yet
  loinc_version text not null    -- the LOINC version the row was checked against
);
alter table __SCHEMA__.lab_loinc enable row level security;
revoke all on __SCHEMA__.lab_loinc from public, anon, authenticated;
grant all on __SCHEMA__.lab_loinc to service_role;
-- RLS on and no policy: no client role reads this table. The absence is the rule (as 005, 014).

with src (loinc, name_en, name_el, ucum, analyte_key, loinc_version) as (values
  ('11572-5', 'Rheumatoid factor [Units/volume] in Serum or Plasma', 'Ρευματοειδής παράγοντας (RF)', '[IU]/mL', 'rf', '2.83'),
  ('11580-8', 'Thyrotropin [Units/volume] in Serum or Plasma by Detection limit <= 0.005 mIU/L', 'Θυρεοειδοτρόπος ορμόνη (TSH) 3ης γενιάς', 'm[IU]/L', 'tsh', '2.83'),
  ('13457-7', 'Cholesterol in LDL [Mass/volume] in Serum or Plasma by calculation', 'LDL χοληστερόλη (υπολογιζόμενη)', 'mg/dL', 'ldl', '2.83'),
  ('13965-9', 'Homocysteine [Moles/volume] in Serum or Plasma', 'Ομοκυστεΐνη', 'umol/L', null, '2.83'),
  ('14804-9', 'Lactate dehydrogenase [Enzymatic activity/volume] in Serum or Plasma by Lactate to pyruvate reaction', 'Γαλακτική αφυδρογονάση (LDH)', 'U/L', null, '2.83'),
  ('1558-6', 'Fasting glucose [Mass/volume] in Serum or Plasma', 'Γλυκόζη νηστείας', 'mg/dL', 'glucose', '2.83'),
  ('1742-6', 'Alanine aminotransferase [Enzymatic activity/volume] in Serum or Plasma', 'Αλανινική αμινοτρανσφεράση (SGPT/ALT)', 'U/L', 'alt', '2.83'),
  ('1751-7', 'Albumin [Mass/volume] in Serum or Plasma', 'Λευκωματίνη', 'g/dL', null, '2.83'),
  ('17856-6', 'Hemoglobin A1c/Hemoglobin.total in Blood by HPLC', 'Γλυκοζυλιωμένη αιμοσφαιρίνη (HbA1c) %, HPLC', '%', 'hba1c', '2.83'),
  ('17861-6', 'Calcium [Mass/volume] in Serum or Plasma', 'Ασβέστιο (Ca)', 'mg/dL', null, '2.83'),
  ('1798-8', 'Amylase [Enzymatic activity/volume] in Serum or Plasma', 'Αμυλάση', 'U/L', null, '2.83'),
  ('18262-6', 'Cholesterol in LDL [Mass/volume] in Serum or Plasma by Direct assay', 'LDL χοληστερόλη (άμεση μέτρηση)', 'mg/dL', 'ldl', '2.83'),
  ('19123-9', 'Magnesium [Mass/volume] in Serum or Plasma', 'Μαγνήσιο (Mg)', 'mg/dL', null, '2.83'),
  ('1920-8', 'Aspartate aminotransferase [Enzymatic activity/volume] in Serum or Plasma', 'Ασπαρτική αμινοτρανσφεράση (SGOT/AST)', 'U/L', 'ast', '2.83'),
  ('1968-7', 'Bilirubin.direct [Mass/volume] in Serum or Plasma', 'Χολερυθρίνη άμεση', 'mg/dL', null, '2.83'),
  ('1975-2', 'Bilirubin.total [Mass/volume] in Serum or Plasma', 'Χολερυθρίνη ολική', 'mg/dL', null, '2.83'),
  ('1988-5', 'C reactive protein [Mass/volume] in Serum or Plasma', 'C-αντιδρώσα πρωτεΐνη (CRP)', 'mg/L', 'crp', '2.83'),
  ('1989-3', '25-hydroxyvitamin D3 [Mass/volume] in Serum or Plasma', '25-υδροξυβιταμίνη D3', 'ng/mL', 'vitamin_d', '2.83'),
  ('20448-7', 'Insulin [Units/volume] in Serum or Plasma', 'Ινσουλίνη', 'u[IU]/mL', null, '2.83'),
  ('2064-4', 'Ceruloplasmin [Mass/volume] in Serum or Plasma', 'Σερουλοπλασμίνη', 'mg/dL', 'ceruloplasmin', '2.83'),
  ('2075-0', 'Chloride [Moles/volume] in Serum or Plasma', 'Χλώριο (Cl)', 'mmol/L', null, '2.83'),
  ('2085-9', 'Cholesterol in HDL [Mass/volume] in Serum or Plasma', 'HDL χοληστερόλη', 'mg/dL', 'hdl', '2.83'),
  ('2089-1', 'Cholesterol in LDL [Mass/volume] in Serum or Plasma', 'LDL χοληστερόλη', 'mg/dL', 'ldl', '2.83'),
  ('2093-3', 'Cholesterol [Mass/volume] in Serum or Plasma', 'Ολική χοληστερόλη', 'mg/dL', 'cholesterol_total', '2.83'),
  ('2132-9', 'Cobalamin (Vitamin B12) [Mass/volume] in Serum or Plasma', 'Βιταμίνη B12', 'pg/mL', null, '2.83'),
  ('2143-6', 'Cortisol [Mass/volume] in Serum or Plasma', 'Κορτιζόλη', 'ug/dL', null, '2.83'),
  ('2157-6', 'Creatine kinase [Enzymatic activity/volume] in Serum or Plasma', 'Κρεατινοφωσφοκινάση (CPK)', 'U/L', 'ck', '2.83'),
  ('2160-0', 'Creatinine [Mass/volume] in Serum or Plasma', 'Κρεατινίνη', 'mg/dL', 'creatinine', '2.83'),
  ('2276-4', 'Ferritin [Mass/volume] in Serum or Plasma', 'Φερριτίνη', 'ng/mL', 'ferritin', '2.83'),
  ('2284-8', 'Folate [Mass/volume] in Serum or Plasma', 'Φυλλικό οξύ', 'ng/mL', null, '2.83'),
  ('2324-2', 'Gamma glutamyl transferase [Enzymatic activity/volume] in Serum or Plasma', 'γ-Γλουταμυλοτρανσφεράση (γ-GT)', 'U/L', null, '2.83'),
  ('2345-7', 'Glucose [Mass/volume] in Serum or Plasma', 'Γλυκόζη (σάκχαρο)', 'mg/dL', 'glucose', '2.83'),
  ('2458-8', 'IgA [Mass/volume] in Serum or Plasma', 'Ανοσοσφαιρίνη A (IgA)', 'mg/dL', null, '2.83'),
  ('2465-3', 'IgG [Mass/volume] in Serum or Plasma', 'Ανοσοσφαιρίνη G (IgG)', 'mg/dL', null, '2.83'),
  ('2472-9', 'IgM [Mass/volume] in Serum or Plasma', 'Ανοσοσφαιρίνη M (IgM)', 'mg/dL', null, '2.83'),
  ('2498-4', 'Iron [Mass/volume] in Serum or Plasma', 'Σίδηρος ορού (Fe)', 'ug/dL', 'iron', '2.83'),
  ('2500-7', 'Iron binding capacity [Mass/volume] in Serum or Plasma', 'Ολική σιδηροδεσμευτική ικανότητα (TIBC)', 'ug/dL', null, '2.83'),
  ('2571-8', 'Triglyceride [Mass/volume] in Serum or Plasma', 'Τριγλυκερίδια', 'mg/dL', 'triglycerides', '2.83'),
  ('26043-0', 'HLA-B27 [Presence] by NAA with probe detection', 'HLA-B27 (PCR)', null, 'hla_b27', '2.83'),
  ('26464-8', 'Leukocytes [#/volume] in Blood', 'Λευκά αιμοσφαίρια', '10*3/uL', 'wbc', '2.83'),
  ('2742-5', 'Angiotensin converting enzyme [Enzymatic activity/volume] in Serum or Plasma', 'Μετατρεπτικό ένζυμο αγγειοτασίνης (ACE)', 'U/L', 'ace', '2.83'),
  ('2777-1', 'Phosphate [Mass/volume] in Serum or Plasma', 'Φώσφορος (P)', 'mg/dL', null, '2.83'),
  ('2823-3', 'Potassium [Moles/volume] in Serum or Plasma', 'Κάλιο (K)', 'mmol/L', 'potassium', '2.83'),
  ('2857-1', 'Prostate specific Ag [Mass/volume] in Serum or Plasma', 'Ειδικό προστατικό αντιγόνο (PSA)', 'ng/mL', null, '2.83'),
  ('2885-2', 'Protein [Mass/volume] in Serum or Plasma', 'Ολικά λευκώματα', 'g/dL', null, '2.83'),
  ('2951-2', 'Sodium [Moles/volume] in Serum or Plasma', 'Νάτριο (Na)', 'mmol/L', 'sodium', '2.83'),
  ('3016-3', 'Thyrotropin [Units/volume] in Serum or Plasma', 'Θυρεοειδοτρόπος ορμόνη (TSH)', 'm[IU]/L', 'tsh', '2.83'),
  ('3024-7', 'Thyroxine (T4) free [Mass/volume] in Serum or Plasma', 'Ελεύθερη θυροξίνη (FT4)', 'ng/dL', null, '2.83'),
  ('3034-6', 'Transferrin [Mass/volume] in Serum or Plasma', 'Τρανσφερρίνη', 'mg/dL', null, '2.83'),
  ('30341-2', 'Erythrocyte [Sedimentation Rate] in Blood', 'Ταχύτητα καθίζησης ερυθρών (ΤΚΕ)', 'mm/h', 'esr', '2.83'),
  ('3040-3', 'Lipase [Enzymatic activity/volume] in Serum or Plasma', 'Λιπάση', 'U/L', null, '2.83'),
  ('3051-0', 'Triiodothyronine (T3) Free [Mass/volume] in Serum or Plasma', 'Ελεύθερη τριιωδοθυρονίνη (FT3)', 'pg/mL', null, '2.83'),
  ('30522-7', 'C reactive protein [Mass/volume] in Serum or Plasma by High sensitivity method', 'C-αντιδρώσα πρωτεΐνη υψηλής ευαισθησίας (hs-CRP)', 'mg/L', 'crp', '2.83'),
  ('3084-1', 'Urate [Mass/volume] in Serum or Plasma', 'Ουρικό οξύ', 'mg/dL', 'uric_acid', '2.83'),
  ('3091-6', 'Urea [Mass/volume] in Serum or Plasma', 'Ουρία', 'mg/dL', 'urea', '2.83'),
  ('3173-2', 'aPTT in Blood by Coagulation assay', 'Χρόνος μερικής θρομβοπλαστίνης (aPTT)', 's', null, '2.83'),
  ('3255-7', 'Fibrinogen [Mass/volume] in Platelet poor plasma by Coagulation assay', 'Ινωδογόνο', 'mg/dL', null, '2.83'),
  ('32623-1', 'Platelet [Entitic mean volume] in Blood by Automated count', 'Μέσος όγκος αιμοπεταλίων (MPV)', 'fL', null, '2.83'),
  ('33253-6', 'Nuclear Ab [Titer] in Serum by Hep2 substrate', 'Αντιπυρηνικά αντισώματα (ANA), τίτλος, Hep-2', '{titer}', 'ana', '2.83'),
  ('33935-8', 'Cyclic citrullinated peptide IgG Ab [Units/volume] in Serum or Plasma', 'Αντισώματα έναντι κυκλικού κιτρουλλινιωμένου πεπτιδίου IgG (anti-CCP)', '[arb''U]/mL', 'anti_ccp', '2.83'),
  ('33959-8', 'Procalcitonin [Mass/volume] in Serum or Plasma', 'Προκαλσιτονίνη', 'ng/mL', null, '2.83'),
  ('4485-9', 'Complement C3 [Mass/volume] in Serum or Plasma', 'Συμπλήρωμα C3', 'mg/dL', null, '2.83'),
  ('4498-2', 'Complement C4 [Mass/volume] in Serum or Plasma', 'Συμπλήρωμα C4', 'mg/dL', null, '2.83'),
  ('4537-7', 'Erythrocyte [Sedimentation Rate] in Blood by Westergren method', 'Ταχύτητα καθίζησης ερυθρών (ΤΚΕ), Westergren', 'mm/h', 'esr', '2.83'),
  ('4544-3', 'Hematocrit [Volume Fraction] of Blood by Automated count', 'Αιματοκρίτης (HCT)', '%', 'hematocrit', '2.83'),
  ('4548-4', 'Hemoglobin A1c/Hemoglobin.total in Blood', 'Γλυκοζυλιωμένη αιμοσφαιρίνη (HbA1c) %', '%', 'hba1c', '2.83'),
  ('4821-5', 'HLA-B27 [Presence]', 'HLA-B27', null, 'hla_b27', '2.83'),
  ('5048-4', 'Nuclear Ab [Titer] in Serum by Immunofluorescence', 'Αντιπυρηνικά αντισώματα (ANA), τίτλος, ανοσοφθορισμός', '{titer}', 'ana', '2.83'),
  ('53027-9', 'Cyclic citrullinated peptide Ab [Units/volume] in Serum', 'Αντισώματα έναντι κυκλικού κιτρουλλινιωμένου πεπτιδίου (anti-CCP)', '[arb''U]/mL', 'anti_ccp', '2.83'),
  ('5902-2', 'Prothrombin time (PT)', 'Χρόνος προθρομβίνης (PT)', 's', null, '2.83'),
  ('5905-5', 'Monocytes/Leukocytes in Blood by Automated count', 'Μονοκύτταρα %', '%', null, '2.83'),
  ('59261-8', 'Hemoglobin A1c/Hemoglobin.total standardized per IFCC-RMP for CDT in Blood', 'Γλυκοζυλιωμένη αιμοσφαιρίνη (HbA1c) mmol/mol, IFCC', 'mmol/mol', 'hba1c', '2.83'),
  ('62292-8', '25-Hydroxyvitamin D3+25-Hydroxyvitamin D2 [Mass/volume] in Serum or Plasma', '25-υδροξυβιταμίνη D (25-OH D)', 'ng/mL', 'vitamin_d', '2.83'),
  ('6301-6', 'INR in Platelet poor plasma by Coagulation assay', 'INR', '{INR}', null, '2.83'),
  ('6690-2', 'Leukocytes [#/volume] in Blood by Automated count', 'Λευκά αιμοσφαίρια (WBC)', '10*3/uL', 'wbc', '2.83'),
  ('6768-6', 'Alkaline phosphatase [Enzymatic activity/volume] in Serum or Plasma', 'Αλκαλική φωσφατάση (ALP)', 'U/L', null, '2.83'),
  ('704-7', 'Basophils [#/volume] in Blood by Automated count', 'Βασεόφιλα (απόλυτος αριθμός)', '10*3/uL', null, '2.83'),
  ('706-2', 'Basophils/Leukocytes in Blood by Automated count', 'Βασεόφιλα %', '%', null, '2.83'),
  ('711-2', 'Eosinophils [#/volume] in Blood by Automated count', 'Ηωσινόφιλα (απόλυτος αριθμός)', '10*3/uL', null, '2.83'),
  ('713-8', 'Eosinophils/Leukocytes in Blood by Automated count', 'Ηωσινόφιλα %', '%', null, '2.83'),
  ('718-7', 'Hemoglobin [Mass/volume] in Blood', 'Αιμοσφαιρίνη (HGB)', 'g/dL', 'hemoglobin', '2.83'),
  ('731-0', 'Lymphocytes [#/volume] in Blood by Automated count', 'Λεμφοκύτταρα (απόλυτος αριθμός)', '10*3/uL', null, '2.83'),
  ('736-9', 'Lymphocytes/Leukocytes in Blood by Automated count', 'Λεμφοκύτταρα %', '%', null, '2.83'),
  ('742-7', 'Monocytes [#/volume] in Blood by Automated count', 'Μονοκύτταρα (απόλυτος αριθμός)', '10*3/uL', null, '2.83'),
  ('751-8', 'Neutrophils [#/volume] in Blood by Automated count', 'Ουδετερόφιλα (απόλυτος αριθμός)', '10*3/uL', null, '2.83'),
  ('770-8', 'Neutrophils/Leukocytes in Blood by Automated count', 'Ουδετερόφιλα %', '%', null, '2.83'),
  ('777-3', 'Platelets [#/volume] in Blood by Automated count', 'Αιμοπετάλια (PLT)', '10*3/uL', 'platelets', '2.83'),
  ('785-6', 'MCH [Entitic mass] by Automated count', 'Μέση περιεκτικότητα αιμοσφαιρίνης (MCH)', 'pg', null, '2.83'),
  ('786-4', 'MCHC [Entitic Mass/volume] in Red Blood Cells by Automated count', 'Μέση πυκνότητα αιμοσφαιρίνης (MCHC)', 'g/dL', null, '2.83'),
  ('787-2', 'MCV [Entitic mean volume] in Red Blood Cells by Automated count', 'Μέσος όγκος ερυθρών (MCV)', 'fL', null, '2.83'),
  ('788-0', 'Erythrocyte [DistWidth] in Blood by Automated count', 'Εύρος κατανομής ερυθρών (RDW)', '%', null, '2.83'),
  ('789-8', 'Erythrocytes [#/volume] in Blood by Automated count', 'Ερυθρά αιμοσφαίρια (RBC)', '10*6/uL', 'rbc', '2.83'),
  ('8061-4', 'Nuclear Ab [Presence] in Serum', 'Αντιπυρηνικά αντισώματα (ANA)', null, 'ana', '2.83'),
  ('8098-6', 'Thyroglobulin Ab [Units/volume] in Serum or Plasma', 'Αντισώματα έναντι θυρεοσφαιρίνης (anti-Tg)', '[IU]/mL', null, '2.83'),
  ('8099-4', 'Thyroperoxidase Ab [Units/volume] in Serum or Plasma', 'Αντισώματα έναντι θυρεοειδικής υπεροξειδάσης (anti-TPO)', '[IU]/mL', null, '2.83')
), up as (
  insert into __SCHEMA__.lab_loinc (loinc, name_en, name_el, ucum, analyte_key, loinc_version)
  select * from src
  on conflict (loinc) do update set name_en = excluded.name_en, name_el = excluded.name_el, ucum = excluded.ucum,
    analyte_key = excluded.analyte_key, loinc_version = excluded.loinc_version
  returning loinc
)
delete from __SCHEMA__.lab_loinc l where not exists (select 1 from src where src.loinc = l.loinc);

do $$
declare
  n  bigint;
  fp text;
begin
  select count(*), md5(string_agg(l.loinc || ' ' || l.name_en || ' ' || coalesce(l.name_el, '') || ' '
                                  || coalesce(l.ucum, '') || ' ' || coalesce(l.analyte_key, '') || ' ' || l.loinc_version,
                                  '|' order by l.loinc collate "C"))
    into n, fp from __SCHEMA__.lab_loinc l;
  if n <> 95 or fp is distinct from 'd991c4e5dc77e8dca62f6e3895a6b516' then
    raise exception 'lab_loinc is not the file (% rows, md5 %): nothing was changed', n, fp;
  end if;
end $$;

-- 2. The code on each result row. Format-checked like the table's key; no foreign key (a row keeps its code even if
-- the list changes later).
alter table __SCHEMA__.results add column if not exists loinc text;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'results_loinc_format'
                 and conrelid = '__SCHEMA__.results'::regclass) then
    alter table __SCHEMA__.results add constraint results_loinc_format check (loinc ~ '^[0-9]{1,7}-[0-9]$');
  end if;
end $$;
create index if not exists results_patient_loinc_idx on __SCHEMA__.results (patient_id, loinc);

-- 3. Which marker a result row is, by its code first. A listed code decides only when it has a key and 014's whole
--    answer (alias, then key) is empty or the same key; a listed code with no key, or that disagrees, decides nothing.
create or replace function __SCHEMA__.match_marker(analyte text, analyte_key text, loinc text) returns text
language sql stable set search_path = ''
as $$
  select case
    when not c.listed then c.kw
    when c.key is not null and coalesce(c.kw, c.key) = c.key then c.key
  end
  from (select __SCHEMA__.match_marker(match_marker.analyte, match_marker.analyte_key) as kw,
               exists (select 1 from __SCHEMA__.lab_loinc x where x.loinc = match_marker.loinc) as listed,
               (select x.analyte_key from __SCHEMA__.lab_loinc x where x.loinc = match_marker.loinc) as key) c
$$;

-- 014's coding, with the code read from each lab row (l). Everything else is 014's, unchanged:
--   labs        [{o, a, k, l, n, x, u, f}]: order (1 = newest), analyte, analyte_key, loinc, value_num, value_text, unit, flag
--   texts       [{t, img}]: findings and diary text; img = the finding is from an imaging report
--   specialties ["Rheumatology", ...]
create or replace function __SCHEMA__.match_codes_from(labs jsonb, texts jsonb, specialties jsonb) returns text[]
language sql stable set search_path = ''
as $$
  with lab as (
    select l.o, __SCHEMA__.match_marker(l.a, l.k, l.l) as marker, l.n, l.x, l.u, l.f
    from jsonb_to_recordset(coalesce(labs, '[]'::jsonb)) as l (o bigint, a text, k text, l text, n numeric, x text, u text, f text)
  ), decided as (
    select distinct on (z.marker) z.codes
    from (select lab.o, lab.marker, __SCHEMA__.match_read(lab.marker, lab.n, lab.x, lab.u, lab.f) as codes from lab) z
    where z.codes is not null
    order by z.marker, z.o
  ), txt as (
    select __SCHEMA__.match_fold(t.t) as t, coalesce(t.img, false) as img
    from jsonb_to_recordset(coalesce(texts, '[]'::jsonb)) as t (t text, img boolean)
  ), spec as (
    select __SCHEMA__.match_fold(s.s) as t from jsonb_array_elements_text(coalesce(specialties, '[]'::jsonb)) as s (s)
  ), codes as (
    select unnest(d.codes) as code from decided d
    union
    select v.code from __SCHEMA__.match_vocab v
    where (v.source = 'symptom' and exists (select 1 from txt where __SCHEMA__.match_text_has(txt.t, v.pattern)))
       or (v.source = 'imaging' and exists (select 1 from txt where txt.img and __SCHEMA__.match_text_has(txt.t, v.pattern)))
       or (v.source = 'specialty' and exists (select 1 from spec where spec.t ~ v.pattern))
  )
  select coalesce(array_agg(c.code order by c.code collate "C"), '{}') from codes c
$$;

-- The patient's coded features from her own confirmed records (same sources as 005 and 014), now with each row's
-- code. Computed, never stored. Same signature, so 018's RPC calls it unchanged.
create or replace function __SCHEMA__.match_patient_codes(patient uuid) returns text[]
language sql stable set search_path = ''
as $$
  select __SCHEMA__.match_codes_from(
    (select coalesce(jsonb_agg(jsonb_build_object('o', q.o, 'a', q.analyte, 'k', q.analyte_key, 'l', q.loinc,
                                                  'n', q.value_num, 'x', q.value_text, 'u', q.unit, 'f', q.flag)), '[]'::jsonb)
       from (select r.analyte, r.analyte_key, r.loinc, r.value_num, r.value_text, r.unit, r.flag,
                    row_number() over (order by d.exam_date desc nulls last, d.confirmed_at desc nulls last, r.id) as o
               from __SCHEMA__.results r
               join __SCHEMA__.documents d on d.id = r.document_id and d.status = 'confirmed'
              where r.patient_id = match_patient_codes.patient) q),
    (select coalesce(jsonb_agg(jsonb_build_object('t', x.t, 'img', x.img)), '[]'::jsonb)
       from (select f.text_original as t, d.kind = 'imaging_report' as img
               from __SCHEMA__.findings f
               join __SCHEMA__.documents d on d.id = f.document_id and d.status = 'confirmed'
              where f.patient_id = match_patient_codes.patient
             union all
             select e.text, false from __SCHEMA__.diary_entries e where e.patient_id = match_patient_codes.patient) x),
    (select coalesce(jsonb_agg(f.specialty), '[]'::jsonb)
       from __SCHEMA__.findings f
       join __SCHEMA__.documents d on d.id = f.document_id and d.status = 'confirmed'
      where f.patient_id = match_patient_codes.patient and f.specialty is not null))
$$;

-- New functions get EXECUTE for PUBLIC (001): take it away. CREATE OR REPLACE keeps 014's grants on the other two;
-- said again so this file stands alone (hdb check: no PUBLIC EXECUTE).
revoke execute on function __SCHEMA__.match_marker(text, text, text), __SCHEMA__.match_codes_from(jsonb, jsonb, jsonb),
  __SCHEMA__.match_patient_codes(uuid) from public, anon, authenticated;
grant execute on function __SCHEMA__.match_marker(text, text, text), __SCHEMA__.match_codes_from(jsonb, jsonb, jsonb),
  __SCHEMA__.match_patient_codes(uuid) to service_role;

insert into __SCHEMA__._applied (file) values ('020_lab_loinc.sql') on conflict (file) do nothing;
