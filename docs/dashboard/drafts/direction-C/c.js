/* Direction C · The Briefing. Routes: #/briefing #/exercises #/exercises/NN #/decks #/decks/short/3 #/demo */
(function(){
'use strict';
const { $, $$, esc } = H;
H.initUI({ key:'C', theme:'auto' });
H.plainStat = true;
const EX = CONTENT.exercises, S = H.S;
const rel = l => { const n = parseInt(l,10); return /h$/.test(l) ? n+(n===1?' hour':' hours')+' ago' : n+(n===1?' minute':' minutes')+' ago'; };
const CHAPS = [['c1','Will we make it?'],['c2','Where are we?'],['c3','What is done?'],['c4','Who is doing what?'],['c5','What does it cost?'],['c6','What could go wrong?']];
const SAMPLE_BLOCKED = ['MIN-4431 · Doctor log-in waits on the role design (sample)','MIN-4436 · QR handshake waits on the Gemini key (sample)','MIN-4440 · Source marks wait on the exam parser (sample)'];

/* ---------- briefing ---------- */
const agentLine = a => S['ag.'+a.n]==='active' ? 'Working on '+(a.issue!=='-'?a.issue+', ':'')+a.title : /waits/.test(a.title) ? 'Waiting: needs Design first' : (a.title==='-'?'Idle':'Idle. Last task: '+a.title);
function stepHTML(m,i){
  return '<li class="step rv" data-s="'+m.id+'" style="--i:'+i+'"><button class="stephead" aria-expanded="false" aria-controls="acc-'+m.id+'"><span class="gl" aria-hidden="true"></span><span class="tt"><b>'+m.id+' · '+esc(m.start+' to '+(m.end.split(' ')[0]===m.start.split(' ')[0]?m.end.split(' ')[1]:m.end))+'</b><span>'+esc(m.name)+'</span></span><span class="cnt num"></span><i class="chev" aria-hidden="true"></i></button>'
   + '<div class="acc" id="acc-'+m.id+'"><div class="in"><div class="pad"><div class="mrow" style="padding:0"><span class="mname">'+esc(m.name)+'</span><span class="mval num"></span><div class="mt"><div class="meter"><i class="fill"></i></div></div></div><div class="gate">Gate: '+esc(m.gate)+'</div></div></div></div></li>';
}
function renderBriefing(){
  const d = DATA, cred = d.money.credits;
  $('#v-briefing').innerHTML =
  '<section id="banner" class="banner flashbox" aria-labelledby="c1"><h2 class="sr" id="c1">Will we make it?</h2><div class="ringw" aria-hidden="true"><svg width="160" height="160" viewBox="0 0 160 160"><circle class="t" cx="80" cy="80" r="70"/><circle class="p" id="ring" cx="80" cy="80" r="70"/></svg><div class="c" id="ringc"></div></div>'
  + '<div class="vword" id="vword"></div><p class="sent" id="sent"></p>'
  + '<div class="cd" id="cd" role="timer" aria-label="Time to the deadline"></div><p class="units" id="units"></p>'
  + '<div class="row">'+H.src('live','LIVE · clock')+'<span class="muted" style="font-size:14px">to the deadline, Sun 15 Nov 18:00</span></div>'
  + '<div class="facts"><span>Submit by <b>17:00</b></span><span>Freeze <b>13:00</b></span></div>'
  + '<div class="row"><button class="btn primary" id="copyStatus">Copy status as text</button></div><p class="nxt" id="nxt"></p></section>'
  + '<h2 class="chap" id="c2"><span class="no">2</span>Where are we?</h2><section class="stack"><ol class="stepper" id="stepper">'+H.ms.map(stepHTML).join('')+'</ol>'
  + '<div class="card rv"><div class="card-h"><h3>Overall</h3>'+H.src('none','SAMPLE · Linear')+'</div><div class="mrow" style="padding:0"><span class="mname"><b id="overall" class="mono">0%</b> done</span><span class="mval" id="overallN"></span><div class="mt"><div class="meter" id="overallM"><i class="fill"></i></div></div></div></div></section>'
  + '<h2 class="chap" id="c3"><span class="no">3</span>What is done?</h2><section class="stack" data-flash>'
  + '<div class="tiles rv"><div class="tile ok" data-flash><b data-v="t.done" class="num"></b><span>Done</span></div><div class="tile brand" data-flash><b data-v="t.inProgress" class="num"></b><span>In progress</span></div><div class="tile" data-flash><b data-v="t.open" class="num"></b><span>Open</span></div></div>'
  + '<div class="callouts rv"><div class="callout" data-flash><span class="gl" aria-hidden="true">●</span><b class="mono num" data-v="t.inReview"></b> in review</div>'
  + '<div class="callout bad" data-flash><span class="gl" aria-hidden="true">■</span><b class="mono num" data-v="t.blocked"></b> blocked <button class="linkbtn" id="blkBtn" aria-expanded="false" aria-controls="blk">See which</button><div class="acc" id="blk" style="flex-basis:100%"><div class="in"><div style="padding:6px 0 0;font-size:14px;line-height:22px">'+SAMPLE_BLOCKED.map(x=>'<div>'+esc(x)+'</div>').join('')+'</div></div></div></div></div>'
  + '<div class="card rv"><div class="card-h"><h3>By role</h3>'+H.src('none','SAMPLE · Linear')+'<span class="upd"></span></div>'+H.byRole()+'</div></section>'
  + '<h2 class="chap" id="c4"><span class="no">4</span>Who is doing what?</h2><section class="agrid">'
  + d.agents.map((a,i)=>'<div class="acard rv" style="--i:'+(i%4)+'" data-agrow="'+esc(a.n)+'" data-state="'+a.state+'"><span class="av" aria-hidden="true">'+esc(H.initials(a.n))+'</span><div class="nm"><b>'+esc(a.n)+'</b> <span>'+esc(a.role)+'</span></div><div class="stt"><span class="dot'+(a.state==='active'?' active':'')+'"></span><span class="st">'+(a.state==='active'?'Active':'Idle')+'</span></div><div class="line"><span class="ln">'+esc(agentLine(a))+'</span> · <span class="last">'+esc(rel(a.last))+'</span></div></div>').join('')
  + '</section><p class="muted" style="margin-top:8px;font-size:13px">'+H.src('none','SAMPLE · Linear')+'</p>'
  + '<h2 class="chap" id="c5"><span class="no">5</span>What does it cost?</h2><section class="grid2">'
  + '<div class="card rv" data-flash><div class="card-h"><h3>Estimated cost</h3>'+H.src('none')+'<span class="upd"></span></div><div class="stat"><span data-v="eur" data-f="eur"></span></div><div class="spark" id="spark"></div></div>'
  + '<div class="card rv"><div class="card-h"><h3>Credits left</h3>'+H.src('none')+'<span class="upd"></span></div><div class="stat" style="font-size:28px;line-height:34px" id="tight"></div><div class="muted" id="tightw"></div>'
  + '<button class="linkbtn" id="credBtn" aria-expanded="false" aria-controls="cred">All credits</button><div class="acc" id="cred"><div class="in">'+H.creditMeters()+'</div></div></div></section>'
  + '<section class="stack" style="margin-top:var(--gap)"><div class="card rv"><div class="card-h"><h3>Tokens by agent</h3>'+H.src('none')+'<span class="upd"></span></div><div id="agM">'+H.agentMeters(5)+'</div><button class="linkbtn" id="agBtn" aria-expanded="false">Show all 10</button></div>'
  + '<div class="card rv"><div class="card-h"><h3>Tokens by chat</h3>'+H.src('none')+'<span class="upd"></span></div>'+H.chatMeters()+'</div></section>'
  + '<h2 class="chap" id="c6"><span class="no">6</span>What could go wrong?</h2><section class="stack" id="risks" aria-live="polite"></section>'
  + '<div class="more"><a href="#/exercises"><b>7</b><span>Exercises</span></a><a href="#/decks"><b>2</b><span>Decks</span></a><a href="#/demo"><b>1</b><span>Demo</span></a></div>';
  H.hydrate($('#v-briefing'));
}
let lastRisk = '';
function paintRisks(){
  const f = H.flags(), key = f.map(x=>x.id+x.level).join('|'); if(key===lastRisk) return; lastRisk = key;
  $('#risks').innerHTML = f.length ? f.map(x=>'<div class="risk '+(x.level==='bad'?'bad':'')+'"><span class="gl" aria-hidden="true">'+(x.level==='bad'?'■':'▲')+'</span><div><b>'+(x.level==='bad'?'Late. ':'Risk. ')+'</b>'+esc(x.plain)+(x.act?'<span class="act">'+esc(x.act)+'</span>':'')+'</div></div>').join('')
    : '<div class="risk ok"><span class="gl" aria-hidden="true">●</span><div><b>Nothing is flagged right now</b></div></div>';
}
let lastV = null;
function paintVerdict(){
  const f = H.flags(), v = H.verdict(), mt = H.verdictMeta[v], b = $('#banner'), w = $('#vword');
  const set = () => { b.className = b.className.replace(/\b(ok|warn|bad)\b/g,'').trim()+' '+mt.cls; w.innerHTML = '<span aria-hidden="true">'+mt.g+'</span>'+mt.w; $('#sent').textContent = H.sentence(v,f.length); };
  if(lastV===null || H.reduced()) set(); else if(v!==lastV){ w.classList.add('swap'); setTimeout(()=>{ set(); w.classList.add('swap'); void w.offsetWidth; w.classList.remove('swap'); if(v==='off'){ w.classList.add('pulse'); setTimeout(()=>w.classList.remove('pulse'),400);} },100); } else $('#sent').textContent = H.sentence(v,f.length);
  lastV = v;
  const mi = $('#miniv'); mi.className = 'chip '+mt.cls; mi.innerHTML = '<span class="g" aria-hidden="true">'+mt.g+'</span>'+mt.w;
}
function paintStepper(){
  const cur = H.curMs(), now = H.now();
  H.ms.forEach(m => { const li = $('.step[data-s="'+m.id+'"]'); if(!li) return; const d = S['m.'+m.id], isCur = m===cur, done = d>=m.total, late = !done && m.e<now;
    const gl = li.querySelector('.gl'); gl.textContent = isCur?'◉':done?'●':late?'▲':'○'; gl.className = 'gl '+(isCur?'cur':done?'ok':late?'late':'');
    li.querySelector('.cnt').textContent = d+' of '+m.total; li.classList.toggle('cur', isCur);
    li.querySelector('.mval').textContent = d+' of '+m.total+' issues'; li.querySelector('.fill').style.setProperty('--f',(d/m.total).toFixed(3));
    const btn = li.querySelector('.stephead'), acc = li.querySelector('.acc');
    if(isCur && li.dataset.wasCur!=='1'){ acc.classList.add('open'); btn.setAttribute('aria-expanded','true'); }
    if(!isCur && li.dataset.wasCur==='1'){ acc.classList.remove('open'); btn.setAttribute('aria-expanded','false'); }
    li.dataset.wasCur = isCur?'1':'0'; });
  $('#overall').textContent = H.donePct()+'%'; $('#overallN').textContent = S['t.done']+' of '+DATA.tasks.total+' issues'; $('#overallM .fill').style.setProperty('--f',(S['t.done']/DATA.tasks.total).toFixed(3));
}
function paintTight(){
  const c = DATA.money.credits.slice().sort((a,b)=>H.credLeft(a)/a.granted - H.credLeft(b)/b.granted)[0];
  $('#tight').textContent = c.n.replace(/ \(.*\)/,'')+' '+H.credLeft(c)+' of '+c.granted+' left'; $('#tightw').textContent = 'The tightest of the 4 credit pots (amounts to be confirmed at kickoff).';
}
function paintSpark(){
  const s = H.eurSeries, mx = Math.max(...s), n = s.length, h = 32;
  const pts = s.map((v,i)=>[i/(n-1)*100, h-(v/mx)*(h-3)-1]);
  let d = 'M'+pts[0][0]+','+pts[0][1]; for(let i=1;i<n;i++) d += ' H'+pts[i][0].toFixed(2)+' V'+pts[i][1].toFixed(2);
  const el = $('#spark'); if(!el) return;
  el.innerHTML = '<svg viewBox="0 0 100 '+h+'" preserveAspectRatio="none" role="img" aria-label="Estimated cost so far, step line"><path d="'+d+' V'+h+' H0 Z" fill="var(--brand)" opacity=".12"/><path d="'+d+'" fill="none" stroke="var(--brand)" stroke-width="2" vector-effect="non-scaling-stroke"/></svg><i class="dotend" style="top:'+(pts[n-1][1]-3)+'px"></i>';
}
const statusText = () => {
  const now = H.now(), ms = H.T.deadline - now, cur = H.curMs(now), f = H.flags(), v = H.verdict();
  return ['Health app status (sample data, '+H.clockStr(now)+' Athens)',
    'Verdict: '+H.verdictMeta[v].w+'. '+H.sentence(v,f.length),
    'Time left: '+H.cdWords(ms)+' to Sun 15 Nov 18:00',
    'Milestone: '+cur.id+' '+cur.name+', '+S['m.'+cur.id]+' of '+cur.total+' issues. Gate: '+cur.gate,
    'Tasks: '+S['t.done']+' done, '+S['t.inProgress']+' in progress, '+S['t.inReview']+' in review, '+S['t.open']+' open, '+S['t.blocked']+' blocked. Cost: '+H.eur(S.eur)+' estimated.',
    'Top flag: '+(f[0]? f[0].plain : 'nothing flagged')].join('\n');
};
function wireBriefing(){
  $$('.stephead',$('#stepper')).forEach(b => b.addEventListener('click', () => {
    const li = b.closest('.step'), acc = li.querySelector('.acc'), isCur = li.classList.contains('cur'); if(isCur) return;
    const open = !acc.classList.contains('open');
    $$('.step:not(.cur) .acc',$('#stepper')).forEach(a => { a.classList.remove('open'); a.closest('.step').querySelector('.stephead').setAttribute('aria-expanded','false'); });
    if(open){ acc.classList.add('open'); b.setAttribute('aria-expanded','true'); } }));
  const tog = (btn, acc, lab) => btn.addEventListener('click', () => { const o = !acc.classList.contains('open'); acc.classList.toggle('open', o); btn.setAttribute('aria-expanded', o); if(lab) btn.textContent = o ? lab[1] : lab[0]; });
  tog($('#blkBtn'), $('#blk'), ['See which','Hide']); tog($('#credBtn'), $('#cred'), ['All credits','Hide credits']);
  $('#agBtn').addEventListener('click', e => { const b = e.currentTarget, all = b.getAttribute('aria-expanded')!=='true'; b.setAttribute('aria-expanded',all); b.textContent = all?'Show top 5':'Show all 10'; $('#agM').innerHTML = H.agentMeters(all?10:5); H.hydrate($('#agM')); });
  $('#copyStatus').addEventListener('click', async e => { const b = e.currentTarget, ok = await H.copy(statusText()); b.style.opacity = 0; setTimeout(()=>{ b.textContent = ok?'Copied':'Copy failed, select the text'; b.style.opacity = 1; },120); setTimeout(()=>{ b.style.opacity = 0; setTimeout(()=>{ b.textContent='Copy status as text'; b.style.opacity = 1; },120); },1500); });
}
H.on('change', key => { requestAnimationFrame(() => { if(!$('#stepper')) return; paintStepper(); paintVerdict(); paintRisks(); paintTight(); H.paintTaskBar($('#v-briefing')); if(key.startsWith('ag.')) $$('.acard').forEach(c => { const a = DATA.agents.find(x=>x.n===c.dataset.agrow); c.querySelector('.ln').textContent = agentLine(a); if(S[key]==='active' && key.slice(3)===a.n) c.querySelector('.last').textContent = 'just now'; }); }); });
H.on('series', paintSpark);

/* ---------- exercises ---------- */
function renderExercises(){ $('#v-exercises').innerHTML = '<div class="pagehead"><h1>Exercises</h1><p class="muted">Seven workshop pages in one layout. The room recommended; nothing is decided. '+H.src('none','SAMPLE · copied text')+'</p></div><div class="covers" aria-label="Chapters">'+H.exCards(i=>'#/exercises/'+EX[i].n)+'</div>'; }
function renderEx(i){
  const hr = j => '#/exercises/'+EX[j].n;
  $('#v-ex').innerHTML = '<div class="exhead"><a href="#/exercises">‹ Exercises</a><span class="muted">Chapter '+(i+1)+' of 7</span><span class="readpct" id="readpct" style="margin-left:auto">read 0%</span></div>' + H.exercisePage(i,{href:hr})
   + '<div class="pn">'+(i>0?'<a class="btn" href="'+hr(i-1)+'">‹ Prev '+EX[i-1].n+'</a>':'<span class="btn" aria-disabled="true" style="opacity:.45">Prev</span>')+(i<EX.length-1?'<a class="btn primary" href="'+hr(i+1)+'">Next '+EX[i+1].n+' ›</a>':'<span class="btn" aria-disabled="true" style="opacity:.45">Next</span>')+'</div>';
  H.wireExercise($('#v-ex'), null); window.scrollTo(0,0); paintRead();
}
let rafR = 0;
function paintRead(){ const bar = $('#rbar'); const max = document.documentElement.scrollHeight - innerHeight, p = max>0 ? Math.min(1,Math.max(0,scrollY/max)) : 0;
  bar.style.setProperty('--p', p.toFixed(4)); const rp = $('#readpct'); if(rp) rp.textContent = 'read '+Math.round(p*100)+'%'; }
window.addEventListener('scroll', () => { if(!$('#rbar').classList.contains('on') || rafR) return; rafR = requestAnimationFrame(()=>{ rafR = 0; paintRead(); }); }, {passive:true});

/* ---------- decks ---------- */
function renderDecks(){
  $('#v-decks').innerHTML = '<div class="pagehead"><h1>Decks</h1><p class="muted">Swipe the rail. Thumbnails are the slide titles from the content files; the real HTML decks open from a local file link. '+H.src('none','SAMPLE · copied text')+'</p></div>'
   + ['short','full'].map(k => { const d = H.deckInfo(k); return '<section class="deckrow"><h2>'+esc(d.label)+' · '+d.slides.length+' slides</h2><p class="muted">'+esc(d.sub)+' · '+esc(d.ver)+(k==='full'?' · Appendix':'')+'</p>'
     + '<div class="rail" role="list" aria-label="'+esc(d.label)+' slides">'+d.slides.map((s,j)=>'<a role="listitem" href="#/decks/'+k+'/'+(j+1)+'" aria-label="Slide '+s.n+': '+esc(s.t)+'">'+H.slideTile(k,j,j?'thumb':'')+'<div class="cap">'+s.n+'. '+esc(s.t)+'</div></a>').join('')+'</div>'
     + '<div class="acts"><a class="btn primary" href="#/decks/'+k+'/1">Present ▸</a><a class="btn" href="'+d.file+'" target="_blank" rel="noopener" title="Opens the deck HTML from the pix-pitching-deck-draft worktree on this machine">Open ↗</a></div></section>'; }).join('');
}
let sx = null;
function renderViewer(k, n){
  const v = $('#viewer'), d = H.deckInfo(k), tot = d.slides.length; n = Math.min(tot, Math.max(1,n||1)); const was = v.classList.contains('open');
  v.innerHTML = '<span class="vt">'+esc(d.label)+'</span><a class="btn vx ibtn" href="#/decks" aria-label="Close (Esc)">✕</a><div class="stagebox'+(was?' fade':'')+'">'+H.slideTile(k,n-1)+'</div>'
   + '<a class="btn vn l ibtn" href="#/decks/'+k+'/'+Math.max(1,n-1)+'" aria-label="Previous slide">‹</a><span class="pill num" aria-live="polite">'+n+' / '+tot+'</span><a class="btn vn r ibtn" href="#/decks/'+k+'/'+Math.min(tot,n+1)+'" aria-label="Next slide">›</a>';
  v.dataset.k = k; v.dataset.n = n; v.classList.add('open'); if(!was) setTimeout(()=>$('.vx',v).focus({preventScroll:true}),40);
}
$('#viewer').addEventListener('pointerdown', e => { sx = e.clientX; });
$('#viewer').addEventListener('pointerup', e => { if(sx===null) return; const dx = e.clientX - sx; sx = null; if(Math.abs(dx)<60) return; const v = $('#viewer'), k = v.dataset.k, n = +v.dataset.n, tot = CONTENT.decks[k].slides.length; location.hash = '#/decks/'+k+'/'+Math.min(tot,Math.max(1,n+(dx<0?1:-1))); });
document.addEventListener('keydown', e => { const v = $('#viewer'); if(!v.classList.contains('open')) return; const k = v.dataset.k, n = +v.dataset.n, tot = CONTENT.decks[k].slides.length;
  if(e.key==='Escape') location.hash = '#/decks'; else if(e.key==='ArrowRight') location.hash = '#/decks/'+k+'/'+Math.min(tot,n+1); else if(e.key==='ArrowLeft') location.hash = '#/decks/'+k+'/'+Math.max(1,n-1); });

/* ---------- demo ---------- */
function demoVerdict(){
  const dv = H.demoVerdict(), st = DATA.demo.steps, fails = st.filter(s=>s.s==='fail').map(s=>s.n);
  const m = { 'ready':['ok','●','Ready'], 'not-ready':['bad','■','Not ready yet'], 'getting-there':['warn','▲','Getting there'] }[dv];
  return '<div class="vtile '+m[0]+'" id="vtile"><span class="gl" aria-hidden="true">'+m[1]+'</span><div><b>'+m[2]+'</b>'+S.clean+' of '+DATA.demo.cleanTarget+' clean runs'+(fails.length?'; step '+fails.join(', ')+(fails.length>1?' fail':' fails'):'')+'</div></div>';
}
function renderDemo(){
  const d = DATA.demo;
  $('#v-demo').innerHTML = '<div class="pagehead" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><h1 style="margin-right:auto">Ready to demo?</h1>'+H.src('none')+'</div><section class="stack" style="margin-top:12px"><div id="vtileW">'+demoVerdict()+'</div>'
   + '<div class="card"><div class="card-h"><h3>Live link</h3><span class="chip warn"><span class="g">▲</span>Live: deploying</span></div><p class="mono" style="overflow-wrap:anywhere;margin-bottom:12px">'+esc(d.url)+'</p><div class="row" style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn" id="copyLink">Copy</button><span class="btn" aria-disabled="true" style="opacity:.5">Open demo ↗</span></div></div>'
   + '<div class="card"><div class="kv"><span class="k">Build</span>'+H.rag(d.build.state,d.build.label+' '+d.build.at)+'</div><div class="kv"><span class="k">Deploy</span>'+H.rag(d.deploy.state,d.deploy.label)+'</div>'
   + '<div class="kv" style="border:0"><span class="k">Clean runs</span><span class="runs" id="runs"></span><b class="mono"><span data-v="clean"></span> of '+d.cleanTarget+'</b></div><div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:6px"><button class="btn" id="runClean" title="Draft only, does not persist">Mark run clean</button><span class="chip" style="align-self:center">Draft only</span></div></div>'
   + '<div class="card"><div class="card-h"><h3>The 8 steps</h3></div><ul class="steps">'+d.steps.map(s=>'<li><button class="stephead" aria-expanded="false" aria-controls="sd'+s.n+'"><span class="n">'+s.n+'</span><span class="g '+s.s+'" aria-hidden="true">'+H.ragGlyph(s.s)+'</span><span class="tt"><span style="color:var(--ink);white-space:normal">'+esc(s.t)+'</span></span><span class="w">'+H.stepWord(s.s)+'</span><i class="chev" aria-hidden="true"></i></button><div class="acc" id="sd'+s.n+'"><div class="in"><div class="pad" style="padding:0 4px 14px 34px;font-size:14px;line-height:21px;color:var(--ink-2)">'+esc(d.notes[s.n])+' Set by hand by the CTO or Release after each run.</div></div></div></li>').join('')+'</ul></div>'
   + '<p class="muted" style="font-size:14px">Set by hand after each run (MIN-4445 item 2).</p></section>';
  H.hydrate($('#v-demo')); paintRuns();
  $$('.steps .stephead').forEach(b => b.addEventListener('click', () => { const acc = b.nextElementSibling, o = !acc.classList.contains('open'); acc.classList.toggle('open',o); b.setAttribute('aria-expanded',o); }));
  $('#copyLink').onclick = async () => { const ok = await H.copy(d.url.replace(' (sample)','')); const c=$('#copyLink'); c.textContent = ok?'Copied':'Copy failed'; setTimeout(()=>{ c.textContent='Copy'; },1500); };
  $('#runClean').onclick = () => { if(S.clean<d.cleanTarget){ H.set('clean',S.clean+1); paintRuns(); $('#vtileW').innerHTML = demoVerdict(); } };
}
function paintRuns(){ const r = $('#runs'); if(r) r.innerHTML = Array.from({length:DATA.demo.cleanTarget},(_,i)=>'<i class="'+(i<S.clean?'on':'')+'"></i>').join(''); }

/* ---------- chapter nav (desktop) + tab bar + router ---------- */
function paintNav(view){
  const l = (h,t,main,cur) => '<a href="'+h+'" class="'+(main?'main':'')+(cur?' on':'')+'"'+(cur?' aria-current="page"':'')+'>'+t+'</a>';
  const tab = view==='ex'?'exercises':view;
  $('#chapnav').innerHTML = '<div class="grp">'+l('#/briefing','Briefing',1,tab==='briefing')
    + (tab==='briefing'?'<div class="sub2">'+CHAPS.map((c,i)=>'<a href="#/briefing" data-go="'+c[0]+'">'+(i+1)+' '+c[1]+'</a>').join('')+'</div>':'')
    + l('#/exercises','Exercises',1,tab==='exercises')+l('#/decks','Decks',1,tab==='decks')+l('#/demo','Demo',1,tab==='demo')+'</div>';
  $$('[data-go]',$('#chapnav')).forEach(a => a.addEventListener('click', e => { e.preventDefault(); const t = a.dataset.go==='c1' ? $('#banner') : document.getElementById(a.dataset.go); t.scrollIntoView({behavior:H.reduced()?'auto':'smooth',block:'start'}); }));
}
let lastView = null, spy = null;
function moveInd(nomove){ const t = $('#tabbar'), cur = $('a[aria-current="page"]',t), ind = $('.ind',t); if(!cur) return; t.classList.toggle('nomove',!!nomove); ind.style.transform = 'translateX('+cur.offsetLeft+'px) scaleX('+(cur.offsetWidth/100)+')'; }
function route(){
  const p = location.hash.replace(/^#\/?/,'').split('/'), v = p[0]||'briefing';
  const view = v==='exercises' && p[1] ? 'ex' : (['briefing','exercises','decks','demo'].includes(v)?v:'briefing'), tab = view==='ex'?'exercises':view;
  $$('#tabbar a').forEach(a => { if(a.dataset.t===tab) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current'); });
  const changed = lastView!==view;
  if(view==='ex') renderEx(Math.max(0,EX.findIndex(e=>e.n===p[1]))); else if(view==='exercises') renderExercises(); else if(view==='decks'){ if(!$('#v-decks').children.length) renderDecks(); } else if(view==='demo') renderDemo();
  $$('.view').forEach(s => { const on = s.dataset.view===view; s.hidden = !on; if(on && changed && !H.reduced()){ s.classList.remove('fade'); void s.offsetWidth; s.classList.add('fade'); } });
  $('#rbar').classList.toggle('on', view==='ex' && !H.reduced());
  if(v==='decks' && p[1]) renderViewer(p[1]==='full'?'full':'short', +p[2]||1); else $('#viewer').classList.remove('open');
  if(changed && view!=='ex') window.scrollTo(0,0);
  if(changed){ paintNav(view); setupSpy(view); }
  lastView = view; requestAnimationFrame(()=>moveInd(!changed));
}
function setupSpy(view){
  if(spy) spy.disconnect(); if(view!=='briefing' || !('IntersectionObserver' in window)) return;
  spy = new IntersectionObserver(es => es.forEach(en => { if(en.isIntersecting){ const id = en.target.id==='banner'?'c1':en.target.id; $$('[data-go]',$('#chapnav')).forEach(a => a.classList.toggle('on', a.dataset.go===id)); } }), {rootMargin:'-10% 0px -75% 0px'});
  [$('#banner'),...CHAPS.slice(1).map(c=>document.getElementById(c[0]))].forEach(t => t && spy.observe(t));
}
window.addEventListener('hashchange', route);

/* ---------- boot ---------- */
renderBriefing(); wireBriefing();
const ringEl = $('#ring'); ringEl && ringEl.style.setProperty('--f',0);
H.hero({ el:$('#cd'), root:$('#banner'), words:$('#units'), onTick:(now,ms)=>{
  $('#minicd').textContent = H.tabClock(ms); $('#minims').textContent = H.curMs(now).id;
  const f = H.winFrac(now); if(ringEl && (!ringEl._t || now.getMinutes()!==ringEl._m)){ ringEl._m = now.getMinutes(); ringEl._t = 1; ringEl.style.setProperty('--f', f.toFixed(4)); } $('#ringc').textContent = Math.round(f*100)+'%';
  const cur = H.curMs(now), nx = H.ms[H.ms.indexOf(cur)+1]; $('#nxt').innerHTML = 'Submit by <b>Sun 17:00</b>. Next gate: <b>'+cur.id+'</b> closes '+cur.end+', '+esc(cur.gate.charAt(0).toLowerCase()+cur.gate.slice(1))+'.';
  if(now.getSeconds()===0 || !paintStepper._d){ paintStepper._d = 1; paintStepper(); } paintVerdict(); paintRisks(); } });
paintStepper(); paintVerdict(); paintRisks(); paintTight(); paintSpark();
// reveal on scroll, once per element
const revIO = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(en => { if(en.isIntersecting){ en.target.classList.add('in'); revIO.unobserve(en.target); } }), {threshold:.15}) : null;
$$('.rv').forEach(el => revIO ? revIO.observe(el) : el.classList.add('in'));
// sticky mini bar: driven by an IntersectionObserver on the banner, not by scroll events
new IntersectionObserver(es => { const on = !es[0].isIntersecting && !$('#v-briefing').hidden; $('#mini').classList.toggle('on', on); $('#mini').setAttribute('aria-hidden', !on); }, {threshold:0}).observe($('#banner'));
window.addEventListener('resize', () => moveInd(true));
route();
})();
