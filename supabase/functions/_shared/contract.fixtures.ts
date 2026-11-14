// Mock fixtures for the web app, built from the synthetic persona Maria Papadopoulou (MIN-4471).
// Synthetic only: no real person, no real exam. Every fixture is parsed against its schema in
// contract_test.ts, so a fixture that drifts from the contract fails CI.
// Ids are fixed so the app can cross-link (a cite id resolves to a row below).
import type {
  AnalyseResponse,
  AssistantResponse,
  ConfirmDocResponse,
  DemoLoginResponse,
  DiaryRow,
  DocCreateResponse,
  DocPhotoResponse,
  DocumentRow,
  ErrorBody,
  ExamDeleteResponse,
  ExamDraftResponse,
  ExtractResponse,
  MyExamsResponse,
  FileAnalysisRow,
  FindingRow,
  GrantEnvelope,
  GrantStatusResponse,
  HandshakeCreateResponse,
  MatchesOptIn,
  PossibleMatchesResponse,
  ProfileRow,
  ResultRow,
} from "./contract.ts";

export const IDS = {
  patient: "6f1d2c3b-4a59-4e2f-9b1a-0c8d7e6f5a41",
  doctor: "9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c62",
  docBlood: "1b2c3d4e-5f60-4718-8293-a4b5c6d7e801",
  docImaging: "2c3d4e5f-6071-4829-93a4-b5c6d7e8f902",
  docDraft: "3d4e5f60-7182-4930-a4b5-c6d7e8f90a03",
  resCrp: "4e5f6071-8293-4a41-b5c6-d7e8f90a1b04",
  resEsr: "5f607182-93a4-4b52-86d7-e8f90a1b2c05",
  resRf: "60718293-a4b5-4c63-97e8-f90a1b2c3d06",
  resHb: "718293a4-b5c6-4d74-a8f9-0a1b2c3d4e07",
  findKnee: "8293a4b5-c6d7-4e85-b90a-1b2c3d4e5f08",
  diaryOne: "93a4b5c6-d7e8-4f96-8a1b-2c3d4e5f6009",
  diaryTwo: "a4b5c6d7-e8f9-4a07-9b2c-3d4e5f60710a",
  grant: "b5c6d7e8-f90a-4b18-8c3d-4e5f6071820b",
  turnAsk: "c6d7e8f9-0a1b-4c29-9d4e-5f60718293c0",
  turnCauses: "d7e8f90a-1b2c-4d3a-8e5f-60718293a4d0",
} as const;

const NOW = "2026-11-15T09:30:00.000+00:00";

// --- rows -------------------------------------------------------------------------------------
export const patientProfile: ProfileRow = {
  id: IDS.patient,
  role: "patient",
  full_name: "Μαρία Παπαδοπούλου",
  full_name_latin: "Maria Papadopoulou",
  specialty: null,
  created_at: "2026-11-14T16:00:00.000+00:00",
};

export const doctorProfile: ProfileRow = {
  id: IDS.doctor,
  role: "doctor",
  full_name: "Νίκος Ανδρέου",
  full_name_latin: "Nikos Andreou",
  specialty: "Orthopaedics",
  created_at: "2026-11-14T16:00:00.000+00:00",
};

export const documents: DocumentRow[] = [
  {
    id: IDS.docBlood,
    patient_id: IDS.patient,
    kind: "blood_test",
    language: "el",
    exam_date: "2026-03-12",
    issuer: "Demo Lab Athens",
    identity_status: "match",
    provenance: "uploaded_by_patient",
    status: "confirmed",
    created_at: "2026-03-12T10:00:00.000+00:00",
    confirmed_at: "2026-03-12T10:02:00.000+00:00",
  },
  {
    id: IDS.docImaging,
    patient_id: IDS.patient,
    kind: "imaging_report",
    language: "el",
    exam_date: "2026-02-02",
    issuer: "Demo Imaging Centre",
    identity_status: "name_only",
    provenance: "uploaded_by_patient",
    status: "confirmed",
    created_at: "2026-02-02T12:00:00.000+00:00",
    confirmed_at: "2026-02-02T12:03:00.000+00:00",
  },
];

