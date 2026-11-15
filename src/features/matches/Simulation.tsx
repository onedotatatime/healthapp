/**
 * /simulation (MIN-4749): the permanent label and one diagram with a plan-month slider over ten years for Greece (SimDiagram.tsx).
 * Nothing on the page moves unless the viewer drags the slider. The data is `ten_years` in data/synthetic/simulation.json (Cron, MIN-4748).
 * If that block cannot be read, the label stays and one sentence says so: no diagram, no placeholder.
 */
import { Flask } from '@phosphor-icons/react';
import simulationJson from '../../../data/synthetic/simulation.json';
import { COPY } from './copy';
import { SimDiagram } from './SimDiagram';
import { parseSimulation, type TenYears } from './tenYears';
import './matches.css';

const PARSED = parseSimulation(simulationJson);

const Label = () => (
  <p className="sim-label" role="note" data-testid="sim-label">
    <Flask size={20} weight="bold" aria-hidden="true" />
    {COPY.simLabel}
  </p>
);

/** `initialMonth` freezes the slider for tests and review; the screen itself never passes it. */
export function SimulationView({ model, initialMonth }: { model: TenYears; initialMonth?: number }) {
  return (
    <main className="sim" data-testid="simulation">
      <Label />
      <div className="sim-inner">
        <SimDiagram model={model} initialMonth={initialMonth} />
      </div>
    </main>
  );
}

/** The data could not be read: the label stays, one card with the sentence, no diagram. */
export function SimulationUnavailable() {
  return (
    <main className="sim" data-testid="simulation">
      <Label />
      <div className="sim-inner">
        <p className="sim-error" role="alert">{COPY.simUnavailable}</p>
      </div>
    </main>
  );
}

export default function Simulation() {
  if (!PARSED.ok) return <SimulationUnavailable />;
  return <SimulationView model={PARSED.data} />;
}
