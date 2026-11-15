/**
 * Step 1 of /doctor/simulate: the machine card (MIN-4594, live since MIN-4675). One card shows one source and never both:
 * `pending` (the live call is sent, nothing is back), `live` (the lines come from the real machine, with its real times) or
 * `replay` (the recorded run, with the sentence saying why when the live one did not happen). Pure: props in, markup out.
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

export function MachineCard({ view }: { view: MachineView }) {
  const { mode, lines, startedAt } = view;
  const idx = lines.length - 1;
  const label =
    mode === 'live' && startedAt ? COPY.liveLabel(formatRunTime(startedAt)) :
    mode === 'replay' ? (startedAt ? COPY.machineLabel(formatRunTime(startedAt)) : COPY.machineFallback) :
    null;
  return (
    <section className="sm-card" aria-labelledby="sm-h1" data-testid="sim-machine" data-mode={mode}>
      <h2 id="sm-h1"><b>1</b> {COPY.machineTitle}</h2>
      <p className="muted">{COPY.machineBody}</p>
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
            {idx < 0 && <li>{mode === 'replay' ? COPY.machineWaiting : COPY.machineStarting}</li>}
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
