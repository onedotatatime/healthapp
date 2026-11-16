import { Fragment, type ReactNode } from 'react';
import type { DemoTag, Theme } from './types';

/** Typeset apostrophes between letters as a right single quote. */
export const typo = (s: string) => s.replace(/(\w)'(\w)/g, '$1’$2');

/** A lone "*" or "†" is the estimate mark: set small and raised, on the number it belongs to. */
const marks = (s: string): ReactNode[] =>
  s.split(/([*†])/).map((p, i) => (p === '*' || p === '†' ? <sup key={i} className="est">{p}</sup> : p));

/** **bold** markers to <strong>; a lone "*" or "†" to the small estimate mark. */
export function rich(s: string): ReactNode {
  return typo(s)
    .split('**')
    .map((part, i) => (i % 2 ? <strong key={i}>{marks(part)}</strong> : <Fragment key={i}>{marks(part)}</Fragment>));
}

/** A "Details → A2" or "Back to slide 4" link. A plain hash link: it works with the keyboard (Tab, Enter) and arrow navigation keeps working. */
export const DeckLink = ({ to, label, className = '' }: { to: string; label: string; className?: string }) => (
  <a className={`deck-link ${className}`} href={`#${to}`}>{typo(label)}</a>
);

export const Lockup = ({ theme, className = '' }: { theme: Theme; className?: string }) => (
  <img
    className={`lockup ${className}`}
    src={theme === 'night' ? '/brand/pathien-lockup-white.svg' : '/brand/pathien-lockup.svg'}
    alt="Pathien"
  />
);

/** The optional tag on a product or demo visual. Renders nothing when there is none. */
export const Tag = ({ children }: { children?: DemoTag }) => (children ? <span className="demo-tag">{children}</span> : null);

/** Slide headline. Size steps down with length so it stays within two lines (one line when short). */
export const headlineSize = (text: string): 'xl' | 'md' | 'lg' | 'sm' => {
  const n = text.length;
  return n <= 58 ? 'xl' : n <= 68 ? 'md' : n <= 88 ? 'lg' : 'sm';
};
export function Headline({ text, size: forced }: { text: string; size?: 'xl' | 'md' | 'lg' | 'sm' }) {
  const size = forced ?? headlineSize(text);
  return <h2 className={`slide-h ${size}`}>{rich(text)}</h2>;
}

/** [[label]] renders as a calm teal bold run; the rest goes through rich(). Shared by Hero and ThreeCards. */
export const withAccent = (s: string, cls = 'hero-flag') =>
  s.split(/\[\[|\]\]/).map((part, i) => (i % 2 ? <b key={i} className={cls}>{typo(part)}</b> : <span key={i}>{rich(part)}</span>));