export const results: ResultRow[] = [
  {
    id: IDS.resCrp, document_id: IDS.docBlood, patient_id: IDS.patient,
    analyte: "CRP", analyte_key: "crp", value_num: 14.2, value_text: null, unit: "mg/L",
    ref_low: null, ref_high: 5, ref_text: "<5", flag: "high", confidence: 0.97, edited_by_patient: false,
  },
  {
    id: IDS.resEsr, document_id: IDS.docBlood, patient_id: IDS.patient,
    analyte: "ΤΚΕ", analyte_key: "esr", value_num: 38, value_text: null, unit: "mm/h",
    ref_low: 0, ref_high: 20, ref_text: "0-20", flag: "high", confidence: 0.93, edited_by_patient: false,
  },
  {
    id: IDS.resRf, document_id: IDS.docBlood, patient_id: IDS.patient,
    analyte: "Ρευματοειδής παράγων", analyte_key: "rf", value_num: 9, value_text: null, unit: "IU/mL",
    ref_low: null, ref_high: 14, ref_text: "<14", flag: "normal", confidence: 0.55, edited_by_patient: false,
  },
  {
    id: IDS.resHb, document_id: IDS.docBlood, patient_id: IDS.patient,
    analyte: "Αιμοσφαιρίνη", analyte_key: "hb", value_num: 12.9, value_text: null, unit: "g/dL",
    ref_low: 12, ref_high: 16, ref_text: "12-16", flag: "normal", confidence: 0.98, edited_by_patient: true,
  },
];

export const findings: FindingRow[] = [
  {
    id: IDS.findKnee, document_id: IDS.docImaging, patient_id: IDS.patient,
    kind: "conclusion",
    text_original: "Μικρή συλλογή υγρού στο δεξί γόνατο. Ήπιες εκφυλιστικές αλλοιώσεις.",
    text_lang: "el", finding_date: "2026-02-02", specialty: "Orthopaedics",
    confidence: 0.91, edited_by_patient: false,
  },
];

export const diary: DiaryRow[] = [
  {
    id: IDS.diaryOne, patient_id: IDS.patient,
    occurred_at: "2026-04-02T07:30:00.000+00:00", recorded_at: "2026-04-02T07:31:10.000+00:00",
    time_edited: false, text: "Morning stiffness in both hands, about an hour.", severity: 6,
  },
  {
    id: IDS.diaryTwo, patient_id: IDS.patient,
    occurred_at: "2026-04-10T18:00:00.000+00:00", recorded_at: "2026-04-11T08:00:00.000+00:00",
    time_edited: true, text: "Right knee swollen after a walk.", severity: 5,
  },
];

// --- function answers -------------------------------------------------------------------------
export const demoLoginPatient: DemoLoginResponse = {
  access_token: "mock-access-token-patient",
  refresh_token: "mock-refresh-token-patient",
  expires_at: 1794729600,
  user_id: IDS.patient,
  persona: "patient",
  role: "patient",
};

export const demoLoginDoctor: DemoLoginResponse = {
  ...demoLoginPatient,
  access_token: "mock-access-token-doctor",
  refresh_token: "mock-refresh-token-doctor",
  user_id: IDS.doctor,
  persona: "doctor",
  role: "doctor",
};

export const docCreate: DocCreateResponse = {
  doc_id: IDS.docDraft,
  bucket: "healthapp-dev",
  path: `${IDS.patient}/${IDS.docDraft}`,
  token: "mock-upload-token",
  signed_url: `https://example.invalid/storage/v1/object/upload/sign/healthapp-dev/${IDS.patient}/${IDS.docDraft}?token=mock`,
};

