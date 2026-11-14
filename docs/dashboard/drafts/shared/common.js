/* Shared logic for the three drafts: clock + ?now=, countdown with digit roll, simulated live updates, meters,
   tiny markdown renderer, exercise-page template, deck tiles. Plain script, works from file://. Needs sample-data.js and content.js. */
(function(){
'use strict';
const H = window.H = {};
const $ = H.$ = (s,r)=> (r||document).querySelector(s);
const $$ = H.$$ = (s,r)=> Array.from((r||document).querySelectorAll(s));
const esc = H.esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const pad = n => String(n).padStart(2,'0');
const lsGet = k => { try{ return localStorage.getItem(k); }catch(e){ return null; } };
const lsSet = (k,v) => { try{ localStorage.setItem(k,v); }catch(e){} };
H.lsGet = lsGet; H.lsSet = lsSet;   // safe storage for the other shared blocks (alert.js)

/* ---------- clock (Europe/Athens, ?now= override) ---------- */
function parseAthens(s){
  if(!s) return null;
  if(/(Z|[+-]\d\d:\d\d)$/.test(s)) return new Date(s);
  if(s.length===16) s += ':00';
  return new Date(s + '+02:00');            // Athens is UTC+2 in November (winter time)
}
H.parse = parseAthens;
const params = H.params = new URLSearchParams(location.search);
const ov = parseAthens(params.get('now'));
H.offset = (ov && !isNaN(ov)) ? ov.getTime() - Date.now() : 0;
H.overridden = H.offset !== 0;
H.now = () => new Date(Date.now() + H.offset);
H.T = { deadline:parseAthens(DATA.deadline), start:parseAthens(DATA.buildStart), freeze:parseAthens(DATA.freeze), submit:parseAthens(DATA.submitBy) };
const fT = new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Athens',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
const fTS = new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Athens',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
const fW = new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Athens',weekday:'short'});
H.hhmm = d => fT.format(d);
H.hhmmss = d => fTS.format(d);
H.dayHHMM = d => fW.format(d) + ' ' + fT.format(d);
H.clockStr = d => fW.format(d) + ' ' + fTS.format(d);

H.ms = DATA.milestones.map(m => {
  const f = t => { const [d,hm] = t.split(' '); return parseAthens('2026-11-' + (d==='Sat'?'14':'15') + 'T' + hm); };
  return Object.assign({}, m, { s:f(m.start), e:f(m.end), hours:(f(m.end)-f(m.start))/36e5 });
});
H.curMs = (now) => { if(!H.ms.length) return null; now = now || H.now(); for(const m of H.ms){ if(now>=m.s && now<m.e) return m; } return now<H.ms[0].s ? H.ms[0] : H.ms[H.ms.length-1]; };
H.fmtWin = m => m.start + ' to ' + m.end;

/* ---------- formatting ---------- */
H.k = v => v>=1e6 ? (v/1e6).toFixed(2).replace(/\.?0+$/,'') + 'M' : Math.round(v/1000) + 'k';
H.eur = v => 'EUR ' + v.toFixed(2);
H.int = v => String(Math.round(v));
const FMT = { int:H.int, k:H.k, eur:H.eur, pct:v=>Math.round(v)+'%', cr:v=>String(Math.round(v)) };
H.cd = ms => {
  if(ms<=0) return 'Time is up';
  const s = Math.floor(ms/1000), h = Math.floor(s/3600), m = Math.floor(s%3600/60), sec = s%60;
  if(h>=48) return Math.floor(h/24)+'d '+pad(h%24)+'h '+pad(m)+'m';
  if(h>0) return h+'h '+pad(m)+'m '+pad(sec)+'s';
  if(m>0) return m+'m '+pad(sec)+'s';
  return sec+'s';
};
H.cdWords = ms => { // "26 hours 30 minutes 12 seconds" (plain units, R21)
  if(ms<=0) return 'Time is up';
  const s = Math.floor(ms/1000), h = Math.floor(s/3600), m = Math.floor(s%3600/60), sec = s%60;
  const u = (n,w) => n+' '+w+(n===1?'':'s');
  return [h?u(h,'hour'):'', (h||m)?u(m,'minute'):'', u(sec,'second')].filter(Boolean).join(' ');
};
H.tier = ms => ms<=0 ? 'up' : ms>3*36e5 ? 'ok' : ms>36e5 ? 'warn' : 'bad';
H.tabClock = ms => { const s=Math.max(0,Math.floor(ms/1000)); return pad(Math.floor(s/3600))+':'+pad(Math.floor(s%3600/60))+':'+pad(s%60); };
H.winFrac = now => Math.min(1,Math.max(0,(now - H.T.start)/(H.T.deadline - H.T.start)));

/* ---------- ui prefs: theme, reduced motion ---------- */
const mqDark = matchMedia('(prefers-color-scheme: dark)'), mqRM = matchMedia('(prefers-reduced-motion: reduce)');
H.reduced = () => document.documentElement.dataset.motion === 'reduced';
H.initUI = function(opt){
  opt = opt || {};
  const root = document.documentElement, key = 'hd-' + (opt.key||'x');
  const applyTheme = () => {
    const pref = lsGet(key+'-theme') || opt.theme || 'auto';
    root.dataset.theme = pref==='auto' ? (mqDark.matches?'dark':'light') : pref;
    $$('[data-act="theme"]').forEach(b => b.setAttribute('aria-pressed', root.dataset.theme==='dark'));
  };
  const applyMotion = () => {
    const pref = lsGet(key+'-motion');
    const reduced = pref ? pref==='reduced' : mqRM.matches;
    root.dataset.motion = reduced ? 'reduced' : 'full';
    $$('[data-act="motion"]').forEach(b => b.setAttribute('aria-pressed', reduced));
  };
  applyTheme(); applyMotion();
  mqDark.addEventListener && mqDark.addEventListener('change', applyTheme);
  mqRM.addEventListener && mqRM.addEventListener('change', applyMotion);
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if(!b) return;
    const a = b.dataset.act;
    if(a==='theme'){ lsSet(key+'-theme', root.dataset.theme==='dark'?'light':'dark'); applyTheme(); }
    if(a==='motion'){ lsSet(key+'-motion', H.reduced()?'full':'reduced'); applyMotion(); }
    if(a==='pause'){ H.sim.paused = !H.sim.paused; b.setAttribute('aria-pressed', H.sim.paused); b.title = H.sim.paused ? 'Resume live updates' : 'Pause live updates'; H.tickUpd(); }
  });
  $$('[data-act="theme"]').forEach(b=>b.setAttribute('aria-pressed', root.dataset.theme==='dark'));
};

