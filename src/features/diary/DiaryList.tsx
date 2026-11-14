import { useEffect, useState } from 'react';
import type { DiaryRow } from '../../api/contract';
import { listDiaryEntries } from './diaryApi';
import { formatWhen } from './format';

/** Entries on the patient home, by date. Shows only the patient's own words and severity. */
export function DiaryList() {
  const [rows, setRows] = useState<DiaryRow[] | null>(null);
  useEffect(() => {
    let live = true;
    void listDiaryEntries().then((r) => live && setRows(r));
    return () => { live = false; };
  }, []);
  if (!rows || rows.length === 0) return null;
  return (
    <section aria-label="Diary" data-testid="diary-list" className="section-title">
      <h2>Your diary</h2>
      <ul className="group">
        {rows.map((r) => (
          <li key={r.id} data-testid="diary-row">
            <div>
              <strong>{formatWhen(r.occurred_at)}</strong>
              {r.time_edited ? ' (time edited by you)' : ''} · {r.severity}/10
              <div>{r.text}</div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
