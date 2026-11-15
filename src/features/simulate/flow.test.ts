import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import recruitJson from '../../../data/synthetic/recruit-50000.json';
import vmJson from '../../../data/synthetic/recruit-50000.vm.json';
import { COPY, RECRUIT_COPY } from './copy';
import { ELIGIBLE, OPTED, RING_MAX, SELECTED } from './dots';
import { REPLAY_MAX_MS, afterReveal, answerFor, prepare, replayPlan, search, type OkRequest } from './flow';
import { ringsTotal } from './motion';
import { parseRecruitFile, recruit, type RecruitFile } from './recruit';

const FILE: RecruitFile = parseRecruitFile(structuredClone(recruitJson));
const run = (sentence: string) => {
  const a = answerFor(FILE, sentence);
  if (a.kind !== 'run') throw new Error(`not a run: ${a.kind}`);
  return a.parsed;
};
const prep = (p: OkRequest) => prepare(FILE, p, search(FILE, p));
const FOUNDER = 'i want to recruit 40 people matching the rheumatoid arthritis desease for a trial';

describe('what the click decides before anything starts (the edge-case table of MIN-4736, one row each)', () => {
  it('empty box: no run', () => {
    expect(answerFor(FILE, '')).toEqual({ kind: 'empty' });
    expect(answerFor(FILE, '   ')).toEqual({ kind: 'empty' });
  });
  it('a condition not on the list: no run', () => {
    expect(answerFor(FILE, 'I want to recruit 40 people matching asthma for a trial')).toEqual({ kind: 'no_condition' });
  });
  it('a number above the 50,000 records: no run', () => {
    expect(answerFor(FILE, 'recruit 50001 people matching gout')).toEqual({ kind: 'too_many' });
    expect(answerFor(FILE, 'recruit 50000 people matching gout').kind).toBe('run');
  });
  it('no number, and zero: a run that asks for no number', () => {
    expect(run('recruit people matching gout').asked).toBeNull();
    expect(run('recruit 0 people matching gout').asked).toBeNull();
  });
  it('two conditions: a run on the one used, the other named as not used', () => {
    const p = run('recruit 10 people matching gout and rheumatoid arthritis');
    expect(p.condition.id).toBe('rheumatoid_arthritis');
    expect(p.others.map((c) => c.id)).toEqual(['gout']);
  });
  it('the founder\'s own sentence is a run: 40 and rheumatoid arthritis', () => {
    const p = run(FOUNDER);
    expect(p.asked).toBe(40);
    expect(p.condition.id).toBe('rheumatoid_arthritis');
  });
});

