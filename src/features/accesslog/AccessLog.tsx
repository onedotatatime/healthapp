import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { callFunction, supabase } from '../../api/client';
import { GrantStatusResponse } from '../handshake/contract';
import { EmptyState, ErrorNote, Spinner } from '../../components/Primitives';
import { PatientScreen } from '../../components/Shell';
import { whoLine } from '../handshake/messages';
import { describe, GRANT_LOG_COLUMNS, GrantLogRow } from './logic';

interface Entry {
  row: GrantLogRow;
  who: string;
}

/** Patient: who had access to my record, and when. Her own `grants` rows under RLS; the doctor's name comes from the existing
 *  `grant-status` call (a patient cannot read a doctor's profile row). A row whose name cannot be fetched still shows. */
async function load(): Promise<Entry[]> {
  if (!supabase || !callFunction) throw new Error('Not configured.');
  const { data, error } = await supabase.from('grants').select(GRANT_LOG_COLUMNS).order('requested_at', { ascending: false });
  if (error) throw new Error(error.message);
  const rows = (data ?? []).flatMap((r) => {
    const p = GrantLogRow.safeParse(r);
    return p.success ? [p.data] : [];
  });
  const { data: s } = await supabase.auth.getSession();
  const accessToken = s.session?.access_token;
  return Promise.all(
    rows.map(async (row): Promise<Entry> => {
      try {
        const res = await callFunction!('grant-status', { grant_id: row.id }, GrantStatusResponse, { accessToken });
        return { row, who: res.grant ? whoLine(res.grant.doctor) : 'A doctor' };
      } catch {
        return { row, who: 'A doctor' };
      }
    }),
  );
}

export function AccessLog() {
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    load().then((e) => live && setEntries(e), () => live && setFailed(true));
    return () => {
      live = false;
    };
  }, []);
  const now = Date.now();
  return (
    <PatientScreen data-testid="access-log">
      <h1>Who had access</h1>
      <p className="muted">Every doctor who asked to see your record, newest first.</p>
      {failed && <ErrorNote>The list could not be loaded. Check the connection and try again.</ErrorNote>}
      {!entries && !failed && <Spinner label="Loading" />}
      {entries && entries.length === 0 && <EmptyState>No doctor has asked to see your record yet.</EmptyState>}
      {entries && entries.length > 0 && (
        <ul className="group">
          {entries.map(({ row, who }) => (
            <li key={row.id} data-testid="access-row">
              <div>
                <strong>{who}</strong>
                <div>{describe(row, now)}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p style={{ marginTop: 'var(--space-5)' }}>
        <Link className="btn" to="/patient">Back to your record</Link>
      </p>
    </PatientScreen>
  );
}
