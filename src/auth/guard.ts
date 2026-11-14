import type { Role } from '../api/contract';

export type AuthState = { status: 'loading' } | { status: 'out' } | { status: 'in'; role: Role };
export type GuardResult = { kind: 'wait' } | { kind: 'allow' } | { kind: 'redirect'; to: string };

export const homeFor = (role: Role): string => (role === 'patient' ? '/patient' : '/doctor');

/** Route guard as a pure function: signed out goes to /login, the wrong role goes back to its own home. */
export function guard(auth: AuthState, required: Role): GuardResult {
  if (auth.status === 'loading') return { kind: 'wait' };
  if (auth.status === 'out') return { kind: 'redirect', to: '/login' };
  return auth.role === required ? { kind: 'allow' } : { kind: 'redirect', to: homeFor(auth.role) };
}
