import type { CSSProperties } from 'react';
import type { FrameId } from '../config';

/** Stagger index for the fade-up: eyebrow, headline lines, body, visuals, in that order (0.1 s apart, see story.css). */
export const ri = (i: number): CSSProperties => ({ ['--i' as string]: i }) as CSSProperties;

/** What a slide needs to know about the frames. Built once in StoryDeck. */
export interface FrameCtx {
  /** The presenter key is in the address. */
  armed: boolean;
  /** Live frames may load: armed, not ?static, and the frame was not switched off with L or its badge. */
  isLive: (id: FrameId) => boolean;
  /** The iframe is mounted and has reported it is ready: only then does the live wording show. */
  isShown: (id: FrameId) => boolean;
  toggle: (id: FrameId) => void;
  setReady: (id: FrameId, ready: boolean) => void;
}