export const extractDraft: ExtractResponse = {
  outcome: "draft",
  draft: {
    document: {
      id: IDS.docDraft, patient_id: IDS.patient, kind: "blood_test", language: "el",
      exam_date: "2026-11-10", issuer: "Demo Lab Athens", identity_status: "match",
      provenance: "uploaded_by_patient", status: "draft", created_at: NOW, confirmed_at: null,
    },
    printed_name: "ΠΑΠΑΔΟΠΟΥΛΟΥ ΜΑΡΙΑ",
    printed_id: "AK 123456",
    header_confidence: { exam_date: 0.95, issuer: 0.9, printed_name: 0.98, printed_id: 0.97 },
    results: [
      {
        id: "e8f90a1b-2c3d-4e4b-9f60-718293a4b5e1", document_id: IDS.docDraft,
        analyte: "CRP", analyte_key: "crp", value_num: 21.5, value_text: null, unit: "mg/L",
        ref_low: null, ref_high: 5, ref_text: "<5", flag: "high", confidence: 0.96, edited_by_patient: false,
      },
      {
        id: "f90a1b2c-3d4e-4f5c-8071-8293a4b5c6f2", document_id: IDS.docDraft,
        analyte: "Anti-CCP", analyte_key: "anti_ccp", value_num: null, value_text: "Θετικό", unit: null,
        ref_low: null, ref_high: null, ref_text: "Αρνητικό", flag: "unknown", confidence: 0.52,
        edited_by_patient: false,
      },
    ],
    findings: [],
  },
};

export const extractRefusedName: ExtractResponse = {
  outcome: "refused",
  reason: "name_mismatch",
  message: "The name on it (ΠΑΠΑΔΟΠΟΥΛΟΣ ΓΕΩΡΓΙΟΣ) doesn't match your profile (Μαρία Παπαδοπούλου). Nothing was saved.",
  mismatch: { printed: "ΠΑΠΑΔΟΠΟΥΛΟΣ ΓΕΩΡΓΙΟΣ", profile: "Μαρία Παπαδοπούλου" },
};

export const extractRefusedId: ExtractResponse = {
  outcome: "refused",
  reason: "id_mismatch",
  message: "The ID on it (AK987654) doesn't match your profile (AK123456). Nothing was saved.",
  mismatch: { printed: "AK987654", profile: "AK123456" },
};

export const extractRefusedUnreadable: ExtractResponse = {
  outcome: "refused",
  reason: "unreadable",
  message: "The page could not be read. Try a sharper photo in more light.",
};

// MIN-4556: the call answers at once; the result is the row's status in the list.
export const extractQueued: ExtractResponse = { outcome: "queued" };

const ago = (s: number) => new Date(Date.parse(NOW) - s * 1000).toISOString().replace("Z", "+00:00");
/** One row per status the screen has to draw, newest first. Synthetic. */
export const myExams: MyExamsResponse = {
  server_now: NOW,
  exams: [
    { id: "e1000000-0000-4000-8000-000000000001", status: "queued", reason: null, uploaded_at: ago(5), status_at: ago(5), kind: null, exam_date: null, values_read: null, can_retry: false, can_delete: true },
    { id: "e1000000-0000-4000-8000-000000000002", status: "reading", reason: null, uploaded_at: ago(60), status_at: ago(40), kind: null, exam_date: null, values_read: null, can_retry: false, can_delete: true },
    { id: IDS.docDraft, status: "draft", reason: null, uploaded_at: ago(300), status_at: ago(240), kind: "blood_test", exam_date: "2026-11-10", values_read: 2, can_retry: false, can_delete: true },
    { id: "e1000000-0000-4000-8000-000000000004", status: "refused", reason: "name_mismatch", uploaded_at: ago(600), status_at: ago(560), kind: null, exam_date: null, values_read: null, can_retry: false, can_delete: true },
    { id: "e1000000-0000-4000-8000-000000000005", status: "failed", reason: "model_timeout", uploaded_at: ago(900), status_at: ago(820), kind: null, exam_date: null, values_read: null, can_retry: true, can_delete: true },
    { id: "e1000000-0000-4000-8000-000000000006", status: "failed", reason: "too_many_attempts", uploaded_at: ago(1200), status_at: ago(1100), kind: null, exam_date: null, values_read: null, can_retry: false, can_delete: true },
    { id: IDS.docBlood, status: "confirmed", reason: null, uploaded_at: ago(86400), status_at: ago(86000), kind: "blood_test", exam_date: "2026-11-04", values_read: 4, can_retry: false, can_delete: false },
  ],
};