describe('the numbers are recruit()\'s at this click, for all 13 conditions', () => {
  for (const c of FILE.conditions) {
    for (const asked of [40, null, FILE.n]) {
      it(`${c.id}, asked ${asked}: the counts, the bright rows and the selected rows are what a fresh recruit() returns`, () => {
        const parsed: OkRequest = { kind: 'ok', condition: c, asked, others: [] };
        const p = prepare(FILE, parsed, search(FILE, parsed));
        const fresh = recruit(FILE, c, asked);
        expect(p.res).toEqual(fresh);
        const all = recruit(FILE, c, null);
        let opted = 0, eligible = 0, selected = 0;
        p.cls.forEach((b) => { if (b & OPTED) opted++; if (b & ELIGIBLE) eligible++; if (b & SELECTED) selected++; });
        expect(opted).toBe(p.optedIn);
        if (!fresh.shown) {
          // the rule of five: only the opt-in is known to the page; the fitting rows are not held at all
          expect(p.shown).toBe(false);
          expect(p.counts).toBeNull();
          expect(eligible).toBe(0);
          expect(selected).toBe(0);
          expect(p.selected).toEqual([]);
          expect(p.stages).toEqual(['all', 'opted']);
          return;
        }
        expect(all.shown).toBe(true);
        expect(p.stages).toEqual(['all', 'opted', 'fit', 'selected']);
        expect(p.counts).toEqual({ records: fresh.records, optedIn: fresh.optedIn, eligible: fresh.eligible, selected: fresh.selected });
        expect(eligible).toBe(fresh.eligible);
        expect(selected).toBe(fresh.selected);
        expect(p.selected).toEqual(fresh.rows);
        // the rows that stay bright at "fit" are exactly the ones counted, and the selected ones are the first of them in file order
        const eligibleRows = [...p.cls].flatMap((b, i) => (b & ELIGIBLE ? [i] : []));
        expect(eligibleRows).toEqual(all.shown ? all.rows : []);
        expect(eligibleRows.slice(0, fresh.selected)).toEqual(fresh.rows);
        // no count is larger than the one before it
        const k = p.counts!;
        expect(k.records).toBeGreaterThanOrEqual(k.optedIn);
        expect(k.optedIn).toBeGreaterThanOrEqual(k.eligible);
        expect(k.eligible).toBeGreaterThanOrEqual(k.selected);
        // every fitting record opted in, every selected one fits
        p.cls.forEach((b) => {
          if (b & ELIGIBLE) expect(b & OPTED).toBeTruthy();
          if (b & SELECTED) expect(b & ELIGIBLE).toBeTruthy();
        });
      });
    }
  }

  it('records is the length of the data searched: 50,000', () => {
    const p = prep(run(FOUNDER));
    expect(p.counts!.records).toBe(50_000);
    expect(p.counts!.records).toBe(FILE.records.length);
  });

  it('the same sentence gives the same numbers every time', () => {
    const a = prep(run(FOUNDER));
    const b = prep(run(FOUNDER));
    expect(a.counts).toEqual(b.counts);
    expect(a.selected).toEqual(b.selected);
    expect([...a.cls]).toEqual([...b.cls]);
  });

  it('founder sentence: 40 asked, 40 found, more records fit and were not selected', () => {
    const p = prep(run(FOUNDER));
    expect(p.counts!.selected).toBe(40);
    expect(p.counts!.eligible).toBeGreaterThan(40);
    expect(p.many).toBe(false);
  });

  it('fewer fit than asked (sarcoid-like, 40): a full flow, every fitting record selected', () => {
    const p = prep(run('recruit 40 people matching sarcoid'));
    expect(p.shown).toBe(true);
    expect(p.counts!.eligible).toBe(6);
    expect(p.counts!.selected).toBe(6);
    expect(p.res.shown && p.res.short).toBe(34);
  });

  it('under 5 (copper metabolism, myopathy): the flow stops after the opted-in stage', () => {
    for (const name of ['copper metabolism', 'myopathy']) {
      const p = prep(run(`recruit 40 people matching ${name}`));
      expect(p.shown, name).toBe(false);
      expect(p.stages, name).toHaveLength(2);
      expect(afterReveal(p).ringsAt, name).toBeNull();
    }
  });

  it('no number or zero: every fitting record is selected, and above 100 they are enlarged, not ringed', () => {
    const p = prep(run('recruit people matching rheumatoid arthritis'));
    expect(p.counts!.selected).toBe(p.counts!.eligible);
    expect(p.many).toBe(true);
    expect(p.selected.length).toBeGreaterThan(RING_MAX);
    expect(afterReveal(p).ringsAt).toBeNull();
    expect(prep(run('recruit 100 people matching rheumatoid arthritis')).many).toBe(false);
    expect(prep(run('recruit 101 people matching rheumatoid arthritis')).many).toBe(true);
  });
});

describe('when each stage happens (motion.ts, ms after the dots filled in)', () => {
  it('four stages 1,500 apart from 400, the rings once the last fade is done, then the result', () => {
    const p = prep(run(FOUNDER));
    const t = afterReveal(p);
    expect(t.stageAt).toEqual([400, 1900, 3400, 4900]);
    expect(t.ringsAt).toBe(5500);
    expect(t.doneAt).toBe(5500 + ringsTotal(40) + 200);
  });
  it('above 100 there are no rings, and the result follows the last fade', () => {
    const t = afterReveal(prep(run('recruit 500 people matching rheumatoid arthritis')));
    expect(t.ringsAt).toBeNull();
    expect(t.doneAt).toBe(4900 + 600 + 200);
  });
  it('under 5 only two stages, then the one sentence; the "fit" stage is never reached', () => {
    const t = afterReveal(prep(run('recruit 40 people matching myopathy')));
    expect(t.stageAt).toEqual([400, 1900]);
    expect(t.ringsAt).toBeNull();
    expect(t.doneAt).toBe(1900 + 600 + 200);
  });
});

