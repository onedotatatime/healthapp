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
  access_token: z.string().min(1),
  refresh_token: z.string().min(1),
  expires_at: z.number().int(), // unix seconds
  user_id: z.string(),
  persona: z.enum(['patient', 'doctor']),
  role: Role,
});
export type DemoLoginResponse = z.infer<typeof DemoLoginResponse>;

/** A row of healthapp_<env>.profiles, read under RLS (own row). */
export const Profile = z.object({
  id: z.string(),
  role: Role,
  full_name: z.string(),
});
export type Profile = z.infer<typeof Profile>;

/** grants.status, review 3 row 9. The timer reads `expires_at` from the grant. */
export const GrantStatus = z.enum(['pending', 'active', 'refused', 'expired', 'revoked']);
export type GrantStatus = z.infer<typeof GrantStatus>;
