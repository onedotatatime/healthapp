/**
 * MIN-4550, direction 3: "About this file", in the doctor's source viewer under the document. One row of `file_analysis`
 * read under RLS (doctor with an active grant on the document's patient). Doctor view only: this module is part of the
 * lazy assistant chunk, so no patient screen can render it. It states what is on the file; it says nothing about health.
 * Four states: analysed, not analysed yet (no row), analysis failed, and loading (plus a read error with a retry).
 */
import { Check, Minus } from '@phosphor-icons/react';
import { ProvenanceMark, type MarkKind } from '../../components/ProvenanceMark';
import { Spinner } from '../../components/Primitives';
import type { FileAnalysisRow } from './analysis.contract';
import { FILE_DOC_TYPE_LABEL, formatBytes, hashCheckWord, itemsLine, presenceWord, qualityWords, shortHash, uploadedLine } from './analysis';

export type FileState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; row: FileAnalysisRow | null };

const Presence = ({ label, value }: { label: string; value: boolean | null }) => (
  <li className="as-presence" data-present={value === null ? 'unknown' : String(value)}>
    {value === false ? <Minus size={16} weight="bold" aria-hidden="true" /> : <Check size={16} weight="bold" aria-hidden="true" />}
    <span>{label}: {presenceWord(value)}</span>
  </li>
);

/** Presentational and pure, so every state can be rendered in a test. */
export function AboutFileView({ state, mark, unchecked = false, onRetry }: { state: FileState; mark: MarkKind; unchecked?: boolean; onRetry?: () => void }) {
  const row = state.status === 'ready' ? state.row : null;
  const tag = state.status === 'ready' ? (row ? row.status : 'none') : state.status;
  return (
    <section className="as-file" aria-labelledby="as-file-title" data-testid="about-file" data-state={tag}>
      <h3 id="as-file-title">About this file</h3>
      {state.status === 'loading' && <p><Spinner label="Reading the file analysis" /></p>}
      {state.status === 'error' && (
        <div data-testid="about-file-error">
          <p className="muted">The file analysis could not be read.</p>
          {onRetry && <button type="button" className="btn as-btn" onClick={onRetry} data-testid="about-file-retry">Try again</button>}
        </div>
      )}
      {state.status === 'ready' && !row && <p className="muted" data-testid="about-file-none">This file has not been analysed yet.</p>}
      {row?.status === 'failed' && (
        <p className="as-bad" data-testid="about-file-failed">
          The analysis of this file failed{row.error_code ? ` (code: ${row.error_code})` : ''}. The values above are unchanged.
        </p>
      )}
      {row?.status === 'done' && <Done row={row} mark={mark} unchecked={unchecked} />}
    </section>
  );
}

function Done({ row, mark, unchecked }: { row: FileAnalysisRow; mark: MarkKind; unchecked: boolean }) {
  const quality = qualityWords(row);
  const hash = shortHash(row.sha256);
  const size = formatBytes(row.bytes);
  return (
    <>
      <dl className="as-facts">
        <dt>Type</dt>
        <dd data-testid="file-type">{row.doc_type ? FILE_DOC_TYPE_LABEL[row.doc_type] : 'Not determined'}{row.pages !== null ? `, ${row.pages} ${row.pages === 1 ? 'page' : 'pages'}` : ''}</dd>
        <dt>Readable</dt>
        <dd data-testid="file-readable">{row.readable === null ? 'Not determined' : row.readable ? 'Readable' : 'Not readable'}</dd>
        <dt>Quality</dt>
        <dd data-testid="file-quality">{quality.length ? quality.map((w, i) => (i ? w.toLowerCase() : w)).join(', ') : 'No quality problem noted'}</dd>
        <dt>Provenance</dt>
        <dd>
          <span className="as-marks"><ProvenanceMark kind={mark} surface="doctor" />{unchecked && <ProvenanceMark kind="unchecked" surface="doctor" />}</span>
          <span className="as-meta" data-testid="file-uploaded">Uploaded {uploadedLine(row.uploaded_at)}{size ? `, ${size}` : ''}{row.mime ? `, ${row.mime}` : ''}.</span>
          <span className="as-meta" data-testid="file-hash">{hash ? <>File fingerprint (SHA-256, first 8): <span className="mono">{hash}</span>. </> : 'No fingerprint recorded. '}{hashCheckWord(row.hash_verified)}</span>
        </dd>
        <dt>On the page</dt>
        <dd>
          <ul className="as-presence-list" data-testid="file-presence">
            <Presence label="Issuer" value={row.issuer_present} />
            <Presence label="Date" value={row.date_present} />
            <Presence label="Stamp or signature" value={row.stamp_or_signature_present} />
          </ul>
        </dd>
      </dl>
      {row.items_count === 0 && row.items.length === 0 ? (
        <p className="muted" data-testid="file-items">{itemsLine(0)}</p>
      ) : (
        <details className="as-items" data-testid="file-items">
          <summary>{itemsLine(row.items_count)}</summary>
          {row.items.map((it, i) => (
            <blockquote key={i} className="as-quote">
              {it.text_original}
              {it.page !== null && <span className="as-meta"> Page {it.page}.</span>}
            </blockquote>
          ))}
          {row.items_count > row.items.length && <p className="muted">Showing {row.items.length} of {row.items_count}.</p>}
        </details>
      )}
    </>
  );
}