describe('the machine card replays the recorded 50,000 run (recruit-50000.vm.json)', () => {
  const plan = replayPlan(vmJson)!;
  it('reads the real file: four phases in order, the recorded offsets, a footer from the file', () => {
    expect(plan).not.toBeNull();
    expect(plan.lines.map((l) => l.id)).toEqual(['created', 'running', 'done', 'deleted']);
    expect(plan.lines.map((l) => l.offsetMs)).toEqual([1000, 4000, 7000, 9000]);
    expect(plan.lines.map((l) => l.log)).toEqual(vmJson.phases.map((p) => p.log));
    expect(plan.startedAt).toBe(vmJson.started_at);
    expect(plan.footer).toBe(`${vmJson.size}, ${vmJson.seconds} s in total.`);
  });
  it('compresses the replay to 3 s at most, in order, while the printed offsets stay the recorded ones', () => {
    expect(plan.times[plan.times.length - 1]).toBeLessThanOrEqual(REPLAY_MAX_MS);
    expect(plan.dotsAt).toBeLessThanOrEqual(3000);
    expect([...plan.times].sort((a, b) => a - b)).toEqual(plan.times);
    expect(plan.lines[3].offsetMs).toBeGreaterThan(REPLAY_MAX_MS);
  });
  it('a file that is not a finished, deleted run gives no card lines: the label alone', () => {
    expect(replayPlan(null)).toBeNull();
    expect(replayPlan({ ...vmJson, deleted: false })).toBeNull();
    expect(replayPlan({ ...vmJson, started_at: 'not a date' })).toBeNull();
    expect(replayPlan({ ...vmJson, phases: vmJson.phases.slice(0, 3) })).toBeNull();
    expect(replayPlan({ ...vmJson, phases: [...vmJson.phases].reverse() })).toBeNull();
  });
  it('the vm file is the one the committed records came from', () => {
    expect(vmJson.file_sha256).toBe('cbeeda91453f779f7a05696383c3144744142035099456bd25d20ed67ab1d521');
    expect(vmJson.deleted).toBe(true);
  });
});

describe('no string types a number, and the removed flow is gone from the page', () => {
  const read = (f: string) => readFileSync(join(__dirname, f), 'utf8');
  const strings = (o: unknown): string[] =>
    typeof o === 'string' ? [o] : typeof o === 'function' ? strings((o as (...a: string[]) => unknown)('N1', 'N2', 'N3')) : o && typeof o === 'object' ? Object.values(o).flatMap(strings) : [];
  it('"Run the simulation", "Run again", 5,000 and the removed labels are in no string', () => {
    const all = [...strings(COPY), ...strings(RECRUIT_COPY)].join('\n');
    expect(all).not.toMatch(/Run the simulation|Run again|5,000|5000|Ask for an introduction|demo patient|Dummy exams/i);
    expect(all).not.toMatch(/Understands a number|made ahead of time/);
  });
  it('the strings that carry a count take it as an argument', () => {
    expect(COPY.recordsTitle('50,000')).toBe('The 50,000 records');
    expect(COPY.recordsTitle('7')).toBe('The 7 records');
    expect(RECRUIT_COPY.intro('N')).toContain('looks through N seeded synthetic records');
    expect(COPY.canvasStage.selectedMany('100')).toBe('More than 100 records are selected, so they are enlarged, not ringed.');
    expect(COPY.canvasLabel('50,000', 'S')).toBe('50,000 synthetic records, one dot each. S');
  });
  it('the page loads no 5,000 run, no matcher, no live call; it only imports the 50,000 file through its own chunk', () => {
    for (const f of ['Simulate.tsx', 'flow.ts', 'dots.ts', 'dotPaint.ts', 'DotCanvas.tsx', 'MachineCard.tsx', 'format.ts']) {
      const src = read(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
      expect(src, f).not.toMatch(/run-5000|findMatches|from '\.\/live'|from '\.\/matcher'[^;]*\bfindMatches|healthapp-simulate-live/);
      expect(src, f).not.toMatch(/createLiveRunner|requestLive|authedCall|makeStream/);
    }
    expect(read('recruit-data.ts')).toContain('recruit-50000.json');
    expect(read('Simulate.tsx')).toMatch(/import\('\.\/recruit-data'\)/);
    expect(read('Simulate.tsx')).not.toMatch(/import\s+\S+\s+from\s+'\.\/recruit-data'/);
  });
});
