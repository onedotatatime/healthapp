import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import runJson from '../../../data/synthetic/run-5000.json';

const auth = vi.hoisted(() => ({ getSession: vi.fn(), refreshSession: vi.fn(), signOut: vi.fn() }));
vi.mock('../../api/client', () => ({ supabase: { auth }, callFunction: null }));
vi.mock('../../lib/env', () => ({
  envState: { status: 'ok', env: 'dev', schema: 'healthapp_dev', bucket: 'healthapp-dev', functionPrefix: 'healthapp-', supabaseUrl: 'https://x.supabase.co', anonKey: 'anon' },
}));

import { LIVE_TIMEOUT_MS, acceptRun, createLiveRunner, parseEvent, reasonOf, requestLive, runLive, type LiveHandlers, type LiveSend } from './live';

// The contract is the CTO's decision on MIN-4670: start, four phase lines, end. The `run` is the file the machine wrote.
const T0 = '2026-11-15T06:30:00Z';
const START = { t: 'start', machine: 'healthapp-sim-20261115-063000', at: T0 };
const phase = (id: string, at: string, extra: object = {}) => ({ t: 'phase', id, at, ...extra });
// The machine's file, as the function relays it: build_run.py leaves `vm` null (the vm block comes on the `end` line).
const goodRun = () => ({ ...structuredClone(runJson), vm: null }) as unknown;
const happy = (run: unknown = goodRun()): object[] => [
  START,
  phase('created', '2026-11-15T06:30:01Z', { seconds: 0.5 }),
  phase('running', '2026-11-15T06:30:03Z'),
  phase('done', '2026-11-15T06:30:04Z', { seconds: 1.4, sha256: 'ab', run }),
  phase('deleted', '2026-11-15T06:30:05Z', { seconds: 1.7 }),
  { t: 'end', live: true, vm: { size: '2 vCPU · 8 GiB', seconds: 5.2 } },
];

const enc = new TextEncoder();
const body = (chunks: string[]) =>
  new ReadableStream<Uint8Array>({
    start(c) {
      chunks.forEach((x) => c.enqueue(enc.encode(x)));
      c.close();
    },
  });
const text = (events: object[]) => events.map((e) => JSON.stringify(e)).join('\n') + '\n';
const reply = (events: object[], status = 200) => new Response(body([text(events)]), { status, headers: { 'content-type': 'application/x-ndjson' } });
const sendOf = (events: object[]): LiveSend => async () => reply(events);

function recorder() {
  const log: string[] = [];
  const on: LiveHandlers = {
    onStart: (e) => log.push(`start:${e.machine}`),
    onPhase: (e) => log.push(`phase:${e.id}`),
  };
  return { log, on };
}

describe('parseEvent', () => {
  it('reads the four kinds of line', () => {
    expect(parseEvent(JSON.stringify(START))).toEqual(START);
    expect(parseEvent(JSON.stringify(phase('created', T0, { seconds: 0.5 })))).toMatchObject({ t: 'phase', id: 'created', seconds: 0.5 });
    expect(parseEvent('{"t":"end","live":true}')).toEqual({ t: 'end', live: true, vm: undefined });
    expect(parseEvent('{"t":"end","live":false,"reason":"cap"}')).toEqual({ t: 'end', live: false, reason: 'cap' });
  });
  it('refuses a line that is not JSON, not an object, or has the wrong shape; ignores an unknown kind', () => {
    for (const bad of ['not json', '[]', '3', 'null', '{"t":"start"}', '{"t":"phase","id":"exploded","at":"x"}', '{"t":"phase","id":"done"}', '{"t":"end"}']) {
      expect(parseEvent(bad), bad).toBeNull();
    }
    expect(parseEvent('{"t":"tick"}')).toEqual({ t: 'other' });
  });
  it('maps an unknown reason to error', () => {
    expect(reasonOf('busy')).toBe('busy');
    expect(reasonOf('on fire')).toBe('error');
    expect(reasonOf(undefined)).toBe('error');
  });
});