export const examDraft: ExamDraftResponse = { draft: (extractDraft as Extract<ExtractResponse, { outcome: "draft" }>).draft };

export const examDeleted: ExamDeleteResponse = { deleted: true, doc_id: "e1000000-0000-4000-8000-000000000004" };

export const confirmDoc: ConfirmDocResponse = {
  document: { ...documents[0], id: IDS.docDraft, exam_date: "2026-11-10", created_at: NOW, confirmed_at: NOW },
  results: results.slice(0, 1).map((r) => ({ ...r, document_id: IDS.docDraft })),
  findings: [],
  sha256_record: "9f2c1d0e8b7a69584736251403f2e1d0c9b8a7968574635241302f1e0d9c8b7a",
};

export const docPhoto: DocPhotoResponse = {
  signed_url: `https://example.invalid/storage/v1/object/sign/healthapp-dev/${IDS.patient}/${IDS.docBlood}?token=mock`,
  expires_at: "2026-11-15T09:31:00.000+00:00",
  content_type: "image/jpeg",
  fingerprint: "match",
};

export const handshakeCreate: HandshakeCreateResponse = {
  token: "hs1.q3Zx7Kp0L9mN2bV4cX8aYw",
  short_code: "K7M3QX9R",
  expires_at: "2026-11-15T09:32:00.000+00:00",
  server_now: NOW,
};

const parties = {
  patient: { id: IDS.patient, full_name: "Μαρία Παπαδοπούλου", specialty: null },
  doctor: { id: IDS.doctor, full_name: "Νίκος Ανδρέου", specialty: "Orthopaedics" },
};

export const grantPending: GrantEnvelope = {
  grant: {
    grant_id: IDS.grant, status: "pending", requested_at: NOW, approved_at: null,
    expires_at: "2026-11-15T09:31:00.000+00:00", revoked_at: null, ...parties,
  },
  server_now: NOW,
};

export const grantActive: GrantEnvelope = {
  grant: {
    ...grantPending.grant, status: "active", approved_at: "2026-11-15T09:30:20.000+00:00",
    expires_at: "2026-11-15T09:45:20.000+00:00",
  },
  server_now: "2026-11-15T09:30:20.000+00:00",
};

export const grantRevoked: GrantEnvelope = {
  grant: { ...grantActive.grant, status: "revoked", revoked_at: "2026-11-15T09:38:00.000+00:00" },
  server_now: "2026-11-15T09:38:00.000+00:00",
};

export const grantStatusNone: GrantStatusResponse = { grant: null, server_now: NOW };

export const assistantAsk: AssistantResponse = {
  turn_id: IDS.turnAsk,
  mode: "ask",
  not_in_record: false,
  segments: [
    {
      kind: "record_fact",
      text: "CRP was 14.2 mg/L on 12 March 2026, above the printed range (<5).",
      cites: [`r:${IDS.resCrp}`],
      verified: true,
    },
    {
      kind: "record_fact",
      text: "ESR was 38 mm/h on the same test, above 0-20.",
      cites: [`r:${IDS.resEsr}`],
      verified: true,
    },
    {
      kind: "general_knowledge",
      text: "CRP and ESR are markers of inflammation; they do not point to one cause on their own.",
      cites: [],
      verified: true,
    },
  ],
  possibilities: [],
  created_at: NOW,
};

export const assistantNotInRecord: AssistantResponse = {
  turn_id: IDS.turnAsk,
  mode: "ask",
  not_in_record: true,
  segments: [],
  possibilities: [],
  created_at: NOW,
};