/* ---------- state (flat keys so any element can bind to one value) ---------- */
const S = H.S = {};
DATA.milestones.forEach(m => S['m.'+m.id] = m.done);
['done','inProgress','inReview','open','blocked'].forEach(k => S['t.'+k] = DATA.tasks[k]);
Object.keys(DATA.tasks.byRole).forEach(k => S['r.'+k] = DATA.tasks.byRole[k]);
DATA.tokens.perAgent.forEach(a => S['ta.'+a.n] = a.v);
DATA.tokens.perChat.forEach(a => S['tc.'+a.n] = a.v);
DATA.money.credits.forEach(c => S['cr.'+c.n] = c.used);
S.eur = DATA.money.estimateEUR; S.clean = DATA.demo.cleanRuns;
S.tokSum = DATA.tokens.series[DATA.tokens.series.length-1];
DATA.agents.forEach(a => S['ag.'+a.n] = a.state);
H.eurSeries = DATA.money.estimateSeries.slice();
H.tokSeries = DATA.tokens.series.slice();
H.log = [ {at:'15:29',t:'Pix commented on MIN-4446'},{at:'15:27',t:'Back updated MIN-4445'},{at:'15:24',t:'Anna moved MIN-4429 to In Review'},{at:'15:20',t:'CTO commented on MIN-4443'},{at:'15:12',t:'Build #14 passed'} ];
H.synced = Date.now();
const listeners = {};
H.on = (ev,fn) => (listeners[ev] = listeners[ev]||[]).push(fn);
const emit = (ev,a) => (listeners[ev]||[]).forEach(f => f(a));
H.emit = emit;
H.taskTotal = () => ['done','inProgress','inReview','open','blocked'].reduce((s,k)=>s+S['t.'+k],0);
H.donePct = () => DATA.tasks.total ? Math.round(S['t.done']/DATA.tasks.total*100) : 0;

/* meter state: warn from 90% of the soft cap ("Near cap"), bad from the hard cap (sample rule, see hand-back note) */
H.meterState = (v,soft,hard) => v>=hard ? 'hard' : v>=0.9*soft ? 'soft' : 'ok';
H.credLeft = c => c.granted - S['cr.'+c.n];

