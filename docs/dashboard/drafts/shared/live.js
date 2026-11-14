/* Live data layer for Direction B (MIN-4457). Loaded after sample-data.js and BEFORE common.js.
   1. Blanks every number that has a live source, so no sample value can show as live.
   2. Live.apply(snapshot) puts a feed snapshot into DATA / H.S (called from b.js after common.js is ready).
   3. Per block state: loading, ok, stale (older than 3 x intervalSec), error (keeps last good value), nodata, "Mac silent".
   Transport lives in feed.js only. Direction A and C do not load this file. */
(function(){
'use strict';
window.HD_LIVE = true;                                   // common.js: no simulated updates
const BLOCKS = { linear:'Linear', usage:'Usage', money:'Estimate', hand:'Hand-set', derived:'Derived' };
const L = window.Live = { rec:{}, loaded:false, feedErr:null, meta:{ intervalSec:180 }, names:BLOCKS };

/* ---- 1. blank the live blocks (names, windows and gates of milestones, demo step texts are hand-set copy and stay) ---- */
DATA.milestones.forEach(m => { m.done = 0; m.total = 0; });
DATA.tasks = { done:0, inProgress:0, inReview:0, open:0, blocked:0, total:0, byRole:{} };
DATA.tokens = { agentCaps:DATA.tokens.agentCaps, chatCaps:DATA.tokens.chatCaps, perAgent:[], perChat:[], series:[], seriesFrom:null, seriesStepMin:15, projection:null, window:null, scope:'', lastSeen:{}, noCapFlags:true };
DATA.money = { estimate:true, estimateEUR:0, estimateSeries:[], projection:null, credits:[], rateCard:null };
DATA.agents = []; DATA.flags = []; DATA.flagsTimed = []; DATA.lanes = [];
DATA.demo.build = { state:'idle', label:'', at:'' }; DATA.demo.deploy = { state:'idle', label:'' }; DATA.demo.url = ''; DATA.demo.cleanRuns = 0;
DATA.demo.steps.forEach(s => { s.s = 'idle'; }); DATA.demo.notes = {};

/* ---- 2. apply a snapshot ---- */
const parseAth = s => { if(!s) return null; if(/(Z|[+-]\d\d:\d\d)$/.test(s)) return new Date(s); return new Date((s.length===16 ? s+':00' : s)+'+02:00'); };
L.apply = function(snap){
  const H = window.H, S = H.S;
  L.loaded = true; L.feedErr = null; L.lastOk = Date.now();
  Object.keys(BLOCKS).forEach(k => { const b = (snap.blocks||{})[k]; if(b) L.rec[k] = { asOf:b.asOf||null, error:b.error||null }; });
  L.meta = { generatedAt:snap.generatedAt||null, receivedAt:snap.receivedAt||null, intervalSec:snap.intervalSec||180 };
  ['deadline','buildStart','freeze','submitBy'].forEach(k => { if(snap[k]) DATA[k] = snap[k]; });
  H.T = { deadline:parseAth(DATA.deadline), start:parseAth(DATA.buildStart), freeze:parseAth(DATA.freeze), submit:parseAth(DATA.submitBy) };
  if(Array.isArray(snap.milestones) && snap.milestones.length){
    DATA.milestones = snap.milestones.map(m => Object.assign({ done:0, total:0 }, m));
    const f = t => { const [d,hm] = t.split(' '); return parseAth('2026-11-' + (d==='Sat'?'14':'15') + 'T' + hm); };
    H.ms.length = 0; DATA.milestones.forEach(m => H.ms.push(Object.assign({}, m, { s:f(m.start), e:f(m.end), hours:(f(m.end)-f(m.start))/36e5 })));
  }
  if(snap.current) DATA.current = snap.current;
  if(snap.tasks) DATA.tasks = Object.assign({ byRole:{} }, snap.tasks);
  if(Array.isArray(snap.agents)) DATA.agents = snap.agents;
  if(Array.isArray(snap.lanes)) DATA.lanes = snap.lanes.map(l => ({ agent:l.agent, bars:l.bars||[], waitsOn:l.waitsOn }));
  if(snap.tokens) DATA.tokens = Object.assign({}, DATA.tokens, snap.tokens, { noCapFlags:true });   // caps are per run; the feed totals are per build window, so cap flags do not apply
  if(snap.money) DATA.money = Object.assign({ credits:[] }, snap.money);
  if(snap.demo) DATA.demo = Object.assign({}, DATA.demo, snap.demo);
  // flat state, same keys common.js builds at load
  Object.keys(S).forEach(k => { if(/^(m|t|r|ta|tc|cr|ag)\./.test(k)) delete S[k]; });
  DATA.milestones.forEach(m => S['m.'+m.id] = m.done);
  ['done','inProgress','inReview','open','blocked'].forEach(k => S['t.'+k] = DATA.tasks[k]||0);
  Object.keys(DATA.tasks.byRole||{}).forEach(k => S['r.'+k] = DATA.tasks.byRole[k]);
  DATA.tokens.perAgent.forEach(a => S['ta.'+a.n] = a.v);
  DATA.tokens.perChat.forEach(a => S['tc.'+a.n] = a.v);
  DATA.money.credits.forEach(c => S['cr.'+c.n] = c.used);
  S.eur = DATA.money.estimateEUR || 0; S.clean = DATA.demo.cleanRuns || 0;
  const ts = DATA.tokens.series; S.tokSum = ts.length ? ts[ts.length-1] : 0;
  DATA.agents.forEach(a => S['ag.'+a.n] = a.state);
  H.eurSeries = (DATA.money.estimateSeries||[]).slice(); H.tokSeries = ts.slice();
  H.emit('live');
};
L.fail = function(err){ L.feedErr = err.message || String(err); window.H && window.H.emit('live'); };

/* projections stay hidden until the window holds 4 h of data (Cron: a straight line from the last 2 h looks high early) */
L.projection = function(kind){
  const w = DATA.tokens.window, p = kind==='tokens' ? DATA.tokens.projection : DATA.money.projection;
  if(!p || !w) return null;
  return (parseAth(w.until) - parseAth(w.since)) >= 4*36e5 ? p : null;
};
L.seriesStartH = () => DATA.tokens.seriesFrom ? (parseAth(DATA.tokens.seriesFrom) - window.H.T.start)/36e5 : 0;
L.stepH = () => (DATA.tokens.seriesStepMin||15)/60;

/* ---- 3. block states and their words ---- */
const ago = ms => { const m = Math.max(0, Math.floor(ms/60000)); return m<1 ? 'under a minute' : m<60 ? m+' min' : Math.floor(m/60)+' h '+String(m%60).padStart(2,'0')+' min'; };
L.ago = ago;
L.silentMs = () => { const t = parseAth(L.meta.receivedAt || L.meta.generatedAt); return t ? Date.now() - t : 0; };
L.isSilent = () => L.loaded && L.silentMs() > 3*L.meta.intervalSec*1000;
L.state = function(b){
  if(b==='derived'){
    if(!L.loaded) return L.feedErr ? { s:'nodata-error', msg:'No data yet: '+L.feedErr } : { s:'loading' };
    const bad = ['linear','hand'].filter(k => !L.rec[k] || !L.rec[k].asOf);
    return bad.length ? { s:'nodata', msg:'Not enough data yet to judge ('+bad.map(k=>BLOCKS[k]).join(', ')+' has no reading).' } : { s:'ok' };
  }
  if(!L.loaded) return L.feedErr ? { s:'nodata-error', msg:'No data yet: '+L.feedErr+'.' } : { s:'loading' };
  const r = L.rec[b];
  if(!r || !r.asOf) return r && r.error ? { s:'nodata-error', msg:'No data yet: '+r.error.message+'.' } : { s:'nodata', msg:'No reading yet.' };
  const age = Date.now() - parseAth(r.asOf), stale = age > 3*L.meta.intervalSec*1000, when = 'updated '+ago(age)+' ago';
  if(L.feedErr) return { s:'error', msg:'Could not reach the feed ('+L.feedErr+'). Showing the value '+when+'.', when };
  if(r.error) return { s:'error', msg:'Could not refresh: '+r.error.message+'. Showing the last good value, '+when+'.', when };
  if(stale) return { s:'stale', msg:(L.isSilent() ? 'Mac silent for '+ago(L.silentMs())+'. ' : '')+'Stale, '+when+'.', when };
  return { s:'ok', msg:'Updated '+ago(age)+' ago', when };
};
const TAG = { loading:['none','Loading'], ok:['live','Live'], stale:['warn','Stale'], error:['bad','Error'], nodata:['none','No data'], 'nodata-error':['bad','Error'] };
const setT = (el, t) => { if(el.textContent!==t) el.textContent = t; };
/* repaint every [data-blk] element: state attribute, "updated Xm ago" line, source tag, message */
L.paint = function(root){
  (root||document).querySelectorAll('[data-blk]').forEach(el => {
    const b = el.dataset.blk, st = L.state(b);
    if(el.dataset.state!==st.s) el.dataset.state = st.s;
    const own = sel => Array.from(el.querySelectorAll(sel)).filter(n => n.closest('[data-blk]')===el);
    own('.upd').forEach(u => {
      if(b==='derived') return;
      const c = st.s==='ok' ? '' : st.s==='stale' ? 'stale' : (st.s==='error'||st.s==='nodata-error') ? 'dead' : '';
      const t = st.s==='loading' ? 'Loading…' : st.s==='ok' ? st.msg : (st.s==='stale'||st.s==='error' ? '▲ ' : st.s==='nodata-error' ? '■ ' : '')+st.msg;
      u.className = 'upd '+c; setT(u, t);
    });
    own('[data-srcfor]').forEach(s => { const g = TAG[st.s], word = BLOCKS[b] || b;
      const cls = 'src '+g[0]; if(s.className!==cls) s.className = cls;
      setT(s, st.s==='ok' ? 'LIVE · '+word : st.s==='loading' ? 'LOADING' : (g[1]+' · '+word).toUpperCase()); s.title = st.msg || ''; });
    own('.blkmsg').forEach(m => setT(m, st.s==='nodata' || st.s==='nodata-error' ? st.msg : ''));
  });
  const fs = document.getElementById('feedstat');
  if(fs){
    let cls = 'src none', t = 'Loading the feed…';
    if(window.H && window.H.sim.paused){ t = 'Paused'; }
    else if(!L.loaded && L.feedErr){ cls = 'src bad'; t = 'Feed error'; }
    else if(L.loaded && L.feedErr){ cls = 'src bad'; t = 'Feed unreachable, last read '+ago(Date.now()-L.lastOk)+' ago'; }
    else if(L.loaded && L.isSilent()){ cls = 'src warn'; t = 'Mac silent for '+ago(L.silentMs()); }
    else if(L.loaded){ cls = 'src live'; t = 'Live · updated '+ago(Date.now()-parseAth(L.meta.generatedAt))+' ago'; }
    if(fs.className!==cls) fs.className = cls; setT(fs, t);
    fs.title = L.feedErr ? L.feedErr : L.loaded ? 'Snapshot made at '+L.meta.generatedAt+' (Mac clock). The clock and the countdown run in the page.' : 'Reading the snapshot';
  }
};
L.lastOk = Date.now();
})();
