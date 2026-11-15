// The /story deck: the founder's own story in six slides, plus beat 4 of slide 3 (#4), the "Did you know" slide 5b and the live simulation slide 5c.
// The words are copied from docs/story/story-deck-content.md (v1, Marketing); the layout is docs/story/layout-spec.md (Design).
// Frames and their addresses: ./story/config.ts (STORY_FRAMES). Templates: ./story/templates.
import type { StorySlide } from './story/types';
import { N } from './notes.story';

export const storySlides: StorySlide[] = [
  {
    id: '1', template: 'story-intro', theme: 'air', notes: N['1'],
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
    id: '2', template: 'story-memoir', theme: 'mist', notes: N['2'],
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
    id: '3', template: 'story-live', variant: 'duo', theme: 'air', notes: [...N['3'], ...N['3b']], hotFromBeat: 0,
    headline: "And that's me today, still trying to figure this out.",
    // Two beats, one pair of frames: #3 and #4 (#3b still works as a link to #3). Beat 2 (#4) swaps only the header, to the first "what if" question; the same iframes stay mounted.
    // 3b was merged into 3 when the support lines went (founder, 15 Nov: "delete"): its notes follow 3a's.
    beats: [
      { support: '', notes: [...N['3'], ...N['3b']] },
      {
        id: '4',
        headline: 'And what if my doctor could find rare cases similar to mine, and cross-check with another doctor in Brazil?',
        support: '',
        notes: N['4'],
      },
    ],
    frames: [
      { frame: 'doctor' },
      { frame: 'patient' },
    ],
  },
  {
    id: '5', template: 'story-live', variant: 'solo', theme: 'air', notes: N['5'], hotFromBeat: 0,
    headline: 'And what if people with similar symptoms could finally find a cure, with their doctors, by taking part in a clinical trial?',
    beats: [{ support: '', notes: N['5'] }],
    frames: [{ frame: 'simulate' }],
  },
  {
    id: '5b', template: 'story-numbers', theme: 'night', eyebrow: 'Did you know?', notes: N['5b'],
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
    id: '5c', template: 'story-live', variant: 'full', theme: 'air', notes: N['5c'], hotFromBeat: 0,
    headline: '',
    beats: [{ support: '', notes: N['5c'] }],
    frames: [{ frame: 'simulation' }],
  },
  {
    id: '6', template: 'story-close', theme: 'night', notes: N['6'],
    headline: ['Find me for', 'a live demo.'],
    support: "I'll show you my record, and what my doctor sees.",
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