/* derived risk flags (rules of MIN-4445 item 7) */
H.flags = function(){
  const out = [], now = H.now(), tk = DATA.tokens;
  // Cap flags are opt-in: the caps are per run (one chat's memory, one agent run), so a feed raises them only when it
  // says its numbers are per-run sizes (capScope 'run'). Whole-day totals against per-run caps are always red.
  const capOn = tk.capScope === 'run' && !tk.noCapFlags;
  if(capOn) tk.perChat.forEach(c => { const v=S['tc.'+c.n], st=H.meterState(v,tk.chatCaps.soft,tk.chatCaps.hard), cap=H.k(st==='hard'?tk.chatCaps.hard:tk.chatCaps.soft);
    if(st!=='ok') out.push({id:'chat-'+c.n, level:st==='hard'?'bad':'warn', text:c.n.replace(' (main)','')+' chat at '+H.k(v)+' of '+cap+(st==='hard'?' hard cap':' soft cap'),
      plain:'The '+c.n.replace(' (main)','').toLowerCase()+' chat is '+(st==='hard'?'over its limit':'near its limit')+' ('+H.k(v)+' of '+cap+').', act:'Start a new chat after this task.'}); });
  if(capOn) tk.perAgent.forEach(a => { const v=S['ta.'+a.n], st=H.meterState(v,tk.agentCaps.soft,tk.agentCaps.hard), cap=H.k(st==='hard'?tk.agentCaps.hard:tk.agentCaps.soft);
    if(st!=='ok') out.push({id:'agent-'+a.n, level:st==='hard'?'bad':'warn', text:a.n+' agent at '+H.k(v)+' of '+cap+(st==='hard'?' hard cap':' soft cap'),
      plain:a.n+' is '+(st==='hard'?'over its token limit':'near its token limit')+' ('+H.k(v)+' of '+cap+').', act:'Hand the next task to a fresh run.'}); });
  DATA.money.credits.forEach(c => { const f=S['cr.'+c.n]/c.granted;
    if(f>0.7) out.push({id:'cr-'+c.n, level:f>0.8?'bad':'warn', text:c.n+' credits at '+Math.round(f*100)+'% used', plain:c.n+' credits are running low ('+S['cr.'+c.n]+' of '+c.granted+' used).', act:'Ask the CTO to top up or switch provider.'}); });
  DATA.flags.filter(f=>f.until && now < parseAthens(f.until)).forEach(f => out.push({id:'static-'+f.text.slice(0,8), level:f.level, text:f.text, plain:f.plain||f.text, act:f.act||''}));
  H.ms.forEach(m => { if(m.e<now && S['m.'+m.id]<m.total) out.push({id:'late-'+m.id, kind:'late', level:'warn', text:m.id+' window ended with '+(m.total-S['m.'+m.id])+' of '+m.total+' open', plain:'Milestone '+m.id.slice(1)+' ended with '+(m.total-S['m.'+m.id])+' issues still open.', act:'Check the cut list, or move the gate.'}); });
  return out;
};
/* Forecast (MIN-4565 block, MIN-4566): the verdict comes from when the must-haves are projected to finish.
   The feed already caps it at At risk with fewer than 3 done. Flags are layered on top: a red flag (credits, caps) makes it
   Off track, any other flag makes it At risk, except a late milestone window, which is amber information and does not move
   the forecast verdict. Without a forecast block (old feed, sample data) the old flag-only rule applies. */
const FC_V = { on:0, risk:1, off:2 }, FC_K = ['on','risk','off'];
H.forecast = () => { const f = DATA.forecast; return f && typeof f==='object' && FC_V[f.verdict]!==undefined ? f : null; };
H.verdict = () => {
  const f = H.flags(), fc = H.forecast();
  const flagV = f.some(x=>x.level==='bad') ? 'off' : f.some(x=>!fc || x.kind!=='late') ? 'risk' : 'on';
  return fc ? FC_K[Math.max(FC_V[fc.verdict], FC_V[flagV])] : flagV;
};
const fcHM = iso => typeof iso==='string' && iso.length>=16 ? iso.slice(11,16) : '';   // the feed writes Athens time already
H.fcLine = () => {
  const f = H.forecast(); if(!f) return '';
  const lim = ' - freeze '+fcHM(f.freeze)+', submit '+fcHM(f.submit);
  if(!f.finish_label) return 'No must-have is done yet, so no finish time can be projected'+lim+'.';
  return (f.early_pace ? 'Early pace (fewer than 3 done). ' : 'At the current pace, ')+'must-haves finish '+f.finish_label+lim+'.';
};
H.fcBlocked = () => { const f = H.forecast(); return f && Array.isArray(f.blocked) ? f.blocked : []; };
H.fcCut = () => { const f = H.forecast(); return f && f.verdict==='off' && Array.isArray(f.cut) ? f.cut : []; };
/* the reasons the full-screen alert lists: every red flag, plus the forecast when it says Off track */
H.alertReasons = () => {
  const out = H.flags().filter(x=>x.level==='bad'), f = H.forecast();
  if(f && H.verdict()==='off' && f.verdict==='off') out.unshift({ id:'forecast-off', level:'bad', text:H.fcLine(), plain:H.fcLine(),
    act: H.fcCut().length ? 'Cut, in this order: '+H.fcCut().map(c=>c.id+' ('+c.finish_after_label+')').join(', ')+'.' : 'Cut scope or move the gate.' });
  return out;
};
H.verdictMeta = { on:{cls:'ok',g:'●',w:'On track'}, risk:{cls:'warn',g:'▲',w:'At risk'}, off:{cls:'bad',g:'■',w:'Off track'} };
H.sentence = (v,n) => ({on:'We are on track.', risk:'We can still make it, but '+n+(n===1?' thing needs':' things need')+' attention.', off:'We are off track. '+n+(n===1?' thing needs':' things need')+' action now.'}[v]);

