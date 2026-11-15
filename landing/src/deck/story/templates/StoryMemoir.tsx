import type { StoryMemoirSlide } from '../types';
import { typo } from '../../util';
import { ri } from './shared';

/** Slide 2: two hospital photos on the left, two spreadsheets laid on the desk like paper. */
export function StoryMemoir({ s }: { s: StoryMemoirSlide }) {
  return (
    <div className="ts-memoir">
      <h2 className="slide-h sm sm-h rise" style={ri(0)}>{typo(s.headline)}</h2>
      <p className="sm-body rise" style={ri(1)}>{typo(s.support)}</p>
      {s.photos.map((p, i) => (
        <figure key={p.src} className={`sm-photo sm-photo-${i} rise rise-photo`} style={ri(2 + i)}>
          <img src={p.src} alt={p.alt} style={p.position ? { objectPosition: p.position } : undefined} />
          {p.chip && <figcaption className="chip">{p.chip}</figcaption>}
        </figure>
      ))}
      {s.sheets.map((p, i) => (
        <figure key={p.src} className={`sm-sheet sm-sheet-${i} rise rise-paper`} style={ri(4 + i)}>
          <img src={p.src} alt={p.alt} />
          <figcaption className="chip">{p.chip}</figcaption>
        </figure>
      ))}
      <p className="sm-foot rise" style={ri(7)}>{typo(s.footer)}</p>
    </div>
  );
}
