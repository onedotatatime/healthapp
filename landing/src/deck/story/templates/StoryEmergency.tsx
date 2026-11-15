import type { StoryEmergencySlide } from '../types';
import { typo } from '../../util';
import { ri } from './shared';

const Tick = ({ children }: { children: string }) => (
  <div className="s4b-tick">
    <i><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#12201F" strokeWidth="4" strokeLinecap="round" aria-hidden="true"><path d="M5 12l5 5 9-10" /></svg></i>
    {typo(children)}
  </div>
);

/**
 * Slide 4b: the emergency "what if". A rainforest photo under a night-teal scrim, the question and three steps on the left,
 * the founder's phone (mid-call, sharing his folder) and the rescuer's tablet on the right. No iframe, no timeline, no "sent" claim:
 * the question and the "Soon on the App Store" pill say it is not here yet. Layout: Pix's spec (slide 4b, 1920x1080).
 */
export function StoryEmergency({ s }: { s: StoryEmergencySlide }) {
  const { phone: p, tablet: t } = s;
  return (
    <div className="ts-emergency">
      <img className="s4b-bg" src={s.background.src} alt="" aria-hidden="true" decoding="async" />
      <div className="s4b-scrim" aria-hidden="true" />

      <div className="s4b-left">
        <h2 className="s4b-h rise" style={ri(0)}>{typo(s.headline)}</h2>
        <ol className="s4b-steps">
          {s.steps.map((st, i) => (
            <li key={st.text} className="s4b-step rise" style={ri(2 + i)}>
              <span className="s4b-num" aria-hidden="true">{i + 1}</span>
              <p>{typo(st.text)}{st.small && <small>{typo(st.small)}</small>}</p>
            </li>
          ))}
        </ol>
      </div>
      <span className="s4b-badge rise" style={ri(6)}>{typo(s.badge)}</span>

      <div className="s4b-devices rise rise-frame" style={ri(3)}>
        <div className="s4b-phone" role="img" aria-label={`Phone screen: ${p.callTitle}, ${p.callStatus}. ${p.title}, ${p.link}. ${p.active}, ${p.expires}. ${p.logged}.`}>
          <div className="s4b-ph-in" aria-hidden="true">
            <div className="s4b-call">
              <div className="s4b-av">L</div>
              <div><b>{p.callTitle}</b><small>{typo(p.callStatus)}</small></div>
              <div className="s4b-end"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#12201F" strokeWidth="2.5" strokeLinecap="round"><path d="M4 15c5-4 11-4 16 0" /></svg></div>
            </div>
            <div className="s4b-card">
              <div className="s4b-lock">
                <svg viewBox="0 0 917 917"><g transform="translate(73.4 640.4)"><path d="M0 -270.4 A282.4 282.4 0 1 1 258 10.9 A56.25 56.25 0 0 1 267.7 -101.2 A169.9 169.9 0 1 0 112.5 -270.4 V-16.1 A90 90 0 0 0 202.5 73.9 H700 V163.9 H202.5 A202.5 202.5 0 0 1 0 -38.6 Z" fill="#0F766E" /><circle cx="700" cy="118.9" r="70.3" fill="#F4846B" /></g></svg>
                <span>{p.app}</span>
              </div>
              <h4>{p.title}</h4>
              <span className="s4b-chip"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0F766E" strokeWidth="2.5" strokeLinecap="round"><path d="M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1" /></svg>{p.link}</span>
              <div className="s4b-row"><span>{p.active}</span><span>{p.expires}</span></div>
              <Tick>{p.logged}</Tick>
            </div>
            {[60, 80, 45, 70].map((w) => <div key={w} className="s4b-sk" style={{ width: `${w}%` }} />)}
          </div>
        </div>

        <svg className="s4b-path" width="1920" height="1080" fill="none" aria-hidden="true">
          <path d="M1362 500 C1420 500 1440 500 1500 520" stroke="#0F766E" strokeWidth="6" strokeLinecap="round" strokeDasharray="1 14" />
          <path d="M1362 500 C1420 500 1440 500 1500 520" stroke="#7FE3CF" strokeWidth="3" strokeLinecap="round" opacity=".8" />
          <circle cx="1431" cy="504" r="10" fill="#F4846B" />
        </svg>

        <div className="s4b-tablet" role="img" aria-label={`Rescue team tablet: ${t.top}, ${t.live}. ${t.title}. ${t.folder}, ${t.folderMeta}. ${t.opened}.`}>
          <div className="s4b-tb-in" aria-hidden="true">
            <div className="s4b-top"><span>{t.top}</span><span>{t.live}</span></div>
            <h4>{typo(t.title)}</h4>
            <div className="s4b-folder">
              <div className="s4b-ic"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F766E" strokeWidth="2.2"><path d="M3 7h6l2 2h10v10H3z" /></svg></div>
              <div><b>{t.folder}</b><small>{t.folderMeta}</small></div>
            </div>
            <Tick>{t.opened}</Tick>
          </div>
        </div>
      </div>
    </div>
  );
}
