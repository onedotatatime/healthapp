// The /story deck: the founder's own story in six slides (plus beat b of slide 3 and the "Did you know" slide 5b).
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
    footer: 'My own photo and my own records, shared by my choice.',
  },
  {
    id: '3', template: 'story-live', variant: 'duo', theme: 'air', notes: N['3'], hotFromBeat: 0,
    headline: "And that's me today, still trying to figure this out.",
    beats: [
      { support: 'And helping doctors find the answer.', notes: N['3'] },
      { support: 'Now, by giving doctors the tool to analyse all my medical exams, we can finally make the difference.', notes: N['3b'] },
    ],
    frames: [
      { frame: 'doctor', label: "My doctor's view · the same exams", labelStatic: "The doctor's view" },
      { frame: 'patient', label: 'My record · my own exams, since 2019', labelStatic: "The patient's view" },
    ],
    tag: 'Live app · my own records, shown by my choice.',
    tagStatic: 'Screenshots of the app · synthetic data, not my own record.',
  },
  {
    id: '4', template: 'story-matches', theme: 'air', notes: N['4'],
    headline: 'And what if my doctor could find rare cases similar to mine, and cross-check with another doctor in Brazil?',
    labels: { pattern: 'A similar case', doctorHere: 'My doctor · Athens', doctorThere: 'Another doctor · Brazil' },
  },
  {
    id: '5', template: 'story-live', variant: 'solo', theme: 'air', notes: N['5'], hotFromBeat: 0,
    headline: 'And what if people with similar symptoms could finally find a cure, with their doctors, by taking part in a clinical trial?',
    beats: [{ support: '', notes: N['5'] }],
    frames: [{ frame: 'simulate', label: "My doctor's view · Simulate matching", labelStatic: "The doctor's view · Simulate matching" }],
    tag: 'A simulation on 5,000 synthetic records. No real people.',
    tagStatic: 'A simulation on 5,000 synthetic records. No real people.',
  },
  {
    id: '5b', counter: '5b', template: 'story-numbers', theme: 'night', eyebrow: 'Did you know?', notes: N['5b'],
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
    id: '6', template: 'story-close', theme: 'night', notes: N['6'],
    headline: ['Find me for', 'a live demo.'],
    support: "I'll show you my record, and what my doctor sees.",
    name: 'Lefteris Georgaras',
    email: 'hello@onedotatatime.design',
    link: { label: 'healthapp-landing.pages.dev', href: 'https://healthapp-landing.pages.dev' },
    photo: { src: '/story/lefteris.webp', alt: 'Lefteris Georgaras' },
    qr: { src: '/deck-qr.svg', alt: 'QR code to healthapp-landing.pages.dev' },
  },
];
