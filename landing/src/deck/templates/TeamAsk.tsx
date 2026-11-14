import type { TeamAskSlide } from '../types';
import { Headline, rich } from '../util';

export function TeamAsk({ s }: { s: TeamAskSlide }) {
  return (
    <div className="t-teamask">
      <Headline text={s.headline} />
      <section className="ta-team">
        <h4 className="caps">{s.team.label}</h4>
        <h3>{s.team.name}</h3>
        <p>{s.team.role}</p>
        <div className="ta-row">
          <span className="ta-agents">{s.team.agents}</span>
          <div className="ta-partner">
            <b>{s.team.partner.title}</b>
            <span>{s.team.partner.text}</span>
          </div>
        </div>
      </section>
      <section className="ta-ask">
        <h4 className="caps">{s.ask.label}</h4>
        <b className="ta-amount">{s.ask.amount}</b>
        <p className="ta-line">{s.ask.line}</p>
        <p className="ta-sub">{s.ask.sub}</p>
      </section>
      <div className="ta-gates">
        <div className="ta-gate-head">{s.gates.head.map((h) => <span key={h}>{h}</span>)}</div>
        {s.gates.rows.map((r) => (
          <div key={r.gate} className="ta-gate">
            <b>{r.gate}</b>
            <b className="ta-tranche">{r.amount}</b>
            <span>{r.buys}</span>
          </div>
        ))}
      </div>
      <div className="ta-contact">
        <div>
          <small>{s.contact.label}</small>
          <a href={`https://${s.contact.link}`} target="_blank" rel="noreferrer">{s.contact.link}</a>
          <a href={`mailto:${s.contact.email}`}>{s.contact.email}</a>
        </div>
        <img src={s.contact.qr} alt={`QR code to ${s.contact.link}`} />
      </div>
    </div>
  );
}
