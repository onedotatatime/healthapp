/* Dashboard replay. Loaded last, after ../direction-A/a.js, which stays byte-identical.
   Part 1 is the pure model (no DOM, no fetch, so node can run it: dashboard/tests/test_replay.py).
   Part 2 is the page: it moves the page clock (H.offset), writes the series values into the same places Live.apply writes, and emits 'live',
   so Direction A's own paint runs unchanged. At the end it applies a fresh snapshot, so the last screen is the live dashboard.
   No number is shown at a time t without a series behind it; everything else stays live and is marked "now" (replay.css). */
(function(){
'use strict';

/* ---------------------------------------------------------------- part 1: the model */
const DURATION_MS = 60000;
const toMs = s => { if(typeof s !== 'string' || !s) return NaN; if(/(Z|[+-]\d\d:\d\d)$/.test(s)) return Date.parse(s); return Date.parse((s.length === 16 ? s + ':00' : s) + '+02:00'); };   // no zone = Athens, winter time, like live.js
const isSeries = a => Array.isArray(a) && a.length > 0 && a.every(v => typeof v === 'number' && isFinite(v));
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/* the replay runs from the build start to now, or to the deadline once it has passed */
const spanEnd = (nowMs, deadlineMs) => isFinite(deadlineMs) ? Math.min(nowMs, deadlineMs) : nowMs;

/* where the playhead is after elapsedMs of real time. Reduced motion: the same 60 s, but time only moves once a second. */
function playhead(startMs, endMs, elapsedMs, reduced){
  const e = reduced ? Math.floor(elapsedMs / 1000) * 1000 : elapsedMs;
  const p = clamp(e / DURATION_MS, 0, 1);
  return { p, t: p >= 1 ? endMs : startMs + p * (endMs - startMs), done: p >= 1 };
}

/* A series is cumulative: element i is the value at from + (i + 1) * step, and the last element is the value at `until` (the partial last step).
   buckets(): how many elements are in the past at time t. */
function buckets(len, fromMs, stepMs, untilMs, tMs){
  if(!(len > 0) || !isFinite(fromMs) || !(stepMs > 0) || !isFinite(tMs)) return 0;
  if(isFinite(untilMs) && tMs >= untilMs) return len;
  return clamp(Math.floor((tMs - fromMs) / stepMs), 0, len);
}
const valueAt = (series, fromMs, stepMs, untilMs, tMs) => { const k = buckets(series.length, fromMs, stepMs, untilMs, tMs); return k <= 0 ? 0 : series[k - 1]; };
const sliceAt = (series, fromMs, stepMs, untilMs, tMs) => series.slice(0, buckets(series.length, fromMs, stepMs, untilMs, tMs));

/* doneSeries: {seriesFrom, stepMin, total, byMilestone:{M1:[..]}, byDirection:{"1":[..]}}, same buckets as tokens.series. Anything that does not fit is "no done history". */
function doneOf(snap){
  const d = snap && snap.doneSeries;
  if(!d || typeof d !== 'object' || !isSeries(d.total)) return null;
  const from = toMs(d.seriesFrom), step = +d.stepMin * 60000;
  if(!isFinite(from) || !(step > 0)) return null;
  const pick = o => { const r = {}; if(o && typeof o === 'object') Object.keys(o).forEach(k => { if(isSeries(o[k])) r[k] = o[k]; }); return r; };
  return { from, step, total: d.total, byMilestone: pick(d.byMilestone), byDirection: pick(d.byDirection) };
}

/* can the replay play? reason: nokey (no viewer link), unreadable (the read failed), noseries (the feed has no token history), null */
function canPlay(o){
  o = o || {};
  if(!o.hasKey) return { ok: false, reason: 'nokey' };
  if(o.error || !o.snap) return { ok: false, reason: 'unreadable' };
  const tk = o.snap.tokens;
  if(!tk || !isSeries(tk.series) || !isFinite(toMs(tk.seriesFrom))) return { ok: false, reason: 'noseries' };
  return { ok: true, reason: null };
}
const LABEL = { nokey: 'Open this page with your viewer link', unreadable: 'Open this page with your viewer link', noseries: 'Nothing to replay yet' };
const WHY = {
  nokey: 'The history sits behind the viewer link.',
  unreadable: 'The feed could not be read just now. Open the link again in a moment.',
  noseries: 'The feed has no token history yet, so there is nothing to replay.'
};

/* every value that has a history, at time t. `hasDone` is false when the feed sends no doneSeries: then no done count is returned at all. */
function frame(snap, tMs){
  const tk = snap.tokens, from = toMs(tk.seriesFrom), step = (+tk.seriesStepMin || 15) * 60000, w = tk.window || {}, until = toMs(w.until);
  const es = snap.money && isSeries(snap.money.estimateSeries) ? snap.money.estimateSeries : [];
  const out = {
    tokens: valueAt(tk.series, from, step, until, tMs),
    tokSeries: sliceAt(tk.series, from, step, until, tMs),
    eur: es.length ? valueAt(es, from, step, until, tMs) : null,
    eurSeries: es.length ? sliceAt(es, from, step, until, tMs) : [],
    hasDone: false, done: 0, byMilestone: {}, byDirection: {}
  };
  const d = doneOf(snap);
  if(d){
    out.hasDone = true;
    out.done = valueAt(d.total, d.from, d.step, until, tMs);
    Object.keys(d.byMilestone).forEach(k => { out.byMilestone[k] = valueAt(d.byMilestone[k], d.from, d.step, until, tMs); });
    Object.keys(d.byDirection).forEach(k => { out.byDirection[k] = valueAt(d.byDirection[k], d.from, d.step, until, tMs); });
  }
  return out;
}

/* the five direction rows at time t: the note is "d of N done" (N = today's total, read from the live note); title and status are live ("status now"); no "updated" time */
function directionsAt(list, byDirection){
  return (Array.isArray(list) ? list : []).map(x => {
    if(!x || typeof x !== 'object') return x;
    const m = /(\d+) of (\d+) done/.exec(typeof x.note === 'string' ? x.note : '');
    const v = byDirection[x.n];
    if(!m || typeof v !== 'number') return x;
    return Object.assign({}, x, { note: Math.min(v, +m[2]) + ' of ' + m[2] + ' done', updatedAt: null });
  });
}

const Model = { DURATION_MS, toMs, spanEnd, playhead, buckets, valueAt, sliceAt, doneOf, canPlay, LABEL, WHY, frame, directionsAt };
window.ReplayModel = Model;

/* ---------------------------------------------------------------- part 2: the page */
if(typeof window.H === 'undefined' || typeof window.Live === 'undefined' || typeof window.Feed === 'undefined' || typeof DATA === 'undefined') return;   // node tests load part 1 only

const { H, Live, Feed } = window;      // DATA is a global const of sample-data.js, not a window property
const $ = id => document.getElementById(id);
const over = $('rpOver'), playBtn = $('rpPlay'), why = $('rpWhy'), bar = $('rpBar'), barBtn = $('rpBtn'), fill = $('rpFill'), track = $('rpTrack'), read = $('rpRead'), msg = $('rpMsg');
const body = document.body;
let snap = null, playing = false, ending = false, timer = 0, session = null;

/* the page's own poll must not overwrite a replay frame: a snapshot or a failure that arrives while playing is dropped (the end fetches a fresh one) */
const applyLive = Live.apply, failLive = Live.fail;
Live.apply = s => { if(!playing) applyLive(s); };
Live.fail = e => { if(!playing) failLive(e); };

/* the header chip says "Paused" while the poll is paused; during the replay it says what is happening */
const paintLive = Live.paint;
Live.paint = root => { paintLive(root); const fs = $('feedstat'); if(playing && fs){ fs.className = 'src none'; fs.textContent = 'Replaying'; fs.title = 'The page shows the recorded history, not the live feed.'; } };

/* overview only: the rail is hidden here, so a link or key that would open a drawer is turned back */
const toOverview = () => { const r = location.hash.replace(/^#\/?/, '').split('/')[0]; if(r && r.indexOf('=') < 0) location.hash = '#/'; };
window.addEventListener('hashchange', toOverview); toOverview();
document.addEventListener('keydown', e => {
  if(e.key === 'Escape' && playing){ finish(); return; }
  if(!e.metaKey && !e.ctrlKey && !e.altKey && /^[1-5wjk]$/.test(e.key) && !/^(INPUT|SELECT|TEXTAREA)$/.test((e.target || {}).tagName || '')) e.stopPropagation();   // Direction A's number keys open the drawer views
}, true);

function setBlocked(reason){
  playBtn.disabled = true; playBtn.textContent = Model.LABEL[reason]; why.textContent = Model.WHY[reason];
}

/* the feed is read once on load. No viewer link and a feed on another host: no read at all. A same-origin ?feed= file is the dev fixture (the bundle holds no JSON). */
async function boot(){
  const devFeed = Feed.feedUrl().origin === location.origin;
  if(!Feed.hasKey() && !devFeed){ setBlocked('nokey'); return; }
  try{ snap = await Feed.fetchSnapshot(); }catch(e){ setBlocked('unreadable'); return; }
  const v = Model.canPlay({ hasKey: true, snap });
  if(!v.ok){ snap = null; setBlocked(v.reason); return; }
  playBtn.disabled = false; playBtn.textContent = 'Play the build in 60 seconds';
  why.textContent = Model.doneOf(snap) ? 'An issue that was done and then reopened is not in the history.' : 'This feed has no done-count history yet, so those counts stay at their current value, marked now.';
  playBtn.focus();
}

function frameAt(p){
  const f = Model.frame(snap, p.t), S = H.S;
  H.offset = p.t - Date.now();
  S.tokSum = f.tokens; H.tokSeries = f.tokSeries;
  if(f.eur !== null){ DATA.money = Object.assign({}, DATA.money, { estimateEUR: f.eur, estimateSeries: f.eurSeries }); S.eur = f.eur; H.eurSeries = f.eurSeries; }
  if(f.hasDone && snap.tasks){
    const total = snap.tasks.total || 0, done = Math.min(f.done, total);
    DATA.tasks = Object.assign({}, snap.tasks, { done, open: Math.max(0, total - done), inProgress: 0, inReview: 0, blocked: 0 });   // the other states have no history: one "not done yet" figure
    ['done', 'inProgress', 'inReview', 'open', 'blocked'].forEach(k => { S['t.' + k] = DATA.tasks[k]; });
    H.ms.forEach(m => { if(typeof f.byMilestone[m.id] === 'number') S['m.' + m.id] = Math.min(f.byMilestone[m.id], m.total || f.byMilestone[m.id]); });
    DATA.directions = Model.directionsAt(snap.directions, f.byDirection);
  }
  H.emit('live');
  relabel();
  fill.style.transform = 'scaleX(' + p.p.toFixed(4) + ')';
  track.setAttribute('aria-valuenow', Math.round(p.p * 100));
  read.textContent = H.dayHHMM(new Date(p.t)) + ' · tokens ' + H.k(f.tokens);
}

/* the live log is hidden while playing (replay.css); this puts it back as it was, in the markup Direction A paints */
function repaintLog(){
  const el = $('log'); if(!el) return;
  el.innerHTML = H.log.length ? H.log.slice(0, 5).map(l => '<div><span>' + H.esc(l.at) + '</span><span>' + H.esc(l.t) + '</span></div>').join('') : '<div class="muted">No activity yet.</div>';
}

/* the "Open" row of the Tasks card reads "Not done yet" while playing: it holds live total minus done(t), the other three states are hidden (replay.css) */
function relabel(){
  const row = document.querySelector('.p-tasks .leg [data-v="t.open"]'); if(!row) return;
  const n = Array.from(row.parentNode.childNodes).find(x => x.nodeType === 3); if(!n) return;
  const want = playing && snap && Model.doneOf(snap) ? 'Not done yet' : 'Open';
  if(n.nodeValue !== want) n.nodeValue = want;
}
H.on('live', relabel);

function play(){
  if(playing || !snap) return;
  const start = H.T.start.getTime(), end = Model.spanEnd(H.now().getTime(), H.T.deadline.getTime());
  if(!(end > start)) return;
  session = { offset: H.offset, paused: H.sim.paused, alertReasons: H.alertReasons, log: H.log.slice(), start, end, t0: performance.now() };
  playing = true; H.sim.paused = true; H.alertReasons = () => [];      // a full-screen alert must not open on a frame that mixes past counts with today's forecast
  body.classList.add('replaying'); body.classList.toggle('rp-nodone', !Model.doneOf(snap));
  over.hidden = true; bar.hidden = false; msg.textContent = ''; barBtn.textContent = 'Stop'; barBtn.focus();
  const tick = () => { const p = Model.playhead(session.start, session.end, performance.now() - session.t0, H.reduced()); if(p.done) finish(); else frameAt(p); };
  tick(); timer = setInterval(tick, H.reduced() ? 1000 : 250);
}

/* stop or end: put the clock back, read a fresh snapshot, apply it. The screen is then what the live dashboard shows. */
async function finish(){
  if(!playing || ending) return;
  ending = true; barBtn.disabled = true; clearInterval(timer); timer = 0;
  let note = '';
  try{ snap = await Feed.fetchSnapshot(); }catch(e){ note = 'The live state could not be read just now, so this is the snapshot from when the page opened.'; }
  H.offset = session.offset; H.alertReasons = session.alertReasons;      // the clock goes back before the fresh snapshot is painted
  playing = false; ending = false; barBtn.disabled = false; body.classList.remove('replaying', 'rp-nodone');
  applyLive(snap); relabel();
  H.log.length = 0; session.log.forEach(l => H.log.push(l)); repaintLog();       // the replayed frames must not leave "N issues done" lines in the live log
  H.sim.paused = session.paused;
  fill.style.transform = 'scaleX(1)'; track.setAttribute('aria-valuenow', 100);
  read.textContent = 'Now · tokens ' + H.k(DATA.tokens.series.length ? DATA.tokens.series[DATA.tokens.series.length - 1] : 0);
  barBtn.textContent = 'Replay'; barBtn.focus();
  msg.textContent = note || 'Done. This is the live state.';
  session = null;
}

playBtn.addEventListener('click', play);
barBtn.addEventListener('click', () => { if(playing) finish(); else play(); });
boot();
})();