describe('acceptRun', () => {
  it('takes the recorded file and refuses what the page and the canvas could not read', () => {
    expect(acceptRun(goodRun())).not.toBeNull();
    expect(acceptRun({ ...(goodRun() as object), synthetic: false })).toBeNull();
    expect(acceptRun(null)).toBeNull();
    const broken = goodRun() as { records: unknown[] };
    broken.records[7] = ['ES', 3];
    expect(acceptRun(broken)).toBeNull();
    const noGroups = goodRun() as { groups?: unknown };
    delete noGroups.groups;
    expect(acceptRun(noGroups)).toBeNull();
  });
});

describe('runLive: the live stream', () => {
  it('lights the states in order, with the machine\'s own times, then hands over the run', async () => {
    const { log, on } = recorder();
    const seen: string[] = [];
    const res = await runLive(sendOf(happy()), { ...on, onPhase: (e) => { on.onPhase(e); seen.push(e.at); } });
    expect(log).toEqual(['start:healthapp-sim-20261115-063000', 'phase:created', 'phase:running', 'phase:done', 'phase:deleted']);
    expect(seen).toEqual(['2026-11-15T06:30:01Z', '2026-11-15T06:30:03Z', '2026-11-15T06:30:04Z', '2026-11-15T06:30:05Z']);
    expect(res).toMatchObject({ live: true, size: '2 vCPU · 8 GiB', seconds: 5.2 });
    if (!res.live) throw new Error('unreachable');
    expect(res.run.n).toBe(5000);
    expect(res.run.records).toHaveLength(5000);
  });

  it('reads lines that arrive in pieces (a line split over chunks, several lines in one)', async () => {
    const all = text(happy());
    const chunks: string[] = [];
    for (let i = 0; i < all.length; i += 4096) chunks.push(all.slice(i, i + 4096));
    expect(chunks.length).toBeGreaterThan(5); // the 143 KB file really is split
    const { log, on } = recorder();
    const res = await runLive(async () => new Response(body(chunks)), on);
    expect(res.live).toBe(true);
    expect(log).toHaveLength(5);
    const one = await runLive(async () => new Response(body([all])), recorder().on);
    expect(one.live).toBe(true);
  });

  it('reads a last line that has no newline, and ignores an unknown kind of line', async () => {
    const lines = happy();
    lines.splice(1, 0, { t: 'tick' });
    const raw = text(lines).trimEnd(); // no trailing newline: the `end` line is closed by the stream
    const { log, on } = recorder();
    const res = await runLive(async () => new Response(body([raw])), on);
    expect(res.live).toBe(true);
    expect(log).toHaveLength(5);
  });

  it('ignores a repeated phase line', async () => {
    const lines = happy();
    lines.splice(2, 0, phase('created', '2026-11-15T06:30:02Z'));
    const { log, on } = recorder();
    await runLive(sendOf(lines), on);
    expect(log.filter((l) => l === 'phase:created')).toHaveLength(1);
  });
});

