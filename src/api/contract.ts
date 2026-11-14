/**
 * LOCAL STUB of Cron's `contract.ts` (MIN-4471; shapes from CTO review section 3 and MIN-4449 decision 1).
 * Same file name and the same zod style, so the swap is: delete this file, copy Cron's `contract.ts`
 * (and its fixtures) from `staging`, fix the import names that differ. Nothing outside `src/api` and
 * `src/auth` reads the wire shapes.
 */
import { z } from 'zod';

export const Role = z.enum(['patient', 'doctor']);
export type Role = z.infer<typeof Role>;

/** healthapp-demo-login: no session needed; the passcode is typed by the presenter (MIN-4449 decision 1, 5). */
export const DemoLoginRequest = z.object({ persona: Role, passcode: z.string().min(1) });
export type DemoLoginRequest = z.infer<typeof DemoLoginRequest>;
export const DemoLoginResponse = z.object({
  session: z.object({ access_token: z.string().min(1), refresh_token: z.string().min(1) }),
  role: Role,
});
export type DemoLoginResponse = z.infer<typeof DemoLoginResponse>;

/** A row of healthapp_<env>.profiles, read under RLS (own row). */
export const Profile = z.object({
  id: z.string(),
  role: Role,
  display_name: z.string().nullish(),
});
export type Profile = z.infer<typeof Profile>;

/** grants.status, review 3 row 9. The timer reads `expires_at` from the grant. */
export const GrantStatus = z.enum(['pending', 'active', 'refused', 'expired', 'revoked']);
export type GrantStatus = z.infer<typeof GrantStatus>;

/** diary_entries (review 3 row 12): a direct insert under RLS, no function. `recorded_at` is the server's `now()`. */
export const DiaryEntry = z.object({
  id: z.string(),
  occurred_at: z.string(),
  recorded_at: z.string().nullish(),
  time_edited: z.boolean(),
  text: z.string(),
  severity: z.number().int().min(1).max(10),
});
export type DiaryEntry = z.infer<typeof DiaryEntry>;
export const DiaryInsert = z.object({
  patient_id: z.string().min(1),
  occurred_at: z.string().min(1),
  time_edited: z.boolean(),
  text: z.string().trim().min(1),
  severity: z.number().int().min(1).max(10),
});
export type DiaryInsert = z.infer<typeof DiaryInsert>;
