import { supabase } from '../../api/client';
import { DiaryEntry, DiaryInsert } from '../../api/contract';

/** Direct insert under RLS (review 3 row 12). When MIN-4481 lands, only this file changes. */
export async function addDiaryEntry(input: Omit<DiaryInsert, 'patient_id'>): Promise<void> {
  if (!supabase) throw new Error('Not configured.');
  const { data } = await supabase.auth.getSession();
  const uid = data.session?.user.id;
  if (!uid) throw new Error('Not signed in.');
  const row = DiaryInsert.parse({ ...input, patient_id: uid });
  const { error } = await supabase.from('diary_entries').insert(row);
  if (error) throw new Error(error.message);
}

export async function listDiaryEntries(): Promise<DiaryEntry[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('diary_entries')
    .select('id, occurred_at, recorded_at, time_edited, text, severity')
    .order('occurred_at', { ascending: false });
  if (error || !data) return [];
  return data.flatMap((r) => {
    const p = DiaryEntry.safeParse(r);
    return p.success ? [p.data] : [];
  });
}