/* ---------- bound values: [data-v=key] text, [data-mv=key] meter ---------- */
function setText(el, to){
  const f = FMT[el.dataset.f||'int'];
  const from = el._v; el._v = to;
  if(from===undefined || from===to || H.reduced()){ el.textContent = f(to); return from!==undefined && from!==to; }
  const t0 = performance.now(), dur = 600;
  cancelAnimationFrame(el._raf);
  const step = t => { const p = Math.min(1,(t-t0)/dur), e = 1-Math.pow(1-p,3); el.textContent = f(from+(to-from)*e); if(p<1) el._raf = requestAnimationFrame(step); else el.textContent = f(to); };
  el._raf = requestAnimationFrame(step);
  return true;
}
H.flash = el => { if(!el) return; el.classList.add('flashbox'); el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); };
function paintMeter(el, first){
  const key = el.dataset.mv, mode = el.dataset.mode||'used', max = +el.dataset.max, soft = +el.dataset.soft, hard = +el.dataset.hard;
  const row = el.closest('.mrow'), val = S[key];
  let frac, st, txt;
  if(mode==='left'){ frac = Math.min(1, val/max); st = frac>0.8?'hard':frac>0.7?'soft':'ok'; txt = Math.round(val)+' of '+max+' used'; }
  else if(mode==='total'){ frac = Math.min(1, val/(+el.dataset.scale||1)); st = 'ok'; txt = H.k(val); }   // live feed: totals since build start, no per-run caps
  else { frac = Math.min(1, val/(+el.dataset.scale||max)); st = H.meterState(val, soft, hard); txt = H.k(val)+' / '+H.k(hard); }
  const old = el.dataset.s;
  el.style.setProperty('--f', frac.toFixed(4)); el.dataset.s = st;
  const t = row.querySelector('.mval'); if(t) t.textContent = txt;
  const ms = row.querySelector('.mstat');
  if(ms){ ms.className = 'mstat ' + st; ms.hidden = st==='ok';
    const pl = H.plainStat;
    ms.textContent = st==='hard' ? (mode==='left'?(pl?'■ Almost out':'■ Over 80% used'):(pl?'■ Over its limit':'■ Over cap')) : st==='soft' ? (mode==='left'?(pl?'▲ Running low':'▲ Over 70% used'):(pl?'▲ Near its limit':'▲ Near cap, soft cap '+H.k(soft))) : ''; }
  if(!first && old!==st) H.flash(row);
}
H.set = function(key, val){
  S[key] = val;
  $$('[data-v]').forEach(el => { if(el.dataset.v===key){ const ch = setText(el, val); if(ch) H.flash(el.closest('[data-flash]')||el); } });
  $$('[data-mv]').forEach(el => { if(el.dataset.mv===key) paintMeter(el); });
  if(key.startsWith('ag.')) $$('[data-agrow]').forEach(r => { if(r.dataset.agrow===key.slice(3)){ r.dataset.state = val; const d=r.querySelector('.dot'); d.classList.toggle('active', val==='active'); r.querySelector('.st').textContent = val==='active'?'Active':'Idle'; if(val==='active') r.querySelector('.last').textContent='just now'; } });
  emit('change', key);
};
H.hydrate = function(root){ // set initial values of bound elements inside root (no tween, no flash)
  $$('[data-v]',root).forEach(el => { el._v = S[el.dataset.v]; el.textContent = FMT[el.dataset.f||'int'](S[el.dataset.v]); });
  $$('[data-mv]',root).forEach(el => paintMeter(el,true));
};

