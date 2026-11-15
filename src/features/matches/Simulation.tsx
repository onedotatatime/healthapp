/**
 * /simulation (MIN-4774): the permanent label and ONE loss card with a Greece / Europe (EU-27) / Global switch and a share slider (SimReach.tsx).
 * Nothing on the page moves unless the viewer moves the slider or the switch. The data is the `reach` block of data/synthetic/simulation.json (Cron, MIN-4773).
 * If that block cannot be read, the label stays and one sentence says so: no card, no placeholder.
 */
import { Flask } from '@phosphor-icons/react';
import simulationJson from '../../../data/synthetic/simulation.json';
import { COPY } from './copy';
import { parseReach, type Reach } from './reach';
import { SimReach } from './SimReach';
import './matches.css';

const PARSED = parseReach(simulationJson);

const Label = () => (
  <p className="sim-label" role="note" data-testid="sim-label">
    <Flask size={20} weight="bold" aria-hidden="true" />
    {COPY.simLabel}
  </p>
);

/** `initialGeo` and `initialShare` freeze the card for tests and review; the screen itself never passes them. */
export function SimulationView({ model, initialGeo, initialShare }: { model: Reach; initialGeo?: string; initialShare?: number }) {
  return (
    <main className="sim" data-testid="simulation">
      <Label />
      <div className="sim-inner">
        <SimReach model={model} initialGeo={initialGeo} initialShare={initialShare} />
      </div>
    </main>
  );
}

/** The data could not be read: the label stays, one sentence, no card. */
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
