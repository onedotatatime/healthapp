import { useEffect, useRef, useState, type FormEvent } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion, useSmoothScroll } from './useSmoothScroll';
import { Screens } from './DemoScreens';

// Swap in one place. Shown as-is until the founder supplies the address; never claim the typed email is stored.
const CONTACT_EMAIL = "[contact]";

gsap.registerPlugin(ScrollTrigger);

const img = (n: string) => `/img/${n}.webp`;
const navLinks = [['how', 'How it works'], ['who', "Who it's for"], ['tech', 'Under the hood'], ['roadmap', 'Roadmap']];
const audienceLinks = [['who-patient', 'For patients'], ['who-doctor', 'For doctors']];
const before = ['Paper in a drawer', 'A new doctor starts from memory', "Specialists don't see each other's results", 'Exams get repeated'];
const after = ['One history on your phone', 'A doctor let in by QR, for a set time', 'Every answer cites its source exam', 'You see every access'];
const statement = "Your health history is scattered across paper, drawers and different doctors' offices.";
const steps = [
  { title: 'Photograph past exams', line: 'Each one is read into a fixed record: date, lab, values, units, ranges. Values outside the printed range are flagged.', does: ['Reads date, lab, values, units, ranges', 'Flags values outside the printed range', 'Saves into a fixed record'], alt: 'A person photographing a lab report with a phone' },
  { title: 'Let a doctor in', line: 'Share by QR code, in person, for a set time.', does: ['Share by QR code, in person', 'Access lasts for a set time', 'Every access is logged, and you can read it'], alt: 'A patient showing a QR code to a doctor' },
  { title: 'Ask across your history', line: 'The doctor asks questions over everything. Every answer cites its source exam.', does: ['Answers across all your exams', 'Each answer cites its source exam', 'Says "not in this record" when it isn\'t'], alt: 'A doctor reading answers beside the patient' }
];
const who = [
  { id: 'who-patient', aud: 'patients', title: 'For patients', img: 'who-patient', alt: 'A patient smiling at home with her phone', items: ['Your whole history, in your pocket.', 'You choose who sees it, and for how long.', 'You can read every access.'] },
  { id: 'who-doctor', aud: 'doctors', title: 'For doctors', img: 'who-doctor', alt: 'A doctor reviewing a record on a tablet', items: ['The full picture before the consultation starts.', 'Ask a question, get the source exam with it.', 'Fewer repeated exams.'] }
];
const tech = [
  ['Reads into a fixed schema.', 'A multimodal model fills set fields, with no field for opinions.'],
  ['Every citation is checked.', 'The server verifies each number and date against the source, and says "not in this record" when it isn\'t.'],
  ['Access that expires.', 'Time-limited access is enforced in the database.'],
  ['A log you can read.', 'Signed, hash-chained, and readable by the patient.']
];
const promises = ['Answers are cited and checked.', 'No AI interpretation for patients.', 'You see every access.', 'Insurers never see records.'];
const future = ['the key on your phone, so we cannot read records at rest.', "the model sees one request's facts, without your name.", 'records verified by the lab that issued them.'];

const Check = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
);
const X = () => (
  <svg viewBox="0 0 32 32" width="32" height="32" fill="none" stroke="#7C8B89" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M10 10l12 12M22 10L10 22" /></svg>
);
const Tick = () => (
  <svg viewBox="0 0 32 32" width="32" height="32" fill="none" stroke="#12201F" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 16.5l4 4 8-9" /></svg>
);
const Arrow = () => (
  <span className="arrow" aria-hidden="true"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7M8 7h9v9" /></svg></span>
);

