import type { ReactNode } from 'react';
import type { DemoTag, Theme } from './types';

/** Typeset apostrophes between letters as a right single quote. */
export const typo = (s: string) => s.replace(/(\w)'(\w)/g, '$1’$2');

/** **bold** markers to <strong>. */
export function rich(s: string): ReactNode {
  return typo(s)
    .split('**')
    .map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : part));
}

export const Lockup = ({ theme, className = '' }: { theme: Theme; className?: string }) => (
  <img
    className={`lockup ${className}`}
    src={theme === 'night' ? '/brand/pathien-lockup-white.svg' : '/brand/pathien-lockup.svg'}
    alt="Pathien"
  />
);

/** The tag every product or demo visual must carry. */
export const Tag = ({ children }: { children: DemoTag }) => <span className="demo-tag">{children}</span>;

/** Slide headline. Size steps down with length so it stays within two lines (one line when short). */
export function Headline({ text }: { text: string }) {
  const n = text.length;
  const size = n <= 58 ? 'xl' : n <= 68 ? 'md' : n <= 88 ? 'lg' : 'sm';
  return <h2 className={`slide-h ${size}`}>{rich(text)}</h2>;
}
