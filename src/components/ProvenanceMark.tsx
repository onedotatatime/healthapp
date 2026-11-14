import { IdentificationCard, PencilSimple, ShieldCheck, UploadSimple } from '@phosphor-icons/react';

export type MarkKind = 'verified' | 'uploaded' | 'edited' | 'name-match';

export const MARK_LABEL: Record<MarkKind, string> = {
  verified: 'Verified by source',
  uploaded: 'Uploaded by patient',
  edited: 'Edited by patient',
  'name-match': 'Name match only',
};

const ICON = { verified: ShieldCheck, uploaded: UploadSimple, edited: PencilSimple, 'name-match': IdentificationCard };

/** One of the four provenance marks. Always an icon plus the words, never colour alone. Not interactive. */
export function ProvenanceMark({ kind, surface = 'patient' }: { kind: MarkKind; surface?: 'patient' | 'doctor' }) {
  const Icon = ICON[kind];
  return (
    <span className={`mark ${kind} ${surface}`} data-testid={`mark-${kind}`}>
      <Icon size={16} weight="bold" aria-hidden="true" />
      {MARK_LABEL[kind]}
    </span>
  );
}
