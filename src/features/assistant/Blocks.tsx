/**
 * The three kinds of content an answer holds, each in its own form (PRD 11.2, 12.5; Cron's kinds, CTO section 3 row 2):
 * a cited fact (text + numbered chips), general medical knowledge (its own dashed box, never inside a fact), and
 * "Not in this record" (one line). Text is rendered as text: React escapes it, there is no markdown or HTML path.
 */
import { CitationChip } from '../../components/CitationChip';
import type { AssistantResponse, Segment } from './contract';
import { factStatus, type RecordIndex } from './record';

export interface ChipCtx {
  index: Pick<RecordIndex, 'resolve'>;
  /** Number shown on the chip for a cite id (the same id keeps one number through an answer). */
  numberFor(cite: string): number;
  /** The cite the source viewer is showing now. */
  openCite: string | null;
  onOpen(cite: string): void;
}

export function Chips({ cites, ctx }: { cites: string[]; ctx: ChipCtx }) {
  return (
    <>
      {cites.map((c) => {
        const s = ctx.index.resolve(c);
        if (!s) return null;
        return <CitationChip key={c} n={ctx.numberFor(c)} record={{ name: s.name, date: s.date, provenance: s.provenance }} open={ctx.openCite === c} onOpen={() => ctx.onOpen(c)} />;
      })}
    </>
  );
}

/** A claim from the record. Shown as a fact only when every cite resolves and the server verified it. */
export function FactBlock({ segment, ctx }: { segment: Segment; ctx: ChipCtx }) {
  const status = factStatus(segment, ctx.index);
  if (status === 'unresolved') {
    return <p className="as-fact as-bad" data-testid="fact-unconfirmed">Could not confirm a source for one statement.</p>;
  }
  if (status === 'unverified') {
    return <p className="as-fact as-bad" data-testid="fact-unverified">One statement could not be verified against the record.</p>;
  }
  return (
    <p className="as-fact" data-testid="fact">
      {segment.text} <Chips cites={segment.cites} ctx={ctx} />
    </p>
  );
}

/** Not from this record. Own container, own label; takes no cites and cannot hold chips. */
export function GeneralBlock({ segment }: { segment: Segment }) {
  return (
    <aside className="as-general" data-testid="general" aria-label="General medical knowledge, not from this record">
      <strong>General medical knowledge, not from this record</strong>
      <p>{segment.text}</p>
    </aside>
  );
}

export function NotInRecordBlock() {
  return <p className="as-nir" data-testid="not-in-record">Not in this record.</p>;
}

/** One whole answer. Facts first, general knowledge after them, or the single "not in this record" line. */
export function Answer({ response, ctx }: { response: AssistantResponse; ctx: Omit<ChipCtx, 'numberFor'> }) {
  const facts = response.segments.filter((s) => s.kind === 'record_fact');
  const general = response.segments.filter((s) => s.kind === 'general_knowledge');
  if (response.not_in_record || response.segments.length === 0) return <NotInRecordBlock />;
  const order: string[] = [];
  for (const f of facts) for (const c of f.cites) if (!order.includes(c)) order.push(c);
  const numberFor = (c: string) => order.indexOf(c) + 1;
  const full: ChipCtx = { ...ctx, numberFor };
  return (
    <div className="as-answer">
      {facts.map((s, i) => <FactBlock key={i} segment={s} ctx={full} />)}
      {general.map((s, i) => <GeneralBlock key={i} segment={s} />)}
    </div>
  );
}
