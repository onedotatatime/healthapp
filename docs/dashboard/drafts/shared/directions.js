/* The five project directions (the founder's project goal, 2026-11-14), the pure part: no DOM, no fetch, so node can run it (dashboard/tests/test_directions.py).
   Input: the snapshot's `directions`, an array of {n, title, status, note, updatedAt}, hand-set on the Mac. Output: always five rows, in order 1 to 5.
   The page owns no title text (CTO must-fix F2, MIN-4499): a title is shown only when the key-gated feed sends it. A row the feed does not report, or reports with a status the page does not know,
   or with no title, is the neutral "Direction N" and "not reported yet", never a guess.
   A feed that has no `directions` field (an older feed, the public stub), an empty array, or something that is not an array all give five calm "not reported yet" rows. */
(function(){
'use strict';
const TITLE_MAX = 80;
/* glyph and word with the colour, so the status is never colour alone (same marks as the verdict chip) */
const STATUS = {
  on_track:    { cls:'ok',   g:'●', w:'On track' },
  at_risk:     { cls:'warn', g:'▲', w:'At risk' },
  off_track:   { cls:'bad',  g:'■', w:'Off track' },
  not_started: { cls:'none', g:'○', w:'Not started' }
};
const NOTE_MAX = 200;
const neutral = n => 'Direction ' + n;
const key = s => typeof s === 'string' ? s.trim().toLowerCase().replace(/[\s-]+/g, '_') : '';
const oneLine = (s, max) => { const t = typeof s === 'string' ? s.replace(/\s+/g, ' ').trim() : ''; return t.length > max ? t.slice(0, max - 1) + '…' : t; };
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
    if(!s) return { n, title:neutral(n), titled:false, reported:false, cls:'', g:'', word:'', note:quiet, updated:'' };
    return { n, title:oneLine(d.title, TITLE_MAX) || neutral(n), titled:!!oneLine(d.title, TITLE_MAX), reported:true, cls:s.cls, g:s.g, word:s.w, note:oneLine(d.note, NOTE_MAX), updated:updated(nowMs, d.updatedAt) };
  });
  const k = rows.filter(r => r.reported).length;
  return { rows, reported:k, count: load === 'ok' ? k + ' of 5 reported' : '' };
}
window.Directions = { STATUS, NOTE_MAX, TITLE_MAX, view, updated };
})();
