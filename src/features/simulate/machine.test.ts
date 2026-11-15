import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import runJson from '../../../data/synthetic/run-5000.json';
import { COPY } from './copy';
import { MachineCard, type MachineLine, type MachineView } from './MachineCard';
import { SimulateView } from './Simulate';
import { parseRun } from './matcher';

// The card is pure (props in, markup out), so the DOM of every case is read here from the rendered markup.
const html = (view: MachineView) => renderToStaticMarkup(createElement(MachineCard, { view }));
const label = (markup: string) => markup.match(/data-testid="sim-machine-label">([^<]*)</)?.[1] ?? null;
const notice = (markup: string) => markup.match(/data-testid="sim-machine-notice"[^>]*>([^<]*)</)?.[1] ?? null;

const lines = (n: number): MachineLine[] =>
  [
    { id: 'created', offsetMs: 1000, log: COPY.liveLog.created },
    { id: 'running', offsetMs: 3000, log: COPY.liveLog.running },
    { id: 'done', offsetMs: 4000, log: COPY.liveLog.done },
    { id: 'deleted', offsetMs: 5000, log: COPY.liveLog.deleted },
  ].slice(0, n) as MachineLine[];

const live = (n: number): MachineView => ({ mode: 'live', notice: null, startedAt: '2026-11-15T06:30:00Z', states: true, lines: lines(n), footer: null });
const replay = (why: string | null, n = 4): MachineView => ({ mode: 'replay', notice: why, startedAt: '2026-11-14T21:25:14Z', states: true, lines: lines(n), footer: '2 vCPU, 5.8 s in total.' });

const RECORDED = 'Recorded run on a boxd machine, 14 Nov 2026, 21:25 UTC. Replayed here, not live.';

describe('a card that ran at the click', () => {
  it('says live, boxd and the real start time, and never "not live", "recorded" or "replayed"', () => {
    const m = html(live(2));
    expect(label(m)).toBe('Live run on a boxd machine, started 15 Nov 2026, 06:30 UTC. Not a replay. Synthetic data.');
    expect(label(m)).not.toMatch(/not live|recorded|replayed/i);
    expect(m).not.toMatch(/Replayed here|Recorded run|Replaying the recorded/);
    expect(notice(m)).toBeNull();
    expect(m).toContain('data-mode="live"');
  });

  it('lights the reached states with their real times and leaves the rest dark', () => {
    const m = html(live(2));
    expect(m).toMatch(/<li class="past"><span class="sm-box" data-s="created"/);
    expect(m).toMatch(/<li class="now" aria-current="step"><span class="sm-box" data-s="running"/);
    expect(m).toMatch(/<li class=""><span class="sm-box" data-s="done"/);
    expect(m).toMatch(/<li class=""><span class="sm-box" data-s="deleted"/);
    expect(m).toContain('+1.0 s</span> machine ready');
    expect(m).toContain('+3.0 s</span> generate.py --n 5000, build_run.py');
    expect(m).not.toContain('run-5000.json written');
  });

  it('shows all four with Deleted last, and the machine\'s own total when it is known', () => {
    const m = renderToStaticMarkup(createElement(MachineCard, { view: { ...live(4), footer: '2 vCPU · 8 GiB, 5.2 s in total.' } }));
    expect(m).toMatch(/<li class="now" aria-current="step"><span class="sm-box" data-s="deleted"/);
    expect(m).toContain('5.2 s in total.');
  });
});

describe('a card that waits for the live call', () => {
  const pending: MachineView = { mode: 'pending', notice: null, startedAt: null, states: true, lines: [], footer: null };
  it('says it is starting, claims neither live nor recorded, and lights nothing', () => {
    const m = html(pending);
    expect(m).toContain('Asking for a live run on a boxd machine to make the 5,000 synthetic records.');
    expect(label(m)).toBeNull();
    expect(m).not.toMatch(/Live run|Recorded run|Replayed/);
    expect(m).not.toContain('class="now"');
    expect(m).toContain('data-mode="pending"');
  });
  it('a live card between the start line and the first state still says it is starting', () => {
    expect(html({ ...live(0) })).toContain('Asking for a live run on a boxd machine');
  });
});

describe('a card that replays the recorded run', () => {
  it('keeps the fixed recorded label word for word and never says it is a live run', () => {
    const m = html(replay(COPY.fallback.off));
    expect(label(m)).toBe(RECORDED);
    expect(label(m)).not.toMatch(/^Live run|started/);
    expect(m).not.toContain('Not a replay');
    expect(m).toContain('data-mode="replay"');
  });

  it('shows one sentence above the label saying why, for each reason', () => {
    for (const reason of ['off', 'busy', 'cap', 'timeout', 'error'] as const) {
      const m = html(replay(COPY.fallback[reason]));
      expect(notice(m), reason).toBe(COPY.fallback[reason].replace("'", '&#x27;'));
      expect(m.indexOf('sim-machine-notice')).toBeLessThan(m.indexOf('sim-machine-label'));
    }
  });

  it('without a notice (the recorded run played with no live attempt) shows no sentence', () => {
    expect(notice(html(replay(null)))).toBeNull();
  });

  it('a recorded run with no machine block is the label alone', () => {
    const m = html({ mode: 'replay', notice: COPY.fallback.error, startedAt: null, states: false, lines: [], footer: null });
    expect(label(m)).toBe(COPY.machineFallback);
    expect(m).not.toContain('sm-states');
  });

  it('starts empty and says it is replaying', () => {
    const m = html(replay(COPY.fallback.timeout, 0));
    expect(m).toContain('Replaying the recorded run');
    expect(m).not.toContain('class="now"');
  });
});

describe('the words', () => {
  it('"live" only in strings about the live run, "recorded" and "replayed" only in the replay ones', () => {
    for (const s of [COPY.machineStarting, COPY.liveLabel('x')]) expect(s).not.toMatch(/recorded|replayed|not live/i);
    expect(COPY.machineLabel('x')).toMatch(/Replayed here, not live/);
    for (const s of Object.values(COPY.fallback)) {
      expect(s).toMatch(/Showing the recorded run instead\.$/);
      expect(s.match(/\./g)!.length).toBe(2); // the reason, then "Showing the recorded run instead."
    }
  });
  it('has a sentence for exactly the five reasons', () => expect(Object.keys(COPY.fallback).sort()).toEqual(['busy', 'cap', 'error', 'off', 'timeout']));
});

describe('the page, before any click', () => {
  const run = parseRun(runJson);
  const page = renderToStaticMarkup(createElement(SimulateView, { run }));
  it('has the page label and an enabled Run button, and no machine card yet', () => {
    expect(page).toContain('data-testid="sim-page-label"');
    expect(page).toContain('Seeded synthetic data. Not real patients.');
    expect(page).toMatch(/data-testid="sim-run"[^>]*>Run the simulation</);
    expect(page).not.toMatch(/data-testid="sim-run"[^>]*disabled/);
    expect(page).not.toContain('sim-machine');
  });
});