/** No backend: the button opens the visitor's mail app with the typed address in the body. Nothing is stored here. */
function Updates({ audience }: { audience: string | null }) {
  const [email, setEmail] = useState('');
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const subject = `Get updates${audience ? ` (${audience})` : ''}`;
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(email)}`;
  };
  return (
    <section id="updates" className="updates">
      <div className="up-card">
        <h2 className="up-h">Hackathon prototype. Hear when we pilot.</h2>
        <form className="up-form" onSubmit={onSubmit}>
          <label className="sr" htmlFor="up-email">Your email</label>
          <div className="up-field">
            <input id="up-email" type="email" required autoComplete="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <button className="btn btn-sm" type="submit">Get updates</button>
          </div>
          <p className="up-note">This opens your email app. Nothing is stored on this page.</p>
        </form>
      </div>
    </section>
  );
}

export default function App() {
  useSmoothScroll();
  const root = useRef<HTMLDivElement>(null);
  const [staticMode] = useState(() => prefersReducedMotion() || window.innerWidth < 768);
  const [audience, setAudience] = useState<string | null>(null);

  useEffect(() => {
    if (!root.current) return;
    const reduce = prefersReducedMotion();
    const ctx = gsap.context(() => {
      if (reduce) return;
      const mobile = window.innerWidth < 768;
      // Hero: headline lines fade up (hierarchy), bg eases from zoomed.
      gsap.from('.h1-line', { y: 24, autoAlpha: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out' });
      gsap.fromTo('.hero-bg', { scale: 1.08 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
      gsap.utils.toArray<HTMLElement>('.fade').forEach((el) =>
        gsap.from(el, { y: 24, autoAlpha: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } })
      );
      // Statement: words grey to white on scroll.
      gsap.fromTo('.st-word', { color: '#7C8F8E' }, {
        color: '#FFFFFF', stagger: 0.08, ease: 'none',
        scrollTrigger: mobile
          ? { trigger: '.statement', start: 'top 80%', end: 'bottom 60%', scrub: true }
          : { trigger: '.statement', start: 'top top', end: '+=150%', pin: true, scrub: true }
      });
      if (mobile) return;
      // Change: pinned wipe reveals After over Before (state transition: one place).
      gsap.fromTo('.ch-head, .cmp', { y: 32, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out', scrollTrigger: { trigger: '.change', start: 'top 80%', once: true } });
      const wipe = { clipPath: 'inset(0 0 0 0%)', ease: 'power2.inOut', duration: 0.76 };
      const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: '.change', start: 'top top', end: '+=110%', pin: true, scrub: 0.6, anticipatePin: 1 } });
      tl.fromTo('.pane-after', { clipPath: 'inset(0 0 0 100%)' }, wipe, 0.12)
        .fromTo('.cmp-h', { left: '100%' }, { left: '0%', ease: 'power2.inOut', duration: 0.76 }, 0.12)
        .fromTo('.pane-before .ph img', { scale: 1 }, { scale: 1.06, duration: 0.76 }, 0.12)
        .fromTo('.pane-after .ph img', { scale: 1.06 }, { scale: 1, duration: 0.76 }, 0.12)
        .to('.pane-before .txt', { opacity: 0.35, duration: 0.76 }, 0.12)
        .fromTo('.pane-after li', { autoAlpha: 0, x: 16 }, { autoAlpha: 1, x: 0, stagger: 0.06, duration: 0.2 }, 0.3)
        .to('.cmp-h', { autoAlpha: 0, duration: 0.12 }, 0.88);
      // How: previous card scales and dims as the next arrives.
      const cards = gsap.utils.toArray<HTMLElement>('.how-card');
      cards.forEach((c, i) => {
        if (i === cards.length - 1) return;
        gsap.to(c, { scale: 0.94, opacity: 0.7, ease: 'none', scrollTrigger: { trigger: cards[i + 1], start: 'top 80%', end: 'top 120px', scrub: true } });
      });
      // Screens: one pin, one scrub, one screen at a time. Each step fades the outgoing screen out and up,
      // the incoming one in from below (state transition: which screen the caption describes).
      const items = gsap.utils.toArray<HTMLElement>('.sc-item');
      const btns = gsap.utils.toArray<HTMLButtonElement>('.sc-prog button');
      const last = items.length - 1;
      const setStep = (n: number) => btns.forEach((b, i) => { b.classList.toggle('on', i === n); if (i === n) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
      gsap.set(items.slice(1), { autoAlpha: 0, y: 24 });
      const stl = gsap.timeline({
        defaults: { ease: 'power2.out' },
        scrollTrigger: {
          trigger: '.screens', start: 'top top', end: '+=400%', pin: true, scrub: 0.6, anticipatePin: 1, invalidateOnRefresh: true,
          snap: { snapTo: 1 / last, directional: false, inertia: false, duration: { min: 0.2, max: 0.6 }, ease: 'power1.inOut' },
          onUpdate: (self) => setStep(Math.round(self.progress * last))
        }
      });
      items.forEach((it, i) => {
        if (i === last) return;
        const next = items[i + 1];
        stl.to(it, { autoAlpha: 0, y: -24, duration: 0.4 }, i + 0.3)
          .fromTo(next, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.4 }, i + 0.3);
        const hl = next.querySelector('.hl');
        if (hl) stl.fromTo(hl, { scale: 0.96 }, { scale: 1, duration: 0.6 }, i + 0.3);
      });
      const arc = document.querySelector<SVGCircleElement>('.ring-arc');
      if (arc) { const c = Number(arc.dataset.c); stl.fromTo(arc, { strokeDashoffset: c }, { strokeDashoffset: c * 0.03, duration: 0.6, ease: 'power2.out' }, 1.3); }
      stl.set({}, {}, last);
      // Progress numbers jump to a step through Lenis.
      const st = stl.scrollTrigger!;
      btns.forEach((b, i) => b.addEventListener('click', () => {
        const y = st.start + ((st.end - st.start) * i) / last;
        const lenis = (window as unknown as { __lenis?: { scrollTo: (n: number, o?: object) => void } }).__lenis;
        if (lenis) lenis.scrollTo(y, { duration: 1.2 }); else window.scrollTo(0, y);
      }));
    }, root);
    // Pins measure the page: re-measure once layout, images and fonts have settled.
    const refresh = () => ScrollTrigger.refresh();
    const raf = requestAnimationFrame(refresh);
    window.addEventListener('load', refresh);
    document.fonts?.ready.then(refresh);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('load', refresh);
      ctx.revert();
    };
  }, []);

  return (
    <div ref={root} className={staticMode ? 'static' : ''}>
      <a className="skip" href="#how">Skip to content</a>
      <nav className="nav" aria-label="Main">
        <a className="logo" href="#top">[name]</a>
        <ul className="nav-main">{navLinks.map(([id, l]) => <li key={id}><a href={`#${id}`}>{l}</a></li>)}</ul>
        <ul className="nav-aud">{audienceLinks.map(([id, l]) => <li key={id}><a href={`#${id}`}>{l}</a></li>)}</ul>
        <a className="btn btn-sm" href="#updates" onClick={() => setAudience(null)}>Get updates</a>
      </nav>

      <main id="top">
        <section className="hero">
          <img className="hero-bg" src={img('bg-hero')} alt="" />
          <h1><span className="h1-line">Your medical history,</span><span className="h1-line">in one place.</span></h1>
          <div className="hero-photo"><img src={img('hero')} alt="A person reviewing their health record on a phone" /></div>
          <div className="hero-cta">
            <p className="sub">Photograph your exams once. Doctors you let in can ask questions, and every answer shows its source.</p>
            <div className="hero-actions">
              <a className="btn btn-arrow" href="#how">See how it works <Arrow /></a>
              {audienceLinks.map(([id, l]) => <a key={id} className="btn btn-ghost" href={`#${id}`}>{l}</a>)}
            </div>
            <span className="tag">Hackathon prototype · synthetic data</span>
          </div>
          <aside className="hero-card">
            <img src={img('who-doctor')} alt="A doctor smiling" />
            <div>
              <span className="chip">How it answers</span>
              <p>Was ferritin ever low? Yes, in the March lab exam (source linked).</p>
              <small>Synthetic example</small>
            </div>
          </aside>
        </section>

        <section className="statement">
          <img className="st-bg" src={img('bg-statement')} alt="" />
          <p className="st-text">{statement.split(' ').map((w, i) => <span key={i} className="st-word">{w} </span>)}</p>
        </section>

        <section className="change">
          <h2 className="ch-head" aria-label="What changes when your history is in one place">
            <span className="ch-1">What changes when</span>
            <span className="ch-2">your history is in one place</span>
          </h2>
          <div className="cmp">
            <div className="pane pane-before" role="group" aria-label="Before">
              <div className="ph"><img src={img('problem')} alt="Papers scattered in a drawer" /></div>
              <div className="txt">
                <span className="cchip">Before</span>
                <ul>{before.map((t) => <li key={t}><span className="ic"><X /></span><span>{t}</span></li>)}</ul>
              </div>
            </div>
            <div className="pane pane-after" role="group" aria-label="After">
              <div className="ph"><img src={img('after')} alt="A woman at a clear kitchen table, smiling at her phone" /></div>
              <div className="txt">
                <span className="cchip">After</span>
                <ul>{after.map((t) => <li key={t}><span className="ic"><Tick /></span><span>{t}</span></li>)}</ul>
              </div>
            </div>
            <div className="cmp-h" aria-hidden="true">
              <span className="knob"><svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#12201F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 5l-5 5 5 5M13 5l5 5-5 5" /></svg></span>
            </div>
          </div>
        </section>

        <section id="how" className="how wrap">
          {steps.map((s, i) => (
            <article key={s.title} className="how-card" style={{ top: `${96 + i * 24}px` }}>
              <div className="how-text">
                <span className="num">0{i + 1}</span>
                <h3>{s.title}</h3>
                <p>{s.line}</p>
                <h4>What it does:</h4>
                <ul>{s.does.map((d) => <li key={d}><Check />{d}</li>)}</ul>
              </div>
              <img src={img(`how-${i + 1}`)} alt={s.alt} />
            </article>
          ))}
        </section>

        <Screens staticMode={staticMode} />

        <section id="who" className="who wrap">
          {who.map((w) => (
            <article key={w.title} id={w.id} className="who-card fade">
              <img src={img(w.img)} alt={w.alt} />
              <div className="who-chip">
                <h3>{w.title}</h3>
                <ul>{w.items.map((t) => <li key={t}>{t}</li>)}</ul>
                <a className="btn btn-sm" href="#updates" onClick={() => setAudience(w.aud)}>Get updates</a>
              </div>
            </article>
          ))}
        </section>

        <section id="tech" className="tech wrap">
          <h2 className="fade">Under the hood</h2>
          <div className="tech-grid">
            {tech.map(([t, d]) => (
              <div key={t} className="tech-card fade"><span className="ic"><Tick /></span><h3>{t}</h3><p>{d}</p></div>
            ))}
          </div>
        </section>

        <section className="trust">
          <div className="wrap trust-row">
            {promises.map((p) => <p key={p} className="fade"><Check />{p}</p>)}
          </div>
        </section>

        <section id="roadmap" className="roadmap wrap">
          <h2 className="fade">Where we're going</h2>
          <ul className="road">
            {future.map((f) => <li key={f} className="fade"><span className="chip chip-coral">Future</span><p>{f}</p></li>)}
          </ul>
        </section>
      </main>

      <Updates audience={audience} />

      <footer id="contact" className="footer">
        <div className="wrap foot">
          <strong>[name]</strong>
          <span>Built at GenAI Summit Hackathon · Athens · Nov 2026</span>
          <a className="btn" href="#top">[contact]</a>
        </div>
      </footer>
    </div>
  );
}
