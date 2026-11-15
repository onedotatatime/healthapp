import type { StoryCloseSlide } from '../types';
import { Lockup, typo } from '../../util';
import { ri } from './shared';

/** Slide 6: the invitation. Big two-line headline, the contact block, the QR, the lockup. */
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
          <p className="sc-line"><a href={s.link.href}>{s.link.label}</a></p>
        </div>
      </div>
      <div className="sc-lockup rise" style={ri(6)}><Lockup theme="night" /></div>
      <figure className="sc-qr rise" style={ri(5)}>
        <img src={s.qr.src} alt={s.qr.alt} />
      </figure>
    </div>
  );
}
