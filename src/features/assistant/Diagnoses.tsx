/**
 * Possible diagnoses (MIN-4665), the doctor's third view. Slice 2 of the live dashboard (MIN-4659); the guard, the order
 * and the words are the CTO's (MIN-4660 section 3), the layout is Pix's (docs/design/min-4659, section 7).
 * - Nothing is called when the view opens: one call to `healthapp-diagnoses` per press of the button.
 * - The banner is in the DOM in every state and cannot be closed.
 * - Cards keep the order received (the server sorts by name). There is no way to draw a number, a rank, a percentage or a
 *   colour difference between cards: the response has no such field, and this file adds none.
 * - A card with no resolved citation is never drawn (PRD 12.5). A statement whose cite does not resolve is not drawn.
 * Doctor view only: this file is in the lazy assistant chunk, so no patient screen can render it. The answer lives in this
 * component's state and goes when access ends.
 */
import { Info, Stethoscope } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';
import { CitationChip } from '../../components/CitationChip';
import { Spinner } from '../../components/Primitives';
import type { DiagnosisItem, DiagnosisStatement } from './analysis.contract';
import type { AssistantApi } from './api';
import { createDiagnosesController, DX, footerLine, guardLine, type DxState } from './diagnoses.state';
import type { RecordIndex } from './record';

type Index = Pick<RecordIndex, 'resolve'>;

export interface DxCard {
  name: string;
  fits: DiagnosisStatement[];
  doesNotExplain: DiagnosisStatement[];
  notInRecord: string[];
  /** Every cite of the card once, in the order of first use. These are the numbers on the chips. */
  cites: string[];
}

/** What can be drawn: statements whose every cite resolves, and cards that keep at least one. The order is untouched. */
export function visibleCards(items: DiagnosisItem[], index: Index): DxCard[] {
  const ok = (s: DiagnosisStatement) => s.cites.length > 0 && s.cites.every((c) => index.resolve(c));
  const cards: DxCard[] = [];
  for (const it of items) {
    const fits = it.fits.filter(ok);
    if (fits.length === 0) continue;
    const doesNotExplain = it.does_not_explain.filter(ok);
    const cites: string[] = [];
    for (const s of [...fits, ...doesNotExplain]) for (const c of s.cites) if (!cites.includes(c)) cites.push(c);
    cards.push({ name: it.name, fits, doesNotExplain, notInRecord: it.not_in_record, cites });
  }
  return cards;
}

interface ViewProps {
  state: DxState;
  index: Index;
  openCite: string | null;
  onOpenCite(cite: string): void;
  onRun?(): void;
}

function Statements({ list, card, index, openCite, onOpenCite }: { list: DiagnosisStatement[]; card: DxCard; index: Index; openCite: string | null; onOpenCite(c: string): void }) {
  return (
    <ul className="dx-list">
      {list.map((s, i) => (
        <li key={i} data-testid="dx-statement">
          {s.text}{' '}
          {s.cites.map((c) => {
            const src = index.resolve(c);
            return src ? <CitationChip key={c} n={card.cites.indexOf(c) + 1} record={{ name: src.name, date: src.date, provenance: src.provenance }} open={openCite === c} onOpen={() => onOpenCite(c)} /> : null;
          })}
        </li>
      ))}
    </ul>
  );
}

export function DiagnosisCard({ card, index, openCite, onOpenCite }: { card: DxCard; index: Index; openCite: string | null; onOpenCite(c: string): void }) {
  const props = { card, index, openCite, onOpenCite };
  return (
    <li className="dx-card" data-testid="dx-card">
      <h3>{card.name}</h3>
      <div className="dx-row" data-testid="dx-fits">
        <span className="dx-k">{DX.fits}</span>
        <Statements list={card.fits} {...props} />
      </div>
      {card.doesNotExplain.length > 0 && (
        <div className="dx-row" data-testid="dx-does-not-explain">
          <span className="dx-k">{DX.doesNotExplain}</span>
          <Statements list={card.doesNotExplain} {...props} />
        </div>
      )}
      {card.notInRecord.length > 0 && (
        <p className="dx-row" data-testid="dx-not-in-record">
          <span className="dx-k">{DX.notInRecord}</span>
          {card.notInRecord.join(', ')}
        </p>
      )}
      <p className="dx-based" data-testid="dx-based">
        <span className="dx-k">{DX.basedOn}</span>
        {card.cites.map((c, i) => {
          const src = index.resolve(c);
          return src ? (
            <button key={c} type="button" className="src-chip" aria-pressed={openCite === c} onClick={() => onOpenCite(c)} data-testid="dx-source">{i + 1}. {src.name} · {src.date}</button>
          ) : null;
        })}
      </p>
    </li>
  );
}

