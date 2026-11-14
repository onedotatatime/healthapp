// Test helpers only (never imported by a function). Fake store and env for the dashboard handlers.
import type { Deps, Store } from "./dashboard.ts";

export const PUSH = "p".repeat(64);
export const VIEW = "v".repeat(64);

export function fakeStore(initial: string | null = null): Store & { writes: string[]; reads: number } {
  const s = {
    writes: [] as string[],
    reads: 0,
    current: initial,
    put(json: string) {
      s.writes.push(json);
      s.current = json;
      return Promise.resolve();
    },
    get() {
      s.reads++;
      return Promise.resolve(s.current);
    },
  };
  return s;
}

export function deps(over: Partial<Deps> & { vars?: Record<string, string> } = {}) {
  const vars: Record<string, string> = {
    HEALTHAPP_DASHBOARD_PUSH_KEY: PUSH,
    HEALTHAPP_DASHBOARD_VIEW_KEY: VIEW,
    ...(over.vars ?? {}),
  };
  const store = (over.store as ReturnType<typeof fakeStore>) ?? fakeStore();
  const d: Deps = {
    env: over.env ?? ((n) => vars[n]),
    store,
    now: over.now ?? (() => new Date("2026-11-14T15:00:00.000Z")),
  };
  return { d, store };
}
