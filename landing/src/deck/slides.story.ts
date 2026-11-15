// The /story deck: the founder's own story in six slides, plus beat 4 of slide 3 (#4), the emergency slide 4b, the "Did you know" slide 5b and the live simulation slide 5c.
// The words are copied from docs/story/story-deck-content.md (v1, Marketing); the layout is docs/story/layout-spec.md (Design).
// Frames and their addresses: ./story/config.ts (STORY_FRAMES). Templates: ./story/templates.
import type { StorySlide } from './story/types';

export const storySlides: StorySlide[] = [
  {
    id: '1', template: 'story-intro', theme: 'air',
    eyebrow: 'Gen AI Summit Hackathon · Biotech & AI · Athens LifeTech Park',
    headline: "Hi, I'm Lefteris.",
    support: 'A product builder, based in Athens.',
    facts: [
      'Founder, onedotatatime.design studio',
      'Designing digital products since 2009',
    ],
    background: '/img/bg-hero.webp',
    photo: { src: '/story/lefteris.webp', alt: 'Lefteris Georgaras', caption: 'Lefteris Georgaras' },
  },
  {
    id: '2', template: 'story-memoir', theme: 'mist',
    headline: "And that's me, back in 2019, in hospital.",
    support: 'No doctor could give me an answer. I was trying to figure out what my body was telling me.',
    photos: [
      { src: '/story/hospital-2019-iv.webp', alt: 'Me, in hospital, 2019, lying in a hospital bed with a drip in my arm', chip: 'Me, in hospital, 2019', position: '50% 18%' },
      { src: '/story/hospital-2019-mask.webp', alt: 'Me, in hospital, 2019, wearing an oxygen mask', position: '50% 22%' },
    ],
    sheets: [
      { src: '/story/spreadsheet-2019-blood.webp', alt: 'My spreadsheet, 2019: blood test results, column by column, date by date', chip: 'My spreadsheet, 2019' },
      { src: '/story/spreadsheet-2019-other.webp', alt: 'My spreadsheet, 2019: other test results, date by date', chip: 'My spreadsheet, 2019' },
    ],
  },
  {
    id: '3', template: 'story-live', variant: 'duo', theme: 'air', hotFromBeat: 0,
    headline: "And that's me today, still trying to figure this out.",
    // Two beats, one pair of frames: #3 and #4 (#3b still works as a link to #3). Beat 2 (#4) swaps only the header, to the first "what if" question; the same iframes stay mounted.
    beats: [
      { support: '' },
      {
        id: '4',
        headline: 'And what if my doctor could find rare cases similar to mine, and cross-check with another doctor in Brazil?',
        support: '',
      },
    ],
    frames: [
      { frame: 'doctor' },
      { frame: 'patient' },
    ],
  },
  {
    // After the Brazil "what if" (#4, the second beat of slide 3): the emergency "what if". Its own slide, no iframe, so the frames of 3 and 4 stay mounted untouched.
    id: '4b', template: 'story-emergency', theme: 'night',
    headline: "And what if I'm in a jungle in Brazil, and I have a serious accident?",
    steps: [
      { text: 'I make the emergency call from my phone.' },
      { text: 'Alongside it, Pathien sends the rescue team a link to my folder.', small: 'For a set time, and logged.' },
      { text: 'The team coming to rescue me can open my history.' },
    ],
    badge: 'Soon on the App Store',
    background: { src: '/story/emergency-motocross.webp' },
    phone: {
      callTitle: 'Emergency call', callStatus: 'In progress · 00:42', app: 'Pathien',
      title: 'Sharing my folder with emergency services', link: 'pathien.app/e/7K2Q…',
      active: 'Link active', expires: 'Expires in 59:12', logged: 'Access logged',
    },
    tablet: {
      top: 'Emergency services', live: 'Live', title: "Lefteris's folder: opened by emergency services",
      folder: 'Blood tests', folderMeta: '2018-2026 · 14 exams', opened: 'Opened 00:51 · logged',
    },
  },
  {
    id: '5', template: 'story-live', variant: 'solo', theme: 'air', hotFromBeat: 0,
    headline: 'And what if people with similar symptoms could finally find a cure, with their doctors, by taking part in a clinical trial?',
    beats: [{ support: '' }],
    frames: [{ frame: 'simulate' }],
  },
  {
    id: '5b', template: 'story-numbers', theme: 'night', eyebrow: 'Did you know?',
    left: {
      value: 4.7, decimals: 1, unit: 'years',
      label: 'The average wait for a rare-disease diagnosis in Europe.',
      source: 'EURORDIS Rare Barometer, Eur J Hum Genet, 2024',
    },
    right: {
      value: 17.5, decimals: 1, suffix: '%',
      label: 'Diagnostic error costs 17.5% of health spending.',
      climaxBefore: 'About ', climax: '€3.5bn*', climaxAfter: ' a year in Greece alone.',
      source: 'OECD, The Economics of Diagnostic Safety, 2025',
    },
    note: "* Our estimate: 17.5% of Greece's €19.9bn health spending (Eurostat, 2024).",
  },
  {
    // After "Did you know": the public simulation page, live, as large as the slide allows. No headline, no label, no pill.
    id: '5c', template: 'story-live', variant: 'full', theme: 'air', hotFromBeat: 0,
    headline: '',
    beats: [{ support: '' }],
    frames: [{ frame: 'simulation' }],
  },
  {
    id: '6', template: 'story-close', theme: 'night',
    headline: ['Find me for', 'a live demo.'],
    name: 'Lefteris Georgaras',
    email: 'hello@onedotatatime.design',
    links: [
      { label: 'Full pitch', href: 'https://healthapp-landing.pages.dev/deck' },
      { label: 'Live marketing', href: 'https://healthapp-landing.pages.dev' },
      { label: 'Product', href: 'https://healthapp-8ui.pages.dev' },
      { label: 'Simulation', href: 'https://healthapp-8ui.pages.dev/simulation' },
      { label: 'Recruit for trial', href: 'https://healthapp-8ui.pages.dev/doctor/simulate' },
      { label: 'Development dashboard', href: 'https://healthapp-dashboard.pages.dev/' },
    ],
    photo: { src: '/story/lefteris.webp', alt: 'Lefteris Georgaras' },
  },
];