/** Presentational and pure, so every state can be rendered in a test. */
export function DiagnosesView({ state, index, openCite, onOpenCite, onRun }: ViewProps) {
  const cards = state.status === 'ok' ? visibleCards(state.data.items, index) : [];
  const shown = state.status === 'ok' ? (cards.length > 0 ? 'ok' : 'none') : state.status;
  const data = state.status === 'ok' || state.status === 'none' ? state.data : null;
  const busy = state.status === 'loading';
  const canRun = state.status === 'idle' || state.status === 'loading' || state.status === 'ok' || state.status === 'none';
  return (
    <section className="dx-view" aria-labelledby="dx-title" data-testid="diagnoses" data-state={shown}>
      <h2 id="dx-title">{DX.title}</h2>
      <div className="dx-banner" role="note" data-testid="dx-banner">
        <Info size={22} weight="bold" aria-hidden="true" />
        <p>{DX.banner}</p>
      </div>
      <p className="as-strip" data-testid="dx-ai-line">{DX.aiLine}</p>
      {canRun && (
        <div className="dx-run">
          <button type="button" className="btn primary as-btn" onClick={onRun} disabled={busy} aria-busy={busy || undefined} data-testid="dx-run">
            <Stethoscope size={20} weight="bold" aria-hidden="true" /> {state.status === 'ok' || state.status === 'none' ? DX.runAgain : DX.run}
          </button>
          {busy && <p data-testid="dx-loading"><Spinner label={DX.loading} /></p>}
        </div>
      )}
      {busy && (
        <ul className="dx-grid" aria-hidden="true" data-testid="dx-skeleton">
          {[0, 1].map((i) => (
            <li key={i} className="dx-card skeleton">
              <span className="skel" style={{ width: '50%', height: 20 }} />
              <span className="skel" style={{ width: '90%' }} />
              <span className="skel" style={{ width: '70%' }} />
              <span className="skel" style={{ width: '40%' }} />
            </li>
          ))}
        </ul>
      )}
      {state.status === 'off' && <div className="empty" data-testid="dx-off">{DX.off}</div>}
      {state.status === 'ended' && <p className="muted" role="status" data-testid="dx-ended">{DX.ended}</p>}
      {state.status === 'error' && (
        <div data-testid="dx-error">
          <div className="note" role="alert">
            <Info size={22} weight="bold" aria-hidden="true" />
            <span>{state.kind === 'timeout' ? DX.timeout : DX.failed}</span>
          </div>
          <p className="dx-retry"><button type="button" className="btn as-btn" onClick={onRun} data-testid="dx-retry">{DX.retry}</button></p>
        </div>
      )}
      {data && data.truncated && (
        <p className="cap-notice" data-testid="dx-truncated"><Info size={22} weight="bold" aria-hidden="true" />{DX.truncated}</p>
      )}
      {data && data.counts.guard_drops > 0 && <p className="dx-guard" data-testid="dx-guard">{guardLine(data.counts.guard_drops)}</p>}
      {shown === 'none' && <div className="empty" data-testid="dx-none">{DX.none}</div>}
      {cards.length > 0 && (
        <ul className="dx-grid" data-testid="dx-grid">
          {cards.map((c) => <DiagnosisCard key={c.name} card={c} index={index} openCite={openCite} onOpenCite={onOpenCite} />)}
        </ul>
      )}
      {data && <p className="footer-counts" data-testid="dx-counts">{footerLine(data.counts)}</p>}
    </section>
  );
}

interface PanelProps {
  api: Pick<AssistantApi, 'diagnoses'>;
  grantId: string;
  index: Index;
  openCite: string | null;
  onOpenCite(cite: string): void;
  onGone(): void;
}

/** The view with its state. It calls nothing until the doctor presses the button. */
export function DiagnosesPanel({ api, grantId, index, openCite, onOpenCite, onGone }: PanelProps) {
  const [state, setState] = useState<DxState>({ status: 'idle' });
  const ctl = useRef<ReturnType<typeof createDiagnosesController> | null>(null);
  const gone = useRef(onGone);
  gone.current = onGone;
  useEffect(() => {
    const c = createDiagnosesController({ api, grantId, onState: setState, onGone: () => gone.current() });
    ctl.current = c;
    return () => c.dispose(); // StrictMode runs this once before the real mount; the new controller replaces it
  }, [api, grantId]);
  return <DiagnosesView state={state} index={index} openCite={openCite} onOpenCite={onOpenCite} onRun={() => ctl.current?.press()} />;
}
