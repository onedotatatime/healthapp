// Slide shapes for the /story deck. They are kept apart from ../types.ts so the pitch deck's Slide union (and its tags) stay as they are.
import type { Theme } from '../types';
import type { FrameId } from './config';

export interface StoryBase {
  /** Hash id of the slide (its first beat): #1 #2 #3 #5 #5b #5c #6. A later beat has its own id: #4 (the second beat of slide 3). */
  id: string;
  theme: Theme;
  /** Eyebrow text. Optional. */
  eyebrow?: string;
  notes: string[];
}

export interface StoryIntroSlide extends StoryBase {
  template: 'story-intro';
  headline: string;
  support: string;
  facts: string[];
  background: string;
  photo: { src: string; alt: string; caption: string };
}

export interface StoryMemoirSlide extends StoryBase {
  template: 'story-memoir';
  headline: string;
  support: string;
  photos: { src: string; alt: string; chip?: string; position?: string }[];
  sheets: { src: string; alt: string; chip: string }[];
}

export interface StoryBeat {
  /** Hash id of this beat. Default: the slide id for the first beat, the slide id + "b" for the second. */
  id?: string;
  /** A header of its own for this beat. The frames never change: only the header (and the words under it) swap. Default: the slide's headline. */
  headline?: string;
  support: string;
  notes: string[];
}

export interface StoryFrameSpec {
  frame: FrameId;
  /** The label over the frame when it is live, and when it is a picture. No label: nothing is printed over the frame. */
  label?: string;
  labelStatic?: string;
}

export interface StoryLiveSlide extends StoryBase {
  template: 'story-live';
  /** duo: a doctor browser frame and a patient phone (slides 3, 4). solo: headline on the left, one big frame (slide 5). full: one frame as large as the slide allows, no headline (slide 5c). */
  variant: 'duo' | 'solo' | 'full';
  headline: string;
  /** One entry per beat. The frames never remount between beats. */
  beats: StoryBeat[];
  frames: StoryFrameSpec[];
  /** The beat from which the frames take clicks and keys. 0 on both live slides: with the presenter key the founder acts in the app from the start. */
  hotFromBeat: number;
}

export interface StoryNumbersSlide extends StoryBase {
  template: 'story-numbers';
  left: { value: number; decimals: number; suffix?: string; unit?: string; label: string; source: string };
  right: { value: number; decimals: number; suffix?: string; label: string; climaxBefore: string; climax: string; climaxAfter: string; source: string };
  note: string;
}

export interface StoryCloseSlide extends StoryBase {
  template: 'story-close';
  headline: [string, string];
  name: string;
  email: string;
  /** Tappable link buttons, shown as a column on the right. Each shows the label and the short URL. */
  links: { label: string; href: string }[];
  photo: { src: string; alt: string };
}

/** Slide 4b: the emergency "what if" (a jungle in Brazil). No iframe: the phone and the rescuer's tablet are drawn in HTML and SVG. */
export interface StoryEmergencySlide extends StoryBase {
  template: 'story-emergency';
  headline: string;
  /** The three steps, in order. `small` is the quiet line under a step. */
  steps: { text: string; small?: string }[];
  /** Plain text in a pill. Never Apple's logo or badge artwork. */
  badge: string;
  background: { src: string };
  /** Words on the phone screen (synthetic, no medical values). */
  phone: { callTitle: string; callStatus: string; app: string; title: string; link: string; active: string; expires: string; logged: string };
  /** Words on the rescuer's tablet. */
  tablet: { top: string; live: string; title: string; folder: string; folderMeta: string; opened: string };
}

export type StorySlide =
  | StoryIntroSlide
  | StoryMemoirSlide
  | StoryLiveSlide
  | StoryEmergencySlide
  | StoryNumbersSlide
  | StoryCloseSlide;