/* ---------- component builders (strings) ---------- */
H.src = (kind,label) => '<span class="src '+kind+'">'+esc(label|| (kind==='live'?'LIVE · clock':kind==='none'?'SAMPLE · no live source':'SAMPLE · Linear'))+'</span>';
const RAG = { pass:['ok','●','Pass'], warn:['warn','▲','Risk'], fail:['bad','■','Fail'], idle:['idle','○','Not run'], ok:['ok','●','On track'], bad:['bad','■','Late'] };
H.rag = (s,word) => { const r = RAG[s]||RAG.idle; return '<span class="chip '+(r[0]==='idle'?'':r[0])+'"><span class="g" aria-hidden="true">'+r[1]+'</span>'+esc(word||r[2])+'</span>'; };
H.ragGlyph = s => (RAG[s]||RAG.idle)[1];
H.meter = function(o){ // o: key,label,max,soft,hard,mode,scale,big
  const scale = o.scale || (o.hard*1.1);
  const ticks = o.mode==='total' ? '' : o.mode==='left' ? [0.7,0.8].map(p=>'<i class="tick" style="left:'+(p*100)+'%" title="'+(p*100)+'% used"></i>').join('')
    : [o.soft,o.hard].map((v,i)=>'<i class="tick" style="left:'+(v/scale*100).toFixed(1)+'%" title="'+(i?'hard':'soft')+' cap '+H.k(v)+'"></i>').join('');
  return '<div class="mrow'+(o.big?' bigm':'')+'" data-flash><span class="mname" title="'+esc(o.label)+'">'+esc(o.label)+'</span><span class="mval num"></span>'
    + '<div class="mt"><div class="meter" role="meter" data-mv="'+esc(o.key)+'" data-mode="'+(o.mode||'used')+'" data-max="'+o.max+'" data-soft="'+(o.soft||0)+'" data-hard="'+(o.hard||0)+'" data-scale="'+scale+'"><i class="fill"></i></div>'+ticks+'</div><span class="mstat" hidden></span></div>';
};
H.agentMeters = (n,topN) => DATA.tokens.perAgent.slice().sort((a,b)=>S['ta.'+b.n]-S['ta.'+a.n]).slice(0,n||10).map(a => H.meter({key:'ta.'+a.n,label:a.n,max:DATA.tokens.agentCaps.hard,soft:DATA.tokens.agentCaps.soft,hard:DATA.tokens.agentCaps.hard})).join('');
H.chatMeters = () => DATA.tokens.perChat.map(c => H.meter({key:'tc.'+c.n,label:c.n,max:DATA.tokens.chatCaps.hard,soft:DATA.tokens.chatCaps.soft,hard:DATA.tokens.chatCaps.hard})).join('');
H.creditMeters = (list) => (list||DATA.money.credits).map(c => H.meter({key:'cr.'+c.n,label:c.n,max:c.granted,mode:'left'})).join('');
H.initials = n => n.slice(0,2);
H.agentRow = a => '<div class="arow" data-agrow="'+esc(a.n)+'" data-state="'+a.state+'"><span class="av" aria-hidden="true">'+esc(H.initials(a.n))+'</span>'
  + '<div class="ainfo"><div class="aname"><b>'+esc(a.n)+'</b> '+(a.role!==a.n?'<span class="muted">'+esc(a.role)+'</span>':'')+'</div><div class="atask">'+(a.issue!=='-'?'<span class="mono">'+esc(a.issue)+'</span> ':'')+esc(a.title)+'</div></div>'
  + '<div class="astat"><span class="dot'+(a.state==='active'?' active':'')+'"></span><span class="st">'+(a.state==='active'?'Active':'Idle')+'</span><span class="last muted">'+esc(a.last)+' ago</span></div></div>';
H.byRole = (n) => { const mx = Math.max(...Object.values(DATA.tasks.byRole)); return Object.keys(DATA.tasks.byRole).sort((a,b)=>DATA.tasks.byRole[b]-DATA.tasks.byRole[a]).slice(0,n||99).map(r =>
  '<div class="rrow"><span>'+esc(r)+'</span><div class="rbar"><i style="transform:scaleX('+(DATA.tasks.byRole[r]/mx).toFixed(3)+')"></i></div><b class="mono num">'+DATA.tasks.byRole[r]+'</b></div>').join(''); };
const TSEG = [['done','Done','ok'],['inProgress','In progress','brand'],['inReview','In review','warn'],['open','Open','idle'],['blocked','Blocked','bad']];
H.TSEG = TSEG;
H.paintTaskBar = root => { const tot = H.taskTotal(); TSEG.forEach(([k]) => { $$('[data-seg="'+k+'"]',root).forEach(el => el.style.flexGrow = S['t.'+k]/tot); }); };

/* ---------- second tick: countdown, clocks, freshness ---------- */
const secFns = [];
H.onSecond = fn => secFns.push(fn);
H.tickUpd = () => { const s = Math.round((Date.now()-H.synced)/1000);
  $$('.upd').forEach(el => { if(el.dataset.live) return; const c = s>=300?'dead':s>=60?'stale':'';
    el.className = 'upd '+c; el.textContent = (s>=60?'▲ Stale · ':'')+'Updated '+(s<60? s+'s' : Math.floor(s/60)+' min')+' ago'; }); };
