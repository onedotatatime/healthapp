import type { CSSProperties } from 'react';
import type { FrameId } from '../config';

/** Stagger index for the fade-up: eyebrow, headline lines, body, visuals, in that order (0.1 s apart, see story.css). */
export const ri = (i: number): CSSProperties => ({ ['--i' as string]: i }) as CSSProperties;

/** What a slide needs to know about the frames. Built once in StoryDeck. */
export interface FrameCtx {
  /** The presenter key is in the address. */
  armed: boolean;
  /** The frame shows the app: armed, not ?static, and not switched to its screenshot with L or its badge (the iframe stays mounted either way). */
  isLive: (id: FrameId) => boolean;
  toggle: (id: FrameId) => void;
}
