/* The five project directions (the founder's project goal, 2026-11-14), the pure part: no DOM, no fetch, so node can run it (dashboard/tests/test_directions.py).
   Input: the snapshot's `directions`, an array of {n, title, status, note, updatedAt}, hand-set on the Mac. Output: always five rows, in order 1 to 5.
   The page owns the five titles: a row the feed does not report, or reports with a status the page does not know, is "not reported yet", never a guess.
   A feed that has no `directions` field (an older feed, the public stub), an empty array, or something that is not an array all give five calm "not reported yet" rows. */
(function(){
'use strict';
const TITLES = { 1:'Scan → AI reads', 2:'Store extracted data', 3:'Store + analyse original files (staging and main)', 4:'Real analysis + projection', 5:'Real matching' };
/* glyph and word with the colour, so the status is never colour alone (same marks as the verdict chip) */
const STATUS = {
  on_track:    { cls:'ok',   g:'●', w:'On track' },
  at_risk:     { cls:'warn', g:'▲', w:'At risk' },
  off_track:   { cls:'bad',  g:'■', w:'Off track' },
  not_started: { cls:'none', g:'○', w:'Not started' }
};
const NOTE_MAX = 200;
const key = s => typeof s === 'string' ? s.trim().toLowerCase().replace(/[\s-]+/g, '_') : '';
const oneLine = s => { const t = typeof s === 'string' ? s.replace(/\s+/g, ' ').trim() : ''; return t.length > NOTE_MAX ? t.slice(0, NOTE_MAX - 1) + '…' : t; };
/* "updated 12 min ago"; a time in the future (a clock a little ahead of the Mac's) reads "just now"; a time that does not parse reads nothing */
function updated(nowMs, iso){
  const t = typeof iso === 'string' ? Date.parse(iso) : NaN;
  if(!isFinite(t) || !isFinite(nowMs)) return '';
  const m = Math.floor(Math.max(0, nowMs - t) / 6e4);
  return 'updated ' + (m < 1 ? 'just now' : m < 60 ? m + ' min ago' : m < 1440 ? Math.floor(m / 60) + ' h ago' : Math.floor(m / 1440) + ' d ago');
}
/* load: 'ok' once a snapshot has been read, 'loading' before the first one, 'error' when the first read failed */
function view(list, nowMs, load){
  const by = {};
  (Array.isArray(list) ? list : []).forEach(d => {
    if(!d || typeof d !== 'object') return;
    const n = Number(d.n);
    if(Number.isInteger(n) && n >= 1 && n <= 5 && !by[n]) by[n] = d;                    // the first entry of a number wins; numbers outside 1 to 5 are ignored
  });
  const quiet = load === 'loading' ? 'Loading the feed…' : load === 'error' ? 'The feed could not be read yet.' : 'not reported yet';
  const rows = [1, 2, 3, 4, 5].map(n => {
    const d = by[n], s = d ? STATUS[key(d.status)] : null;
    if(!s) return { n, title:TITLES[n], reported:false, cls:'', g:'', word:'', note:quiet, updated:'' };
    return { n, title:TITLES[n], reported:true, cls:s.cls, g:s.g, word:s.w, note:oneLine(d.note), updated:updated(nowMs, d.updatedAt) };
  });
  const k = rows.filter(r => r.reported).length;
  return { rows, reported:k, count: load === 'ok' ? k + ' of 5 reported' : '' };
}
window.Directions = { TITLES, STATUS, NOTE_MAX, view, updated };
})();
