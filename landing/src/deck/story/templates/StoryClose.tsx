import type { StoryCloseSlide } from '../types';
import { Lockup, typo } from '../../util';
import { ri } from './shared';

/** Slide 6: the invitation. Big two-line headline, the contact block, five link buttons, the lockup. */
export function StoryClose({ s }: { s: StoryCloseSlide }) {
  return (
    <div className="ts-close">
      <h1 className="sc-h">
        <span className="rise" style={ri(1)}>{s.headline[0]}</span>{' '}
        <span className="rise" style={ri(2)}>{s.headline[1]}</span>
      </h1>
      <p className="sc-support rise" style={ri(3)}>{typo(s.support)}</p>
      <div className="sc-contact rise" style={ri(4)}>
        <img className="sc-photo" src={s.photo.src} alt={s.photo.alt} />
        <div>
          <p className="sc-name">{s.name}</p>
          <p className="sc-line">{s.email}</p>
        </div>
      </div>
      <div className="sc-lockup rise" style={ri(6)}><Lockup theme="night" /></div>
      <ul className="sc-links">
        {s.links.map((l, i) => (
          <li key={l.href} className="rise" style={ri(4 + i)}>
            <a className="sc-link" href={l.href} target="_blank" rel="noopener">
              <span className="sc-link-label">{l.label}</span>
              <span className="sc-link-url">{l.href.replace(/^https:\/\//, '')}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
