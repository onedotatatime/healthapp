import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Lockup, typo } from '../util';
import { readMode, type FrameId } from './config';
import type { StorySlide } from './types';
import { StoryEmergency } from './templates/StoryEmergency';
import { StoryClose } from './templates/StoryClose';
import { StoryIntro } from './templates/StoryIntro';
import { StoryLive } from './templates/StoryLive';
import { StoryMemoir } from './templates/StoryMemoir';
import { StoryNumbers } from './templates/StoryNumbers';
import type { FrameCtx } from './templates/shared';

const W = 1920;
const H = 1080;

const beatsOf = (s: StorySlide) => (s.template === 'story-live' ? s.beats.length : 1);
const notesOf = (s: StorySlide, beat: number) => (s.template === 'story-live' ? s.beats[beat].notes : s.notes);
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

export function StoryDeck({ slides }: { slides: StorySlide[] }) {
  const n = slides.length;
  // "n / 6" counts the numbered stops (1 2 3 4 5 6); 4b, 5b and 5c show their own id.
  const total = useMemo(() => slides.reduce((c, s) => c + Array.from({ length: beatsOf(s) }, (_, b) => beatId(s, b)).filter((id) => /^\d+$/.test(id)).length, 0), [slides]);
  const mode = useMemo(() => readMode(), []);
  const pinned = new URLSearchParams(window.location.search).has('scale1');

  const [pos, setPos] = useState(() => parseHash(slides));
  const { index, beat } = pos;
  const [scale, setScale] = useState(1);
  const [notes, setNotes] = useState(false);
  const [hud, setHud] = useState(true);
  const hudTimer = useRef<number>(0);
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
  const jump = useCallback((i: number) => setPos({ index: Math.min(Math.max(i, 0), n - 1), beat: 0 }), [n]);

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

  const labelNow = beatId(cur, beat);
  const counterNow = /^\d+$/.test(labelNow) ? `${labelNow} / ${total}` : labelNow;

  // a frame has the mouse and keys: show the "Next" pill, because after a click inside the app the arrow keys go to the app
  const hotNow = cur.template === 'story-live' && beat >= cur.hotFromBeat && framesOf(cur).some((id) => isLive(id));

  return (
    <div className="stage story" onClick={onStageClick}>
      <div className={`frame ${pinned ? 'pinned' : ''}`} style={pinned ? undefined : { transform: `translate(-50%, -50%) scale(${scale})` }}>
        {slides.map((s, i) => (
          <StorySlideView key={s.id} s={s} i={i} index={index} beat={i === index ? beat : 0} ctx={ctx} />
        ))}
        <button type="button" className={`next-pill ${hotNow ? 'is-on' : ''}`} onClick={(e) => { e.stopPropagation(); forward(); }} tabIndex={hotNow ? 0 : -1} aria-hidden={!hotNow}>
          Next
        </button>
      </div>

      <div className={`hud ${hud ? 'on' : ''}`} aria-live="polite" hidden={!hud}>
        <span className="hud-count">{counterNow}</span>
        <span className="hud-keys">← → space · F fullscreen · N notes{mode.armed ? ' · L live / screenshot' : ''}{mode.staticMode ? ' · static' : ''}</span>
      </div>

      {notes && (
        <aside className="notes" role="complementary" aria-label="Speaker notes">
          <header>
            <b>Speaker notes · slide {labelNow}</b>
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

