import type { SpendSlide } from '../types';

/** The closing contact line: label, live link, email and the DNA-shaped QR. */
export function Contact({ c }: { c: SpendSlide['contact'] }) {
  return (
    <div className="ta-contact">
      <div>
        <small>{c.label}</small>
        <a href={`https://${c.link}`} target="_blank" rel="noreferrer">{c.link}</a>
        <a href={`mailto:${c.email}`}>{c.email}</a>
      </div>
      <img src={c.qr} alt={`QR code to ${c.link}`} />
    </div>
  );
}
