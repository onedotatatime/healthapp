-- Checks for the patient's feature coding (014_match_coding.sql, MIN-4505). Renders with __SCHEMA__ ->
-- healthapp_<env> (sed, as the other checks). Needs 005, 006 and 014. Writes no row: the coding is checked
-- through match_codes_from, which reads plain values. Synthetic data only. Needs 020 for the LOINC part below.
-- Output, one row per part (a part passes when failures = 0):
--   cases    hand-written cases: each of the six markers positive, negative and as text, units, the
--            extraction's HbA1c-as-haemoglobin key, latest-decides, and negation in English and Greek.
--   cohort   agreement with scripts/synthetic/match.py: every row of match_cohort (its codes ARE
--            match.features of the synthetic record, seeded by 006) is written out the way the extraction
--            stores a record (printed names in English or Greek, units, text results, an older result that
--            says the opposite, a newer one that decides nothing, symptoms in words with negated ones mixed in)
--            and coded back. failures = rows whose SQL codes differ from match.py's.
-- match_coding_check(n) codes only the first n cohort rows (0 = cases only); the full run takes about a minute.
-- LOINC step 1 (020_lab_loinc.sql, MIN-4689; needs 020 from here on): a lab row may carry a code (`l`). The cases
-- below the "LOINC" line check that a code decides the test, that a code not on the list or no code keeps 014's
-- keyword path, and that a code 014's answer (alias, then key) contradicts, or a listed code with no key, decides
-- nothing (MIN-4690 §3: a newer MCH or MCHC row must not hide a coded low Hb).
-- match_coding_check(n, coded_pct): coded_pct (0, 50 or 100) is the share of the cohort's lab rows that carry their
-- code from lab_loinc (100 = every row, 50 = every other row, 0 = none: 014's path); each run must still give
-- match.py's codes. All 5,000 rows take about 40 s on a laptop Postgres, several minutes on the hosted one.
create or replace function pg_temp.match_coding_check(cohort_rows integer default 400, coded_pct integer default 0)
returns table (part text, cases bigint, failures bigint, failed text[])
language sql as $check$
with c (name, labs, texts, specs, want) as (values
  -- ANA
  ('ANA text positive (en)', '[{"o":1,"a":"ANA (IFA)","x":"Positive"}]', '[]', '[]', '{ANA_positive}'),
  ('ANA text negative (el)', '[{"o":1,"a":"Αντιπυρηνικά αντισώματα","x":"Αρνητικό"}]', '[]', '[]', '{}'),
  ('ANA titre 1:160 positive', '[{"o":1,"a":"Antinuclear antibodies","x":"1:160"}]', '[]', '[]', '{ANA_positive}'),
  ('ANA titre <1:80 negative', '[{"o":1,"a":"ANA","x":"<1:80"}]', '[]', '[]', '{}'),
  ('ANA titre 1:40 negative', '[{"o":1,"a":"ANA","x":"1/40"}]', '[]', '[]', '{}'),
  ('ANA index above printed range', '[{"o":1,"a":"ANA screen","n":2.1,"u":"index","f":"high"}]', '[]', '[]', '{ANA_positive}'),
  ('ANA index within printed range', '[{"o":1,"a":"ANA screen","n":0.4,"u":"index","f":"normal"}]', '[]', '[]', '{}'),
  ('ANA number without a printed range decides nothing', '[{"o":1,"a":"ANA","n":3,"f":"unknown"}]', '[]', '[]', '{}'),
  ('ANA equivocal decides nothing', '[{"o":1,"a":"ANA","x":"Equivocal"}]', '[]', '[]', '{}'),
  ('ANA word and titre disagree: Positive 1:40 decides nothing', '[{"o":1,"a":"ANA","x":"Positive 1:40"}]', '[]', '[]', '{}'),
  ('ANA word and titre disagree: newer Negative (1:80) decides nothing, older positive stands', '[{"o":1,"a":"ANA","x":"Negative (1:80)"},{"o":2,"a":"ANA","x":"Positive"}]', '[]', '[]', '{ANA_positive}'),
  -- HLA-B27
  ('HLA-B27 θετικό', '[{"o":1,"a":"HLA-B27","x":"Θετικό"}]', '[]', '[]', '{HLA_B27_positive}'),
  ('HLA-B27 detected', '[{"o":1,"a":"HLA B27 (PCR)","x":"Detected"}]', '[]', '[]', '{HLA_B27_positive}'),
  ('HLA-B27 not detected', '[{"o":1,"a":"HLA-B27","x":"Not detected"}]', '[]', '[]', '{}'),
  ('HLA-B27 δεν ανιχνεύεται', '[{"o":1,"a":"HLA-B27","x":"Δεν ανιχνεύεται"}]', '[]', '[]', '{}'),
  -- HbA1c
  ('HbA1c 7.1 % high', '[{"o":1,"a":"HbA1c","n":7.1,"u":"%","f":"high"}]', '[]', '[]', '{HbA1c_high}'),
  ('HbA1c 5.2 % normal', '[{"o":1,"a":"HbA1c","n":5.2,"u":"%","f":"normal"}]', '[]', '[]', '{}'),
  ('HbA1c keyed as haemoglobin by the extraction', '[{"o":1,"a":"Glycated haemoglobin (HbA1c)","k":"hemoglobin","n":6.8,"u":"%","f":"high"}]', '[]', '[]', '{HbA1c_high}'),
  ('Glycated hemoglobin without HbA1c in the name, keyed as haemoglobin', '[{"o":1,"a":"Glycated hemoglobin","k":"hemoglobin","n":5.4,"u":"%","f":"normal"}]', '[]', '[]', '{}'),
  ('HbA1c in Greek, keyed as haemoglobin, normal', '[{"o":1,"a":"Γλυκοζυλιωμένη αιμοσφαιρίνη","k":"hemoglobin","n":5.1,"u":"%","f":"normal"}]', '[]', '[]', '{}'),
  ('HbA1c 53 mmol/mol high', '[{"o":1,"a":"Hb A1c","n":53,"u":"mmol/mol","f":"high"}]', '[]', '[]', '{HbA1c_high}'),
  ('HbA1c 36 mmol/mol normal', '[{"o":1,"a":"HbA1c (IFCC)","n":36,"u":"mmol/mol","f":"normal"}]', '[]', '[]', '{}'),
  ('HbA1c in an unknown unit decides nothing', '[{"o":1,"a":"HbA1c","n":7.1,"u":"mg/dL","f":"high"}]', '[]', '[]', '{}'),
  ('haemoglobin is still haemoglobin', '[{"o":1,"a":"Haemoglobin","k":"hemoglobin","n":10.1,"u":"g/dL","f":"low"}]', '[]', '[]', '{Hb_low}'),
  -- ACE
  ('ACE 78 U/L high', '[{"o":1,"a":"Angiotensin converting enzyme","n":78,"u":"U/L","f":"high"}]', '[]', '[]', '{ACE_high}'),
  ('ACE in Greek 30 U/L normal', '[{"o":1,"a":"Μετατρεπτικό ένζυμο αγγειοτασίνης (ΜΕΑ)","n":30,"u":"U/L","f":"normal"}]', '[]', '[]', '{}'),
  -- Ceruloplasmin
  ('ceruloplasmin 12 mg/dL low (el)', '[{"o":1,"a":"Σερουλοπλασμίνη","n":12,"u":"mg/dL","f":"low"}]', '[]', '[]', '{ceruloplasmin_low}'),
  ('ceruloplasmin 0.12 g/L low', '[{"o":1,"a":"Ceruloplasmin","n":0.12,"u":"g/L","f":"low"}]', '[]', '[]', '{ceruloplasmin_low}'),
  ('ceruloplasmin 0.30 g/L normal', '[{"o":1,"a":"Caeruloplasmin","n":0.30,"u":"g/L","f":"normal"}]', '[]', '[]', '{}'),
  ('ceruloplasmin 35 mg/dL normal', '[{"o":1,"a":"Ceruloplasmin","n":35,"u":"mg/dL","f":"normal"}]', '[]', '[]', '{}'),
  -- CK
  ('CK 640 U/L high', '[{"o":1,"a":"Creatine kinase (CK)","n":640,"u":"U/L","f":"high"}]', '[]', '[]', '{CK_high}'),
  ('CPK in Greek 120 U/L normal', '[{"o":1,"a":"Κρεατινοφωσφοκινάση (CPK)","n":120,"u":"U/L","f":"normal"}]', '[]', '[]', '{}'),
  ('CK-MB is not CK', '[{"o":1,"a":"CK-MB","n":250,"u":"U/L","f":"high"}]', '[]', '[]', '{}'),
  ('creatinine is not CK', '[{"o":1,"a":"Κρεατινίνη","k":"creatinine","n":1.0,"u":"mg/dL","f":"normal"}]', '[]', '[]', '{}'),
  -- RF and anti-CCP written as text
  ('RF text positive', '[{"o":1,"a":"Rheumatoid factor (RF)","k":"rf","x":"Positive"}]', '[]', '[]', '{RF_positive}'),
  ('anti-CCP text αρνητικό', '[{"o":1,"a":"Αντι-CCP","k":"anti_ccp","x":"Αρνητικό"}]', '[]', '[]', '{}'),
  ('CRP text decides nothing', '[{"o":1,"a":"CRP","k":"crp","x":"<0.5"}]', '[]', '[]', '{}'),
  -- latest decides
  ('newer negative ANA wins over older positive', '[{"o":1,"a":"ANA","x":"Negative"},{"o":2,"a":"ANA","x":"Positive"}]', '[]', '[]', '{}'),
  ('newer equivocal ANA leaves older positive', '[{"o":1,"a":"ANA","x":"Equivocal"},{"o":2,"a":"ANA","x":"Positive"}]', '[]', '[]', '{ANA_positive}'),
  ('newer normal HbA1c (mmol/mol) wins over older high', '[{"o":1,"a":"HbA1c","n":35,"u":"mmol/mol","f":"normal"},{"o":2,"a":"HbA1c","n":7.4,"u":"%","f":"high"}]', '[]', '[]', '{}'),
  -- negation (texts)
  ('joint pain stated', '[]', '[{"t":"Joint pain in both hands."}]', '[]', '{joint_pain}'),
  ('no joint pain', '[]', '[{"t":"No joint pain."}]', '[]', '{}'),
  ('χωρίς πόνο στις αρθρώσεις', '[]', '[{"t":"Χωρίς πόνο στις αρθρώσεις."}]', '[]', '{}'),
  ('denies morning stiffness', '[]', '[{"t":"Denies morning stiffness."}]', '[]', '{}'),
  ('όχι πρωινή δυσκαμψία', '[]', '[{"t":"Όχι πρωινή δυσκαμψία."}]', '[]', '{}'),
  ('negative for sacroiliitis (imaging)', '[]', '[{"t":"Negative for sacroiliitis.","img":true}]', '[]', '{}'),
  ('sacroiliitis stated (imaging)', '[]', '[{"t":"Left-sided sacroiliitis.","img":true}]', '[]', '{img_sacroiliitis}'),
  ('effusion is absent (imaging)', '[]', '[{"t":"Joint effusion is absent.","img":true}]', '[]', '{}'),
  ('δεν παρατηρείται υδράρθρωση (imaging)', '[]', '[{"t":"Δεν παρατηρείται υδράρθρωση.","img":true}]', '[]', '{}'),
  ('υδράρθρωση δεν παρατηρείται (imaging)', '[]', '[{"t":"Υδράρθρωση δεν παρατηρείται.","img":true}]', '[]', '{}'),
  ('denies X but reports Y', '[]', '[{"t":"Denies fatigue but reports joint pain."}]', '[]', '{joint_pain}'),
  ('αρνείται X αλλά αναφέρει Y', '[]', '[{"t":"Αρνείται κόπωση αλλά αναφέρει αρθραλγία."}]', '[]', '{joint_pain}'),
  ('negation stops at the sentence', '[]', '[{"t":"No fever. Morning stiffness for an hour."}]', '[]', '{morning_stiffness}'),
  ('negation reaches 5 words, not 8', '[]', '[{"t":"No fever or chills reported over the last months, joint pain in the mornings"}]', '[]', '{joint_pain}'),
  ('no improvement is not a negation', '[]', '[{"t":"No improvement of the joint pain."}]', '[]', '{joint_pain}'),
  ('reports fatigue and has had no rash', '[]', '[{"t":"Reports fatigue and has had no rash."}]', '[]', '{fatigue}'),
  ('the specialty field is not negated', '[]', '[]', '["Rheumatology"]', '{spec_rheumatology}'),
  -- the seeded persona's record (007), as the extraction stores it: the six codes match.py gives her
  ('Maria 007 record', '[{"o":1,"a":"ALT","k":"alt","n":20.3,"u":"U/L","f":"normal"},{"o":2,"a":"Anti-CCP","k":"anti_ccp","n":41.5,"u":"U/mL","f":"high"},{"o":3,"a":"Haemoglobin","k":"hemoglobin","n":14.2,"u":"g/dL","f":"normal"},{"o":4,"a":"C-reactive protein (CRP)","k":"crp","n":7.6,"u":"mg/L","f":"high"},{"o":5,"a":"Uric acid","k":"uric_acid","n":5.5,"u":"mg/dL","f":"normal"},{"o":6,"a":"ACE","k":"ace","n":42.2,"u":"U/L","f":"normal"},{"o":7,"a":"Rheumatoid factor (RF)","k":"rf","n":25.3,"u":"IU/mL","f":"high"},{"o":8,"a":"Erythrocyte sedimentation rate (ESR)","k":"esr","n":15.8,"u":"mm/h","f":"normal"},{"o":9,"a":"Anti-CCP","k":"anti_ccp","n":5.1,"u":"U/mL","f":"normal"},{"o":10,"a":"Erythrocyte sedimentation rate (ESR)","k":"esr","n":30.1,"u":"mm/h","f":"high"}]',
   '[{"t":"Joint pain and morning stiffness in both hands."}]', '["Rheumatology"]',
   '{CRP_high,RF_positive,anti_CCP_positive,joint_pain,morning_stiffness,spec_rheumatology}'),
  -- LOINC (020). The printed names below give no keyword on purpose: only the code can decide them.
  ('LOINC: a code decides the test (no keyword in the name)', '[{"o":1,"a":"Πρωτεΐνη φλεγμονής","l":"1988-5","n":12,"u":"mg/L","f":"high"}]', '[]', '[]', '{CRP_high}'),
  ('LOINC: the hs-CRP code is the same test', '[{"o":1,"a":"Πρωτεΐνη φλεγμονής (ευαίσθητη)","l":"30522-7","n":7.5,"u":"mg/L","f":"high"}]', '[]', '[]', '{CRP_high}'),
  ('LOINC: a code below the threshold decides "normal"', '[{"o":1,"a":"Πρωτεΐνη φλεγμονής","l":"1988-5","n":2,"u":"mg/L","f":"normal"},{"o":2,"a":"C-reactive protein (CRP)","k":"crp","n":40,"u":"mg/L","f":"high"}]', '[]', '[]', '{}'),
  ('LOINC: the HbA1c mmol/mol code goes through 014''s unit conversion', '[{"o":1,"a":"Δείκτης γλυκαιμικού ελέγχου","l":"59261-8","n":53,"u":"mmol/mol","f":"high"}]', '[]', '[]', '{HbA1c_high}'),
  ('LOINC: the HbA1c % code', '[{"o":1,"a":"Δείκτης γλυκαιμικού ελέγχου","l":"4548-4","n":5.2,"u":"%","f":"normal"}]', '[]', '[]', '{}'),
  ('LOINC: a qualitative code read as text (HLA-B27)', '[{"o":1,"a":"Γονότυπος B (PCR)","l":"26043-0","x":"Θετικό"}]', '[]', '[]', '{HLA_B27_positive}'),
  ('LOINC: an ANA titre code', '[{"o":1,"a":"Ανοσοφθορισμός Hep-2","l":"5048-4","x":"1:320"}]', '[]', '[]', '{ANA_positive}'),
  ('LOINC: a code the extraction''s key contradicts decides nothing (uric acid printed, creatinine code)', '[{"o":1,"a":"Ουρικό οξύ","k":"uric_acid","l":"2160-0","n":2.1,"u":"mg/dL","f":"high"}]', '[]', '[]', '{}'),
  ('LOINC: a code not on the list keeps the keyword path', '[{"o":1,"a":"C-reactive protein (CRP)","k":"crp","l":"99999-9","n":12,"u":"mg/L","f":"high"}]', '[]', '[]', '{CRP_high}'),
  ('LOINC: a code not on the list and no keyword decides nothing', '[{"o":1,"a":"Πρωτεΐνη φλεγμονής","l":"99999-9","n":12,"u":"mg/L","f":"high"}]', '[]', '[]', '{}'),
  ('LOINC: a code that disagrees with the printed name decides nothing (HbA1c printed, Hb code)', '[{"o":1,"a":"Glycated haemoglobin (HbA1c)","k":"hemoglobin","l":"718-7","n":6.8,"u":"%","f":"high"}]', '[]', '[]', '{}'),
  ('LOINC: a disagreeing newer row decides nothing, the older row stands', '[{"o":1,"a":"Glycated haemoglobin (HbA1c)","k":"hemoglobin","l":"718-7","n":5.0,"u":"%","f":"normal"},{"o":2,"a":"HbA1c","n":7.4,"u":"%","f":"high"}]', '[]', '[]', '{HbA1c_high}'),
  ('LOINC: a code that agrees with the printed name decides (CK)', '[{"o":1,"a":"Creatine kinase (CK)","l":"2157-6","n":640,"u":"U/L","f":"high"}]', '[]', '[]', '{CK_high}'),
  ('LOINC: a code whose key matching does not use decides nothing (glucose)', '[{"o":1,"a":"Σάκχαρο","k":"glucose","l":"2345-7","n":250,"u":"mg/dL","f":"high"}]', '[]', '[]', '{}'),
  ('LOINC: a listed code with no key decides nothing (MCH keyed as haemoglobin; MIN-4690 §3)', '[{"o":1,"a":"Mean corpuscular haemoglobin (MCH)","k":"hemoglobin","l":"785-6","n":10,"u":"pg","f":"low"}]', '[]', '[]', '{}'),
  ('LOINC: a newer MCH row does not hide a coded low Hb (MIN-4690 §3)', '[{"o":1,"a":"Μέση περιεκτικότητα αιμοσφαιρίνης (MCH)","k":"hemoglobin","l":"785-6","n":29,"u":"pg","f":"normal"},{"o":2,"a":"Αιμοσφαιρίνη (HGB)","k":"hemoglobin","l":"718-7","n":10.5,"u":"g/dL","f":"low"}]', '[]', '[]', '{Hb_low}'),
  ('LOINC: a newer MCHC row does not hide a coded low Hb (MIN-4690 §3)', '[{"o":1,"a":"Μέση πυκνότητα αιμοσφαιρίνης (MCHC)","k":"hemoglobin","l":"786-4","n":33,"u":"g/dL","f":"normal"},{"o":2,"a":"Αιμοσφαιρίνη (HGB)","k":"hemoglobin","l":"718-7","n":10.5,"u":"g/dL","f":"low"}]', '[]', '[]', '{Hb_low}'),
  ('LOINC: 014''s alias still wins over the extraction''s key (HbA1c printed, keyed haemoglobin, HbA1c code)', '[{"o":1,"a":"Γλυκοζυλιωμένη αιμοσφαιρίνη HbA1c","k":"hemoglobin","l":"4548-4","n":6.8,"u":"%","f":"high"}]', '[]', '[]', '{HbA1c_high}'),
  ('LOINC: no code keeps 014 (the same row without l)', '[{"o":1,"a":"Glycated haemoglobin (HbA1c)","k":"hemoglobin","n":6.8,"u":"%","f":"high"}]', '[]', '[]', '{HbA1c_high}')
), cases as (
  select c.name, c.want::text[] as want,
         __SCHEMA__.match_codes_from(c.labs::jsonb, c.texts::jsonb, c.specs::jsonb) as got
  from c
),
-- cohort agreement --------------------------------------------------------------------------------------
words (code, src, ord, en, el) as (values
  ('morning_stiffness','symptom',1,'morning stiffness','πρωινή δυσκαμψία'),
  ('low_back_pain','symptom',2,'low back pain','οσφυαλγία'),
  ('joint_pain','symptom',3,'joint pain','αρθραλγία'),
  ('fatigue','symptom',4,'fatigue','κόπωση'),
  ('weight_loss','symptom',5,'weight loss','απώλεια βάρους'),
  ('weight_gain','symptom',6,'weight gain','αύξηση βάρους'),
  ('polyuria','symptom',7,'polyuria','πολυουρία'),
  ('palpitations','symptom',8,'palpitations','αίσθημα παλμών'),
  ('cold_intolerance','symptom',9,'cold intolerance','δυσανεξία στο κρύο'),
  ('heat_intolerance','symptom',10,'heat intolerance','δυσανεξία στη ζέστη'),
  ('rash','symptom',11,'rash','εξάνθημα'),
  ('headache','symptom',12,'headache','κεφαλαλγία'),
  ('cough','symptom',13,'cough','βήχας'),
  ('dry_eyes','symptom',14,'dry eyes','ξηροφθαλμία'),
  ('hand_swelling','symptom',15,'swollen hands','πρήξιμο στα χέρια'),
  ('bone_pain','symptom',16,'bone pain','οστικός πόνος'),
  ('muscle_weakness','symptom',17,'muscle weakness','μυϊκή αδυναμία'),
  ('tremor','symptom',18,'tremor','τρόμος'),
  ('leg_oedema','symptom',19,'leg oedema','οίδημα κάτω άκρων'),
  ('img_sacroiliitis','imaging',1,'sacroiliitis','ιερολαγονίτιδα'),
  ('img_disc_degeneration','imaging',2,'disc degeneration','δισκοπάθεια'),
  ('img_joint_effusion','imaging',3,'joint effusion','υδράρθρωση'),
  ('img_osteopenia','imaging',4,'osteopenia','οστεοπενία'),
  ('img_hand_erosions','imaging',5,'erosions','διαβρώσεις'),
  ('img_hilar_lymphadenopathy','imaging',6,'hilar lymphadenopathy','πυλαία λεμφαδενοπάθεια'),
  ('spec_orthopaedics','specialty',1,'Orthopaedics','Ορθοπαιδική'),
  ('spec_rheumatology','specialty',2,'Rheumatology','Ρευματολογία'),
  ('spec_gp','specialty',3,'General practice','Γενική Ιατρική'),
  ('spec_endocrinology','specialty',4,'Endocrinology','Ενδοκρινολογία'),
  ('spec_cardiology','specialty',5,'Cardiology','Καρδιολογία'),
  ('spec_gastroenterology','specialty',6,'Gastroenterology','Γαστρεντερολογία'),
  ('spec_nephrology','specialty',7,'Nephrology','Νεφρολογία'),
  ('spec_pulmonology','specialty',8,'Pulmonology','Πνευμονολογία'),
  ('spec_neurology','specialty',9,'Neurology','Νευρολογία'),
  ('spec_hepatology','specialty',10,'Hepatology','Ηπατολογία')
), names (analyte_key, i, a, k) as (values   -- k = what the extraction's synonym map writes for that name
  ('crp',0,'C-reactive protein (CRP)','crp'), ('crp',1,'CRP (C-αντιδρώσα πρωτεΐνη)','crp'),
  ('esr',0,'Erythrocyte sedimentation rate (ESR)','esr'), ('esr',1,'ΤΚΕ (Ταχύτητα καθίζησης ερυθρών)','esr'),
  ('rf',0,'Rheumatoid factor (RF)','rf'), ('rf',1,'Ρευματοειδής παράγοντας (RF)','rf'),
  ('anti_ccp',0,'Anti-CCP','anti_ccp'), ('anti_ccp',1,'Αντι-CCP','anti_ccp'),
  ('ana',0,'ANA (IFA)',null), ('ana',1,'Αντιπυρηνικά αντισώματα (ANA)',null), ('ana',2,'Antinuclear antibodies',null),
  ('hla_b27',0,'HLA-B27',null), ('hla_b27',1,'HLA B27 (PCR)',null),
  ('tsh',0,'TSH','tsh'), ('tsh',1,'Θυρεοειδοτρόπος ορμόνη (TSH)','tsh'),
  ('hba1c',0,'HbA1c',null), ('hba1c',1,'Glycated haemoglobin (HbA1c)','hemoglobin'), ('hba1c',2,'Γλυκοζυλιωμένη αιμοσφαιρίνη','hemoglobin'),
  ('ldl',0,'LDL cholesterol','ldl'), ('ldl',1,'Χοληστερόλη LDL','ldl'),
  ('ferritin',0,'Ferritin','ferritin'), ('ferritin',1,'Φερριτίνη','ferritin'),
  ('hemoglobin',0,'Haemoglobin','hemoglobin'), ('hemoglobin',1,'Αιμοσφαιρίνη','hemoglobin'),
  ('wbc',0,'White blood cells','wbc'), ('wbc',1,'Λευκά αιμοσφαίρια','wbc'),
  ('vitamin_d',0,'Vitamin D (25-OH)','vitamin_d'), ('vitamin_d',1,'Βιταμίνη D','vitamin_d'),
  ('creatinine',0,'Creatinine','creatinine'), ('creatinine',1,'Κρεατινίνη','creatinine'),
  ('uric_acid',0,'Uric acid','uric_acid'), ('uric_acid',1,'Ουρικό οξύ','uric_acid'),
  ('alt',0,'ALT (SGPT)','alt'), ('alt',1,'Αλανινική αμινοτρανσφεράση (ALT)','alt'),
  ('ace',0,'ACE',null), ('ace',1,'Angiotensin converting enzyme',null), ('ace',2,'Μετατρεπτικό ένζυμο αγγειοτασίνης (ACE)',null),
  ('ceruloplasmin',0,'Ceruloplasmin',null), ('ceruloplasmin',1,'Σερουλοπλασμίνη',null),
  ('ck',0,'Creatine kinase (CK)',null), ('ck',1,'CPK',null), ('ck',2,'Κρεατινική κινάση (CK)',null)
), co as (
  select x.* from (select row_number() over (order by m.id) as rn, m.id, m.codes from __SCHEMA__.match_cohort m) x
  where x.rn <= cohort_rows
), mk as (
  select row_number() over (order by x.analyte_key) as mi, x.analyte_key, x.unit, x.ref_low as lo, x.ref_high as hi,
         x.code_above, x.code_below, (select count(*) from names n where n.analyte_key = x.analyte_key) as ncount
  from __SCHEMA__.match_lab_defs x
), st as (
  select co.rn, mk.*, (co.rn + mk.mi) % 3 as v,
         case when mk.code_above = any (co.codes) then 'above' when mk.code_below = any (co.codes) then 'below'
              else 'normal' end as s,
         case when mk.code_above = any (co.codes) or mk.code_below = any (co.codes) then 'normal'
              when mk.code_above is not null then 'above' else 'below' end as s_old
  from co cross join mk
), val as (
  select st.*,
         (select jsonb_build_object('a', n.a, 'k', n.k) from names n
           where n.analyte_key = st.analyte_key and n.i = (st.rn + st.mi) % st.ncount) as nm,
         case st.s when 'above' then case when st.unit = 'qual' then 1 else st.hi + greatest(st.hi - st.lo, 1) * 0.5 end
                   when 'below' then greatest(st.lo - (st.hi - st.lo) * 0.25, st.lo * 0.5)
                   else case when st.unit = 'qual' then 0 else (st.lo + st.hi) / 2 end end as value,
         case st.s_old when 'above' then case when st.unit = 'qual' then 1 else st.hi + greatest(st.hi - st.lo, 1) * 0.5 end
                       when 'below' then greatest(st.lo - (st.hi - st.lo) * 0.25, st.lo * 0.5)
                       else case when st.unit = 'qual' then 0 else (st.lo + st.hi) / 2 end end as value_old
  from st
), lab_rows0 as (
  -- the main (newest deciding) row, printed the way a lab of this kind prints it
  select val.rn, val.mi, val.analyte_key, 1 as b, val.nm || jsonb_build_object('o', 10, 'f', case val.s when 'above' then 'high' when 'below' then 'low' else 'normal' end)
         || case
              when val.unit = 'qual' and val.v = 0 then jsonb_build_object('n', val.value, 'u', 'index')
              when val.unit = 'qual' and val.v = 1 then jsonb_build_object('x', case when val.s = 'above'
                     then (array['Positive', 'Detected'])[1 + val.rn % 2] else (array['Negative', 'Not detected'])[1 + val.rn % 2] end)
              when val.unit = 'qual' then jsonb_build_object('x', case when val.analyte_key = 'ana'
                     then case when val.s = 'above' then '1:320' else '<1:80' end
                     else case when val.s = 'above' then 'Θετικό' else 'Αρνητικό' end end)
              when val.code_above like '%\_positive' and val.v > 0 then jsonb_build_object('x', case when val.s = 'above'
                     then (array['Positive', 'Θετικό'])[val.v] else (array['Negative', 'Αρνητικό'])[val.v] end)
              when val.analyte_key = 'hba1c' and val.v = 1 then jsonb_build_object('n', round((val.value - 2.152) / 0.09148, 1), 'u', 'mmol/mol')
              when val.analyte_key = 'hba1c' and val.v = 2 then jsonb_build_object('n', val.value, 'u', '')
              when val.analyte_key = 'ceruloplasmin' and val.v = 1 then jsonb_build_object('n', val.value / 100, 'u', 'g/L')
              when val.analyte_key = 'ceruloplasmin' and val.v = 2 then jsonb_build_object('n', val.value * 10, 'u', 'mg/L')
              when val.analyte_key in ('ck', 'ace') and val.v = 1 then jsonb_build_object('n', val.value, 'u', 'IU/L')
              else jsonb_build_object('n', val.value, 'u', val.unit)
            end as r
  from val
  union all
  -- an older result that says the opposite: the newest one decides
  select val.rn, val.mi, val.analyte_key, 2, val.nm || jsonb_build_object('o', 20 + val.mi, 'n', val.value_old, 'u', case when val.unit = 'qual' then 'index' else val.unit end,
                                              'f', case val.s_old when 'above' then 'high' when 'below' then 'low' else 'normal' end)
  from val where (val.rn + val.mi) % 4 = 0
  union all
  -- a newer result that decides nothing (borderline text, unknown unit, text in place of a number)
  select val.rn, val.mi, val.analyte_key, 3, val.nm || jsonb_build_object('o', 1, 'f', 'unknown')
         || case when val.unit = 'qual' or val.code_above like '%\_positive' then jsonb_build_object('x', 'Equivocal')
                 when val.analyte_key in ('hba1c', 'ceruloplasmin', 'ck', 'ace') then jsonb_build_object('n', 999, 'u', 'mg/kg')
                 else jsonb_build_object('x', 'see comment') end
  from val where (val.rn + val.mi) % 5 = 1
), kc as (
  -- 020's codes per key: the mmol/mol code for a row printed in mmol/mol (HbA1c), the others in turn for the rest
  select l.analyte_key,
         array_agg(l.loinc order by l.loinc collate "C") filter (where l.ucum is distinct from 'mmol/mol') as pct,
         array_agg(l.loinc order by l.loinc collate "C") filter (where l.ucum = 'mmol/mol') as mol
  from __SCHEMA__.lab_loinc l where l.analyte_key is not null group by l.analyte_key
), lab_rows as (
  -- coded_pct of the lab rows carry their code (100: all; 50: every other row; 0: none, 014's path)
  select r0.rn, r0.r || case
           when coded_pct >= 100 or (coded_pct > 0 and (r0.rn + r0.mi + r0.b) % 2 = 0) then
             jsonb_build_object('l', case when r0.r->>'u' = 'mmol/mol' then kc.mol[1]
                                          else kc.pct[1 + ((r0.rn + r0.mi) % cardinality(kc.pct))::int] end)
           else '{}'::jsonb end as r
  from lab_rows0 r0 left join kc on kc.analyte_key = r0.analyte_key
), w as (
  select co.rn, words.*, words.code = any (co.codes) as present, case when co.rn % 2 = 0 then words.en else words.el end as word,
         row_number() over (partition by co.rn, words.src, words.code = any (co.codes)
                            order by (words.ord + co.rn) % 19, words.ord) as j
  from co cross join words
), letter as (
  select w.rn,
         coalesce(string_agg(w.word, ', ' order by w.ord) filter (where w.present), '') || '. '
         || coalesce(string_agg(format((case when w.rn % 2 = 0 then array['No %s.', 'Denies %s.', 'Negative for %s.', '%s is absent.']
                                             else array['Χωρίς %s.', 'Όχι %s.', 'Δεν αναφέρει %s.', '%s απουσιάζει.'] end)[1 + (w.rn + w.j) % 4],
                                       w.word), ' ' order by w.j) filter (where not w.present and w.j <= 2), '') || ' '
         || coalesce(max(format(case when w.rn % 2 = 0 then 'Denies %s but reports %s.' else 'Αρνείται %s αλλά αναφέρει %s.' end,
                                mix.word, w.word)) filter (where w.present and w.j = 1), '') as t
  from w join w mix on mix.rn = w.rn and mix.src = 'symptom' and not mix.present and mix.j = 3
  where w.src = 'symptom' group by w.rn
), imaging as (
  select w.rn,
         coalesce(string_agg(w.word, ', ' order by w.ord) filter (where w.present), '') || '. '
         || coalesce(string_agg(format((case when w.rn % 2 = 0 then array['No %s.', '%s is absent.']
                                             else array['Δεν παρατηρείται %s.', '%s απουσιάζει.'] end)[1 + (w.rn + w.j) % 2],
                                       w.word), ' ' order by w.j) filter (where not w.present and w.j <= 2), '') as t
  from w where w.src = 'imaging' group by w.rn
), labs as (
  select l.rn, jsonb_agg(l.r) as labs from lab_rows l group by l.rn
), specs as (
  select co.rn, coalesce(jsonb_agg(w.word) filter (where w.present), '[]'::jsonb) as specs
  from co join w on w.rn = co.rn and w.src = 'specialty' group by co.rn
), agree as (
  select co.id, co.codes as want,
         __SCHEMA__.match_codes_from(labs.labs,
           jsonb_build_array(jsonb_build_object('t', le.t, 'img', false), jsonb_build_object('t', im.t, 'img', true)),
           specs.specs) as got
  from co join labs on labs.rn = co.rn join letter le on le.rn = co.rn join imaging im on im.rn = co.rn
       join specs on specs.rn = co.rn
)
select 'cases', count(*), count(*) filter (where got is distinct from want),
       array_agg(name || ' -> ' || got::text order by name) filter (where got is distinct from want)
from cases
union all
select 'cohort codes ' || coded_pct || '%', count(*), count(*) filter (where got is distinct from want),
       (array_agg(id || ' got ' || got::text || ' want ' || want::text order by id) filter (where got is distinct from want))[1:5]
from agree
$check$;

select * from pg_temp.match_coding_check();