export const assistantCauses: AssistantResponse = {
  turn_id: IDS.turnCauses,
  mode: "causes",
  not_in_record: false,
  segments: [],
  possibilities: [
    {
      label: "Inflammatory arthritis",
      rationale: "Raised CRP and ESR with morning stiffness in both hands lasting about an hour.",
      cites: [`r:${IDS.resCrp}`, `r:${IDS.resEsr}`, `d:${IDS.diaryOne}`],
    },
    {
      label: "Osteoarthritis of the right knee",
      rationale: "Imaging conclusion of mild degenerative change and an effusion; swelling after walking.",
      cites: [`f:${IDS.findKnee}`, `d:${IDS.diaryTwo}`],
    },
  ],
  created_at: NOW,
};

export const errorGrantExpired: ErrorBody = {
  error: { code: "grant_expired", message: "Access to this record has ended." },
};
export const errorTokenExpired: ErrorBody = {
  error: { code: "token_expired", message: "This code has expired. Ask for a new one." },
};
export const errorBadPasscode: ErrorBody = {
  error: { code: "bad_passcode", message: "Wrong passcode." },
};
export const errorRateLimited: ErrorBody = {
  error: { code: "rate_limited", message: "Too many tries. Wait a minute." },
};

// Possible matches (MIN-4505): the answers healthapp_dev gave on 14 Nov 2026 for the synthetic persona,
// copied verbatim (doctor in a live grant; Maria opted in, then out). Synthetic only.
export const possibleMatchesMaria: PossibleMatchesResponse = {
  match_count: 9,
  groups: [{
    n: 9,
    pattern: ["CRP_high", "RF_positive", "anti_CCP_positive", "joint_pain", "morning_stiffness", "spec_rheumatology"],
    countries: ["DE", "FR", "GR", "IT", "NL", "SE"],
    label: "seeded, synthetic",
  }],
};
/** Not opted in, no match and below k all look exactly like this. */
export const possibleMatchesEmpty: PossibleMatchesResponse = { match_count: 0, groups: [] };
export const matchesOptInOn: MatchesOptIn = { matching_opt_in: true, matching_opt_in_at: "2026-11-14T17:25:33.783784+00:00" };
export const matchesOptInOff: MatchesOptIn = { matching_opt_in: false, matching_opt_in_at: null };

// file_analysis (MIN-4549): synthetic, one per state the doctor panel shows. A missing row is "not analysed yet".
export const fileAnalysisDone: FileAnalysisRow = {
  document_id: IDS.docBlood, patient_id: IDS.patient, status: "done", error_code: null,
  doc_type: "blood_test", pages: 1, readable: true, blurred: false, cropped: false, rotated: false,
  handwriting_present: false, issuer_present: true, date_present: true, stamp_or_signature_present: false,
  sha256: "d43bdf71c0a64f6f2d1d8f5f0b6f5c0a8e2f4d7c9b1a3e5f7d9c1b3a5e7f9d1b", mime: "image/jpeg", bytes: 105265,
  uploaded_at: "2026-11-14T18:23:06.992+00:00", hash_verified: true,
  items_count: 1, items: [{ text_original: "Αντι-CCP 85 U/mL <20 ↑", page: 1 }],
  analysed_at: "2026-11-14T18:57:03.843+00:00",
};
export const fileAnalysisFailed: FileAnalysisRow = {
  document_id: IDS.docImaging, patient_id: IDS.patient, status: "failed", error_code: "model_timeout",
  doc_type: null, pages: null, readable: null, blurred: null, cropped: null, rotated: null, handwriting_present: null,
  issuer_present: null, date_present: null, stamp_or_signature_present: null,
  sha256: "9443e53b0a64f6f2d1d8f5f0b6f5c0a8e2f4d7c9b1a3e5f7d9c1b3a5e7f9d1b2", mime: "image/jpeg", bytes: 130730,
  uploaded_at: "2026-11-14T18:30:00.000+00:00", hash_verified: true, items_count: 0, items: [],
  analysed_at: "2026-11-14T18:31:00.000+00:00",
};
export const analyseDone: AnalyseResponse = { outcome: "analysed", status: "done", error_code: null, items_count: 1 };
