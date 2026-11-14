-- Per env. Rendered by `scripts/hdb render dev 011_seed_record.sql` (MIN-4487). DEV ONLY, synthetic only.
-- Numbered 011, not 010: 010 is 010_handshake.sql (MIN-4484) and 005 to 007 are the matching run's.
-- The confirmed record of the synthetic patient Maria (tests/synthetic/ground-truth.json, documents 1 to 5)
-- plus three diary entries, so the doctor's overview and the assistant have rows to read. Fixed ids
-- (5eed...), so it can be run again. It writes nothing for any other persona and no grant (the
-- handshake creates those). Never run it against healthapp_demo: that record is made on stage, so the
-- block refuses there (a loud stop, not a silent skip, so a render-every-file loop sees it).
do $$
declare p uuid;
begin
  if '__SCHEMA__' <> 'healthapp_dev' then raise exception '011_seed_record is for healthapp_dev only'; end if;
  select id into p from __SCHEMA__.profiles where role = 'patient' and national_id_norm = 'AK123456';
  if p is null then raise exception 'seed the personas first (003)'; end if;

  insert into __SCHEMA__.documents (id, patient_id, kind, language, exam_date, issuer, printed_name, printed_id,
                                    identity_status, provenance, status, confirmed_at)
  select ('5eed0000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid, p, kind, lang, d, issuer, pname, pid,
         'match', 'uploaded_by_patient', 'confirmed', now()
    from (values
    (1, 'blood_test', 'el', date '2025-05-14', 'Ιατρικό Εργαστήριο «Υγεία», Αθήνα', 'ΠΑΠΑΔΟΠΟΥΛΟΥ ΜΑΡΙΑ', 'AK123456'),
    (2, 'blood_test', 'el', date '2025-12-09', 'Ιατρικό Εργαστήριο «Υγεία», Αθήνα', 'ΠΑΠΑΔΟΠΟΥΛΟΥ ΜΑΡΙΑ', 'AK123456'),
    (3, 'blood_test', 'en', date '2026-10-22', 'Athens Medical Laboratory', 'PAPADOPOULOU MARIA', 'AK123456'),
    (4, 'imaging_report', 'el', date '2026-03-18', 'Ακτινολογικό Κέντρο Αθηνών', 'ΠΑΠΑΔΟΠΟΥΛΟΥ ΜΑΡΙΑ', 'AK123456'),
    (5, 'doctor_letter', 'en', date '2026-04-02', 'Dr Eleni Markou, Consultant Orthopaedic Surgeon, Athens Orthopaedic Clinic', 'PAPADOPOULOU MARIA', 'AK123456')
  ) v (n, kind, lang, d, issuer, pname, pid)
  on conflict (id) do nothing;

  insert into __SCHEMA__.results (id, document_id, patient_id, pos, analyte, analyte_key, value_num, value_text, unit,
                                  ref_low, ref_high, ref_text, flag, confidence)
  select ('5eed0000-0000-4000-8001-' || lpad((n * 100 + pos)::text, 12, '0'))::uuid,
         ('5eed0000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid, p, pos, analyte, akey, val, val::text, unit,
         lo, hi, ref, flag, 0.95
    from (values
    (1, 0, 'CRP (C-αντιδρώσα πρωτεΐνη)', 'crp', 18.4::numeric, 'mg/L', 0::numeric, 5::numeric, '0 - 5', 'high'),
    (1, 1, 'ΤΚΕ (Ταχύτητα καθίζησης ερυθρών)', 'esr', 42.0::numeric, 'mm/h', 0::numeric, 20::numeric, '0 - 20', 'high'),
    (1, 2, 'Ρευματοειδής παράγοντας (RF)', 'rf', 38.0::numeric, 'IU/mL', null::numeric, 14::numeric, '<14', 'high'),
    (1, 3, 'Αντι-CCP', 'anti_ccp', 85.0::numeric, 'U/mL', null::numeric, 20::numeric, '<20', 'high'),
    (1, 4, 'Αιμοσφαιρίνη', 'hemoglobin', 12.4::numeric, 'g/dL', 12.0::numeric, 16.0::numeric, '12,0 - 16,0', 'normal'),
    (1, 5, 'Λευκά αιμοσφαίρια', 'wbc', 9.1::numeric, '10^3/μL', 4.0::numeric, 10.0::numeric, '4,0 - 10,0', 'normal'),
    (1, 6, 'Ερυθρά αιμοσφαίρια', 'rbc', 4.3::numeric, '10^6/μL', 3.8::numeric, 5.2::numeric, '3,8 - 5,2', 'normal'),
    (1, 7, 'Αιματοκρίτης', 'hematocrit', 37.9::numeric, '%', 36.0::numeric, 46.0::numeric, '36,0 - 46,0', 'normal'),
    (1, 8, 'Αιμοπετάλια', 'platelets', 332.0::numeric, '10^3/μL', 150::numeric, 400::numeric, '150 - 400', 'normal'),
    (2, 0, 'CRP (C-αντιδρώσα πρωτεΐνη)', 'crp', 7.9::numeric, 'mg/L', 0::numeric, 5::numeric, '0 - 5', 'high'),
    (2, 1, 'ΤΚΕ (Ταχύτητα καθίζησης ερυθρών)', 'esr', 31.0::numeric, 'mm/h', 0::numeric, 20::numeric, '0 - 20', 'high'),
    (2, 2, 'Ρευματοειδής παράγοντας (RF)', 'rf', 33.0::numeric, 'IU/mL', null::numeric, 14::numeric, '<14', 'high'),
    (2, 3, 'Αντι-CCP', 'anti_ccp', 79.0::numeric, 'U/mL', null::numeric, 20::numeric, '<20', 'high'),
    (2, 4, 'Αιμοσφαιρίνη', 'hemoglobin', 12.9::numeric, 'g/dL', 12.0::numeric, 16.0::numeric, '12,0 - 16,0', 'normal'),
    (2, 5, 'Λευκά αιμοσφαίρια', 'wbc', 8.4::numeric, '10^3/μL', 4.0::numeric, 10.0::numeric, '4,0 - 10,0', 'normal'),
    (2, 6, 'Ερυθρά αιμοσφαίρια', 'rbc', 4.4::numeric, '10^6/μL', 3.8::numeric, 5.2::numeric, '3,8 - 5,2', 'normal'),
    (2, 7, 'Αιματοκρίτης', 'hematocrit', 38.6::numeric, '%', 36.0::numeric, 46.0::numeric, '36,0 - 46,0', 'normal'),
    (2, 8, 'Αιμοπετάλια', 'platelets', 301.0::numeric, '10^3/μL', 150::numeric, 400::numeric, '150 - 400', 'normal'),
    (3, 0, 'C-reactive protein (CRP)', 'crp', 3.8::numeric, 'mg/L', 0::numeric, 5::numeric, '0 - 5', 'normal'),
    (3, 1, 'Erythrocyte sedimentation rate (ESR)', 'esr', 17.0::numeric, 'mm/h', 0::numeric, 20::numeric, '0 - 20', 'normal'),
    (3, 2, 'Rheumatoid factor (RF)', 'rf', 31.0::numeric, 'IU/mL', null::numeric, 14::numeric, '<14', 'high'),
    (3, 3, 'Anti-CCP', 'anti_ccp', 82.0::numeric, 'U/mL', null::numeric, 20::numeric, '<20', 'high'),
    (3, 4, 'Haemoglobin', 'hemoglobin', 13.1::numeric, 'g/dL', 12.0::numeric, 16.0::numeric, '12.0 - 16.0', 'normal'),
    (3, 5, 'White blood cells', 'wbc', 7.7::numeric, '10^3/μL', 4.0::numeric, 10.0::numeric, '4.0 - 10.0', 'normal'),
    (3, 6, 'Red blood cells', 'rbc', 4.5::numeric, '10^6/μL', 3.8::numeric, 5.2::numeric, '3.8 - 5.2', 'normal'),
    (3, 7, 'Haematocrit', 'hematocrit', 39.4::numeric, '%', 36.0::numeric, 46.0::numeric, '36.0 - 46.0', 'normal'),
    (3, 8, 'Platelets', 'platelets', 288.0::numeric, '10^3/μL', 150::numeric, 400::numeric, '150 - 400', 'normal')
  ) v (n, pos, analyte, akey, val, unit, lo, hi, ref, flag)
  on conflict (id) do nothing;

  insert into __SCHEMA__.findings (id, document_id, patient_id, pos, kind, text_original, text_lang, finding_date, confidence)
  select ('5eed0000-0000-4000-8002-' || lpad((v.n * 100 + v.pos)::text, 12, '0'))::uuid,
         ('5eed0000-0000-4000-8000-' || lpad(v.n::text, 12, '0'))::uuid, p, v.pos, v.kind, v.t, d.language, d.exam_date, 0.95
    from (values
    (4, 0, 'note', 'Διατήρηση του άξονα του άκρου. Μικρά οστεόφυτα στις αρθρικές επιφάνειες του μηριαίου και της κνήμης.'),
    (4, 1, 'conclusion', 'Ήπια οστεοαρθρίτιδα του δεξιού γόνατος με στένωση του έσω διαρθρικού διαστήματος. Δεν παρατηρείται κάταγμα.'),
    (5, 0, 'written_diagnosis', 'Early osteoarthritis of the right knee.'),
    (5, 1, 'note', 'Morning stiffness in both hands lasting about 45 minutes; an inflammatory cause is to be excluded.'),
    (5, 2, 'medication', 'Ibuprofen 400 mg twice daily, only when needed.')
  ) v (n, pos, kind, t)
  join __SCHEMA__.documents d on d.id = ('5eed0000-0000-4000-8000-' || lpad(v.n::text, 12, '0'))::uuid
  on conflict (id) do nothing;

  insert into __SCHEMA__.diary_entries (id, patient_id, occurred_at, recorded_at, text, severity)
  select ('5eed0000-0000-4000-8003-' || lpad(n::text, 12, '0'))::uuid, p, at, at, t, sev
    from (values
    (1, timestamptz '2026-11-02 08:10:00+02', 'Woke with stiff hands, about 45 minutes before they loosened.', 5),
    (2, timestamptz '2026-11-06 19:30:00+02', 'Right knee ached after the stairs at the metro.', 6),
    (3, timestamptz '2026-11-10 07:50:00+02', 'Hands stiff again in the morning, easier after a warm shower.', 4)
  ) v (n, at, t, sev)
  on conflict (id) do nothing;
end $$;

insert into __SCHEMA__._applied (file) values ('011_seed_record.sql') on conflict (file) do nothing;
