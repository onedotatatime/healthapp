/**
 * The demo panel's three calls (MIN-4516). The passcode is checked by `healthapp-demo-login` (it exists and answers 401 to a
 * wrong one); the reset is Cron's `healthapp-demo-reset` (MIN-4514: not deployed when this was written, so a 404 is shown
 * as "not deployed yet", never as a success). The patient token from the check lives in memory only and reads the newest
 * grant row under RLS, so no new backend is needed for the timestamps.
 */
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { ApiError } from '../../api/call';
import { callFunction } from '../../api/client';
import { DemoLoginResponse } from '../../api/contract';
import { GrantRow } from '../handshake/contract';
import { envState } from '../../lib/env';
import { readDoctorOpen, type Handshake } from './timing';

/** Cron's answer is not specified yet: accept any JSON object, and read nothing from it. */
const ResetResponse = z.object({}).passthrough();

export interface Unlocked {
  /** Patient session token, in memory only. */
  patientToken: string;
}

export async function checkPasscode(passcode: string): Promise<Unlocked> {
  if (!callFunction) throw new ApiError(0, 'Not configured.');
  const res = await callFunction('demo-login', { persona: 'patient', passcode }, DemoLoginResponse);
  return { patientToken: res.access_token };
}

export async function resetDemo(passcode: string): Promise<void> {
  if (!callFunction) throw new ApiError(0, 'Not configured.');
  await callFunction('demo-reset', { passcode }, ResetResponse);
}

/** The newest grant the synthetic patient can see, with the doctor-open moment this browser recorded for it. */
export async function lastHandshake(u: Unlocked): Promise<Handshake | null> {
  if (envState.status !== 'ok') throw new ApiError(0, 'Not configured.');
  const c = createClient(envState.supabaseUrl, envState.anonKey, {
    db: { schema: envState.schema },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'healthapp-demo-panel' },
    global: { headers: { Authorization: `Bearer ${u.patientToken}` } },
  });
  const { data, error } = await c.from('grants').select('id, requested_at, approved_at').order('requested_at', { ascending: false }).limit(1);
  if (error) throw new ApiError(0, error.message);
  const row = data?.[0];
  if (!row) return null;
  const g = GrantRow.pick({ id: true, requested_at: true, approved_at: true }).safeParse(row);
  if (!g.success) return null;
  return { grant_id: g.data.id, scanned_at: g.data.requested_at, approved_at: g.data.approved_at, doctor_open_at: readDoctorOpen(g.data.id) };
}