H.mountCountdown = function(el){
  let pat = '', prev = '';
  return function(str){
    const p = str.replace(/\d/g,'#');
    if(p!==pat){ pat = p; el.innerHTML = Array.from(str).map(c => /\d/.test(c) ? '<span class="dg"><span class="cur">'+c+'</span></span>' : '<span>'+(c===' '?'&nbsp;':esc(c))+'</span>').join(''); prev = str; return; }
    const kids = el.children, digitIdx = []; for(let i=0;i<str.length;i++) if(/\d/.test(str[i])) digitIdx.push(i);
    const sec = digitIdx.slice(-2);
    digitIdx.forEach(i => { if(str[i]===prev[i]) return; const dg = kids[i];
      if(sec.indexOf(i)>=0 && !H.reduced()){ const old = dg.querySelector('.cur'); old.className = 'out'; const nw = document.createElement('span'); nw.className = 'cur in'; nw.textContent = str[i]; dg.appendChild(nw); setTimeout(()=>old.remove(),170); }
      else dg.querySelector('.cur').textContent = str[i]; });
    prev = str;
  };
};
let lastTier = null;
H.hero = function(o){ // o: el (countdown), root (gets tier class + last10), bar (.winbar), words (el), onTier
  const paint = H.mountCountdown(o.el); let first = true;
  const run = () => {
    const now = H.now(), ms = H.T.deadline - now, tier = H.tier(ms), str = H.cd(ms);
    paint(str);
    o.el.className = (o.el.className.replace(/\btier-\w+/g,'').trim()+' tier-'+tier).trim();
    if(o.root){ o.root.classList.toggle('last10', ms>0 && ms<6e5); if(lastTier && lastTier!==tier && !H.reduced()) H.flash(o.root); }
    lastTier = tier;
    if(o.bar) o.bar.style.setProperty('--f', H.winFrac(now).toFixed(4));
    if(o.words) o.words.textContent = H.cdWords(ms);
    document.title = H.tabClock(ms) + ' · Health app';
    if(o.onTick) o.onTick(now, ms);
    first = false;
  };
  H.onSecond(run); run();
};
(function loop(){
  const run = () => { if(!document.hidden){ secFns.forEach(f => f()); H.tickUpd(); } setTimeout(run, 1000 - (Date.now()%1000) + 5); };
  document.addEventListener('visibilitychange', () => { if(!document.hidden){ secFns.forEach(f=>f()); H.tickUpd(); } });
  setTimeout(run, 1000 - (Date.now()%1000) + 5);
})();

/* ---------- simulated live updates (every 4 to 8 s, one change) ---------- */
H.sim = { paused:false };
const pick = a => a[Math.floor(Math.random()*a.length)];
const rnd = (a,b) => Math.round(a + Math.random()*(b-a));
function logEv(t){ H.log.unshift({at:H.hhmm(H.now()),t}); H.log.length = 12; emit('log', H.log[0]); }
const EVENTS = [
  () => { const act = DATA.agents.filter(a => S['ag.'+a.n]==='active'); if(!act.length) return false; const a = pick(act), tk = DATA.tokens;
    const cur = S['ta.'+a.n] || 0, d = rnd(1500,7500); if(S['ta.'+a.n]===undefined || cur+d>=tk.agentCaps.hard-1000) return false;
    H.set('ta.'+a.n, cur+d); const cc = S['tc.Coordinator (main)']; if(Math.random()<.5 && cc+d/2<tk.chatCaps.hard-2000) H.set('tc.Coordinator (main)', cc+Math.round(d/2));
    S.tokSum += d; H.tokSeries[H.tokSeries.length-1] = S.tokSum; H.set('eur', +(S.eur + d/1000*0.05).toFixed(2)); H.eurSeries[H.eurSeries.length-1] = S.eur; emit('series'); return true; },
  () => { const r = Math.random(); let from,to,ag = pick(['Ren','Pix','Back','Anna','Cron']);
    if(r<.4 && S['t.open']>0){ from='open'; to='inProgress'; } else if(r<.75 && S['t.inProgress']>0){ from='inProgress'; to='inReview'; } else if(S['t.inReview']>0){ from='inReview'; to='done'; } else return false;
    H.set('t.'+from, S['t.'+from]-1); H.set('t.'+to, S['t.'+to]+1);
    if(to==='done'){ const m = H.curMs(); if(m && S['m.'+m.id]<m.total) H.set('m.'+m.id, S['m.'+m.id]+1); }
    logEv(ag+' moved MIN-'+rnd(4430,4470)+' to '+({inProgress:'In Progress',inReview:'In Review',done:'Done'})[to]); return true; },
  () => { const a = pick(DATA.agents), now = S['ag.'+a.n]; const act = DATA.agents.filter(x=>S['ag.'+x.n]==='active').length;
    if(now==='active' && act<=2) return false; H.set('ag.'+a.n, now==='active'?'idle':'active'); logEv(a.n+(now==='active'?' went idle':' started on '+(a.issue!=='-'?a.issue:'a new task'))); return true; },
  () => { const c = DATA.money.credits[0]; if(S['cr.'+c.n]>=c.granted-1) return false; H.set('cr.'+c.n, S['cr.'+c.n]+rnd(1,3)); return true; }
];
(function schedule(){
  if(window.HD_LIVE) return;   // Direction B live: the feed replaces the simulation
  setTimeout(function step(){
    if(!H.sim.paused && !document.hidden){ for(let i=0;i<4;i++){ if(pick(EVENTS)()!==false) break; } H.synced = Date.now(); H.tickUpd(); emit('sync'); }
    schedule();
  }, rnd(4000,8000));
})();

