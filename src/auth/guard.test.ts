import { describe, expect, it } from 'vitest';
import { guard, homeFor } from './guard';

describe('role guard', () => {
  it('waits while the session is loading', () => {
    expect(guard({ status: 'loading' }, 'patient')).toEqual({ kind: 'wait' });
  });
  it('sends a signed-out visitor to the login panel from both routes', () => {
    expect(guard({ status: 'out' }, 'patient')).toEqual({ kind: 'redirect', to: '/login' });
    expect(guard({ status: 'out' }, 'doctor')).toEqual({ kind: 'redirect', to: '/login' });
  });
  it('lets each role into its own route', () => {
    expect(guard({ status: 'in', role: 'patient' }, 'patient')).toEqual({ kind: 'allow' });
    expect(guard({ status: 'in', role: 'doctor' }, 'doctor')).toEqual({ kind: 'allow' });
  });
  it('sends a patient away from a doctor route, and the reverse, to their own home', () => {
    expect(guard({ status: 'in', role: 'patient' }, 'doctor')).toEqual({ kind: 'redirect', to: '/patient' });
    expect(guard({ status: 'in', role: 'doctor' }, 'patient')).toEqual({ kind: 'redirect', to: '/doctor' });
  });
  it('homeFor names the two homes', () => {
    expect([homeFor('patient'), homeFor('doctor')]).toEqual(['/patient', '/doctor']);
  });
});
