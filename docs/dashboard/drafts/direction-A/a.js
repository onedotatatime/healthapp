/* Direction A · Mission Control, the dashboard base (MIN-4530). Live through shared/live.js and shared/feed.js, like B.
   Hash routes: #/ (overview), #/branches, #/exercises/00..06, #/decks, #/decks/short|full/N (viewer over the drawer), #/simulations (#/demo redirects there), #/risk.
   Every list can be empty (the public stub bundle has no exercises, decks or demo steps): nothing here may throw on [] or null. */
(function(){
'use strict';
const { $, $$, esc } = H;
H.initUI({ key:'A', theme:'dark' });
const main = $('#main'), drawer = $('#drawer'), scrim = $('#scrim'), drBody = $('#drBody'), drTabs = $('#drTabs'), drTitle = $('#drTitle'), viewer = $('#viewer');
const EX = CONTENT.exercises, S = H.S, wall = H.params.get('wall')==='1';
if(wall) document.body.classList.add('wall');
let viaKey = false;
H.log.length = 0;     // the sample event log in common.js is not live data; this page fills its own log from snapshot changes

/* live tag: its text and colour are set by Live.paint from the block's own asOf and error */
const blkTag = b => '<span class="src none" data-srcfor="'+b+'">Loading</span>';
const BRE = t => '<p class="muted bre">'+esc(t)+'</p>';          // the one empty-state pattern: dashed box, one sentence

/* ---------- boot: skip on reload within 10 minutes and under reduced motion ---------- */
let boot = !H.reduced();
try{ const t = +sessionStorage.getItem('hdA-boot'); if(t && Date.now()-t < 6e5) boot = false; sessionStorage.setItem('hdA-boot', Date.now()); }catch(e){}

/* ---------- overview ---------- */
const span = H.T.deadline - H.T.start, fr = d => ((d - H.T.start)/span*100).toFixed(2);
const liveMeters = (list, pfx, n) => { const top = list.slice().sort((a,b)=>b.v-a.v).slice(0,n), mx = Math.max(1, ...top.map(x=>x.v));
  return top.map(a => H.meter({key:pfx+a.n,label:a.n,mode:'total',max:mx,scale:mx,soft:0,hard:0})).join(''); };
let rolesAll = false, dynSig = '';

function renderMain(){
  main.innerHTML =
  '<section class="hero">'
  + '<div class="card hero-main flashbox" id="hero" data-enter><div class="card-h"><h2>Time to submission deadline</h2>'+H.src('live','LIVE · clock')+'</div>'
  +   '<div class="cd" id="cd" role="timer" aria-label="Time to the deadline, Sun 15 Nov 18:00 Athens"></div><div class="hero-words" id="words"></div>'
  +   '<div class="winwrap"><div class="winlabels"><span style="left:'+fr(H.T.submit)+'%;transform:translateX(-100%)">17:00 submit</span></div>'
  +   '<div class="wintrack"><div class="winbar" id="bar"><i class="fill"></i></div><i class="wintick" style="left:'+fr(H.T.freeze)+'%;top:0"></i><i class="wintick" style="left:'+fr(H.T.submit)+'%;top:0"></i></div>'
  +   '<div class="winlabels below"><span style="left:0">Sat 12:00 build start</span><span class="lf" style="left:'+fr(H.T.freeze)+'%;transform:translateX(-100%)">13:00 freeze</span><span style="right:0">18:00 deadline</span></div></div><div id="heroRepo"></div></div>'
  + '<div class="card now-panel" data-enter><div id="nowp"></div><div class="fc" id="fc" aria-live="polite"></div><div class="flags" id="flags" aria-live="polite"></div></div>'
  + '</section>'
  + '<section class="card dirs" id="dirs" data-enter aria-labelledby="dirsH"><div class="card-h"><span class="chip brand goal">Project goal</span><h2 id="dirsH">Five directions, in parallel</h2><span class="muted dcount mono" id="dirsN"></span></div>'
  +   '<ol class="dlist" id="dlist"></ol></section>'
  + '<div class="dyn" id="dyn"></div>';
  renderDyn(true);
}

/* the milestone band: B's M1 to M7 content in A's time-axis card. A segment is not a button: no click, the full text is its title. */
function bandHTML(){
  const head = '<div class="ladder-head"><span class="card-h" style="margin:0"><h2>Milestones · one time axis</h2>'+blkTag('linear')+'<span class="upd"></span></span>'
    + '<span class="mono ov"><span class="muted">OVERALL</span> <b id="overall">n/a</b> <span class="muted" id="overallN"></span></span></div><p class="blkmsg"></p>';
  if(!H.ms.length) return '<section class="card ladder-card blk" data-enter data-blk="linear">'+head+'<div class="bb">'+BRE('No milestones from the feed yet.')+'</div></section>';
  return '<section class="card ladder-card blk" data-enter data-blk="linear">'+head+'<div class="bb ladder"><div class="lsegs" id="lsegs">'+H.ms.map(m =>
    '<div class="lseg" data-m="'+esc(m.id)+'" style="flex:'+m.hours+' 1 0" title="'+esc(m.id+' · '+m.name+' · '+H.fmtWin(m)+' · gate: '+m.gate)+'">'
    + '<div class="ln"><span class="id">'+esc(m.id)+'</span><span class="cnt num"></span></div><div class="nm">'+esc(m.name)+'</div>'
    + '<div class="win">'+esc(H.fmtWin(m))+' · '+(Math.round(m.hours*10)/10)+' h</div><div class="gt"><b>Gate</b> '+esc(m.gate)+'</div>'
    + '<div class="meter"><i class="fill"></i></div><span class="gate" aria-hidden="true">◇</span></div>').join('')
    + '<div class="cursor" id="cursor" aria-hidden="true"></div></div><div class="laxis" id="laxis"><span id="ax0"></span><span id="ax1"></span><span id="ax2"></span></div></div></section>';
}

/* repo numbers (MIN-4569): twelve tiles from the feed's `repo` block. They sit in the empty area of the deadline card under the countdown (founder, 14 Nov: "here we can add
   numbers like branch nubers, prs, commits, lines of code"), and at the top of the Branches drawer. A field the feed did not read is "n/a, not reported yet", never 0;
   a feed with no repo block at all is one quiet sentence. The reason text comes from the feed, so it only goes through esc(). */
function repoCard(where){
  const hero = where==='hero', load = Live.loaded ? 'ok' : Live.feedErr ? 'error' : 'loading', rec = Live.rec.repo, v = RepoNumbers.view(DATA.repo, load, rec && rec.error && rec.error.message);
  const head = '<h2 id="'+(hero?'repoH':'repoDrH')+'">Repo numbers</h2>'+blkTag('repo')+'<span class="upd"></span>';
  const body = v.state==='ok'
    ? '<div class="rtiles" role="group" aria-label="Repo numbers">'+v.tiles.map(t =>
        '<div class="bt" data-id="'+esc(t.id)+'"'+(t.missing?' data-missing="1"':'')+'><span class="k">'+esc(t.k)+'</span><b'+(t.missing?' class="unk"':'')+'>'+esc(t.v)+'</b><span class="s">'+esc(t.s)+'</span></div>').join('')+'</div>'
    : BRE(v.empty);
  return hero
    ? '<section class="hero-repo blk" data-blk="repo" id="repo" aria-labelledby="repoH" data-state-view="'+v.state+'"><div class="hr-h">'+head+'</div>'+body+'</section>'
    : '<section class="card repo-card blk" data-enter data-blk="repo" id="repoDr" aria-labelledby="repoDrH" data-state-view="'+v.state+'"><div class="card-h">'+head+'</div>'+body+'</section>';
}

/* agent leaderboard (MIN-4584): every agent of tokens.perAgent is a row, ranked by tokens, time worked second. The model is shared/leaderboard.js. */
function leaderboard(){
  const load = Live.loaded ? 'ok' : Live.feedErr ? 'error' : 'loading', v = Leaderboard.view(DATA.tokens.perAgent, (DATA.agents||[]).map(a => a.n), load);
  if(v.state!=='ok') return BRE(v.empty);
  return '<ol class="lb" aria-label="Agents ranked by tokens used, then time worked">'+v.rows.map(r =>
    '<li class="lbrow'+(r.idle?' idle':'')+'" data-agent="'+esc(r.n)+'"'+(r.builtin?' data-builtin="1"':'')+'><span class="rk">'+r.rank+'</span>'
    + '<span class="nm"><b>'+esc(r.n)+'</b>'+(r.builtin?'<span class="tag">built-in agent</span>':'')+'</span>'
    + '<span class="tk'+(r.tokMissing?' na':'')+'" title="weighted tokens">'+esc(r.tokens)+'</span>'
    + '<span class="tm'+(r.timeMissing?' na':'')+'"'+(r.runs?' title="'+esc(r.runs)+'"':'')+'>'+esc(r.time)+'</span></li>').join('')+'</ol>';
}
function renderDyn(force){
  const dyn = $('#dyn'); if(!dyn) return;
  const sig = JSON.stringify([H.ms.map(m=>[m.id,m.name,m.start,m.end,m.gate,m.total,m.done]), DATA.tasks, DATA.tokens.perAgent, DATA.tokens.perChat, DATA.tokens.scope,
    DATA.money.credits, DATA.money.estimateEUR, DATA.money.estimateSeries, DATA.money.rateCard, DATA.agents, DATA.demo, rolesAll, DATA.repo, Live.loaded, Live.feedErr, Live.rec.repo]);
  if(!force && sig===dynSig) return; dynSig = sig;
  const tk = DATA.tokens, rc = DATA.money.rateCard, ag = DATA.agents;
  const rateNote = rc ? esc(rc.label||'estimate at API list price, not a bill')+'.'+(rc.aliased && Object.keys(rc.aliased).length ? ' '+Object.keys(rc.aliased).map(k=>esc(k.replace('claude-',''))).join(', ')+' priced at the nearest rate row.' : '') : '';
  const slot = $('#heroRepo'); if(slot) slot.innerHTML = repoCard('hero');
  dyn.innerHTML = bandHTML()
  + '<section class="panels">'
  + '<div class="card panel p-tasks blk" data-enter data-flash data-blk="linear"><div class="card-h"><h2>Tasks</h2>'+blkTag('linear')+'<span class="upd"></span></div><p class="blkmsg"></p><div class="body bb">'
  +   '<div class="segbar" id="segbar">'+H.TSEG.map(s=>'<i data-seg="'+s[0]+'" title="'+s[1]+'"></i>').join('')+'</div>'
  +   '<div class="leg">'+H.TSEG.map(s=>'<div data-flash><span class="sw '+s[2]+'"></span>'+s[1]+'<b class="num" data-v="t.'+s[0]+'"></b></div>').join('')+'</div>'
  +   '<div class="sub"><span>By role</span>'+(Object.keys(DATA.tasks.byRole||{}).length>3 ? '<button class="linkbtn" id="roleMore" aria-expanded="'+rolesAll+'">'+(rolesAll?'show top 5':'show all')+'</button>' : '')+'</div><div id="roles" class="roles'+(rolesAll?' all':'')+'">'+H.byRole()+'</div></div></div>'
  + '<div class="card panel p-tokens blk" data-enter data-blk="usage"><div class="card-h"><h2>Tokens · weighted</h2>'+blkTag('usage')+'<span class="upd"></span></div><p class="blkmsg"></p><div class="body compact bb">'
  +   '<div class="sub"><span>Agent leaderboard</span><span class="lbh">tokens · time worked</span></div>'+leaderboard()
  +   '<div class="sub"><span>Chats</span></div>'+liveMeters(tk.perChat,'tc.',4)
  +   '<p class="muted note">Weighted tokens since build start (in x1, cache write x2, cache read x0.1, out x5).'+(tk.scope?' Scope: '+esc(tk.scope)+'.':'')+'</p></div></div>'
  + '<div class="card panel p-money" data-enter><div class="card-h"><h2>Money</h2></div><div class="body compact">'
  +   '<div class="sec blk" data-blk="money"><div class="sub"><span>Est. spend, EUR</span><span class="subr">'+blkTag('money')+'<span class="upd"></span></span></div><p class="blkmsg"></p><div class="bb"><div class="stat" data-flash><span data-v="eur" data-f="eur"></span></div><div class="spark" id="spark"></div>'+(rateNote?'<p class="muted note">'+rateNote+'</p>':'')+'</div></div>'
  +   '<div class="sec blk" data-blk="hand"><div class="sub"><span>Credits consumed of granted</span><span class="subr">'+blkTag('hand')+'<span class="upd"></span></span></div><p class="blkmsg"></p><div class="bb">'+H.creditMeters()+'</div></div></div></div>'
  + '<div class="card panel p-who blk" data-enter data-blk="linear"><div class="card-h"><h2>Who is working</h2>'+blkTag('linear')+'<span class="upd"></span></div><p class="blkmsg"></p><div class="body bb">'
  +   '<div id="whoList"></div>'
  +   '<div class="sub"><span>Live log</span></div><div class="log" id="log" aria-live="off"></div></div></div>'
  + '</section>'
  + '<a class="strip" id="strip" href="#/simulations" aria-label="Open the doctor simulations"><span class="t">SIMULATIONS</span><span class="sv">'
  +   '<span><b class="num">'+SIMS.run.n.toLocaleString('en-US')+'</b> synthetic patients, <b class="num">'+SIMS.run.match_count+'</b> matches</span>'
  +   '<span class="muted">'+esc(SIMS.label)+'</span>'
  + '</span><span class="open">open ↗</span></a>';
  H.hydrate(dyn); H.paintTaskBar(dyn); Live.paint(dyn);
  paintSpark(); paintLog(); paintLadder(); Chat.paintCard();
}

function paintLadder(){
  const now = H.now(), cur = H.curMs(now);
  H.ms.forEach(m => { const el = $('.lseg[data-m="'+m.id+'"]'); if(!el) return;
    const d = S['m.'+m.id]||0, tot = m.total||0, met = tot>0 && d>=tot, late = tot>0 && !met && m.e<now;
    el.querySelector('.id').innerHTML = esc(m.id)+(met ? ' <span class="chk" role="img" aria-label="done">✓</span>' : '');
    el.querySelector('.cnt').textContent = tot ? d+' of '+tot+' done'+(late?' · late':'') : 'no issues';
    el.querySelector('.fill').style.setProperty('--f', (tot ? d/tot : 0).toFixed(3));
    const g = el.querySelector('.gate'); g.textContent = met||late ? '◆' : '◇'; g.className = 'gate'+(met?' met':late?' miss':'');
    el.classList.toggle('cur', m===cur); el.classList.toggle('fin', met); el.classList.toggle('late', late); });
  const ov = $('#overall'); if(!ov) return;
  const tot = DATA.tasks.total;
  ov.textContent = H.ms.length && tot ? H.donePct()+'%' : 'n/a'; $('#overallN').textContent = H.ms.length && tot ? S['t.done']+' of '+tot+' issues' : '';
  placeCursor();
}
/* x position (px inside .lsegs) of a moment: inside its own segment, so the min-width of the short blocks cannot skew it */
function xAt(t){
  const segs = H.ms.map(m => ({m, el:$('.lseg[data-m="'+m.id+'"]')})).filter(s => s.el); if(!segs.length) return null;
  for(const s of segs){ if(t < s.m.s) return s.el.offsetLeft; if(t <= s.m.e) return s.el.offsetLeft + (t - s.m.s)/(s.m.e - s.m.s)*s.el.offsetWidth; }
  const l = segs[segs.length-1].el; return l.offsetLeft + l.offsetWidth;
}
function placeCursor(){
  const cur = $('#cursor'), a0 = $('#ax0'); if(!cur || !H.ms.length) return;
  const x = xAt(H.now()); if(x===null) return;
  cur.style.transform = 'translateX('+(x-1)+'px)';
  const first = H.ms[0], last = H.ms[H.ms.length-1], w = $('#lsegs').offsetWidth;
  a0.textContent = first.start; a0.style.left = '0';
  const a2 = $('#ax2'); a2.textContent = last.end; a2.style.right = '0';
  const mid = xAt(H.parse('2026-11-15T00:00')), a1 = $('#ax1');
  if(mid!==null && mid>90 && mid<w-90){ a1.textContent = 'Sun 00:00'; a1.style.left = mid+'px'; a1.style.transform = 'translateX(-50%)'; a1.hidden = false; } else a1.hidden = true;
}
/* the five directions of the project goal: always five rows; what the feed does not report reads "not reported yet" (dashed, calm).
   The text of a note comes from the feed, so it only ever goes through esc(). Repainted once a second by the clock, written only when the markup changes. */
let lastDirs = '';
function paintDirections(){
  const el = $('#dlist'); if(!el) return;
  const v = Directions.view(DATA.directions, Date.now(), Live.loaded ? 'ok' : Live.feedErr ? 'error' : 'loading');
  const html = v.rows.map(r => '<li class="d '+(r.reported ? 'rep d-'+r.cls : 'unrep')+'" data-n="'+r.n+'"><span class="dn mono" aria-hidden="true">'+r.n+'</span>'
    + '<span class="dt">'+(r.titled ? '<span class="sr">Direction '+r.n+': </span>' : '')+esc(r.title)+'</span>'
    + (r.reported ? '<span class="chip '+r.cls+' dpill"><span class="g" aria-hidden="true">'+r.g+'</span>'+esc(r.word)+'</span>' : '<span class="dpill"></span>')
    + '<span class="dnote'+(r.reported ? '' : ' muted')+'"'+(r.reported && r.note ? ' title="'+esc(r.note)+'"' : '')+'>'+esc(r.note)+'</span>'
    + (r.updated ? '<span class="dupd mono muted">'+esc(r.updated)+'</span>' : '')+'</li>').join('');
  const n = $('#dirsN'); if(n && n.textContent !== v.count) n.textContent = v.count;
  if(html === lastDirs) return; lastDirs = html; el.innerHTML = html;
}
function paintNow(){
  const el = $('#nowp'); if(!el) return; const m = H.curMs();
  if(!m){ el.innerHTML = '<div class="micro">Now</div><p class="muted">No milestones from the feed yet.</p>'; return; }
  const i = H.ms.indexOf(m), n = H.ms[i+1];
  el.innerHTML = '<div class="micro">Now</div><div class="big"><span class="chip-now">NOW</span>'+esc(m.id)+' · '+esc(m.name)+'</div><div class="gate">gate: '+esc(m.gate)+'</div>'
    + '<div class="micro" style="margin-top:6px">Next</div><div class="gate"><b class="mono" style="color:var(--ink)">'+(n? esc(n.id)+' · '+esc(n.start) : 'Submit by 17:00')+'</b> · '+esc(n? n.gate : 'Deadline Sun 18:00')+'</div>';
}
let lastFcKey = '';
function paintForecast(){
  const box = $('#fc'); if(!box) return;
  const ds = Live.state('derived'), f = ds.s==='ok' ? H.forecast() : null;
  const blocked = f ? H.fcBlocked() : [], cut = f ? H.fcCut() : [];
  const key = f ? JSON.stringify([H.fcLine(), f.verdict, blocked, cut, f.cut_reaches_freeze]) : '';
  if(key===lastFcKey) return; lastFcKey = key;
  if(!f){ box.innerHTML = ''; return; }
  let h = '<div class="micro">Forecast</div><p class="fc-line">'+esc(H.fcLine())+'</p>';
  if(blocked.length) h += '<div class="micro">Blocked ('+blocked.length+')</div>' + blocked.map(b => '<div class="f warn"><span class="g" aria-hidden="true">▲</span><span><b class="mono">'+esc(b.id)+'</b> '+esc(b.title)+' waits on '
    + ((b.waits_on||[]).map(w => '<b class="mono">'+esc(w.id)+'</b> ('+esc(w.who)+')').join(', ') || 'an open issue')+'</span></div>').join('');
  if(cut.length) h += '<div class="micro">Cut, in this order</div><ol class="fc-cut">' + cut.map(c => '<li><b class="mono">'+esc(c.id)+'</b> '+esc(c.title)+' <span class="muted">'+esc(c.minutes)+' min, then finish '+esc(c.finish_after_label)+'</span></li>').join('') + '</ol>'
    + (f.cut_reaches_freeze===false ? '<p class="muted">Even cutting all of these does not get under the freeze.</p>' : '');
  box.innerHTML = h;
}
let lastFlagKey = '';
function paintFlags(){
  const box = $('#flags'); if(!box) return;
  const ds = Live.state('derived'), f = ds.s==='ok' ? H.flags() : [], key = ds.s+'|'+(ds.msg||'')+'|'+f.map(x=>x.id+x.level).join('|');
  if(key===lastFlagKey) return; lastFlagKey = key;
  if(ds.s!=='ok'){ box.innerHTML = '<div class="micro">Risk flags</div>' + (ds.msg ? '<div class="f"><span class="g" aria-hidden="true">○</span><span>'+esc(ds.msg)+'</span></div>' : ''); return; }
  box.innerHTML = '<div class="micro">Risk flags ('+f.length+') '+f.map(x=>'<span class="t-'+x.level+'">'+(x.level==='bad'?'■':'▲')+'</span>').join(' ')+'</div>'
    + (f.length ? f.slice(0,3).map(x=>'<div class="f '+x.level+'"><span class="g" aria-hidden="true">'+(x.level==='bad'?'■':'▲')+'</span><span>'+esc(x.text)+'</span></div>').join('') : '<div class="f ok"><span class="g">●</span><span>Nothing is flagged right now</span></div>')
    + (f.length>3 ? '<a class="linkbtn" href="#/risk">+'+(f.length-3)+' more</a>' : '');
}
const vchip = $('#verdict'); let lastV = null;
function paintVerdict(){
  const ds = Live.state('derived'); let key, cls, html, title = '';
  if(ds.s==='loading'){ key = 'loading'; cls = 'none'; html = '<span aria-hidden="true">○</span>Loading'; }
  else if(ds.s!=='ok'){ key = 'nodata'; cls = 'none'; html = '<span aria-hidden="true">○</span>No data yet'; title = ds.msg || ''; }
  else if(!H.ms.length && !DATA.tasks.total){ key = 'nodata'; cls = 'none'; html = '<span aria-hidden="true">○</span>No data yet'; title = 'No milestones or issues in the feed yet.'; }   // zero of nothing is not On track
  else { const v = H.verdict(), mt = H.verdictMeta[v]; key = v; cls = mt.cls; html = '<span aria-hidden="true">'+mt.g+'</span>'+mt.w; }
  vchip.title = title; if(key===lastV) return;
  const set = () => { vchip.className = 'vchip '+cls; vchip.innerHTML = html; };
  if(lastV===null || H.reduced()){ set(); } else { vchip.classList.add('swap'); setTimeout(()=>{ set(); vchip.classList.add('swap'); void vchip.offsetWidth; vchip.classList.remove('swap'); if(key==='off'){ vchip.classList.add('pulse'); setTimeout(()=>vchip.classList.remove('pulse'),400);} },100); }
  lastV = key;
}
function paintSpark(){
  const el = $('#spark'); if(!el) return;
  const s = H.eurSeries, n = s.length;
  if(n<2){ el.innerHTML = ''; return; }        // a trend needs two points; fewer is no chart at all
  const mx = Math.max(1, ...s), h = 28, pts = s.map((v,i)=>[i/(n-1)*100, h-(v/mx)*(h-3)-1]);
  let d = 'M'+pts[0][0]+','+pts[0][1]; for(let i=1;i<n;i++) d += ' H'+pts[i][0].toFixed(2)+' V'+pts[i][1].toFixed(2);
  el.innerHTML = '<svg viewBox="0 0 100 '+h+'" preserveAspectRatio="none" aria-label="Estimated spend so far, step line" role="img"><path d="'+d+' V'+h+' H0 Z" fill="var(--brand)" opacity=".12"/><path d="'+d+'" fill="none" stroke="var(--brand)" stroke-width="2" vector-effect="non-scaling-stroke"/></svg><i class="dotend" style="top:'+(pts[n-1][1]-3)+'px"></i>';
}
function paintLog(){
  const el = $('#log'); if(!el) return;
  el.innerHTML = H.log.length ? H.log.slice(0,5).map(l=>'<div><span>'+esc(l.at)+'</span><span>'+esc(l.t)+'</span></div>').join('') : '<div class="muted">No activity yet.</div>';
}
/* the log is built here from what changes between two snapshots (agent started, went idle, issues done); the feed sends no event list */
let prevAg = null, prevDone = null;
function logDiff(){
  if(!Live.loaded) return;
  const ags = {}; DATA.agents.forEach(a => ags[a.n] = { state:a.state, issue:a.issue }); const done = DATA.tasks.done || 0;
  if(prevAg){
    const ev = [];
    Object.keys(ags).forEach(n => { const a = ags[n], p = prevAg[n]; if(!p) return;
      if(a.state!==p.state) ev.push(n+(a.state==='active' ? ' started'+(a.issue && a.issue!=='-' ? ' on '+a.issue : '') : ' went idle'));
      else if(a.state==='active' && a.issue!==p.issue) ev.push(n+' moved to '+a.issue); });
    if(done>prevDone) ev.push((done-prevDone)+(done-prevDone===1?' issue':' issues')+' done, '+done+' of '+DATA.tasks.total);
    if(ev.length){ ev.reverse().forEach(t => H.log.unshift({ at:H.hhmm(H.now()), t })); H.log.length = Math.min(H.log.length, 12); paintLog(); }
  }
  prevAg = ags; prevDone = done;
}
/* a snapshot (or a feed failure) arrived: repaint everything that reads it, keep the open drawer's scroll */
H.on('live', () => {
  logDiff(); renderDyn(false); paintDirections(); paintLadder(); paintNow(); paintForecast(); paintFlags(); paintVerdict(); Live.paint();
  if(drawer.classList.contains('open') && ['branches','risk'].includes(route.v)) renderDrawer(true);
});

/* ---------- drawer ---------- */
let route = {v:'',a:'',b:''}, lastFocus = null, drawerKey = '';
const parse = () => { const p = location.hash.replace(/^#\/?/,'').split('/'); if(p[0]==='demo'){ p[0] = 'simulations'; history.replaceState(null,'','#/simulations'); }   // the Demo tab is gone: old links land on the simulations
  return {v:p[0]||'', a:p[1]||'', b:p[2]||''}; };
const exHref = i => '#/exercises/'+EX[i].n;
function moveInd(nomove){
  const t = $('.tabs',drTabs); if(!t) return; const cur = $('[aria-current="page"]',t), ind = $('.ind',t); if(!cur) return;
  t.classList.toggle('nomove', !!nomove);
  ind.style.transform = 'translateX('+cur.offsetLeft+'px) scaleX('+(cur.offsetWidth/100)+')';
}

/* branches: open, merged and closed branches of the repo, from the feed's `branches` block */
const LINEAR = 'https://linear.app/minhos/issue/';
const safeUrl = u => /^https:\/\/[^\s"'<>]+$/.test(u||'') ? u : '';
const rel = iso => { if(!iso) return ''; const ms = Date.now() - new Date(iso); if(isNaN(ms)) return ''; const m = Math.floor(ms/6e4);
  return m<1 ? 'just now' : m<60 ? m+' min ago' : m<1440 ? Math.floor(m/60)+' h ago' : Math.floor(m/1440)+' d ago'; };
const ab = (v, base) => v ? '<span class="ab" title="'+esc(v.ahead+' commit'+(v.ahead===1?'':'s')+' ahead of, '+v.behind+' behind '+base)+'"><b class="up">↑'+v.ahead+'</b> <span class="dn'+(v.behind>0?' behind':'')+'">↓'+v.behind+'</span></span>' : '<span class="muted" title="Not comparable with '+esc(base)+' (branch deleted)">gone</span>';
function branchRow(b, kind){
  const pr = b.pr, prState = pr ? String(pr.state||'').toLowerCase() : '', dim = b.state==='open' && b.vsMain && b.vsMain.ahead===0 && !b.onRemote;
  const prHtml = pr ? (safeUrl(pr.url) ? '<a class="prl" href="'+esc(pr.url)+'" target="_blank" rel="noopener">PR #'+esc(pr.number)+'<span class="sr"> (opens GitHub)</span></a>' : '<span class="prl">PR #'+esc(pr.number)+'</span>')
      + ' <span class="chip '+(prState==='merged'?'ok':prState==='open'?'brand':'')+' pst">'+esc(prState||'unknown')+'</span>'+(pr.base ? ' <span class="muted pbase">to '+esc(pr.base)+'</span>' : '') : '<span class="muted">no pull request</span>';
  const when = kind==='closed' && pr && (pr.mergedAt||pr.closedAt) ? (pr.mergedAt ? 'merged ' : 'closed ')+rel(pr.mergedAt||pr.closedAt) : b.lastCommitAt ? 'commit '+rel(b.lastCommitAt) : 'no commit time';
  const who = b.agent || b.lastCommitAuthor || '';
  const issue = b.issue && /^[A-Za-z]+-\d+$/.test(b.issue) ? '<a href="'+LINEAR+esc(b.issue)+'" target="_blank" rel="noopener">'+esc(b.issue)+'<span class="sr"> (opens Linear)</span></a>' : '<span class="muted">no issue</span>';
  return '<li class="brr'+(dim?' dim':'')+'"><div class="c n"><span class="bl">Branch</span><span class="bn mono" title="'+esc(b.name)+'">'+esc(b.name)+'</span>'
    + '<span class="flags">'+(b.hasWorktree ? '<span class="chip wt" title="A local worktree exists for this branch">worktree</span>' : '')+(b.state==='open' && !b.onRemote ? '<span class="chip loc" title="Not pushed to GitHub">local only</span>' : '')+(dim ? '<span class="chip" title="No commits of its own and not on GitHub">no commits yet</span>' : '')+'</span></div>'
    + '<div class="c p"><span class="bl">Pull request</span><span>'+prHtml+'</span></div>'
    + '<div class="c a"><span class="bl">vs staging</span>'+ab(b.vsStaging,'staging')+'</div>'
    + '<div class="c a"><span class="bl">vs main</span>'+ab(b.vsMain,'main')+'</div>'
    + '<div class="c f"><span class="bl">Files, lines</span><span class="mono num"><b>'+(b.files==null?'?':b.files)+'</b> f <span class="plus">+'+(b.added||0)+'</span> <span class="minus">−'+(b.removed||0)+'</span></span></div>'
    + '<div class="c w"><span class="bl">Last activity</span><span>'+esc(when)+(who ? ' <span class="muted">· '+esc(who)+'</span>' : '')+'</span></div>'
    + '<div class="c i"><span class="bl">Issue</span><span>'+issue+'</span></div></li>';
}
function branchesView(){
  const B = DATA.branches, t = (B && B.totals) || {}, items = (B && B.items) || [], open = items.filter(x=>x.state==='open'), closed = items.filter(x=>x.state!=='open'), noPr = !!B && B.prSource==='none';
  const err = B && Live.rec.branches && Live.rec.branches.error;
  const cnt = n => n==null ? '<b class="unk">'+(B ? 'unknown' : 'n/a')+'</b>' : '<b>'+n+'</b>';   // n/a: the feed sends no branches block at all
  const tiles = '<div class="brtot" role="group" aria-label="Branch totals">'
    + '<div class="bt"><span class="k">Open on GitHub</span>'+cnt(t.openOnRemote)+'<span class="s">pushed branches, not yet merged</span></div>'
    + '<div class="bt"><span class="k">Open incl. local</span>'+cnt(t.open)+'<span class="s">'+(t.open!=null && t.openOnRemote!=null ? (t.open-t.openOnRemote)+' only on this Mac' : 'with local-only branches')+'</span></div>'
    + '<div class="bt"><span class="k">Merged today</span>'+cnt(t.mergedToday)+'<span class="s">'+(t.merged==null ? 'pull request state unknown' : t.merged+' merged in all')+'</span></div>'
    + '<div class="bt"><span class="k">Closed</span>'+cnt(t.closed)+'<span class="s">closed without merging</span></div></div>';
  const emptyClosed = noPr ? 'Pull request state is unknown without GitHub access, so merged and closed branches are not listed.' : 'No merged or closed branches yet.';
  return '<p class="muted drintro">Which branches are open, what was merged, and how big each one is. Newest first.</p>'
    + repoCard('drawer')
    + '<section class="card brcard blk" data-blk="branches"><div class="card-h"><h2>'+esc((B && B.repo) || 'Branches')+'</h2>'+blkTag('branches')+'<span class="upd"></span></div><p class="blkmsg"></p>'
    + (err ? '<p class="brwarn" role="note"><b>Partial reading.</b> '+esc(err.message)+'. Pull request state may be missing; branch names, commits and file counts are from local git.</p>' : '')
    + tiles
    + '<h3 class="sub brsub">Open <span class="num">'+open.length+'</span></h3>'+(open.length ? '<ul class="brl">'+open.map(b=>branchRow(b,'open')).join('')+'</ul>' : BRE('No open branches.'))
    + '<h3 class="sub brsub">Merged and closed <span class="num">'+closed.length+'</span></h3>'+(closed.length ? '<ul class="brl">'+closed.map(b=>branchRow(b,'closed')).join('')+'</ul>' : BRE(emptyClosed))
    + (B && B.truncated ? '<p class="note muted">The list is cut to the newest branches. The totals above count every branch.</p>' : '')
    + (B ? '<p class="note muted">Read from git and GitHub on the Mac. Faded rows have no commits of their own and are not on GitHub. Compared with <span class="mono">'+esc((B.bases||['main','staging']).join('</span> and <span class="mono">'))+'</span>.</p>' : '')
    + '</section>';
}

/* decks: both pitch decks as posters, Present opens the full-screen viewer, Open the deck HTML (a local link, so empty on the public page) */
function decksView(){
  const ks = ['short','full'].filter(k => CONTENT.decks[k] && CONTENT.decks[k].slides.length);
  const deckBtn = '<p><a class="btn primary" id="deckLink" href="'+esc(H.deckUrl)+'" target="_blank" rel="noopener">Open the pitch deck ↗</a></p>';
  if(!ks.length) return '<p class="muted drintro">The pitch deck opens on its own page.</p>'+deckBtn;
  return deckBtn+'<p class="muted drintro">Two decks, equal weight. Thumbnails show the slide title and headline from the content files; the real HTML decks open from a local file link. '+H.src('none','SAMPLE · copied text')+'</p><div class="posters">'
    + ks.map(k => { const d = H.deckInfo(k); return '<article class="card poster" data-k="'+k+'">'+H.slideTile(k,0)+'<h3>'+esc(d.label)+' · '+d.slides.length+' slides</h3><p class="muted">'+esc(d.sub)+' · '+esc(d.ver)+'</p><div class="actions"><a class="btn primary" href="#/decks/'+k+'/1" data-present>Present ▸</a><a class="btn" href="'+esc(d.file)+'" target="_blank" rel="noopener" title="Opens the deck HTML from the pix-pitching-deck-draft worktree on this machine">Open ↗</a></div></article>'; }).join('')+'</div>';
}
let viewerT0 = 0, viewerTimer = 0;
const pad2 = n => String(n).padStart(2,'0');
function renderViewer(k, n){
  const d = H.deckInfo(k), tot = d.slides.length; if(!tot){ closeViewer(); return; } n = Math.min(tot, Math.max(1,n||1));
  const wasOpen = viewer.classList.contains('open');
  viewer.innerHTML = '<div class="vh"><a class="btn" href="#/decks" aria-label="Close viewer (Esc)">✕</a><b>'+esc(d.label)+'</b><span class="mono num">'+n+' / '+tot+'</span><span style="margin-left:auto" class="mono" title="Rehearsal clock, counts up from Present">⏱ <span id="vt">00:00</span></span>'
    + '<a class="btn" href="#/decks/'+k+'/'+Math.max(1,n-1)+'" aria-label="Previous slide">‹</a><a class="btn" href="#/decks/'+k+'/'+Math.min(tot,n+1)+'" aria-label="Next slide">›</a><button class="btn" id="vf" title="Fullscreen (f)">⛶</button></div>'
    + '<div class="vs"><div class="slidebox'+(wasOpen?' fade':'')+'">'+H.slideTile(k,n-1)+'</div></div>'
    + '<div class="notes">Speaker notes: in source, <span class="mono">'+esc(d.file.replace(/^.*docs\//,'docs/').replace('.html','-content.md'))+'</span></div>'
    + '<div class="dots">'+d.slides.map((s,j)=>'<i class="'+(j===n-1?'on':'')+'"></i>').join('')+'</div>'
    + '<div class="vr">'+d.slides.map((s,j)=>'<a href="#/decks/'+k+'/'+(j+1)+'"'+(j===n-1?' aria-current="true"':'')+' aria-label="Slide '+s.n+': '+esc(s.t)+'">'+H.slideTile(k,j,'thumb')+'</a>').join('')+'</div>';
  if(!wasOpen){ viewer.classList.add('open'); viewerT0 = Date.now(); clearInterval(viewerTimer); viewerTimer = setInterval(()=>{ const s = Math.floor((Date.now()-viewerT0)/1000), el = $('#vt'); if(el) el.textContent = pad2(Math.floor(s/60))+':'+pad2(s%60); }, 1000); }
  else { const s = Math.floor((Date.now()-viewerT0)/1000); $('#vt').textContent = pad2(Math.floor(s/60))+':'+pad2(s%60); }
  $('#vf').onclick = () => { if(document.fullscreenElement) document.exitFullscreen(); else if(viewer.requestFullscreen) viewer.requestFullscreen(); };
  const cur = $('.vr [aria-current]',viewer); if(cur) cur.scrollIntoView({block:'nearest',inline:'center'});
  if(!wasOpen) setTimeout(()=>$('.vh a',viewer).focus({preventScroll:true}),40);
}
function closeViewer(){ if(!viewer.classList.contains('open')) return; viewer.classList.remove('open'); clearInterval(viewerTimer); if(document.fullscreenElement) document.exitFullscreen(); }

/* doctor simulations (MIN-4600): recorded runs on seeded synthetic data, replayed from shared/sim-data.js (aggregates only, built by dashboard/build_sims.py).
   No feed and no key: the numbers are in the page. Every block carries the synthetic label; the 5,000 run also says it is a recording. */
const nf = n => Number(n).toLocaleString('en-US');
const dateOf = iso => new Date(iso).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric', timeZone:'UTC' });
const PHASE = { created:'Machine created', running:'Simulation ran', done:'Result written', deleted:'Machine deleted' };
function simsView(){
  const r = SIMS.run, g = SIMS.growth, f = r.funnel, lab = '<p class="simlabel">'+esc(SIMS.label)+'</p>';
  const steps = [[f.opted_in,'Opted in'],[f.share_min,'Share at least '+r.min_shared+' findings with the patient'],[f.exact,'Exact match'],[f.shown,'Shown as matches']];
  const mx = Math.max(1, ...g.rate_values);
  return '<p class="muted drintro">One synthetic patient looking for matches in a seeded network</p>'
    + '<section class="card simcard" aria-labelledby="simH1"><div class="card-h"><h2 id="simH1">The '+nf(r.n)+' run</h2></div>'
    +   lab+'<p class="simlabel">Recorded run on a '+esc(r.provider)+' machine, '+esc(dateOf(r.started_at))+'. Replayed here, not live.</p>'
    +   '<div class="kv"><span class="lbl">Machine</span><span class="mono">'+esc(r.machine)+'</span></div>'
    +   '<div class="kv"><span class="lbl">Size</span><span>'+esc(r.size)+(r.deleted?', deleted after the run':'')+'</span></div>'
    +   '<div class="kv"><span class="lbl">Total time</span><span class="mono">'+r.seconds+' s</span></div>'
    +   '<div class="kv"><span class="lbl">Seed</span><span class="mono">'+r.seed+'</span></div>'
    +   '<div class="kv"><span class="lbl">Rule</span><span>Groups of '+r.k+', at least '+r.min_shared+' shared findings</span></div>'
    +   '<h3 class="micro simsub">Funnel</h3><ol class="simfun">'+steps.map(x=>'<li><b class="mono num">'+nf(x[0])+'</b><span>'+esc(x[1])+'</span></li>').join('')+'</ol>'
    +   '<h3 class="micro simsub">Matches by country</h3><p class="simcty">'+r.by_country.map(c=>'<span class="chip brand"><b>'+esc(c[0])+'</b> '+c[1]+'</span>').join(' ')+'</p>'
    + '</section>'
    + '<section class="card simcard" aria-labelledby="simH2"><div class="card-h"><h2 id="simH2">Match rate as the network grows</h2></div>'
    +   lab+'<p class="simlabel">'+esc(g.label)+'.</p>'
    +   '<div class="kv"><span class="lbl">Seed</span><span class="mono">'+g.seed+'</span></div>'
    +   '<div class="kv"><span class="lbl">Rule</span><span>Groups of '+g.k+', at least '+g.min_shared+' shared findings, up to '+nf(g.cohort_size)+' records</span></div>'
    +   '<table class="simtbl"><thead><tr><th scope="col">'+esc(g.x_label)+'</th><th scope="col">'+esc(g.rate_label)+' ('+esc(g.rate_unit)+')</th></tr></thead><tbody>'
    +   g.x_values.map((x,i)=>'<tr><td class="mono num">'+nf(x)+'</td><td><span class="simbar" style="--w:'+(g.rate_values[i]/mx*100).toFixed(1)+'%"></span><b class="mono num">'+g.rate_values[i].toFixed(1)+'%</b></td></tr>').join('')
    +   '</tbody></table>'
    + '</section>';
}

function renderDrawer(soft){
  const r = route, key = r.v==='decks' ? 'decks' : r.v+'/'+r.a+'/'+r.b;
  if(soft && key!==drawerKey) return;
  if(!soft && r.v==='decks' && key===drawerKey && drawer.classList.contains('open')) return;   // moving between slides must not rebuild the posters
  const keep = drBody.scrollTop;
  let tabs = '', html = '', title = '';
  if(r.v==='branches'){
    title = 'Branches'; html = branchesView();
  } else if(r.v==='exercises'){
    title = 'Exercises';
    if(!EX.length){ html = BRE('The workshop pages are not published on this page yet.'); }
    else { const i = EX.findIndex(e=>e.n===r.a), idx = i<0 ? 0 : i;
      tabs = '<div class="tabs" role="navigation" aria-label="Exercise pages">'+EX.map((e,j)=>'<a href="'+exHref(j)+'" title="'+esc(e.t)+'"'+(j===idx?' aria-current="page"':'')+'>'+e.n+'</a>').join('')+'<i class="ind"></i></div>';
      html = H.exercisePage(idx,{href:exHref}) + '<p class="muted mono" style="font-size:11px;margin-top:12px">keys: 0 to 6 jump a page · j / k scroll · Esc close</p>'; }
  } else if(r.v==='decks'){
    title = 'Decks'; html = decksView();
  } else if(r.v==='simulations'){
    title = 'Doctor simulations'; html = simsView();
  } else if(r.v==='chat'){
    title = 'Chat \u00B7 '+(r.a||'');
  } else if(r.v==='risk'){
    title = 'Risk flags'; const f = Live.state('derived').s==='ok' ? H.flags() : [];
    html = (f.length ? f.map(x=>'<div class="risk-item"><span class="chip '+(x.level==='bad'?'bad':'warn')+'"><span class="g">'+(x.level==='bad'?'■':'▲')+'</span>'+(x.level==='bad'?'Late':'Risk')+'</span><div>'+esc(x.text)+(x.act?'<div class="muted" style="font-size:13px">'+esc(x.act)+'</div>':'')+'</div></div>').join('') : '<p>Nothing is flagged right now.</p>')
      + '<p class="muted" style="font-size:13px;margin-top:12px">Rules: a milestone window that ended with open issues, credits over 70% used, and the flags set by hand.</p>';
  }
  drawerKey = key; drTitle.textContent = title; drTabs.innerHTML = tabs; drBody.innerHTML = html;
  drawer.classList.toggle('chat', r.v==='chat');
  if(r.v==='chat') Chat.mount(drBody, decodeURIComponent(r.a||'')); else Chat.unmount();
  if(r.v==='exercises' && EX.length){ H.wireExercise(drBody, drBody); }
  if(r.v==='decks'){ $$('[data-present]',drBody).forEach(a => a.addEventListener('click', () => { const rc = a.closest('.poster').getBoundingClientRect(); viewer.style.setProperty('--ox', (rc.left+rc.width/2)+'px'); viewer.style.setProperty('--oy', (rc.top+rc.height/2)+'px'); })); }
  Live.paint(drBody);
  if(soft) drBody.scrollTop = keep;
}
function applyRoute(){
  const prev = route; route = parse();
  const open = ['branches','exercises','decks','simulations','risk','chat'].includes(route.v);
  $$('#rail a').forEach(a => a.removeAttribute('aria-current')); const rv = open ? (route.v==='risk'||route.v==='chat'?null:route.v) : 'overview'; if(rv) $('#rail a[data-view="'+rv+'"]').setAttribute('aria-current','page');
  const kbd = viaKey; viaKey = false;
  drawer.classList.toggle('instant', kbd); scrim.classList.toggle('instant', kbd);
  if(open){
    const wasOpen = drawer.classList.contains('open');
    if(!wasOpen) lastFocus = document.activeElement;
    const sameView = prev.v===route.v;
    renderDrawer(false);
    if(wasOpen && !kbd && sameView && route.v!=='decks'){ drBody.classList.remove('fade'); void drBody.offsetWidth; drBody.classList.add('fade'); }
    drawer.classList.add('open'); scrim.classList.add('open'); drawer.setAttribute('aria-hidden','false');
    if(!wasOpen){ drBody.scrollTop = 0; setTimeout(()=>{ const ta = route.v==='chat' && $('#chatText'); (ta && !ta.disabled ? ta : $('#drClose')).focus({preventScroll:true}); }, kbd?0:30); } else if(sameView && route.v==='exercises'){ drBody.scrollTop = 0; }
    if(route.v==='exercises') requestAnimationFrame(()=>moveInd(!sameView || kbd || !wasOpen));
    main.setAttribute('inert','');
  } else {
    drawer.classList.remove('open'); scrim.classList.remove('open'); drawer.setAttribute('aria-hidden','true'); main.removeAttribute('inert'); Chat.unmount();
    if(lastFocus && document.contains(lastFocus)){ try{ lastFocus.focus({preventScroll:true}); }catch(e){} } lastFocus = null; drawerKey = '';
  }
  const dk = route.v==='decks' && (route.a==='short' || route.a==='full') ? route.a : null;
  if(dk && CONTENT.decks[dk].slides.length) renderViewer(dk, +route.b||1); else closeViewer();
}
window.addEventListener('hashchange', applyRoute);
$('#drClose').addEventListener('click', () => { location.hash = '#/'; });
scrim.addEventListener('click', () => { location.hash = '#/'; });
document.addEventListener('keydown', e => {
  if(e.metaKey||e.ctrlKey||e.altKey) return;
  const t = e.target; if(t && /^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName)) return;
  if(viewer.classList.contains('open')){
    const k = route.a==='full'?'full':'short', n = +route.b||1, tot = CONTENT.decks[k].slides.length;
    if(e.key==='Escape'){ location.hash = '#/decks'; }
    else if(e.key==='ArrowRight'){ location.hash = '#/decks/'+k+'/'+Math.min(tot,n+1); } else if(e.key==='ArrowLeft'){ location.hash = '#/decks/'+k+'/'+Math.max(1,n-1); }
    else if(e.key==='f'){ $('#vf').click(); }
    return;
  }
  const open = drawer.classList.contains('open');
  if(e.key==='Escape' && open){ viaKey = true; location.hash = '#/'; return; }
  if(e.key==='j' && open){ drBody.scrollBy({top:140}); return; }
  if(e.key==='k' && open){ drBody.scrollBy({top:-140}); return; }
  if(e.key==='w'){ document.body.classList.toggle('wall'); startWall(); return; }
  if(open && route.v==='exercises' && /^[0-6]$/.test(e.key) && EX.some(x=>x.n==='0'+e.key)){ viaKey = true; location.hash = '#/exercises/0'+e.key; return; }
  const map = {'1':'#/','2':'#/branches','3':'#/exercises/00','4':'#/decks','5':'#/simulations'};
  if(map[e.key]){ viaKey = true; location.hash = map[e.key]; }
});

/* ---------- wall mode: a 1px outline moves to the next panel every 20 s ---------- */
let wallTimer = 0;
function startWall(){
  clearInterval(wallTimer); $$('.hl').forEach(x=>x.classList.remove('hl'));
  if(!document.body.classList.contains('wall')) return;
  const items = ['#hero','#dirs','.ladder-card','.p-tasks','.p-tokens','.p-money','.p-who'].map(s=>$(s)).filter(Boolean); let i = 0;
  items[0].classList.add('hl'); if(H.reduced()) return;
  wallTimer = setInterval(()=>{ items[i].classList.remove('hl'); i = (i+1)%items.length; items[i].classList.add('hl'); }, 20000);
}

/* ---------- boot ---------- */
H.tickUpd = () => Live.paint();     // the 1 s loop in common.js: block ages, "Mac silent", header status
let lastMin = -1;
renderMain();
H.hero({ el:$('#cd'), root:$('#hero'), bar:$('.winbar'), words:$('#words'), onTick:(now)=>{
  $('#clock').textContent = H.clockStr(now) + (H.overridden?' (?now)':'');
  const cm = H.curMs(now), id = cm ? cm.id : '';
  if(now.getSeconds()===0 || H._cur!==id){ H._cur = id; paintLadder(); paintNow(); }
  paintForecast(); paintFlags(); paintVerdict(); paintDirections();
  const m = now.getMinutes(); if(m!==lastMin){ lastMin = m; if(drawer.classList.contains('open') && route.v==='branches') renderDrawer(true); } } });
paintDirections(); paintLadder(); paintNow(); paintForecast(); paintFlags(); paintVerdict(); paintSpark(); paintLog(); Live.paint();
window.addEventListener('resize', placeCursor);
main.addEventListener('click', e => {
  if(e.target.closest('#roleMore')){ rolesAll = !rolesAll; renderDyn(true); }
});
if(boot){
  document.body.classList.add('booting'); H.enter(main);
  $$('.lseg .fill').forEach((f,i)=>{ f.style.transitionDelay = (i*40)+'ms'; setTimeout(()=>f.style.transitionDelay='',900); });
}
const feed = Feed.start({ paused:() => H.sim.paused, onSnapshot:s => Live.apply(s), onError:e => Live.fail(e) });
document.addEventListener('click', e => { if(e.target.closest('[data-act="pause"]') && !H.sim.paused) feed.refresh(); Live.paint(); });
applyRoute();
if(wall) startWall();
})();
