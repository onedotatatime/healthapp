/* Agent leaderboard (MIN-4584), the pure part: no DOM, no fetch, so node can run it (dashboard/tests/test_leaderboard_ui.py).
   Input: the snapshot's `tokens.perAgent` (Cron, MIN-4583): rows { n, v, mins, runs }. v = weighted tokens, mins = minutes worked (one decimal), runs = integer.
   The 13 configured agents are always rows (zeros included); the feed may add built-in agents (general-purpose, web-fetch, Explore). Older feeds and the public
   Pages stub send rows without mins and runs, or no rows at all: both are valid and show "n/a", never a zero and never an error.
   Order (Back, MIN-4582): tokens, biggest first; time worked is the tie-break; a tie on both keeps the feed order. Every agent is its own row, no cap.
   Built-in agents are shown (their tokens are real build work) and marked "built-in" when the page knows the team list (`known`, the feed's agents). */
(function(root){
'use strict';
const isNum = v => typeof v === 'number' && Number.isFinite(v) && v >= 0;
const group = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/* Minutes as hours and minutes: 171 -> "2h 51m", 48.6 -> "49m", 0 -> "0m", 0.3 -> "<1m". Tokens are never abbreviated, so "m" only ever means minutes on this card. */
function clock(mins){
  if(!isNum(mins)) return 'n/a';
  if(mins > 0 && mins < 0.5) return '<1m';
  const t = Math.round(mins), h = Math.floor(t / 60), m = t % 60;
  return h ? h + 'h ' + (m < 10 ? '0' : '') + m + 'm' : m + 'm';
}

/* perAgent: the feed value (anything). known: names of the team (array of strings, optional). load: 'ok' | 'loading' | 'error'. */
function view(perAgent, known, load){
  const list = Array.isArray(perAgent) ? perAgent : [];
  const team = new Set(Array.isArray(known) ? known.filter(k => typeof k === 'string') : []);
  const seen = new Set(), rows = [];
  list.forEach(r => {
    if(!r || typeof r !== 'object' || typeof r.n !== 'string' || !r.n.trim() || seen.has(r.n)) return;
    seen.add(r.n);
    const tok = isNum(r.v) ? r.v : null, mins = isNum(r.mins) ? r.mins : null, runs = Number.isSafeInteger(r.runs) && r.runs >= 0 ? r.runs : null;
    rows.push({ n: r.n, tok, mins, runs, builtin: team.size > 0 && !team.has(r.n), i: rows.length });
  });
  rows.sort((a, b) => (b.tok === null ? -1 : b.tok) - (a.tok === null ? -1 : a.tok) || (b.mins === null ? -1 : b.mins) - (a.mins === null ? -1 : a.mins) || a.i - b.i);
  const out = rows.map((r, k) => ({
    rank: k + 1, n: r.n, builtin: r.builtin,
    tokens: r.tok === null ? 'n/a' : group(r.tok), time: clock(r.mins),
    runs: r.runs === null ? '' : r.runs + (r.runs === 1 ? ' run' : ' runs'),
    tokMissing: r.tok === null, timeMissing: r.mins === null, idle: r.tok === 0 && (r.mins === 0 || r.mins === null)
  }));
  if(out.length) return { state: 'ok', rows: out, empty: '' };
  const empty = load === 'loading' ? 'Loading the feed…' : load === 'error' ? 'The feed could not be read yet.' : 'Agent numbers are not reported yet.';
  return { state: 'none', rows: [], empty };
}

root.Leaderboard = { view, clock, fmt: group };
})(typeof window !== 'undefined' ? window : globalThis);
