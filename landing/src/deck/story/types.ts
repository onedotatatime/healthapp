// Slide shapes for the /story deck. They are kept apart from ../types.ts so the pitch deck's Slide union (and its tags) stay as they are.
import type { Theme } from '../types';
import type { FrameId } from './config';

export interface StoryBase {
  /** Hash id: #1 #2 #3 (#3b is its second beat) #4 #5 #5b #6. */
  id: string;
  theme: Theme;
  /** Eyebrow text. Optional. */
  eyebrow?: string;
  /** Explicit counter label ("5b"): not counted in "n / 6". */
  counter?: string;
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
  footer: string;
}

export interface StoryBeat { support: string; notes: string[] }

export interface StoryFrameSpec {
  frame: FrameId;
  /** The label over the frame when it is live, and when it is a picture. */
  label: string;
  labelStatic: string;
}

export interface StoryLiveSlide extends StoryBase {
  template: 'story-live';
  variant: 'duo' | 'solo';
  headline: string;
  /** One entry per beat. The frames never remount between beats. */
  beats: StoryBeat[];
  frames: StoryFrameSpec[];
  /** The peach pill under the frames: when live, and when the frames are pictures. */
  tag: string;
  tagStatic: string;
  /** The beat from which the frames take clicks and keys. 0 on both live slides: with the presenter key the founder acts in the app from the start. */
  hotFromBeat: number;
}

export interface StoryMatchesSlide extends StoryBase {
  template: 'story-matches';
  headline: string;
  labels: { pattern: string; doctorHere: string; doctorThere: string };
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
  support: string;
  name: string;
  email: string;
  link: { label: string; href: string };
  photo: { src: string; alt: string };
  qr: { src: string; alt: string };
}

export type StorySlide =
  | StoryIntroSlide
  | StoryMemoirSlide
  | StoryLiveSlide
  | StoryMatchesSlide
  | StoryNumbersSlide
  | StoryCloseSlide;
