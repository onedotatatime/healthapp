import type { EndReason } from './grant';
import type { GrantView } from './contract';

/** The words for a closed grant, for each side. Sentence case, no jargon (PRD 13.4 spirit; the copy owner is Anna). */
export function patientEnded(reason: EndReason, grant: GrantView): { title: string; body: string } {
  const who = grant.doctor.full_name;
  if (reason === 'refused') return { title: 'You declined', body: `${who} did not get access to your record.` };
  if (reason === 'revoked') return { title: 'Access ended', body: `You ended access. ${who} can no longer see your record.` };
  if (grant.approved_at === null) return { title: 'Request ended', body: `${who} asked, and the request ended without an answer. Nothing was shared.` };
  return { title: 'Access ended', body: `The time is up. ${who} can no longer see your record.` };
}

export function doctorEnded(reason: EndReason, grant: GrantView): { title: string; body: string } {
  const who = grant.patient.full_name;
  if (reason === 'refused') return { title: 'Request declined', body: `${who} declined. You have no access to this record.` };
  if (grant.approved_at === null) return { title: 'Request ended', body: `${who} did not answer in time. Ask for a new code to try again.` };
  return { title: 'Access ended', body: `Access to ${who}'s record has ended. Nothing is kept on this screen.` };
}

export const whoLine = (p: { full_name: string; specialty: string | null }) => (p.specialty ? `${p.full_name} · ${p.specialty}` : p.full_name);

/** Total grant length in seconds for the timer's track; 15 min when the server did not stamp an approval. */
export function grantSeconds(g: GrantView): number {
  if (g.approved_at && g.expires_at) {
    const s = Math.round((Date.parse(g.expires_at) - Date.parse(g.approved_at)) / 1000);
    if (s > 0) return s;
  }
  return 900;
}

/** "Dr. Eleni Raptis (Rheumatology)", the way PRD 11.2 words the request. */
export const askingLine = (p: { full_name: string; specialty: string | null }) => (p.specialty ? `${p.full_name} (${p.specialty})` : p.full_name);
