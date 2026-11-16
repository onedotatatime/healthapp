/**
 * Step 1 of /doctor/simulate: the machine card (MIN-4594; the recorded 50,000 run since MIN-4736). One card shows one source and never
 * both: `pending` (a call is sent, nothing is back), `live` (the lines come from a real machine, with its real times) or `replay` (the
 * recorded run, with the sentence saying why when a live one did not happen). The page plays only `replay` now; the other two stay for
 * the live cut. Pure: props in, markup out.
 */
import { COPY } from './copy';
import { formatRunTime } from './format';
import { PHASE_IDS, type PhaseId } from './matcher';

export interface MachineLine { id: PhaseId; offsetMs: number; log: string }

export interface MachineView {
  mode: 'pending' | 'live' | 'replay';
  /** The reason sentence above the recorded label. Only in `replay`, and only when the live run did not happen. */
  notice: string | null;
  /** `live`: the machine's own start time. `replay`: the recorded run's. */
  startedAt: string | null;
  /** False only for a recorded run with no machine block: then the card is the label alone. */
  states: boolean;
  /** The states reached so far, in order. */
  lines: MachineLine[];
  footer: string | null;
}

/** `total` is the number of records, formatted by the page from the file it loaded; no number is typed here. */
export function MachineCard({ view, total }: { view: MachineView; total: string }) {
  const { mode, lines, startedAt } = view;
  const idx = lines.length - 1;
  const label =
    mode === 'live' && startedAt ? COPY.liveLabel(formatRunTime(startedAt)) :
    mode === 'replay' ? (startedAt ? COPY.machineLabel(formatRunTime(startedAt)) : COPY.machineFallback) :
    null;
  return (
    <section className="sm-card" aria-labelledby="sm-h1" data-testid="sim-machine" data-mode={mode}>
      <h2 id="sm-h1"><b>1</b> {COPY.machineTitle}</h2>
      <p className="muted">{COPY.machineBody(total)}</p>
      {view.notice && <p className="sm-notice" role="status" data-testid="sim-machine-notice">{view.notice}</p>}
      {label && <p className="sm-fixed" data-testid="sim-machine-label">{label}</p>}
      {view.states && (
        <>
          <ol className="sm-states" aria-label="Machine states">
            {PHASE_IDS.map((id, n) => (
              <li key={id} className={n < idx ? 'past' : n === idx ? 'now' : ''} aria-current={n === idx ? 'step' : undefined}>
                <span className="sm-box" data-s={id} />
                <strong>{COPY.machineStates[id]}</strong>
              </li>
            ))}
          </ol>
          <ul className="sm-log mono" aria-live="polite">
            {idx < 0 && mode === 'replay' && <li>{COPY.machineWaiting}</li>}
            {lines.map((l) => (
              <li key={l.id} data-testid={`sim-machine-line-${l.id}`}><span>+{(l.offsetMs / 1000).toFixed(1)} s</span> {l.log}</li>
            ))}
          </ul>
          {view.footer && <p className="muted sm-small">{view.footer}</p>}
        </>
      )}
    </section>
  );
}
