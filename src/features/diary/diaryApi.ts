import { supabase } from '../../api/client';
import { DiaryRow, DiaryInsert, DIARY_COLUMNS } from '../../api/contract';

/** Direct insert under RLS (review 3 row 12). When MIN-4481 lands, only this file changes. */
export async function addDiaryEntry(input: DiaryInsert): Promise<void> {
  if (!supabase) throw new Error('Not configured.');
  const row = DiaryInsert.parse(input);
  const { error } = await supabase.from('diary_entries').insert(row);
  if (error) throw new Error(error.message);
}

export async function listDiaryEntries(): Promise<DiaryRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('diary_entries')
    .select(DIARY_COLUMNS)
    .order('occurred_at', { ascending: false });
  if (error || !data) return [];
  return data.flatMap((r) => {
    const p = DiaryRow.safeParse(r);
    return p.success ? [p.data] : [];
  });
}