describe('runLive: every reason to play the recorded run', () => {
  for (const reason of ['off', 'busy', 'cap', 'timeout', 'error'] as const) {
    it(`end with live:false and reason ${reason}`, async () => {
      const { log, on } = recorder();
      const res = await runLive(sendOf([START, { t: 'end', live: false, reason }]), on);
      expect(res).toEqual({ live: false, reason });
      expect(log).toEqual(['start:healthapp-sim-20261115-063000']);
    });
  }

  it('an end with no reason, or one we do not know, is error', async () => {
    expect(await runLive(sendOf([{ t: 'end', live: false }]), recorder().on)).toEqual({ live: false, reason: 'error' });
    expect(await runLive(sendOf([{ t: 'end', live: false, reason: 'cosmic rays' }]), recorder().on)).toEqual({ live: false, reason: 'error' });
  });

  it('a run that fails part-way ends the same way, after the lines already sent', async () => {
    const lines = [START, phase('created', '2026-11-15T06:30:01Z'), { t: 'end', live: false, reason: 'error' }];
    const { log, on } = recorder();
    expect(await runLive(sendOf(lines), on)).toEqual({ live: false, reason: 'error' });
    expect(log).toEqual(['start:healthapp-sim-20261115-063000', 'phase:created']); // the page clears the card on this result
  });

  it('a non-200 answer is error, whatever the body', async () => {
    for (const status of [401, 403, 400, 429, 500, 503]) {
      const res = await runLive(async () => new Response('{"error":{"code":"x","message":"y"}}', { status }), recorder().on);
      expect(res, String(status)).toEqual({ live: false, reason: 'error' });
    }
  });

  it('a non-200 answer is error even when its body looks like a good stream', async () => {
    const res = await runLive(async () => reply(happy(), 503), recorder().on);
    expect(res).toEqual({ live: false, reason: 'error' });
  });

  it('an answer with no body, or a call that throws, is error', async () => {
    expect(await runLive(async () => new Response(null, { status: 200 }), recorder().on)).toEqual({ live: false, reason: 'error' });
    expect(await runLive(async () => { throw new TypeError('network'); }, recorder().on)).toEqual({ live: false, reason: 'error' });
    expect(await runLive(() => { throw new Error('sync'); }, recorder().on)).toEqual({ live: false, reason: 'error' });
  });

  it('a done line whose file is not a synthetic run is error, and the card is never lit Done for it', async () => {
    const lines = happy({ ...(goodRun() as object), synthetic: false });
    const { log, on } = recorder();
    expect(await runLive(sendOf(lines), on)).toEqual({ live: false, reason: 'error' });
    expect(log).toEqual(['start:healthapp-sim-20261115-063000', 'phase:created', 'phase:running']);
    const nofile = happy();
    delete (nofile[3] as { run?: unknown }).run;
    expect(await runLive(sendOf(nofile), recorder().on)).toEqual({ live: false, reason: 'error' });
  });

  it('a stream that closes with no end line is error', async () => {
    expect(await runLive(sendOf(happy().slice(0, 4)), recorder().on)).toEqual({ live: false, reason: 'error' });
  });

  it('end with live:true but no file is error', async () => {
    expect(await runLive(sendOf([START, { t: 'end', live: true }]), recorder().on)).toEqual({ live: false, reason: 'error' });
  });

  it('a line that is not JSON is error', async () => {
    const res = await runLive(async () => new Response(body([JSON.stringify(START) + '\nthis is not json\n'])), recorder().on);
    expect(res).toEqual({ live: false, reason: 'error' });
  });
});

