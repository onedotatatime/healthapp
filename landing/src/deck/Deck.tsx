import { useCallback, useEffect, useRef, useState } from 'react';
import type { Slide } from './types';
import { Lockup, typo } from './util';
import { Appendix, Chart, Compare, Cover, Funnel, Hero, Product, Statement, Stats, Steps, Table, TeamAsk, ThreeCards, TwoColumn } from './templates';

const W = 1920;
const H = 1080;

function SlideBody({ s }: { s: Slide }) {
  switch (s.template) {
    case 'cover': return <Cover s={s} />;
    case 'hero': return <Hero s={s} />;
    case 'stats': return <Stats s={s} />;
    case 'statement': return <Statement s={s} />;
    case 'funnel': return <Funnel s={s} />;
    case 'chart': return <Chart s={s} />;
    case 'table': return <Table s={s} />;
    case 'product': return <Product s={s} />;
    case 'compare': return <Compare s={s} />;
    case 'steps': return <Steps s={s} />;
    case 'twocol': return <TwoColumn s={s} />;
    case 'threecards': return <ThreeCards s={s} />;
    case 'teamask': return <TeamAsk s={s} />;
    case 'appendix': return <Appendix s={s} />;
  }
}

function SlideView({ s, counter, current }: { s: Slide; counter?: string; current: boolean }) {
  const isCover = s.template === 'cover';
  const topLockup = s.template === 'teamask';
  const isHero = s.template === 'hero';
  return (
    <section
      className={`slide theme-${s.theme} t-${s.template}-slide ${current ? 'is-current' : ''}`}
      aria-hidden={!current}
      aria-label={`Slide ${s.id}`}
    >
      {!isCover && (
        <header className={`slide-head ${topLockup ? 'with-lockup' : ''}`}>
          {topLockup && <Lockup theme={s.theme} className="head-lockup" />}
          <span className="eyebrow">{s.no ? `${s.no} · ${s.kicker}` : s.kicker}</span>
          {counter && <span className="counter">{counter}</span>}
        </header>
      )}
      <SlideBody s={s} />
      {s.footer && <p className="slide-foot">{typo(s.footer)}</p>}
      {!isCover && !topLockup && !isHero && <Lockup theme={s.theme} className="foot-lockup" />}
    </section>
  );
}

// The hash is the slide id: #1 ... #15, #6b, #16 (backup) or #a. Anything else falls back to the first slide.
const parseHash = (slides: Slide[]) => {
  const h = window.location.hash.replace('#', '').toLowerCase();
  if (h === 'a' || h === 'appendix') return slides.length - 1;
  const i = slides.findIndex((s) => s.id.toLowerCase() === h);
  return i >= 0 ? i : 0;
};

export function Deck({ slides }: { slides: Slide[] }) {
  const n = slides.length;
  const numbered = slides.filter((s) => !s.backup && !s.counter);
  const total = numbered.length;
  const [index, setIndex] = useState(() => parseHash(slides));
  const [scale, setScale] = useState(1);
  const [notes, setNotes] = useState(false);
  const [hud, setHud] = useState(true);
  const hudTimer = useRef<number>(0);
  // ?scale1 pins the slide to 1920x1080 at the top-left (used to take exact-size screenshots)
  const pinned = new URLSearchParams(window.location.search).has('scale1');

  const go = useCallback((i: number) => setIndex(Math.min(Math.max(i, 0), n - 1)), [n]);

  // URL hash <-> slide
  useEffect(() => {
    const target = `#${slides[index].id}`;
    if (window.location.hash !== target) window.history.replaceState(null, '', target);
    document.title = `Pathien | Pitch deck | ${slides[index].counter ?? index + 1} / ${n}`;
  }, [index, n, slides]);
  useEffect(() => {
    const onHash = () => setIndex(parseHash(slides));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [slides]);

  // Fit 16:9 into any viewport, letterboxed
  useEffect(() => {
    const fit = () => setScale(pinned ? 1 : Math.min(window.innerWidth / W, window.innerHeight / H));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [pinned]);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.();
  }, []);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      switch (e.key) {
        case 'ArrowRight': case 'ArrowDown': case 'PageDown': case ' ': case 'Enter':
          e.preventDefault(); go(index + 1); break;
        case 'ArrowLeft': case 'ArrowUp': case 'PageUp': case 'Backspace':
          e.preventDefault(); go(index - 1); break;
        case 'Home': e.preventDefault(); go(0); break;
        case 'End': e.preventDefault(); go(n - 1); break;
        case 'f': case 'F': toggleFullscreen(); break;
        case 'n': case 'N': setNotes((v) => !v); break;
        case 'Escape': setNotes(false); break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, index, n, toggleFullscreen]);

  // HUD shows on mouse move, hides after a moment
  useEffect(() => {
    const show = () => {
      setHud(true);
      window.clearTimeout(hudTimer.current);
      hudTimer.current = window.setTimeout(() => setHud(false), 2500);
    };
    // ?clean keeps the presenter chrome hidden (used for screenshots and projectors that mirror the page)
    if (!new URLSearchParams(window.location.search).has('clean')) show();
    else setHud(false);
    window.addEventListener('mousemove', show);
    return () => { window.removeEventListener('mousemove', show); window.clearTimeout(hudTimer.current); };
  }, []);

  // Click: right two thirds forward, left third back. Links and buttons keep their own behaviour.
  const onStageClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('a,button,.notes')) return;
    if (e.clientX < window.innerWidth / 3) go(index - 1);
    else go(index + 1);
  };

  const cur = slides[index];
  const counterFor = (s: Slide) => {
    if (s.template === 'cover') return undefined;
    if (s.backup) return 'Backup';
    if (s.counter) return s.counter;
    return `${numbered.indexOf(s) + 1} / ${total}`;
  };

  return (
    <div className="stage" onClick={onStageClick}>
      <div className={`frame ${pinned ? 'pinned' : ''}`} style={pinned ? undefined : { transform: `translate(-50%, -50%) scale(${scale})` }}>
        {slides.map((s, i) => (
          <SlideView key={s.id} s={s} counter={counterFor(s)} current={i === index} />
        ))}
      </div>

      <div className={`hud ${hud ? 'on' : ''}`} aria-live="polite" hidden={!hud}>
        <span className="hud-count">{index + 1} / {n}</span>
        <span className="hud-keys">← → space · F fullscreen · N notes</span>
      </div>

      {notes && (
        <aside className="notes" role="complementary" aria-label="Speaker notes">
          <header>
            <b>Speaker notes · slide {cur.counter ?? cur.id}</b>
            <button type="button" onClick={() => setNotes(false)} aria-label="Close notes">Close (N)</button>
          </header>
          {cur.notes.map((p, i) => <p key={i}>{typo(p)}</p>)}
        </aside>
      )}
    </div>
  );
}
