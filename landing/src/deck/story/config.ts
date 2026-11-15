// The /story deck's live frames. Every address lives here, in one constant, so the CTO's decision (MIN-4729: which URLs, and how the
// patient and the doctor frames sign in as two different users) changes this file and nothing else.
//
// DEFAULT IS SCREENSHOTS. No iframe is mounted, so no app page (and no real record) loads for a casual visitor. With the presenter key
// (?live=<PRESENTER_KEY>) the iframes mount at deck start and are visible and interactive on their slides. The key is not a secret: it only keeps casual visitors on
// screenshots. ?static forces screenshots even with the key (a bad venue network).

// Two origins, one database (healthapp_demo). The founder signs in on each frame as himself (staging, patient) and as the doctor (production).
// No passcode, token or auto-login lives in this file, in the deck URLs or in the bundle.
export const STORY_APP = 'https://healthapp-8ui.pages.dev';
export const STORY_APP_STAGING = 'https://staging.healthapp-8ui.pages.dev';

/** The presenter key. Open /story?live=<this> to turn the live frames on. */
export const PRESENTER_KEY = 'live-athens-2026';

export type FrameId = 'doctor' | 'patient' | 'simulate' | 'simulation';

export interface FrameConfig {
  id: FrameId;
  kind: 'browser' | 'phone';
  /** What the iframe loads (CTO decision, MIN-4729). */
  url: string;
  /** The iframe title (accessible name). */
  title: string;
  /** The frame's visible viewport, in deck px. */
  viewW: number;
  viewH: number;
  /** The size the app renders at inside the iframe, in CSS px (phone 390 wide, desktop 1280 wide). The iframe is scaled by viewW / iframeW. */
  iframeW: number;
  iframeH: number;
  /** The fallback picture shown instead of the iframe, and when it is not ready. */
  fallback: string;
  fallbackAlt: string;
  /** Only if the CTO says the scan runs in a frame. */
  allowCamera?: boolean;
}

export const STORY_FRAMES: Record<FrameId, FrameConfig> = {
  // Slides 3 and 4, left: the doctor's desktop view.
  doctor: {
    id: 'doctor',
    kind: 'browser',
    url: `${STORY_APP}/doctor`,
    title: 'Doctor view, live',
    viewW: 1250, viewH: 676, iframeW: 1280, iframeH: 692,
    fallback: '/story/fallback-doctor.webp',
    fallbackAlt: "The doctor's view of a shared record: results outside the printed range, a question box and a chart over time",
  },
  // Slides 3 and 4, right: the patient's phone view.
  patient: {
    id: 'patient',
    kind: 'phone',
    url: `${STORY_APP_STAGING}/patient`,
    title: 'Patient view, live',
    viewW: 355, viewH: 768, iframeW: 390, iframeH: 844,
    fallback: '/story/fallback-patient.webp',
    fallbackAlt: 'The patient\'s record on a phone: scan an exam, share with a doctor, and a list of exams',
  },
  // Slide 5: the doctor's "Simulate matching" page, on 5,000 synthetic records.
  simulate: {
    id: 'simulate',
    kind: 'browser',
    url: `${STORY_APP}/doctor/simulate`,
    title: 'Simulate matching, live',
    viewW: 1100, viewH: 812, iframeW: 1280, iframeH: 945,
    fallback: '/story/fallback-simulate.webp',
    fallbackAlt: 'Simulate matching on 5,000 records: a seeded synthetic data banner and a button to run the simulation',
  },
  // Slide 5c: the public /simulation page (the timeline plot), as large as the slide allows. It needs no sign-in.
  simulation: {
    id: 'simulation',
    kind: 'browser',
    url: `${STORY_APP}/simulation`,
    title: 'Simulation, live',
    viewW: 1600, viewH: 910, iframeW: 1280, iframeH: 728,
    fallback: '/story/fallback-simulation.webp',
    fallbackAlt: "The simulation page, a model on synthetic data: with all of Greece's patients in the network the yearly loss to wrong or missed diagnoses falls from €2.19 billion to €1.98 billion, lower by €201 million (9.2%)",
  },
};

export interface StoryMode {
  /** ?static: every frame is a picture, nothing is loaded. */
  staticMode: boolean;
  /** The address carries the presenter key: live frames may load. */
  armed: boolean;
}

export function readMode(search: string = window.location.search): StoryMode {
  const q = new URLSearchParams(search);
  const staticMode = q.has('static');
  return { staticMode, armed: !staticMode && q.get('live') === PRESENTER_KEY };
}