describe('runLive: the 25 second limit', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  /** A stream that sends `start` and then goes quiet, like a proxy holding the lines back. */
  const quiet = () => {
    let ctl!: ReadableStreamDefaultController<Uint8Array>;
    const stream = new ReadableStream<Uint8Array>({ start(c) { ctl = c; c.enqueue(enc.encode(JSON.stringify(START) + '\n')); } });
    return { response: new Response(stream), push: (e: object) => ctl.enqueue(enc.encode(JSON.stringify(e) + '\n')) };
  };

  it('is 25 seconds', () => expect(LIVE_TIMEOUT_MS).toBe(25_000));

  it('25 s without an end line is timeout, and nothing reaches the page afterwards', async () => {
    const q = quiet();
    const { log, on } = recorder();
    let sent: AbortSignal | undefined;
    const p = runLive(async (signal) => { sent = signal; return q.response; }, on);
    await vi.advanceTimersByTimeAsync(24_999);
    let settled = false;
    void p.then(() => { settled = true; });
    await vi.advanceTimersByTimeAsync(0);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(await p).toEqual({ live: false, reason: 'timeout' });
    expect(sent?.aborted).toBe(true);
    const before = [...log];
    try { q.push(phase('created', '2026-11-15T06:30:01Z')); } catch { /* the stream was cancelled: also fine */ }
    await vi.advanceTimersByTimeAsync(0);
    expect(log).toEqual(before);
  });

  it('a call that never answers is timeout too', async () => {
    const p = runLive(() => new Promise<Response>(() => undefined), recorder().on);
    await vi.advanceTimersByTimeAsync(25_000);
    expect(await p).toEqual({ live: false, reason: 'timeout' });
  });

  it('a run that ends in time clears the timer', async () => {
    const p = runLive(sendOf(happy()), recorder().on);
    await vi.advanceTimersByTimeAsync(0);
    expect((await p).live).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('runLive: leaving the page', () => {
  it('an abort from outside is error, and the call is told to stop', async () => {
    const ctl = new AbortController();
    let sent: AbortSignal | undefined;
    const p = runLive((signal) => new Promise<Response>((_, rej) => { sent = signal; signal.addEventListener('abort', () => rej(new Error('aborted'))); }), recorder().on, { signal: ctl.signal });
    ctl.abort();
    expect(await p).toEqual({ live: false, reason: 'error' });
    expect(sent?.aborted).toBe(true);
  });

  it('the connection is released when the run is over', async () => {
    let sent: AbortSignal | undefined;
    await runLive(async (signal) => { sent = signal; return reply(happy()); }, recorder().on);
    expect(sent?.aborted).toBe(true);
  });
});

describe('one click, one request', () => {
  it('a second start while a run is live sends nothing and calls nothing', async () => {
    const send = vi.fn(async () => reply(happy()));
    const runner = createLiveRunner(send);
    const first = recorder();
    const p = runner.start(first.on);
    expect(p).not.toBeNull();
    expect(runner.running).toBe(true);
    expect(send).toHaveBeenCalledTimes(1);

    const second = recorder();
    expect(runner.start(second.on)).toBeNull();
    expect(send).toHaveBeenCalledTimes(1);
    expect(second.log).toEqual([]);

    expect((await p!).live).toBe(true);
    expect(runner.running).toBe(false);
  });

  it('Run again behaves like the first run: one more request, then the same guard', async () => {
    const send = vi.fn(async () => reply(happy()));
    const runner = createLiveRunner(send);
    await runner.start(recorder().on);
    expect(send).toHaveBeenCalledTimes(1);
    const again = runner.start(recorder().on);
    expect(send).toHaveBeenCalledTimes(2);
    expect(runner.start(recorder().on)).toBeNull();
    expect(send).toHaveBeenCalledTimes(2);
    await again;
  });

  it('frees the guard after every kind of failure, so Run again works', async () => {
    const runner = createLiveRunner(async () => new Response('', { status: 500 }));
    expect(await runner.start(recorder().on)).toEqual({ live: false, reason: 'error' });
    expect(runner.running).toBe(false);
    expect(runner.start(recorder().on)).not.toBeNull();
  });
});

describe('requestLive: the one call', () => {
  const real = globalThis.fetch;
  beforeEach(() => {
    auth.getSession.mockReset().mockResolvedValue({ data: { session: { access_token: 'doctor-jwt' } }, error: null });
  });
  afterEach(() => vi.stubGlobal('fetch', real));

  it('POSTs once to healthapp-simulate-live with the doctor\'s session and the env header, and no body', async () => {
    const f = vi.fn(async () => reply(happy()));
    vi.stubGlobal('fetch', f);
    const ctl = new AbortController();
    const res = await requestLive(ctl.signal);
    expect(res.ok).toBe(true);
    expect(f).toHaveBeenCalledTimes(1);
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://x.supabase.co/functions/v1/healthapp-simulate-live');
    expect(init.method).toBe('POST');
    expect(init.body).toBeUndefined();
    expect(init.signal).toBe(ctl.signal);
    expect(init.headers).toMatchObject({ authorization: 'Bearer doctor-jwt', 'x-healthapp-env': 'dev', apikey: 'anon' });
  });

  it('a refused session (401) is refreshed once by authedCall; a function that answers 403 is not retried', async () => {
    const f = vi.fn(async () => new Response('{"error":{"code":"wrong_role","message":"no"}}', { status: 403 }));
    vi.stubGlobal('fetch', f);
    await expect(requestLive(new AbortController().signal)).rejects.toMatchObject({ status: 403, code: 'wrong_role' });
    expect(f).toHaveBeenCalledTimes(1);
    expect(auth.refreshSession).not.toHaveBeenCalled();
  });

  it('through the whole chain, a 403 or a network failure is the recorded run, not a raw error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"error":"x"}', { status: 403 })));
    expect(await runLive(requestLive, recorder().on)).toEqual({ live: false, reason: 'error' });
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('offline'); }));
    expect(await runLive(requestLive, recorder().on)).toEqual({ live: false, reason: 'error' });
  });
});
