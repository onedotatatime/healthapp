/* Direction A · Mission Control. Hash routes: #/ (overview), #/exercises/00..06, #/decks/short|full/N, #/demo, #/risk */
(function(){
'use strict';
const { $, $$, esc } = H;
H.initUI({ key:'A', theme:'dark' });
const main = $('#main'), drawer = $('#drawer'), scrim = $('#scrim'), drBody = $('#drBody'), drTabs = $('#drTabs'), drTitle = $('#drTitle');
const EX = CONTENT.exercises, wall = H.params.get('wall')==='1';
if(wall) document.body.classList.add('wall');
let viaKey = false;

/* ---------- boot: skip on reload within 10 minutes and under reduced motion ---------- */
let boot = !H.reduced();
try{ const t = +sessionStorage.getItem('hdA-boot'); if(t && Date.now()-t < 6e5) boot = false; sessionStorage.setItem('hdA-boot', Date.now()); }catch(e){}

/* ---------- overview ---------- */
const span = H.T.deadline - H.T.start, fr = d => ((d - H.T.start)/span*100).toFixed(2);
const sumDone = () => H.ms.reduce((s,m)=>s+H.S['m.'+m.id],0);
function renderMain(){
  const tk = DATA.tokens, cred = DATA.money.credits;
  main.innerHTML =
  '<section class="hero">'
  + '<div class="card hero-main flashbox" id="hero" data-enter><div class="card-h"><h2>Time to submission deadline</h2>'+H.src('live','LIVE · clock')+'</div>'
  +   '<div class="cd" id="cd" role="timer" aria-label="Time to the deadline, Sun 15 Nov 18:00 Athens"></div><div class="hero-words" id="words"></div>'
  +   '<div class="winwrap"><div class="winlabels"><span style="left:'+fr(H.T.submit)+'%;transform:translateX(-100%)">17:00 submit</span></div>'
  +   '<div class="wintrack"><div class="winbar" id="bar"><i class="fill"></i></div><i class="wintick" style="left:'+fr(H.T.freeze)+'%;top:0"></i><i class="wintick" style="left:'+fr(H.T.submit)+'%;top:0"></i></div>'
  +   '<div class="winlabels below"><span style="left:0">Sat 12:00 build start</span><span class="lf" style="left:'+fr(H.T.freeze)+'%;transform:translateX(-100%)">13:00 freeze</span><span style="right:0">18:00 deadline</span></div></div></div>'
  + '<div class="card now-panel" data-enter><div id="nowp"></div><div class="flags" id="flags" aria-live="polite"></div></div>'
  + '</section>'
  + '<section class="card ladder-card" data-enter><div class="ladder-head"><span class="card-h" style="margin:0"><h2>Milestones · one time axis</h2></span><span class="mono" style="font-size:12px"><span class="muted">OVERALL</span> <b id="overall">0%</b> <span class="muted" id="overallN"></span> '+H.src('none','SAMPLE · Linear')+'</span></div>'
  +   '<div class="ladder"><div class="lsegs" id="lsegs">'+H.ms.map(m =>
        '<div class="lseg" data-m="'+m.id+'" style="flex:'+m.hours+' 1 0" title="'+esc(m.id+' · '+m.name+' · '+H.fmtWin(m)+' · gate: '+m.gate)+'"><div class="ln"><span>'+m.id+'</span><span class="cnt num"></span></div><div class="nm">'+esc(m.name)+'</div><div class="meter"><i class="fill"></i></div><span class="gate" aria-hidden="true">◇</span></div>').join('')
  +   '<div class="cursor" id="cursor" aria-hidden="true"></div></div>'
  +   '<div class="laxis"><span style="left:0">Sat 15:00</span><span style="left:'+((9/27)*100).toFixed(2)+'%;transform:translateX(-50%)">Sun 00:00</span><span style="right:0">Sun 18:00</span></div></div></section>'
  + '<section class="panels">'
  + '<div class="card panel p-tasks" data-enter data-flash><div class="card-h"><h2>Tasks</h2>'+H.src('none','SAMPLE · Linear')+'<span class="upd"></span></div><div class="body">'
  +   '<div class="segbar" id="segbar">'+H.TSEG.map(s=>'<i data-seg="'+s[0]+'" title="'+s[1]+'"></i>').join('')+'</div>'
  +   '<div class="leg">'+H.TSEG.map(s=>'<div data-flash><span class="sw '+s[2]+'"></span>'+s[1]+'<b class="num" data-v="t.'+s[0]+'"></b></div>').join('')+'</div>'
  +   '<div class="sub">By role <button class="linkbtn" id="roleMore" aria-expanded="false">show all</button></div><div id="roles">'+H.byRole()+'</div></div></div>'
  + '<div class="card panel p-tokens" data-enter><div class="card-h"><h2>Tokens · weighted</h2>'+H.src('none')+'<span class="upd"></span></div><div class="body compact">'
  +   '<div class="sub">Agents <span><button class="linkbtn" id="agMore" aria-expanded="false">show 10</button></span></div><div id="agMeters">'+H.agentMeters(5)+'</div>'
  +   '<div class="sub">Chats · soft '+H.k(tk.chatCaps.soft)+' · hard '+H.k(tk.chatCaps.hard)+'</div>'+H.chatMeters()+'</div></div>'
  + '<div class="card panel p-money" data-enter data-flash><div class="card-h"><h2>Money</h2>'+H.src('none')+'<span class="upd"></span></div><div class="body compact">'
  +   '<div class="micro">Est. spend, EUR</div><div class="stat" data-flash><span data-v="eur" data-f="eur"></span></div><div class="spark" id="spark"></div>'
  +   '<div class="sub">Credits left of granted</div>'+H.creditMeters()+'</div></div>'
  + '<div class="card panel p-who" data-enter><div class="card-h"><h2>Who is working</h2>'+H.src('none','SAMPLE · Linear')+'<span class="upd"></span></div><div class="body">'
  +   DATA.agents.slice(0,5).map(H.agentRow).join('')+'<div class="muted" style="font:500 11px/16px var(--mono);padding:2px 4px">+'+(DATA.agents.length-5)+' more, idle: '+DATA.agents.slice(5).map(a=>esc(a.n)).join(', ')+'</div><div class="sub">Live log</div><div class="log" id="log" aria-live="off"></div></div></div>'
  + '</section>'
  + '<a class="strip" id="strip" href="#/demo" aria-label="Open the demo product drawer"><span class="t">DEMO</span><span><span class="g '+DATA.demo.build.state+'">●</span> build passed '+esc(DATA.demo.build.at)+'</span><span><span class="g warn">▲</span> deploy: deploying</span>'
  +   '<span>clean runs <b data-v="clean"></b>/'+DATA.demo.cleanTarget+'</span><span class="steps" title="The 8 steps">'+DATA.demo.steps.map(s=>'<span class="g '+s.s+'">'+H.ragGlyph(s.s)+'</span>').join('')+'</span><span class="open">open ↗</span></a>';
  H.hydrate(main);
  H.paintTaskBar(main);
}
function paintLadder(){
  H.ms.forEach(m => { const el = $('.lseg[data-m="'+m.id+'"]'); if(!el) return; const d = H.S['m.'+m.id], now = H.now();
    el.querySelector('.cnt').textContent = d+'/'+m.total;
    el.querySelector('.fill').style.setProperty('--f', (d/m.total).toFixed(3));
    const g = el.querySelector('.gate'); const met = d>=m.total, miss = !met && m.e<now;
    g.textContent = met ? '◆' : miss ? '◆' : '◇'; g.className = 'gate'+(met?' met':miss?' miss':'');
    el.classList.toggle('cur', m===H.curMs()); });
  const done = H.S['t.done'];
  $('#overall').textContent = H.donePct()+'%'; $('#overallN').textContent = done+' of '+DATA.tasks.total+' issues';
  placeCursor();
}
function placeCursor(){
  const now = H.now(), cur = $('#cursor'), segs = $('#lsegs'); if(!cur) return;
  const m = H.curMs(now), el = $('.lseg[data-m="'+m.id+'"]');
  const p = Math.min(1, Math.max(0, (now - m.s)/(m.e - m.s)));
  cur.style.transform = 'translateX('+(el.offsetLeft + p*el.offsetWidth - 1)+'px)';
}
function paintNow(){
  const m = H.curMs(), i = H.ms.indexOf(m), n = H.ms[i+1];
  $('#nowp').innerHTML = '<div class="micro">Now</div><div class="big"><span class="chip-now">NOW</span>'+m.id+' · '+esc(m.name)+'</div><div class="gate">gate: '+esc(m.gate)+'</div>'
    + '<div class="micro" style="margin-top:6px">Next</div><div class="gate"><b class="mono" style="color:var(--ink)">'+(n? n.id+' · '+n.start : 'Submit by 17:00')+'</b> · '+esc(n? n.gate : 'Deadline Sun 18:00')+'</div>';
}
let lastFlagKey = '';
function paintFlags(){
  const f = H.flags(), key = f.map(x=>x.id+x.level).join('|');
  if(key===lastFlagKey) return; lastFlagKey = key;
  $('#flags').innerHTML = '<div class="micro">Risk flags ('+f.length+') '+f.map(x=>'<span class="t-'+x.level+'">'+(x.level==='bad'?'■':'▲')+'</span>').join(' ')+'</div>'
    + (f.length ? f.slice(0,3).map(x=>'<div class="f '+x.level+'"><span class="g" aria-hidden="true">'+(x.level==='bad'?'■':'▲')+'</span><span>'+esc(x.text)+'</span></div>').join('') : '<div class="f ok"><span class="g">●</span><span>Nothing is flagged right now</span></div>')
    + (f.length>3 ? '<a class="linkbtn" href="#/risk">+'+(f.length-3)+' more</a>' : '');
}
const vchip = $('#verdict'); let lastV = null;
function paintVerdict(){
  const v = H.verdict(), mt = H.verdictMeta[v]; if(v===lastV) return;
  const set = () => { vchip.className = 'vchip '+mt.cls; vchip.innerHTML = '<span aria-hidden="true">'+mt.g+'</span>'+mt.w; };
  if(lastV===null || H.reduced()){ set(); } else { vchip.classList.add('swap'); setTimeout(()=>{ set(); vchip.classList.add('swap'); void vchip.offsetWidth; vchip.classList.remove('swap'); if(v==='off'){ vchip.classList.add('pulse'); setTimeout(()=>vchip.classList.remove('pulse'),400);} },100); }
  lastV = v;
}
function paintSpark(){
  const s = H.eurSeries, mx = Math.max(...s), n = s.length, h = 28;
  const pts = s.map((v,i)=>[i/(n-1)*100, h-(v/mx)*(h-3)-1]);
  let d = 'M'+pts[0][0]+','+pts[0][1]; for(let i=1;i<n;i++) d += ' H'+pts[i][0].toFixed(2)+' V'+pts[i][1].toFixed(2);
  $('#spark').innerHTML = '<svg viewBox="0 0 100 '+h+'" preserveAspectRatio="none" aria-label="Estimated spend so far, step line" role="img"><path d="'+d+' V'+h+' H0 Z" fill="var(--brand)" opacity=".12"/><path d="'+d+'" fill="none" stroke="var(--brand)" stroke-width="2" vector-effect="non-scaling-stroke"/></svg><i class="dotend" style="top:'+(pts[n-1][1]-3)+'px"></i>';
}
function paintLog(first){
  const el = $('#log'); if(!el) return;
  el.innerHTML = H.log.slice(0,5).map(l=>'<div><span>'+esc(l.at)+'</span><span>'+esc(l.t)+'</span></div>').join('');
}
H.on('log', () => { const el = $('#log'); if(!el) return; const l = H.log[0], row = document.createElement('div'); row.innerHTML = '<span>'+esc(l.at)+'</span><span>'+esc(l.t)+'</span>'; row.className = 'enter'; el.prepend(row);
  const rows = el.children; if(rows.length>5){ const last = rows[rows.length-1]; last.classList.add('out'); setTimeout(()=>last.remove(), 200); } });
let raf = 0;
H.on('change', key => { if(raf) return; raf = requestAnimationFrame(() => { raf = 0; if(!$('#lsegs')) return; paintLadder(); H.paintTaskBar(main); paintFlags(); paintVerdict(); paintNow(); if(route.v==='risk') renderDrawer(true); }); });
H.on('series', paintSpark);

/* ---------- drawer ---------- */
let route = {v:'',a:'',b:''}, lastFocus = null, drawerKey = '';
const parse = () => { const p = location.hash.replace(/^#\/?/,'').split('/'); return {v:p[0]||'', a:p[1]||'', b:p[2]||''}; };
const exHref = i => '#/exercises/'+EX[i].n;
function moveInd(nomove){
  const t = $('.tabs',drTabs); if(!t) return; const cur = $('[aria-current="page"]',t), ind = $('.ind',t); if(!cur) return;
  t.classList.toggle('nomove', !!nomove);
  ind.style.transform = 'translateX('+cur.offsetLeft+'px) scaleX('+(cur.offsetWidth/100)+')';
}
function renderDrawer(soft){
  const r = route, key = r.v+'/'+r.a+'/'+r.b;
  if(soft && key!==drawerKey) return;
  const keep = drBody.scrollTop;
  let tabs = '', html = '', title = '';
  if(r.v==='exercises'){
    title = 'Exercises'; const i = Math.max(0, EX.findIndex(e=>e.n===r.a)), idx = i<0?0:i;
    tabs = '<div class="tabs" role="navigation" aria-label="Exercise pages">'+EX.map((e,j)=>'<a href="'+exHref(j)+'" title="'+esc(e.t)+'"'+(j===idx?' aria-current="page"':'')+'>'+e.n+'</a>').join('')+'<i class="ind"></i></div>';
    html = H.exercisePage(idx,{href:exHref}) + '<p class="muted mono" style="font-size:11px;margin-top:12px">keys: 0 to 6 jump a page · j / k scroll · Esc close</p>';
  } else if(r.v==='decks'){
    title = 'Decks'; const k = r.a==='full'?'full':'short', d = H.deckInfo(k), n = Math.min(d.slides.length, Math.max(1, +r.b||1)), idx = n-1;
    tabs = '<div class="seg" style="margin-right:auto"><a href="#/decks/full" '+(k==='full'?'aria-current="page"':'')+'>Pitch deck · 13 slides</a><a href="#/decks/short" '+(k==='short'?'aria-current="page"':'')+'>Short pitch · 6 slides · 90 s</a></div>';
    html = '<div class="stage-wrap"><div class="stage" id="stage">'+H.slideTile(k,idx)+'<div class="stage-nav"><a class="btn" href="#/decks/'+k+'/'+Math.max(1,n-1)+'">‹ Prev</a><b class="mono num">'+n+' / '+d.slides.length+'</b><a class="btn" href="#/decks/'+k+'/'+Math.min(d.slides.length,n+1)+'">Next ›</a>'
      + '<a class="btn" href="'+d.file+'" target="_blank" rel="noopener" title="The deck HTML lives in the pix-pitching-deck-draft worktree; it is not copied here">Open full ↗</a></div>'
      + '<p class="muted" style="margin-top:10px;font-size:13px">Updated: '+esc(d.ver)+'. Stage shows the slide title and headline from the deck content file; the real deck opens in a new tab.</p></div>'
      + '<div class="film" aria-label="Slides">'+d.slides.map((s,j)=>'<a href="#/decks/'+k+'/'+(j+1)+'"'+(j===idx?' aria-current="true"':'')+' aria-label="Slide '+s.n+': '+esc(s.t)+'">'+H.slideTile(k,j,'thumb')+'</a>').join('')+'</div></div>';
  } else if(r.v==='demo'){
    title = 'Demo product'; const dm = DATA.demo;
    tabs = '<span style="margin-left:auto">'+H.src('none')+'</span>';
    html = '<div class="kv"><span class="lbl">Build</span><span>'+H.rag(dm.build.state,dm.build.label+' '+dm.build.at)+'</span></div>'
      + '<div class="kv"><span class="lbl">Deploy</span><span>'+H.rag(dm.deploy.state,dm.deploy.label)+'</span></div>'
      + '<div class="kv"><span class="lbl">Link</span><span style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><span class="chip warn"><span class="g">▲</span>Live: deploying</span><span class="mono">'+esc(dm.url)+'</span><button class="btn" id="copyLink">Copy</button><span class="btn" aria-disabled="true" style="opacity:.5" title="Sample link">Open ↗</span></span></div>'
      + '<div class="kv"><span class="lbl">Clean runs</span><span style="display:flex;gap:14px;align-items:center;flex-wrap:wrap"><span class="runs" id="runs"></span><b class="mono"><span data-v="clean"></span> of '+dm.cleanTarget+'</b><span class="muted">Last run: not yet</span>'
      + '<button class="btn" id="runClean" title="Draft only, does not persist">Mark run clean</button><button class="btn" id="runFail" title="Draft only">Fail a step</button><span class="chip">Draft only</span></span></div>'
      + '<h3 class="micro" style="margin:20px 0 4px">The 8 steps</h3>'+dm.steps.map(s=>'<div class="steprow"><span class="n">'+s.n+'</span><span>'+esc(s.t)+'<div class="muted" style="font-size:12px;line-height:16px">'+esc(dm.notes[s.n])+'</div></span>'+H.rag(s.s)+'</div>').join('')
      + '<p class="muted" style="margin-top:14px;font-size:13px">Set by hand by the CTO or Release after each run (MIN-4445 item 2).</p>';
  } else if(r.v==='risk'){
    title = 'Risk flags'; const f = H.flags();
    html = (f.length ? f.map(x=>'<div class="risk-item"><span class="chip '+(x.level==='bad'?'bad':'warn')+'"><span class="g">'+(x.level==='bad'?'■':'▲')+'</span>'+(x.level==='bad'?'Late':'Risk')+'</span><div>'+esc(x.text)+(x.act?'<div class="muted" style="font-size:13px">'+esc(x.act)+'</div>':'')+'</div></div>').join('') : '<p>Nothing is flagged right now.</p>')
      + '<p class="muted" style="font-size:13px;margin-top:12px">Rules: a chat or agent at 90% of its soft cap, credits under 30% left, a milestone window that ended with open issues.</p>';
  }
  drawerKey = key; drTitle.textContent = title; drTabs.innerHTML = tabs; drBody.innerHTML = html;
  if(r.v==='exercises'){ H.wireExercise(drBody, drBody); }
  if(r.v==='demo'){ paintRuns(); const cl = $('#copyLink'); if(cl) cl.onclick = async () => { const ok = await H.copy(DATA.demo.url.replace(' (sample)','')); cl.textContent = ok?'Copied':'Copy failed'; setTimeout(()=>cl.textContent='Copy',1500); };
    $('#runClean').onclick = () => { if(H.S.clean<DATA.demo.cleanTarget){ H.set('clean', H.S.clean+1); paintRuns(); } };
    $('#runFail').onclick = () => { H.set('clean',0); paintRuns(); const rn=$('#runs'); rn.classList.remove('fail'); void rn.offsetWidth; rn.classList.add('fail'); }; H.hydrate(drBody); }
  if(soft) drBody.scrollTop = keep;
}
function paintRuns(){ const el = $('#runs'); if(el) el.innerHTML = Array.from({length:DATA.demo.cleanTarget},(_,i)=>'<i class="'+(i<H.S.clean?'on':'')+'"></i>').join(''); }
function applyRoute(){
  const prev = route; route = parse();
  const open = ['exercises','decks','demo','risk'].includes(route.v);
  $$('#rail a').forEach(a => a.removeAttribute('aria-current')); const rv = open ? (route.v==='risk'?null:route.v) : 'overview'; if(rv) $('#rail a[data-view="'+rv+'"]').setAttribute('aria-current','page');
  const kbd = viaKey; viaKey = false;
  drawer.classList.toggle('instant', kbd); scrim.classList.toggle('instant', kbd);
  if(open){
    const wasOpen = drawer.classList.contains('open');
    if(!wasOpen) lastFocus = document.activeElement;
    const sameView = prev.v===route.v;
    renderDrawer(false);
    if(wasOpen && !kbd && sameView){ drBody.classList.remove('fade'); void drBody.offsetWidth; drBody.classList.add('fade'); }
    drawer.classList.add('open'); scrim.classList.add('open'); drawer.setAttribute('aria-hidden','false');
    if(!wasOpen){ drBody.scrollTop = 0; setTimeout(()=>$('#drClose').focus({preventScroll:true}), kbd?0:30); } else if(sameView && route.v==='exercises'){ drBody.scrollTop = 0; }
    if(route.v==='exercises') requestAnimationFrame(()=>moveInd(!sameView || kbd || !wasOpen));
    if(route.v==='decks'){ const st = $('#stage'); if(st && !kbd && !H.reduced() && prev.v==='decks'){ st.classList.add('fadein'); } }
    main.setAttribute('inert','');
  } else {
    drawer.classList.remove('open'); scrim.classList.remove('open'); drawer.setAttribute('aria-hidden','true'); main.removeAttribute('inert');
    if(lastFocus && document.contains(lastFocus)){ try{ lastFocus.focus({preventScroll:true}); }catch(e){} } lastFocus = null; drawerKey = '';
  }
}
window.addEventListener('hashchange', applyRoute);
$('#drClose').addEventListener('click', () => { location.hash = '#/'; });
scrim.addEventListener('click', () => { location.hash = '#/'; });
document.addEventListener('keydown', e => {
  if(e.metaKey||e.ctrlKey||e.altKey) return;
  const t = e.target; if(t && /^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName)) return;
  const open = drawer.classList.contains('open');
  if(e.key==='Escape' && open){ viaKey = true; location.hash = '#/'; return; }
  if(e.key==='j' && open){ drBody.scrollBy({top:140}); return; }
  if(e.key==='k' && open){ drBody.scrollBy({top:-140}); return; }
  if(e.key==='w'){ document.body.classList.toggle('wall'); startWall(); return; }
  if(open && route.v==='decks' && (e.key==='ArrowRight'||e.key==='ArrowLeft')){ const k = route.a==='full'?'full':'short', n = Math.max(1,+route.b||1), tot = CONTENT.decks[k].slides.length; viaKey = true; location.hash = '#/decks/'+k+'/'+Math.min(tot,Math.max(1,n+(e.key==='ArrowRight'?1:-1))); return; }
  if(open && route.v==='exercises' && /^[0-6]$/.test(e.key)){ viaKey = true; location.hash = '#/exercises/0'+e.key; return; }
  const map = {'1':'#/','2':'#/exercises/00','3':'#/decks','4':'#/demo'};
  if(map[e.key]){ viaKey = true; location.hash = map[e.key]; }
});

/* ---------- wall mode: a 1px outline moves to the next panel every 20 s ---------- */
let wallTimer = 0;
function startWall(){
  clearInterval(wallTimer); $$('.hl').forEach(x=>x.classList.remove('hl'));
  if(!document.body.classList.contains('wall')) return;
  const items = ['#hero','.ladder-card','.p-tasks','.p-tokens','.p-money','.p-who'].map(s=>$(s)).filter(Boolean); let i = 0;
  items[0].classList.add('hl'); if(H.reduced()) return;
  wallTimer = setInterval(()=>{ items[i].classList.remove('hl'); i = (i+1)%items.length; items[i].classList.add('hl'); }, 20000);
}

/* ---------- boot ---------- */
renderMain();
H.hero({ el:$('#cd'), root:$('#hero'), bar:$('.winbar'), words:$('#words'), onTick:(now)=>{
  $('#clock').textContent = H.clockStr(now) + (H.overridden?' (?now)':'');
  if(now.getSeconds()===0 || !H._cur || H._cur!==H.curMs(now).id){ H._cur = H.curMs(now).id; paintLadder(); paintNow(); }
  paintFlags(); paintVerdict(); } });
paintLadder(); paintNow(); paintFlags(); paintVerdict(); paintSpark(); paintLog();
window.addEventListener('resize', placeCursor);
$('#roleMore').addEventListener('click', e => { const b = e.currentTarget, all = b.getAttribute('aria-expanded')!=='true'; b.setAttribute('aria-expanded', all); b.textContent = all?'show top 5':'show all'; $('#roles').style.maxHeight = all?'none':'104px'; $('#roles').style.overflow = 'hidden'; });
$('#roles').style.maxHeight = '104px'; $('#roles').style.overflow = 'hidden';
$('#agMore').addEventListener('click', e => { const b = e.currentTarget, all = b.getAttribute('aria-expanded')!=='true'; b.setAttribute('aria-expanded', all); b.textContent = all?'show 5':'show 10'; $('#agMeters').innerHTML = H.agentMeters(all?10:5); H.hydrate($('#agMeters')); });
if(boot){
  document.body.classList.add('booting'); H.enter(main);
  $$('.lseg .fill').forEach((f,i)=>{ f.style.transitionDelay = (i*40)+'ms'; setTimeout(()=>f.style.transitionDelay='',900); });
}
applyRoute();
if(wall) startWall();
})();
