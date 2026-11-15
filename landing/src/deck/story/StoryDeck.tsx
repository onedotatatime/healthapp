import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Lockup, typo } from '../util';
import { readMode, type FrameId } from './config';
import { PathRail } from './PathRail';
import type { StorySlide } from './types';
import { StoryClose } from './templates/StoryClose';
import { StoryIntro } from './templates/StoryIntro';
import { StoryLive } from './templates/StoryLive';
import { StoryMatches } from './templates/StoryMatches';
import { StoryMemoir } from './templates/StoryMemoir';
import { StoryNumbers } from './templates/StoryNumbers';
import type { FrameCtx } from './templates/shared';

const W = 1920;
const H = 1080;

const beatsOf = (s: StorySlide) => (s.template === 'story-live' ? s.beats.length : 1);
const notesOf = (s: StorySlide, beat: number) => (s.template === 'story-live' ? s.beats[beat].notes : s.notes);
const framesOf = (s: StorySlide): FrameId[] => (s.template === 'story-live' ? s.frames.map((f) => f.frame) : []);

// Hash = slide id, plus "b" for the second beat of a slide with beats: #3 (beat a), #3b (beat b), #5b is its own slide.
function parseHash(slides: StorySlide[]): { index: number; beat: number } {
  const h = window.location.hash.replace('#', '').toLowerCase();
  const exact = slides.findIndex((s) => s.id.toLowerCase() === h);
  if (exact >= 0) return { index: exact, beat: 0 };
  if (h.endsWith('b')) {
    const i = slides.findIndex((s) => s.id.toLowerCase() === h.slice(0, -1));
    if (i >= 0 && beatsOf(slides[i]) > 1) return { index: i, beat: 1 };
  }
  return { index: 0, beat: 0 };
}
const hashOf = (s: StorySlide, beat: number) => `#${s.id}${beat > 0 ? 'b' : ''}`;

