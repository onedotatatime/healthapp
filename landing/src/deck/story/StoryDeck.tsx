import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Lockup } from '../util';
import { readMode, type FrameId } from './config';
import type { StorySlide } from './types';
import { StoryEmergency } from './templates/StoryEmergency';
import { StoryClose } from './templates/StoryClose';
import { StoryIntro } from './templates/StoryIntro';
import { StoryLive } from './templates/StoryLive';
import { StoryMemoir } from './templates/StoryMemoir';
import { StoryNumbers } from './templates/StoryNumbers';
import type { FrameCtx } from './templates/shared';
import { StoryNav, type Stop } from './StoryNav';

const W = 1920;
const H = 1080;

const beatsOf = (s: StorySlide) => (s.template === 'story-live' ? s.beats.length : 1);
const framesOf = (s: StorySlide): FrameId[] => (s.template === 'story-live' ? s.frames.map((f) => f.frame) : []);

// Every stop of the deck is a slide or a beat of a slide, and has a hash id: #1 #2 #3 #4 #4b #5 #5b #5c #6.
// #3 and #4 are the two beats of slide 3 (same frames, so the iframes never remount); a beat with no id of its own is the slide id + "b".
// #3b was a beat of its own until it merged into #3; old links to it still land on #3.
const HASH_ALIAS: Record<string, string> = { '3b': '3' };
const beatId = (s: StorySlide, beat: number) => (s.template === 'story-live' && s.beats[beat].id) || (beat > 0 ? `${s.id}b` : s.id);
function parseHash(slides: StorySlide[]): { index: number; beat: number } {
  const raw = window.location.hash.replace('#', '').toLowerCase();
  const h = HASH_ALIAS[raw] ?? raw;
  for (let index = 0; index < slides.length; index++) {
    for (let beat = 0; beat < beatsOf(slides[index]); beat++) {
      if (beatId(slides[index], beat).toLowerCase() === h) return { index, beat };
    }
  }
  return { index: 0, beat: 0 };
}
const hashOf = (s: StorySlide, beat: number) => `#${beatId(s, beat)}`;
// The stops in order, one per hash id: 1 2 3 4 4b 5 5b 5c 6. The dots, the counter and Home / End all walk this list.
const stopsOf = (slides: StorySlide[]): Stop[] => slides.flatMap((s, index) => Array.from({ length: beatsOf(s) }, (_, beat) => ({ index, beat, id: beatId(s, beat) })));

// The controls fade to low opacity this long after the last mouse move, key or touch.
const IDLE_MS = 3000;

export function StoryDeck({ slides }: { slides: StorySlide[] }) {
  const n = slides.length;
  const stops = useMemo(() => stopsOf(slides), [slides]);
  const mode = useMemo(() => readMode(), []);
  const pinned = new URLSearchParams(window.location.search).has('scale1');

  const [pos, setPos] = useState(() => parseHash(slides));
  const { index, beat } = pos;
  const [scale, setScale] = useState(1);
  const [idle, setIdle] = useState(false);
  const idleTimer = useRef<number>(0);
  const [off, setOff] = useState<Set<FrameId>>(() => new Set());

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
  const jump = useCallback((i: number) => {
    const t = stops[Math.min(Math.max(i, 0), stops.length - 1)];
    setPos({ index: t.index, beat: t.beat });
  }, [stops]);
  const at = Math.max(0, stops.findIndex((t) => t.index === index && t.beat === beat));

  // hash <-> position
  useEffect(() => {
    const target = hashOf(cur, beat);
    if (window.location.hash !== target) window.history.replaceState(null, '', target + '');
    document.title = `Pathien | Story | ${beatId(cur, beat)}`;
  }, [cur, beat]);
  useEffect(() => {
    const onHash = () => setPos(parseHash(slides));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [slides]);

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
        case 'End': e.preventDefault(); jump(stops.length - 1); break;
        case 'f': case 'F': toggleFullscreen(); break;
        case 'l': case 'L': toggleSlideFrames(); break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [forward, back, jump, stops.length, toggleFullscreen, toggleSlideFrames]);

  // The controls are fully visible on mouse move, a key or a touch, and fade to low opacity after IDLE_MS (?clean hides them for screenshots).
  // They stay clickable while faded. A mouse over a live frame sends no events to this page, so they fade there; moving out brings them back.
  useEffect(() => {
    const wake = () => {
      setIdle(false);
      window.clearTimeout(idleTimer.current);
      idleTimer.current = window.setTimeout(() => setIdle(true), IDLE_MS);
    };
    wake();
    const evs = ['mousemove', 'mousedown', 'keydown', 'touchstart'] as const;
    evs.forEach((ev) => window.addEventListener(ev, wake));
    return () => { evs.forEach((ev) => window.removeEventListener(ev, wake)); window.clearTimeout(idleTimer.current); };
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
    if ((e.target as HTMLElement).closest('a,button,.sn,.live-frame.is-hot')) return;
    if (e.clientX < window.innerWidth / 3) back();
    else forward();
  };

  const clean = useMemo(() => new URLSearchParams(window.location.search).has('clean'), []);

  return (
    <div className="stage story" onClick={onStageClick}>
      <div className={`frame ${pinned ? 'pinned' : ''}`} style={pinned ? undefined : { transform: `translate(-50%, -50%) scale(${scale})` }}>
        {slides.map((s, i) => (
          <StorySlideView key={s.id} s={s} i={i} index={index} beat={i === index ? beat : 0} ctx={ctx} />
        ))}
        <StoryNav stops={stops} at={at} idle={idle} clean={clean} keys={`← → space · Home End · F fullscreen${mode.armed ? ' · L live / screenshot' : ''}`} onBack={back} onNext={forward} onJump={jump} />
      </div>

    </div>
  );
}

function StorySlideView({ s, i, index, beat, ctx }: { s: StorySlide; i: number; index: number; beat: number; ctx: FrameCtx }) {
  const current = i === index;
  const state = current ? 'is-current' : i < index ? 'is-before' : 'is-after';
  const showHead = s.template !== 'story-intro' && s.template !== 'story-close' && !(s.template === 'story-live' && s.variant === 'full');
  return (
    <section className={`slide theme-${s.theme} ts-${s.template}-slide ${state}`} aria-hidden={!current} aria-label={`Slide ${s.id}`}>
      {showHead && (
        <header className="slide-head">
          {s.eyebrow ? <span className="eyebrow rise">{s.eyebrow}</span> : <span />}
          <Lockup theme={s.theme} className="head-lockup-story" />
        </header>
      )}
      {s.template === 'story-intro' && <StoryIntro s={s} />}
      {s.template === 'story-memoir' && <StoryMemoir s={s} />}
      {s.template === 'story-live' && <StoryLive s={s} beat={beat} ctx={ctx} />}
      {s.template === 'story-emergency' && <StoryEmergency s={s} />}
      {s.template === 'story-numbers' && <StoryNumbers s={s} current={current} />}
      {s.template === 'story-close' && <StoryClose s={s} />}
    </section>
  );
}

