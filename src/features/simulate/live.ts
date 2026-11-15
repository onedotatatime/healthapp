/**
 * The live call of /doctor/simulate (MIN-4675, CTO decision on MIN-4670). The Run click sends one POST to the Edge Function
 * `healthapp-simulate-live` and reads its NDJSON stream: `start`, four `phase` lines with real times, then `end`.
 * This is the only file of the module that calls the network and the only one that imports from src/api (the session and the
 * env header). Everything else in the module stays offline. No key and no model call here: the function drives the machine.
 *
 * The recorded run is the fallback. `runLive` never throws and never hangs: it resolves with the live run, or with the reason
 * the page plays the recorded one (`off`, `busy`, `cap`, `timeout`, `error`). A non-200, a network error, a file that is not a
 * synthetic run, a stream that closes early and 25 s without an `end` line are all `error` or `timeout`.
 */
import { authedCall } from '../../api/authed';
import { makeStream } from '../../api/call';
import { envState } from '../../lib/env';
import { PHASE_IDS, parseRun, type PhaseId, type RunFile } from './matcher';

export const LIVE_TIMEOUT_MS = 25_000;

export type FallbackReason = 'off' | 'busy' | 'cap' | 'timeout' | 'error';
const REASONS: readonly FallbackReason[] = ['off', 'busy', 'cap', 'timeout', 'error'];
export const reasonOf = (r: unknown): FallbackReason => (REASONS.includes(r as FallbackReason) ? (r as FallbackReason) : 'error');

export type LiveEvent =
  | { t: 'start'; machine: string; at: string }
  | { t: 'phase'; id: PhaseId; at: string; seconds?: number; run?: unknown }
  | { t: 'end'; live: true; vm?: unknown }
  | { t: 'end'; live: false; reason?: unknown }
  | { t: 'other' };

/** One NDJSON line. null when the line is not a JSON object or a known line has the wrong shape; an unknown `t` is `other` and ignored. */
export function parseEvent(line: string): LiveEvent | null {
  let x: unknown;
  try {
    x = JSON.parse(line);
  } catch {
    return null;
  }
  if (!x || typeof x !== 'object' || Array.isArray(x)) return null;
  const o = x as Record<string, unknown>;
  if (typeof o.t !== 'string') return null;
  if (o.t === 'start') return typeof o.machine === 'string' && typeof o.at === 'string' ? { t: 'start', machine: o.machine, at: o.at } : null;
  if (o.t === 'phase') {
    if (!PHASE_IDS.includes(o.id as PhaseId) || typeof o.at !== 'string') return null;
    return { t: 'phase', id: o.id as PhaseId, at: o.at, seconds: typeof o.seconds === 'number' ? o.seconds : undefined, run: o.run };
  }
  if (o.t === 'end') {
    if (o.live === true) return { t: 'end', live: true, vm: o.vm };
    if (o.live === false) return { t: 'end', live: false, reason: o.reason };
    return null;
  }
  return { t: 'other' };
}

/** parseRun, plus the shape the page and the canvas read, so a bad file falls back here and not inside a render. */
export function acceptRun(x: unknown): RunFile | null {
  try {
    const r = parseRun(x);
    const ok =
      Array.isArray(r.groups) && Array.isArray(r.age_bands) && r.codes.every((c) => typeof c === 'string') &&
      r.seeded && typeof r.seeded === 'object' && r.detail && typeof r.detail === 'object' &&
      Array.isArray(r.persona.codes) && r.result && Array.isArray(r.result.matched) &&
      r.records.every((rec) => Array.isArray(rec) && rec.length === 5 && typeof rec[0] === 'string' && Array.isArray(rec[4]));
    return ok ? r : null;
  } catch {
    return null;
  }
}

export interface LiveHandlers {
  onStart(e: { machine: string; at: string }): void;
  onPhase(e: { id: PhaseId; at: string; seconds?: number }): void;
}
export type LiveResult = { live: true; run: RunFile; size: string | null; seconds: number | null } | { live: false; reason: FallbackReason };
export type LiveSend = (signal: AbortSignal) => Promise<Response>;