/* ---------- tiny markdown renderer ---------- */
function inl(s){
  s = esc(s);
  s = s.replace(/`([^`]+)`/g,'<code>$1</code>');
  s = s.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
  s = s.replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?!\*)/g,'$1<em>$2</em>');
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2">$1</a>');
  return s;
}
H.md = function(src){
  const L = src.replace(/\r/g,'').split('\n'); let i = 0, out = [];
  const cells = r => r.trim().replace(/^\||\|$/g,'').split(/(?<!\\)\|/).map(c=>c.trim().replace(/\\\|/g,'|'));
  while(i<L.length){
    const ln = L[i];
    if(!ln.trim()){ i++; continue; }
    if(/^---+\s*$/.test(ln)){ out.push('<hr>'); i++; continue; }
    let m;
    if((m = ln.match(/^(#{2,4}) (.*)/))){ out.push('<h'+m[1].length+'>'+inl(m[2])+'</h'+m[1].length+'>'); i++; continue; }
    if(ln.startsWith('|')){ const rows = []; while(i<L.length && L[i].startsWith('|')) rows.push(L[i++]);
      const head = cells(rows[0]), body = rows.slice(2).map(cells);
      const hasHead = head.some(h=>h.length);
      out.push('<div class="tbl"><table>'+(hasHead?'<thead><tr>'+head.map(h=>'<th>'+inl(h)+'</th>').join('')+'</tr></thead>':'')+'<tbody>'+body.map(r=>'<tr>'+r.map(c=>'<td>'+inl(c)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>'); continue; }
    if(ln.startsWith('>')){ const q=[]; while(i<L.length && L[i].startsWith('>')) q.push(L[i++].replace(/^>\s?/,'')); out.push('<blockquote><p>'+q.filter(Boolean).map(inl).join('</p><p>')+'</p></blockquote>'); continue; }
    if(/^\d+\. /.test(ln) || /^[-*] /.test(ln)){ const ord = /^\d+\. /.test(ln), items = [];
      while(i<L.length && (ord?/^\d+\. /.test(L[i]):/^[-*] /.test(L[i]) )){ let t = L[i++].replace(ord?/^\d+\. /:/^[-*] /,''); while(i<L.length && /^\s+\S/.test(L[i])) t += ' ' + L[i++].trim(); items.push(t); }
      out.push((ord?'<ol>':'<ul>')+items.map(t=>'<li>'+inl(t)+'</li>').join('')+(ord?'</ol>':'</ul>')); continue; }
    const p = []; while(i<L.length && L[i].trim() && !/^(#{2,4} |\||>|---|\d+\. |[-*] )/.test(L[i])) p.push(L[i++]);
    out.push('<p>'+inl(p.join(' '))+'</p>');
  }
  return out.join('\n');
};

/* ---------- exercise pages: ONE template for all 7 (guidelines section 7) ---------- */
const EX = CONTENT.exercises;
H.exCount = EX.length;
H.readMin = i => Math.max(1, Math.round(EX[i].md.split(/\s+/).length/200));
H.exercisePage = function(i, o){ // o.href(i) -> hash link or null ; returns html string
  const e = EX[i], parts = e.md.split(/\n(?=## )/); let intro = '', secs = [];
  parts.forEach(p => { if(p.startsWith('## ')) secs.push(p); else intro = p; });
  const isDec = t => /(decisions|open questions) for the founder/i.test(t);
  const heads = [], htmls = []; let dec = null;
  secs.forEach((p,k) => { const t = p.split('\n')[0].replace(/^## /,''); const id = 'ex'+i+'-s'+k;
    if(isDec(t)) dec = {id, t, body:p.split('\n').slice(1).join('\n')};
    else { heads.push({id,t}); htmls.push(H.md(p).replace(/^<h2>/,'<h2 id="'+id+'">')); } });
  if(dec) heads.push({id:dec.id, t:'For the founder: '+dec.t.replace(/^\d+\.\s*/,'').replace(/ for the founder/i,'').toLowerCase()});
  const link = (j,lab) => { const h = j>=0 && j<EX.length ? o.href(j) : null; return h ? '<a class="btn" href="'+h+'">'+lab+'</a>' : '<span class="btn" aria-disabled="true" style="opacity:.45">'+lab+'</span>'; };
  const toc = heads.map(h => '<li><button type="button" data-scroll="'+h.id+'">'+esc(h.t)+'</button></li>').join('');
  return '<article class="ex" data-ex="'+i+'">'
   + '<header class="ex-head"><div class="ex-eyebrow micro">'+(i ? 'Workshop '+i : 'Summary')+' · page '+(i+1)+' of 7 <span class="chip warn"><span class="g" aria-hidden="true">▲</span>Recommended, not decided</span></div>'
   + '<h1 tabindex="-1">'+esc(e.t)+'</h1>'
   + '<div class="ex-meta"><span><b>Facilitator</b>Pix Elidis</span><span><b>Ticket</b>MIN-4441</span><span><b>Date</b>14 Nov 2026</span><span><b>Room</b>CEO, Marketing, Sales, Product, CTO</span></div></header>'
   + '<div class="ex-lede"><p class="ex-line">'+esc(e.line)+'</p><div class="ex-fig"><b>'+esc(e.fig.v)+'</b><span>'+esc(e.fig.l)+'</span></div></div>'
   + '<div class="ex-layout"><div><nav class="ex-toc" aria-label="Contents"><div class="micro">Contents</div><ol>'+toc+'</ol></nav>'
   + '<label class="ex-sel"><span class="sr">Contents</span><select data-exsel><option value="">Contents</option>'+heads.map(h=>'<option value="'+h.id+'">'+esc(h.t)+'</option>').join('')+'</select></label></div>'
   + '<div class="ex-body">'+(intro.trim()?H.md(intro):'')+htmls.join('\n')
   + (dec ? '<aside class="ex-dec" id="'+dec.id+'"><h2>For the founder: '+esc(dec.t.replace(/^\d+\.\s*/,''))+'</h2>'+H.md(dec.body)+'</aside>' : '')
   + '<footer class="ex-foot"><span><span class="mono">'+esc(e.f)+'</span> · <a href="https://linear.app/minhos/issue/MIN-4441">MIN-4441</a> · copied as text, source unchanged</span>'
   + '<span class="ex-nav">'+link(i-1,'‹ Previous '+(i>0?EX[i-1].n:''))+link(i+1,'Next '+(i<EX.length-1?EX[i+1].n:'')+' ›')+'</span></footer></div></div></article>';
};
H.wireExercise = function(root, scroller){ // scrollspy + contents clicks
  const behavior = () => H.reduced() ? 'auto' : 'smooth';
  const go = id => { const t = document.getElementById(id); if(t) t.scrollIntoView({behavior:behavior(), block:'start'}); };
  $$('[data-scroll]',root).forEach(b => b.addEventListener('click', () => go(b.dataset.scroll)));
  const sel = $('[data-exsel]',root); if(sel) sel.addEventListener('change', () => { if(sel.value){ go(sel.value); } });
  const targets = $$('[data-scroll]',root).map(b => document.getElementById(b.dataset.scroll)).filter(Boolean);
  if(!('IntersectionObserver' in window)) return null;
  const io = new IntersectionObserver(es => { es.forEach(en => { if(en.isIntersecting){ $$('[data-scroll]',root).forEach(b => b.classList.toggle('on', b.dataset.scroll===en.target.id)); if(sel) sel.value = en.target.id; } }); },
    { root:scroller||null, rootMargin:'-8% 0px -80% 0px', threshold:0 });
  targets.forEach(t => io.observe(t));
  const first = $('[data-scroll]',root); if(first) first.classList.add('on');
  return io;
};
H.exCards = (href) => EX.map((e,i) => '<a class="excover" href="'+href(i)+'" data-i="'+i+'"><span class="exn mono">'+e.n+'</span><span class="ext">'+esc(e.t)+'</span><span class="exl">'+esc(e.line)+'</span><span class="exf"><b class="mono">'+esc(e.fig.v)+'</b> <span class="muted">'+esc(e.fig.l)+'</span></span><span class="exr muted">'+H.readMin(i)+' min read</span></a>').join('');

/* ---------- deck tiles (slide titles from the .md sources; the deck HTML files are not copied) ---------- */
H.deckInfo = k => ({ key:k, label:k==='short'?'Short pitch':'Pitch deck', sub:k==='short'?'6 slides · about 90 seconds':'13 slides · appendix for questions and for Monday', ver:CONTENT.decks[k].version, slides:CONTENT.decks[k].slides,
  file:'file:///Users/onedotatatime.design/AppDevelopment/healthapp/.claude/worktrees/pix-pitching-deck-draft-094214/'+CONTENT.decks[k].file });
H.slideTile = (k,idx,cls) => { const s = CONTENT.decks[k].slides[idx]; return '<div class="slide '+(cls||'')+'"><span class="sn">'+pad(s.n)+' / '+pad(CONTENT.decks[k].slides.length)+'</span><div><div class="st">'+esc(s.t)+'</div><div class="sh">'+esc(s.h)+'</div></div></div>'; };

/* ---------- helpers ---------- */
H.enter = (root, sel) => { $$(sel||'[data-enter]',root).forEach((el,i) => { el.style.setProperty('--i', Math.min(i,8)); el.classList.add('enter'); }); };
H.copy = async txt => { try{ await navigator.clipboard.writeText(txt); return true; }catch(e){ const ta=document.createElement('textarea'); ta.value=txt; ta.style.cssText='position:fixed;opacity:0'; document.body.appendChild(ta); ta.select(); let ok=false; try{ ok=document.execCommand('copy'); }catch(_){} ta.remove(); return ok; } };
H.relFlags = () => H.flags();
H.demoVerdict = () => { const d = DATA.demo; const live = d.deploy.state==='pass';
  return (d.build.state==='pass' && live && S.clean>=d.cleanTarget) ? 'ready' : d.steps.some(s=>s.s==='fail') ? 'not-ready' : 'getting-there'; };
H.stepWord = s => (RAG[s]||RAG.idle)[2];
})();
