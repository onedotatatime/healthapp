/**
 * The source viewer: a right side sheet (not modal, so the overview stays usable). The record's values next to the
 * original photo, with the marks. The photo is a 60 s signed URL fetched when the sheet opens; closing the sheet (or
 * the grant ending, which unmounts the workspace) removes it. Escape closes; focus goes in on open and back to the opener.
 */
import { useEffect, useId, useRef, useState } from 'react';
import { X } from '@phosphor-icons/react';
import { ProvenanceMark, type MarkKind } from '../../components/ProvenanceMark';
import { Spinner } from '../../components/Primitives';
import { isGrantGone, type AssistantApi } from './api';
import type { DocPhotoResponse } from './contract';
import { AboutFileView, type FileState } from './FileFacts';
import { FLAG_WORD, KIND_LABEL, formatDate, formatTime, rangeText, valueText, type RecordData, type RecordIndex, type Subject } from './record';

type Photo = { status: 'loading' } | { status: 'ok'; photo: DocPhotoResponse } | { status: 'error' };

interface Props {
  subject: Subject;
  record: RecordData;
  index: RecordIndex;
  api: AssistantApi;
  grantId: string;
  onClose(): void;
  onGone(): void;
}

export function SourceViewer({ subject, record, index, api, grantId, onClose, onGone }: Props) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => closeRef.current?.focus(), [subject]);

  const doc = subject.kind === 'doc' ? index.docs.get(subject.docId) : undefined;
  const entry = subject.kind === 'diary' ? record.diary.find((d) => d.id === subject.id) : undefined;
  if (!doc && !entry) return null;

  return (
    <aside className="as-sheet" role="dialog" aria-modal="false" aria-labelledby={titleId} data-testid="source-viewer" onKeyDown={(e) => e.key === 'Escape' && onClose()}>
      <div className="as-sheet-head">
        <h2 id={titleId}>{doc ? `${KIND_LABEL[doc.kind]}, ${formatDate(doc.exam_date ?? doc.created_at)}` : `Diary entry, ${formatDate(entry!.occurred_at)}`}</h2>
        <button type="button" ref={closeRef} className="as-close" onClick={onClose} aria-label="Close source" data-testid="source-close">
          <X size={20} weight="bold" aria-hidden="true" />
        </button>
      </div>
      {doc && <DocBody doc={doc} focus={subject.kind === 'doc' ? subject.focus : undefined} record={record} api={api} grantId={grantId} onGone={onGone} />}
      {entry && (
        <div className="as-sheet-body">
          <span className="as-marks"><ProvenanceMark kind="uploaded" surface="doctor" /></span>
          <p className="as-meta">Written by the patient. Time of the event: {formatDate(entry.occurred_at)}, {formatTime(entry.occurred_at)}{entry.time_edited ? ' (time edited by the patient)' : ''}.</p>
          <blockquote className="as-quote">{entry.text}</blockquote>
          <p className="mono">Severity {entry.severity} of 10</p>
          <p className="muted">A diary entry has no original photo.</p>
        </div>
      )}
    </aside>
  );
}

function DocBody({ doc, focus, record, api, grantId, onGone }: { doc: NonNullable<ReturnType<RecordIndex['docs']['get']>>; focus?: string; record: RecordData; api: AssistantApi; grantId: string; onGone(): void }) {
  const [photo, setPhoto] = useState<Photo>({ status: 'loading' });
  useEffect(() => {
    let alive = true;
    setPhoto({ status: 'loading' });
    api.photo(doc.id, grantId).then(
      (p) => alive && setPhoto({ status: 'ok', photo: p }),
      (e) => {
        if (!alive) return;
        setPhoto({ status: 'error' });
        if (isGrantGone(e)) onGone();
      },
    );
    return () => {
      alive = false; // the signed URL is dropped with this component
    };
  }, [api, doc.id, grantId, onGone]);

  const [file, setFile] = useState<FileState>({ status: 'loading' });
  const [fileTry, setFileTry] = useState(0);
  useEffect(() => {
    let alive = true;
    setFile({ status: 'loading' });
    api.fileAnalysis(doc.id).then(
      (row) => alive && setFile({ status: 'ready', row }),
      (e) => {
        if (!alive) return;
        setFile({ status: 'error' });
        if (isGrantGone(e)) onGone();
      },
    );
    return () => {
      alive = false;
    };
  }, [api, doc.id, fileTry, onGone]);

  const results = record.results.filter((r) => r.document_id === doc.id);
  const findings = record.findings.filter((f) => f.document_id === doc.id);
  const marks: MarkKind[] = [doc.provenance === 'verified_by_source' ? 'verified' : 'uploaded', ...(doc.identity_status === 'name_only' ? (['name-match'] as MarkKind[]) : [])];
  const edited = results.some((r) => r.edited_by_patient) || findings.some((f) => f.edited_by_patient);
  return (
    <div className="as-sheet-body">
      <span className="as-marks">
        {marks.map((m) => <ProvenanceMark key={m} kind={m} surface="doctor" />)}
        {edited && <ProvenanceMark kind="edited" surface="doctor" />}
      </span>
      {doc.issuer && <p className="as-meta">{doc.issuer}</p>}
      <div className="as-sheet-cols">
        <div>
          <h3>Values</h3>
          {results.length === 0 && <p className="muted">No values were extracted from this document.</p>}
          {results.length > 0 && (
            <table className="as-table" data-testid="source-values">
              <thead><tr><th scope="col">Test</th><th scope="col">Value</th><th scope="col">Printed range</th></tr></thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.id} data-focus={focus === `r:${r.id}` ? 'true' : undefined} aria-current={focus === `r:${r.id}` ? 'true' : undefined}>
                    <th scope="row">{r.analyte}</th>
                    <td className="mono">{valueText(r)}<span className="as-flag">{FLAG_WORD[r.flag]}</span></td>
                    <td className="mono">{rangeText(r) ?? 'none'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {findings.length > 0 && <h3>From the document</h3>}
          {findings.map((f) => (
            <blockquote key={f.id} className="as-quote" data-focus={focus === `f:${f.id}` ? 'true' : undefined} aria-current={focus === `f:${f.id}` ? 'true' : undefined}>{f.text_original}</blockquote>
          ))}
        </div>
        <div>
          <h3>Original photo</h3>
          {photo.status === 'loading' && <Spinner label="Opening the original" />}
          {photo.status === 'error' && <p className="muted" data-testid="photo-error">The original photo could not be opened.</p>}
          {photo.status === 'ok' && (
            <>
              <img className="as-photo" src={photo.photo.signed_url} alt={`Original ${KIND_LABEL[doc.kind].toLowerCase()} of ${formatDate(doc.exam_date ?? doc.created_at)}`} data-testid="source-photo" />
              {photo.photo.fingerprint === 'mismatch' && <p className="note caution">The photo does not match the stored fingerprint.</p>}
            </>
          )}
        </div>
      </div>
      <AboutFileView state={file} mark={marks[0]} onRetry={() => setFileTry((n) => n + 1)} />
    </div>
  );
}