const fail = (reason: FallbackReason): LiveResult => ({ live: false, reason });

/** Reads `body` line by line (a line may arrive in several chunks, several lines in one). `onLine` returns true to stop. */
async function consume(body: ReadableStream<Uint8Array>, onLine: (line: string) => boolean): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) {
        buf += decoder.decode();
        if (buf.trim()) onLine(buf);
        return;
      }
      buf += decoder.decode(value, { stream: true });
      let i: number;
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i);
        buf = buf.slice(i + 1);
        if (line.trim() && onLine(line)) return;
      }
    }
  } finally {
    reader.cancel().catch(() => undefined);
  }
}

/** One live call. Resolves once, always: the live run, or the reason to play the recorded one. */
export async function runLive(send: LiveSend, on: LiveHandlers, opts: { timeoutMs?: number; signal?: AbortSignal } = {}): Promise<LiveResult> {
  const ctl = new AbortController();
  const abort = () => ctl.abort();
  opts.signal?.addEventListener('abort', abort);
  let settled = false; // once true, nothing more reaches the handlers
  let timer: ReturnType<typeof setTimeout> | undefined;

  const work = (async (): Promise<LiveResult> => {
    let res: Response;
    try {
      res = await send(ctl.signal);
    } catch {
      return fail('error');
    }
    if (!res.ok || !res.body) return fail('error');
    let run: RunFile | null = null;
    let out: LiveResult | null = null;
    const seen = new Set<PhaseId>();
    await consume(res.body, (line) => {
      if (settled) return true;
      const ev = parseEvent(line);
      if (!ev) {
        out = fail('error');
        return true;
      }
      if (ev.t === 'start') {
        on.onStart(ev);
      } else if (ev.t === 'phase') {
        if (seen.has(ev.id)) return false;
        if (ev.id === 'done') {
          run = acceptRun(ev.run);
          if (!run) {
            out = fail('error'); // the card is not lit "Done" for a file the page will not use
            return true;
          }
        }
        seen.add(ev.id);
        on.onPhase(ev);
      } else if (ev.t === 'end') {
        if (!ev.live) out = fail(reasonOf(ev.reason));
        else if (!run) out = fail('error');
        else {
          const vm = ev.vm && typeof ev.vm === 'object' ? (ev.vm as { size?: unknown; seconds?: unknown }) : {};
          out = { live: true, run, size: typeof vm.size === 'string' ? vm.size : null, seconds: typeof vm.seconds === 'number' ? vm.seconds : null };
        }
        return true;
      }
      return false;
    });
    return out ?? fail('error'); // the stream closed with no `end` line
  })().catch(() => fail('error'));

  const timeout = new Promise<LiveResult>((resolve) => {
    timer = setTimeout(() => resolve(fail('timeout')), opts.timeoutMs ?? LIVE_TIMEOUT_MS);
  });
  try {
    return await Promise.race([work, timeout]);
  } finally {
    settled = true;
    clearTimeout(timer);
    opts.signal?.removeEventListener('abort', abort);
    ctl.abort(); // frees the connection; the function deletes its machine whether or not we are still reading
  }
}

/** The one network call of the module: one POST, the doctor's session, the env header, an empty body. */
export const requestLive: LiveSend = (signal) =>
  authedCall(async (accessToken) => {
    if (envState.status !== 'ok') throw new Error('Not configured.');
    return makeStream(envState)('simulate-live', { accessToken, signal });
  });

/** One live call at a time. A second `start` while one runs sends nothing and returns null. */
export function createLiveRunner(send: LiveSend = requestLive, timeoutMs: number = LIVE_TIMEOUT_MS) {
  let running = false;
  return {
    get running() {
      return running;
    },
    start(on: LiveHandlers, signal?: AbortSignal): Promise<LiveResult> | null {
      if (running) return null;
      running = true;
      return runLive(send, on, { timeoutMs, signal }).finally(() => {
        running = false;
      });
    },
  };
}