export function StoryDeck({ slides }: { slides: StorySlide[] }) {
  const n = slides.length;
  const numbered = slides.filter((s) => !s.counter);
  const total = numbered.length;
  const mode = useMemo(() => readMode(), []);
  const pinned = new URLSearchParams(window.location.search).has('scale1');

  const [pos, setPos] = useState(() => parseHash(slides));
  const { index, beat } = pos;
  const [scale, setScale] = useState(1);
  const [notes, setNotes] = useState(false);
  const [hud, setHud] = useState(true);
  const hudTimer = useRef<number>(0);
  const [off, setOff] = useState<Set<FrameId>>(() => new Set());
  const [pulse, setPulse] = useState(1);

  const cur = slides[index];

  // ---- navigation: a beat first, then the slide ----
  const forward = useCallback(() => {
    setPos((p) => {
      if (p.beat < beatsOf(slides[p.index]) - 1) return { index: p.index, beat: p.beat + 1 };
      return p.index < n - 1 ? { index: p.index + 1, beat: 0 } : p;
    });
  }, [n, slides]);
  const back = useCallback(() => {
    setPos((p) => {
      if (p.beat > 0) return { index: p.index, beat: p.beat - 1 };
      return p.index > 0 ? { index: p.index - 1, beat: beatsOf(slides[p.index - 1]) - 1 } : p;
    });
  }, [slides]);
  const jump = useCallback((i: number) => setPos({ index: Math.min(Math.max(i, 0), n - 1), beat: 0 }), [n]);

  // hash <-> position
  useEffect(() => {
    const target = hashOf(cur, beat);
    if (window.location.hash !== target) window.history.replaceState(null, '', target + '');
    document.title = `Pathien | Story | ${cur.counter ?? cur.id}${beat ? 'b' : ''}`;
  }, [cur, beat]);
  useEffect(() => {
    const onHash = () => setPos(parseHash(slides));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [slides]);

  // the dot pulses once on slide 1, on slide 3 beat b, and when slide 6 lands
  useEffect(() => {
    if ((cur.id === '3' && beat === 1) || cur.id === '6' || cur.id === '1') setPulse((v) => v + 1);
  }, [cur.id, beat]);

  // fit 16:9 into any viewport, letterboxed
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

  // ---- frames ----
  // With the key every frame is live by default; `off` holds the frames the presenter switched to their screenshot. The iframes stay mounted either way.
  const isLive = useCallback((id: FrameId) => mode.armed && !off.has(id), [mode.armed, off]);
  const toggle = useCallback((id: FrameId) => {
    if (!mode.armed) return;
    setOff((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }, [mode.armed]);
  const ctx: FrameCtx = useMemo(() => ({ armed: mode.armed, isLive, toggle }), [mode.armed, isLive, toggle]);

  // L: switch every frame of the current slide between live and screenshot (presenter key only)
  const toggleSlideFrames = useCallback(() => {
    if (!mode.armed) return;
    const ids = framesOf(cur);
    if (!ids.length) return;
    setOff((prev) => {
      const next = new Set(prev);
      const anyLive = ids.some((id) => !prev.has(id));
      ids.forEach((id) => (anyLive ? next.add(id) : next.delete(id)));
      return next;
    });
  }, [mode.armed, cur]);

  // ---- keyboard ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const onControl = !!(e.target as HTMLElement).closest?.('a,button');
      if (onControl && (e.key === 'Enter' || e.key === ' ')) return;
      switch (e.key) {
        case 'ArrowRight': case 'ArrowDown': case 'PageDown': case ' ': case 'Enter':
          e.preventDefault(); forward(); break;
        case 'ArrowLeft': case 'ArrowUp': case 'PageUp': case 'Backspace':
          e.preventDefault(); back(); break;
        case 'Home': e.preventDefault(); jump(0); break;
        case 'End': e.preventDefault(); jump(n - 1); break;
        case 'f': case 'F': toggleFullscreen(); break;
        case 'n': case 'N': setNotes((v) => !v); break;
        case 'l': case 'L': toggleSlideFrames(); break;
        case 'Escape': setNotes(false); break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [forward, back, jump, n, toggleFullscreen, toggleSlideFrames]);

  // HUD shows on mouse move, hides after a moment (?clean keeps it hidden)
  useEffect(() => {
    const show = () => {
      setHud(true);
      window.clearTimeout(hudTimer.current);
      hudTimer.current = window.setTimeout(() => setHud(false), 2500);
    };
    if (!new URLSearchParams(window.location.search).has('clean')) show();
    else setHud(false);
    window.addEventListener('mousemove', show);
    return () => { window.removeEventListener('mousemove', show); window.clearTimeout(hudTimer.current); };
  }, []);

  // While the mouse is over a live frame the keys go to the app (LiveFrame focuses it on enter). The parent only sees the mouse once it is
  // OUTSIDE the frame, so a mouse move anywhere else hands the keyboard back to the deck.
  useEffect(() => {
    const handBack = (e: MouseEvent) => {
      const a = document.activeElement;
      if (a && a.tagName === 'IFRAME' && !(e.target as HTMLElement).closest?.('.live-frame')) {
        (a as HTMLElement).blur();
        window.focus();
      }
    };
    window.addEventListener('mousemove', handBack);
    return () => window.removeEventListener('mousemove', handBack);
  }, []);

  // click: right two thirds forward, left third back. Links, buttons and a frame that has the mouse keep their own clicks.
  const onStageClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('a,button,.notes,.live-frame.is-hot')) return;
    if (e.clientX < window.innerWidth / 3) back();
    else forward();
  };

  const counterFor = (s: StorySlide) => (s.counter ? s.counter : `${numbered.indexOf(s) + 1} / ${total}`);

  // a frame has the mouse and keys: show the "Next" pill, because after a click inside the app the arrow keys go to the app
  const hotNow = cur.template === 'story-live' && beat >= cur.hotFromBeat && framesOf(cur).some((id) => isLive(id));

  return (
    <div className="stage story" onClick={onStageClick}>
      <div className={`frame ${pinned ? 'pinned' : ''}`} style={pinned ? undefined : { transform: `translate(-50%, -50%) scale(${scale})` }}>
        {slides.map((s, i) => (
          <StorySlideView key={s.id} s={s} i={i} index={index} beat={i === index ? beat : 0} ctx={ctx} />
        ))}
        <PathRail slideId={cur.id} theme={cur.theme} pulse={pulse} />
        <button type="button" className={`next-pill ${hotNow ? 'is-on' : ''}`} onClick={(e) => { e.stopPropagation(); forward(); }} tabIndex={hotNow ? 0 : -1} aria-hidden={!hotNow}>
          Next
        </button>
      </div>

      <div className={`hud ${hud ? 'on' : ''}`} aria-live="polite" hidden={!hud}>
        <span className="hud-count">{counterFor(cur)}{beat ? 'b' : ''}</span>
        <span className="hud-keys">← → space · F fullscreen · N notes{mode.armed ? ' · L live / screenshot' : ''}{mode.staticMode ? ' · static' : ''}</span>
      </div>

      {notes && (
        <aside className="notes" role="complementary" aria-label="Speaker notes">
          <header>
            <b>Speaker notes · slide {cur.counter ?? cur.id}{beat ? 'b' : ''}</b>
            <button type="button" onClick={() => setNotes(false)} aria-label="Close notes">Close (N)</button>
          </header>
          {notesOf(cur, beat).map((p, i) => <p key={i}>{typo(p)}</p>)}
        </aside>
      )}
    </div>
  );
}

function StorySlideView({ s, i, index, beat, ctx }: { s: StorySlide; i: number; index: number; beat: number; ctx: FrameCtx }) {
  const current = i === index;
  const state = current ? 'is-current' : i < index ? 'is-before' : 'is-after';
  const showHead = s.template !== 'story-intro' && s.template !== 'story-close';
  return (
    <section className={`slide theme-${s.theme} ts-${s.template}-slide ${state}`} aria-hidden={!current} aria-label={`Slide ${s.counter ?? s.id}`}>
      {showHead && (
        <header className="slide-head">
          {s.eyebrow ? <span className="eyebrow rise">{s.eyebrow}</span> : <span />}
          <Lockup theme={s.theme} className="head-lockup-story" />
        </header>
      )}
      {s.template === 'story-intro' && <StoryIntro s={s} />}
      {s.template === 'story-memoir' && <StoryMemoir s={s} />}
      {s.template === 'story-live' && <StoryLive s={s} beat={beat} ctx={ctx} />}
      {s.template === 'story-matches' && <StoryMatches s={s} />}
      {s.template === 'story-numbers' && <StoryNumbers s={s} current={current} />}
      {s.template === 'story-close' && <StoryClose s={s} />}
    </section>
  );
}

