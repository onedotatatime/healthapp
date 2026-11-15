/** The exams list (MIN-4664): every confirmed exam the grant can read, newest first. A row opens the source viewer on that exam. Words are the record's own: kind and date, the provenance marks, a count of values. */
import { CaretRight } from '@phosphor-icons/react';
import { ProvenanceMark } from '../../components/ProvenanceMark';
import type { ExamRow, Subject } from './record';

export function ExamsList({ exams, onOpenSubject }: { exams: ExamRow[]; onOpenSubject(s: Subject): void }) {
  return (
    <section className="dash-sec" aria-labelledby="exams-title" data-testid="exams">
      <h2 id="exams-title">Exams</h2>
      {exams.length === 0 ? <p className="muted" data-testid="exams-empty">No confirmed exam in this record.</p> : (
        <>
          <p className="sec-sub muted">{exams.length} confirmed {exams.length === 1 ? 'exam' : 'exams'}, newest first. A row opens its source.</p>
          <ul className="exams">
            {exams.map((e) => (
              <li key={e.key}>
                <button type="button" className="exam" onClick={() => onOpenSubject(e.subject)} data-testid="exam-row" aria-label={`Open source: ${e.title}, ${e.date}`}>
                  <span><span className="exam-title">{e.title}</span><span className="exam-date">{e.date}</span></span>
                  <span className="exam-meta">
                    {e.marks.map((m) => <ProvenanceMark key={m} kind={m} surface="doctor" />)}
                    {e.values > 0 && <span className="exam-n">{e.values} {e.values === 1 ? 'value' : 'values'}</span>}
                    {e.findings > 0 && <span className="exam-n">{e.findings} {e.findings === 1 ? 'finding' : 'findings'}</span>}
                    {e.flagged > 0 && <span className="flag-chip" data-testid="exam-flagged">{e.flagged} outside the printed range</span>}
                  </span>
                  <CaretRight className="chev" size={22} weight="bold" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
