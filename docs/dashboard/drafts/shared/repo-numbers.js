/* Repo number tiles (MIN-4569), the pure part: no DOM, no fetch, so node can run it (dashboard/tests/test_repo_numbers_ui.py).
   Input: the snapshot's top-level `repo` block (Cron, MIN-4568): integers only, a field that could not be read is left out of the object
   (never null, never zero). Output: always the same twelve tiles in the same order, so the grid never reshuffles.
   A missing, null, malformed or negative value is "n/a, not reported yet" and never a zero. A block that is absent, not an object,
   or holds no readable number at all gives one calm sentence instead of twelve empty tiles.
   The reason text of a failed read comes from the feed, so the page only ever puts it through esc(). */
(function(root){
'use strict';
const isNum = v => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0;
const group = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const oneLine = (s, max) => { const t = typeof s === 'string' ? s.replace(/\s+/g, ' ').trim() : ''; return t.length > max ? t.slice(0, max - 1) + '…' : t; };

/* id is the feed's key. plus/minus: the sign is part of the number (lines added and removed are directions, not counts). sub24: the 24 h figure that travels with the total. */
const TILES = [
  { id:'branchesOpen',    k:'Branches open',    s:'pushed, not merged yet' },
  { id:'branchesMerged',  k:'Branches merged',  s:'through a merged pull request' },
  { id:'prsOpen',         k:'PRs open',         s:'waiting for review or merge' },
  { id:'prsMerged',       k:'PRs merged',       s:'' },
  { id:'prsTotal',        k:'PRs in total',     s:'closed ones included' },
  { id:'commitsStaging',  k:'Commits on staging', s:'', sub24:'commitsStaging24h' },
  { id:'commitsMain',     k:'Commits on main',  s:'', sub24:'commitsMain24h' },
  { id:'linesAdded',      k:'Lines added',      s:'merged to staging since build start', sign:'+' },
  { id:'linesRemoved',    k:'Lines removed',    s:'merged to staging since build start', sign:'−' },
  { id:'filesChanged',    k:'Files changed',    s:'merged to staging since build start' },
  { id:'codeLines',       k:'Lines of code',    s:'on staging, code only' },
  { id:'codeFiles',       k:'Code files',       s:'on staging' }
];

function tile(t, repo){
  const v = repo[t.id];
  if(!isNum(v)) return { id:t.id, k:t.k, v:'n/a', s:'not reported yet', missing:true };
  const h = t.sub24 && isNum(repo[t.sub24]) ? '+' + group(repo[t.sub24]) + ' in the last 24 h' : t.s;
  return { id:t.id, k:t.k, v:(t.sign || '') + group(v), s:h, missing:false };
}

/* load: 'ok' once a snapshot has been read, 'loading' before the first one, 'error' when the first read failed. errMsg: blocks.repo.error.message, if any. */
function view(repo, load, errMsg){
  const obj = repo && typeof repo === 'object' && !Array.isArray(repo) ? repo : null;
  const tiles = obj ? TILES.map(t => tile(t, obj)) : [];
  const reported = tiles.filter(t => !t.missing).length;
  if(obj && reported) return { state:'ok', tiles, reported, total:TILES.length, empty:'' };
  const why = oneLine(errMsg, 160);
  const empty = load === 'loading' ? 'Loading the feed…' : load === 'error' ? 'The feed could not be read yet.'
    : why ? 'Repo numbers could not be read: ' + why + (/[.!?]$/.test(why) ? '' : '.') : 'Repo numbers are not reported yet.';
  return { state:'none', tiles:[], reported:0, total:TILES.length, empty };
}

root.RepoNumbers = { view, fmt:group, IDS:TILES.map(t => t.id) };
})(typeof window !== 'undefined' ? window : globalThis);
