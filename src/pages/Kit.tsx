import { AccessTimer } from '../components/AccessTimer';
import { CitationChip } from '../components/CitationChip';
import { ErrorNote, Spinner } from '../components/Primitives';
import { ProvenanceMark } from '../components/ProvenanceMark';

const T0 = Date.parse('2026-11-14T12:00:00Z');
const iso = (s: number) => new Date(T0 + s * 1000).toISOString();

/** One set of the glass primitives: card glass, tiles, a list, buttons and one chrome bar. The solid form is the same markup under
 *  `.solid`, which sets the glass tokens to what `prefers-reduced-transparency` and the no-backdrop-filter fallback use. */
function Surfaces({ title }: { title: string }) {
  return (
    <div className="kit-set">
      <h3>{title}</h3>
      <div className="card"><p>Card</p></div>
      <div className="tiles">
        <div className="tile primary">Tile</div>
        <div className="tile">Tile</div>
      </div>
      <div className="group"><div>Row</div><div>Row</div></div>
      <div className="row">
        <button type="button" className="btn primary">Primary</button>
        <button type="button" className="btn">Ghost</button>
      </div>
      <div className="kit-bar"><button type="button" className="btn primary">Bar</button></div>
    </div>
  );
}

/** Review page for the shared parts (not linked from anywhere). The clock is frozen so every state shows. */
export function Kit() {
  return (
    <main className="page doctor kit">
      <h1>Shared parts</h1>
      <h2>Provenance marks</h2>
      <div className="row">
        <ProvenanceMark kind="verified" />
        <ProvenanceMark kind="uploaded" />
        <ProvenanceMark kind="edited" />
        <ProvenanceMark kind="name-match" />
        <ProvenanceMark kind="unchecked" />
      </div>
      <div className="row">
        <ProvenanceMark kind="verified" surface="doctor" />
        <ProvenanceMark kind="uploaded" surface="doctor" />
        <ProvenanceMark kind="edited" surface="doctor" />
        <ProvenanceMark kind="name-match" surface="doctor" />
        <ProvenanceMark kind="unchecked" surface="doctor" />
      </div>
      <h2>Citation chip</h2>
      <p>
        Ferritin is below range.
        <CitationChip n={1} record={{ name: 'Blood test', date: '30 Oct 2026', provenance: 'uploaded' }} />
        <CitationChip n={2} record={{ name: 'Lab report', date: '2 Nov 2026', provenance: 'verified' }} open />
      </p>
      <h2>Access timer</h2>
      <AccessTimer surface="doctor" expiresAt={iso(14 * 60 + 32)} totalSeconds={900} nowMs={T0} />
      <br />
      <AccessTimer surface="patient" label="Dr. Eleni Raptis · Rheumatology" expiresAt={iso(14 * 60 + 32)} totalSeconds={900} nowMs={T0} onEndAccess={() => {}} />
      <br />
      <AccessTimer surface="doctor" expiresAt={iso(95)} totalSeconds={900} nowMs={T0} />
      <br />
      <AccessTimer surface="patient" label="Dr. Eleni Raptis · Rheumatology" expiresAt={iso(95)} totalSeconds={900} nowMs={T0} onEndAccess={() => {}} />
      <br />
      <AccessTimer surface="doctor" expiresAt={iso(-1)} totalSeconds={900} nowMs={T0} />
      <h2>Primitives</h2>
      <p><Spinner label="Reading the record" /></p>
      <ErrorNote>This is how a doctor-side error reads.</ErrorNote>
      <h2>Glass and solid</h2>
      <div className="kit-pair">
        <Surfaces title="Glass" />
        <div className="solid"><Surfaces title="Solid" /></div>
      </div>
    </main>
  );
}
