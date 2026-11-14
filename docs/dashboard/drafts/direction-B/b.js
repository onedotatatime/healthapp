/* Direction B · The Journey Map. Routes: #/timeline #/exercises #/exercises/NN #/decks #/decks/short/3 #/demo */
(function(){
'use strict';
const { $, $$, esc } = H;
H.initUI({ key:'B', theme:'dark' });
const EX = CONTENT.exercises, S = H.S, LW = 120, TOTAL = 30;
const hrs = d => (d - H.T.start) / 36e5;
const at = h => new Date(H.T.start.getTime() + h*36e5);
const nowH = () => hrs(H.now());
const P = s => hrs(H.parse(s));
const pad2 = n => String(n).padStart(2,'0');
let mode = 'next6', crossH = null, viaKbd = false;

/* ---------- timeline view ---------- */
let lanesAll = [], shown = [], hidden = [], idleOpen = false;
const agentRole = n => (DATA.agents.find(a=>a.n===n)||{}).role || '';
function splitLanes(){ lanesAll = DATA.lanes; shown = lanesAll.filter(l => l.bars.some(b => b.state==='active' || b.state==='planned')); hidden = lanesAll.filter(l => shown.indexOf(l)<0); }
const barEnd = b => b.to==='now' ? Math.min(TOTAL, nowH()) : Math.min(TOTAL, P(b.to));
const barStart = b => Math.max(0, P(b.from));
const barW = b => Math.max(0.08, barEnd(b)-barStart(b));
/* live tag: its text and colour are set by Live.paint from the block's own asOf and error */
const blkTag = b => '<span class="src none" data-srcfor="'+b+'">Loading</span>';
function packRows(bars){   // greedy: a bar goes to the first sub-row whose last bar ended (a label needs about 1.3 h of width)
  const ends = [], out = [];
  bars.map((b,i)=>({i, s:barStart(b)})).sort((a,b)=>a.s-b.s).forEach(o => { const b = bars[o.i]; let r = ends.findIndex(e => e <= o.s); if(r<0){ r = ends.length; ends.push(0); } ends[r] = Math.max(barEnd(b), o.s+1.3); out[o.i] = r; });
  return { rows:out, n:Math.max(1, ends.length) };
}
function laneHTML(l, k, isHidden){
  const pk = packRows(l.bars);
  return '<div class="mr'+(isHidden?' idle':'')+'"'+(isHidden&&!idleOpen?' hidden':'')+' data-lane="'+esc(l.agent)+'" style="--rh:'+(pk.n*26+4)+'px"><div class="rl"><b>'+esc(l.agent)+'</b><small>'+esc(agentRole(l.agent))+'</small></div><div class="lane">'
   + l.bars.map((b,i) => '<div class="bar '+b.state+'" role="button" tabindex="0" data-agent="'+esc(l.agent)+'" data-i="'+i+'" style="top:'+(4+pk.rows[i]*26)+'px;--h:'+barStart(b).toFixed(3)+';--w:'+barW(b).toFixed(3)+';--k:'+k+'" aria-label="'+esc(l.agent+' '+b.issue+' '+b.state)+'"><span class="t">'+esc(b.issue!=='-'?b.issue:'work')+(b.state==='planned'&&l.waitsOn?' · waits on '+esc(l.waitsOn):'')+'</span>'+(b.state==='active'?'<i class="dot active"></i>':'')+'</div>').join('')
   + '</div></div>';
}
const YMAX = 56, YH = 60;
function cumRow(id,label,unit,blk){
  return '<div class="mr cum" id="'+id+'" data-blk="'+blk+'" style="--rh:72px"><div class="rl"><b>'+label+'</b><small>'+unit+'</small>'+blkTag(blk)+'</div><div class="lane"><div class="svgw"></div><i class="cdot"></i><span class="plbl at" style="--h:30;top:6px"></span><span class="blkmsg"></span></div></div>';
}
function mapHTML(){
  let back = '<div class="layer back"><div class="night at" style="--h:12;width:calc(8 * var(--pph) * 1px)"><span class="nightl">overnight, agents only</span></div>';
  for(let h=0;h<=TOTAL;h++) back += '<i class="vl at'+(h===12?' mid':'')+'" style="--h:'+h+'"></i>';
  back += '</div>';
  let lbl = ''; for(let h=0;h<TOTAL;h++){ const hh=(12+h)%24; lbl += '<span class="hl at'+(h===12?' mid':'')+(h%3?' n3':'')+(h===0?' first':'')+'" style="--h:'+h+'">'+(h===0?'Sat 12:00':h===12?'Sun 00:00':pad2(hh)+':00')+'</span>'; }
  const axis = '<div class="mr axis"><div class="rl"><span class="micro">Time</span><small>Europe/Athens</small></div><div class="lane">'+lbl+'</div></div>';
  const mil = '<div class="mr msband" data-blk="linear"><div class="rl"><b>Milestones</b><small>M1 to M7, gates ◇</small>'+blkTag('linear')+'</div><div class="lane"><span class="blkmsg"></span>'
    + H.ms.map((m,i)=>'<div class="ms" data-m="'+m.id+'" style="--h:'+hrs(m.s)+';--w:'+m.hours+';--k:'+i+'" title="'+esc(m.id+' · '+m.name+' · '+H.fmtWin(m)+' · gate: '+m.gate)+'"><span class="msbg" aria-hidden="true"><span class="msf"></span></span><div class="msin"><div class="msh"><b class="msid">'+esc(m.id)+'</b><span class="msc"></span></div><div class="msn">'+esc(m.name)+'</div><div class="msw">'+esc(H.fmtWin(m))+' · '+(Math.round(m.hours*10)/10)+' h</div><div class="msg"><b>Gate</b> '+esc(m.gate)+'</div></div></div>').join('')
    + H.ms.map(m=>'<span class="gate at" data-g="'+m.id+'" style="--h:'+hrs(m.e)+'" aria-hidden="true">◇</span>').join('')+'</div></div>';
  const lanes = '<div class="mr" data-blk="linear" style="--rh:30px"><div class="rl"><b>Agents</b>'+(lanesAll.length ? '<small>'+esc(shown.length+' busy, '+hidden.length+' idle')+'</small>' : '')+blkTag('linear')+'</div><div class="lane"><span class="blkmsg"></span></div></div>'
    + shown.map((l,i)=>laneHTML(l,i,false)).join('') + hidden.map(l=>laneHTML(l,0,true)).join('')
    + (hidden.length ? '<div class="mr" style="--rh:30px"><div class="rl" style="padding:0"><button class="idlebtn" id="idleBtn" aria-expanded="'+idleOpen+'">'+(idleOpen?'- hide idle':'+ '+hidden.length+' idle')+'</button></div><div class="lane"></div></div>' : '');
  const fl = H.flags(), nh = Math.min(TOTAL, Math.max(0, nowH()));
  const risks = '<div class="mr" data-blk="derived" style="--rh:30px"><div class="rl"><b>Risks</b>'+blkTag('derived')+'</div><div class="lane"><span class="blkmsg"></span>'
    + (fl.length ? '<span class="rk at" style="--h:'+nh.toFixed(3)+'" title="'+esc(fl.map(f=>f.text).join('. '))+'">▲</span><span class="rkt at" style="--h:'+nh.toFixed(3)+';position:absolute;top:6px;margin-left:12px;font:500 11px/18px var(--sans);color:var(--ink-2);white-space:nowrap">'+esc(fl.length===1 ? fl[0].text : fl.length+' risks now, hover the marker')+'</span>' : '<span class="rkt at" style="--h:'+nh.toFixed(3)+';position:absolute;top:6px;margin-left:12px;font:500 11px/18px var(--sans);color:var(--ink-2);white-space:nowrap">no risks raised</span>')+'</div></div>';
  const front = '<div class="layer front"><i class="mk dash r" style="left:calc(25 * var(--pph) * 1px)"><b class="flag">13:00 freeze</b></i><i class="mk dash r" style="left:calc(29 * var(--pph) * 1px)"><b class="flag">17:00 submit</b></i><i class="mk dead r" style="left:calc(30 * var(--pph) * 1px)"><b class="flag">■ 18:00 deadline</b></i>'
    + '<i class="mk now" id="nowline"><b class="flag" id="nowflag">NOW</b></i><i class="cross" id="cross"></i><div class="tip" id="tip" role="status"></div></div>';
  return back + axis + mil + lanes + cumRow('rowTok','Tokens Σ','weighted, all agents','usage') + cumRow('rowEur','Money','EUR estimate','money') + risks + front;
}
function vmapHTML(){
  return '<p class="blkmsg"></p><ol class="vm">'+H.ms.map(m=>'<li data-vm="'+m.id+'"><div class="h"><span>'+m.id+'</span><span>'+esc(H.fmtWin(m))+'</span></div><div class="n">'+esc(m.name)+'</div>'
    + '<div class="mrow" style="padding:0"><span class="mname"></span><span class="mval num" data-vc></span><div class="mt"><div class="meter" data-vmeter><i class="fill"></i></div></div></div>'
    + '<div class="g">gate: '+esc(m.gate)+'</div><div class="vnow"></div></li>').join('')+'</ol>';
}
const lastTok = () => { const a = DATA.tokens.perAgent; return a.length ? Math.max.apply(null, a.map(x=>x.v)) : 1; };
const liveMeters = (list, pfx, n) => { const top = list.slice().sort((a,b)=>b.v-a.v).slice(0,n), mx = Math.max(1, ...top.map(x=>x.v));
  return top.map(a => H.meter({key:pfx+a.n,label:a.n,mode:'total',max:mx,scale:mx,soft:0,hard:0})).join(''); };
function renderTimeline(){
  const v = $('#v-timeline');
  v.innerHTML =
   '<section class="card band flashbox" id="band"><div><div class="cdl"><span class="micro">Time to deadline</span>'+H.src('live','LIVE · clock')+'</div><div class="cd" id="cd" role="timer" aria-label="Time to the deadline, Sun 15 Nov 18:00 Athens"></div></div>'
   + '<div class="prog" data-blk="linear"><div class="t"><span><b id="pct">0%</b> of the way</span><span id="pctn" class="mono"></span></div><div class="winbar"><i class="fill" id="pbar"></i></div><div class="keep" style="margin-top:6px">'+blkTag('linear')+' <span class="upd"></span></div></div>'
   + '<div data-blk="derived"><span class="vchip" id="verdict"></span><p class="blkmsg" style="margin-top:6px"></p></div><p class="sentence serif" id="sentence"></p></section>'
   + '<section class="card mapcard"><div class="maptool"><h2>The 30 hours, on one axis</h2><div class="legend"><span><i style="background:var(--brand)"></i>active</span><span><i style="background:var(--brand-tint);border:1px solid var(--brand)"></i>done</span><span><i style="border:1px dashed var(--line-ui)"></i>planned</span><span>◆ gate met · ▲ risk</span></div>'
   + '<div class="zoom" role="group" aria-label="Zoom"><button data-zoom="fit">Fit</button><button data-zoom="next6">Next 6 h</button><button data-zoom="full">Full</button></div></div>'
   + '<div class="mapscroll" id="scroller"><div class="maptrack" id="track" tabindex="0" role="group" aria-label="Timeline map. Left and right arrow keys move the time cursor by 15 minutes." data-zoom="next6"></div></div>'
   + '<div class="vmap" id="vmap" data-blk="linear"></div></section>'
   + '<section class="cards4" id="cards4"></section>';
  renderMap(); renderCards();
}
let mapSig = '';
function renderMap(force){
  const tr = $('#track'); if(!tr) return;
  const sig = JSON.stringify([DATA.lanes, DATA.milestones.map(m=>[m.id,m.name,m.start,m.end,m.gate]), idleOpen, H.flags().map(f=>f.text)]);
  if(!force && sig===mapSig) return; mapSig = sig;
  splitLanes(); tr.innerHTML = mapHTML(); $('#vmap').innerHTML = vmapHTML(); crossH = null;
}
function renderCards(){
  const c = $('#cards4'); if(!c) return;
  const tk = DATA.tokens, rc = DATA.money.rateCard;
  c.innerHTML =
   '<div class="card" data-blk="linear" data-flash><div class="card-h"><h2>Tasks</h2>'+blkTag('linear')+'<span class="upd"></span></div><div class="blkmsg"></div><div class="segbar" id="segbar">'+H.TSEG.map(s=>'<i data-seg="'+s[0]+'" title="'+s[1]+'"></i>').join('')+'</div>'
   +   '<div class="leg">'+H.TSEG.map(s=>'<div data-flash><span class="sw '+s[2]+'"></span>'+s[1]+'<b class="num" data-v="t.'+s[0]+'"></b></div>').join('')+'</div><div class="sub">By role, top 5</div>'+H.byRole(5)+'</div>'
   +  '<div class="card" data-blk="usage"><div class="card-h"><h2>Tokens by agent and chat</h2>'+blkTag('usage')+'<span class="upd"></span></div><div class="blkmsg"></div>'+liveMeters(tk.perAgent,'ta.',5)+'<div class="sub">Chats</div>'+liveMeters(tk.perChat,'tc.',4)
   +   '<p class="muted note">Weighted tokens since build start (in x1, cache write x2, cache read x0.1, out x5).'+(tk.scope?' Scope: '+esc(tk.scope)+'.':'')+'</p></div>'
   +  '<div class="card" data-blk="hand"><div class="card-h"><h2>Credits consumed</h2>'+blkTag('hand')+'<span class="upd"></span></div><div class="blkmsg"></div>'+H.creditMeters()
   +   '<div data-blk="money"><div class="sub keep">Estimated spend '+blkTag('money')+'</div><div class="stat" data-flash><span data-v="eur" data-f="eur"></span></div><span class="upd keep"></span><div class="blkmsg"></div>'
   +   '<p class="muted note">'+(rc ? esc(rc.label||'estimate at API list price, not a bill')+'.'+(rc.aliased && Object.keys(rc.aliased).length ? ' '+Object.keys(rc.aliased).map(k=>esc(k.replace('claude-',''))).join(', ')+' priced at the nearest rate row.' : '') : '')+'</p></div></div>'
   +  '<div class="card" data-blk="hand"><div class="card-h"><h2>Demo</h2>'+blkTag('hand')+'<span class="upd"></span></div><div class="blkmsg"></div><p style="margin-bottom:8px">'+H.rag(DATA.demo.deploy.state,DATA.demo.deploy.label)+'</p><p>Clean runs <b class="mono"><span data-v="clean"></span>/'+DATA.demo.cleanTarget+'</b></p><p class="glyphs" style="margin:8px 0">'+DATA.demo.steps.map(s=>'<span class="g '+s.s+'">'+H.ragGlyph(s.s)+'</span>').join(' ')+'</p><a class="btn" href="#/demo">Open the demo ›</a></div>';
  H.hydrate(c); H.paintTaskBar(c); Live.paint(c);
}
function curMsAt(h){ const t = at(h); for(const m of H.ms) if(t>=m.s && t<m.e) return m; return null; }
function valAt(series, h, projTo, nowVal){        // series[i] is the running total at the END of bucket i (feed: seriesFrom + (i+1) x step)
  const t0 = Live.seriesStartH(), dt = Live.stepH(), n = series.length, hn = nowH();
  if(!n || h < t0 + dt) return {v:0, proj:false};
  if(h <= hn){ const i = Math.min(n-1, Math.floor((h-t0)/dt+1e-9)-1); return {v:series[Math.max(0,i)], proj:false}; }
  if(projTo==null) return {v:null, proj:false};
  const v = nowVal + (projTo-nowVal)*Math.min(1,(h-hn)/(TOTAL-hn)); return {v, proj:true};
}
function paintCum(id, series, proj, fmt, nowVal){
  const row = $('#'+id); if(!row) return; const n = series.length, hn = Math.min(TOTAL, nowH());
  const lbl = row.querySelector('.plbl'), box = row.querySelector('.svgw');
  if(n<1){ box.innerHTML = ''; lbl.textContent = ''; row._y = () => 36; return; }
  const mx = Math.max(proj ? proj.v : 0, nowVal, 1) * (proj ? 1 : 1.1);
  const y = v => (YMAX - (v/mx)*(YMAX-6)).toFixed(2);
  const t0 = Live.seriesStartH(), dt = Live.stepH(), x = i => Math.min(hn, Math.max(0, t0 + dt*(i+1))).toFixed(3);
  let d = 'M'+Math.max(0,t0).toFixed(3)+','+YMAX+' H'+x(0)+' V'+y(series[0]); for(let i=1;i<n;i++) d += ' H'+x(i)+' V'+y(series[i]); d += ' H'+hn.toFixed(3);
  const area = d + ' V'+YMAX+' Z';
  const pj = proj ? '<path class="proj" d="M'+hn.toFixed(3)+','+y(nowVal)+' L'+TOTAL+','+y(proj.v)+'"/>' : '';
  box.innerHTML = '<svg viewBox="0 0 '+TOTAL+' '+YH+'" preserveAspectRatio="none" aria-hidden="true"><path class="area" d="'+area+'"/><path class="step" d="'+d+'"/>'+pj+'</svg>';
  lbl.textContent = proj ? 'projection ~ '+fmt(proj.v) : 'projection after 4 h of data';
  row._y = v => (+y(v))/YH*72;
}
function paintDyn(){
  const hn = nowH(), now = H.now(), cur = H.curMs(now);   // cur is null while the feed has no milestones
  const nl = $('#nowline'); if(!nl) return;
  nl.style.setProperty('--nh', Math.min(TOTAL,Math.max(0,hn)).toFixed(4));
  $('#nowflag').textContent = 'NOW '+H.hhmm(now);
  H.ms.forEach(m => { const el = $('.ms[data-m="'+m.id+'"]'), d = S['m.'+m.id]||0; if(!el) return;
    el.querySelector('.msc').textContent = m.total? d+' of '+m.total+' done' : 'no issues'; el.querySelector('.msf').style.setProperty('--f',(m.total? d/m.total : 0).toFixed(3)); el.classList.toggle('cur', m===cur); el.classList.toggle('fin', m.total>0 && d>=m.total);
    const g = $('.gate[data-g="'+m.id+'"]'), met = m.total>0 && d>=m.total, miss = !met && m.e<now; g.textContent = met||miss ? '◆' : '◇'; g.className = 'gate at'+(met?' met':miss?' miss':''); });
  $$('.bar.active').forEach(b => { const l = lanesAll.find(x=>x.agent===b.dataset.agent), bar = l.bars[+b.dataset.i]; b.style.setProperty('--w',barW(bar).toFixed(3)); });
  paintCum('rowTok', H.tokSeries, Live.projection('tokens'), H.k, S.tokSum);
  paintCum('rowEur', H.eurSeries, Live.projection('money'), v=>'EUR '+Math.round(v), S.eur);
  // header band
  $('#pct').textContent = H.donePct()+'%'; $('#pctn').textContent = S['t.done']+' of '+DATA.tasks.total+' issues'; $('#pbar').style.setProperty('--f',(DATA.tasks.total? S['t.done']/DATA.tasks.total : 0).toFixed(3));
  const v = H.verdict(), mt = H.verdictMeta[v], chip = $('#verdict');
  if(chip.dataset.v!==v){ const set=()=>{ chip.className='vchip '+mt.cls; chip.innerHTML='<span aria-hidden="true">'+mt.g+'</span>'+mt.w; chip.dataset.v=v; };
    if(!chip.dataset.v || H.reduced()) set(); else { chip.classList.add('swap'); setTimeout(()=>{ set(); chip.classList.add('swap'); void chip.offsetWidth; chip.classList.remove('swap'); if(v==='off'){chip.classList.add('pulse');setTimeout(()=>chip.classList.remove('pulse'),400);} },100); } }
  const nextM = !cur ? null : now < cur.e ? cur : H.ms[H.ms.indexOf(cur)+1];
  $('#sentence').textContent = 'Submit by Sun 17:00. '+(nextM? 'Next gate: '+nextM.id+' closes '+nextM.end+': '+nextM.gate.charAt(0).toLowerCase()+nextM.gate.slice(1)+'.' : (cur ? 'Every gate is behind us.' : 'No milestones from the feed yet.'));
  // vertical (phone) map
  H.ms.forEach(m => { const li = $('[data-vm="'+m.id+'"]'); if(!li) return; const d = S['m.'+m.id]||0; li.classList.toggle('cur', m===cur);
    li.querySelector('[data-vc]').textContent = m.total? d+' of '+m.total : 'no issues'; li.querySelector('.fill').style.setProperty('--f',(m.total? d/m.total : 0).toFixed(3));
    li.querySelector('.vnow').innerHTML = m===cur ? '<div class="nowline">NOW '+H.hhmm(now)+'</div><div class="chips">'+DATA.agents.filter(a=>S['ag.'+a.n]==='active').map(a=>'<span class="chip brand"><span class="dot active"></span>'+esc(a.n)+'</span>').join('')+'</div>' : ''; });
}
let lastMin = -1, lastBar = 0;
H.on('change', () => { requestAnimationFrame(() => { H.paintTaskBar($('#v-timeline')); if($('#nowline')) paintDyn(); }); });
/* a snapshot (or a feed failure) arrived: repaint everything that reads it, keep scroll, zoom and the open idle list */
H.on('live', () => {
  if(!$('#nowline')) return;
  renderMap(); renderCards(); paintDyn();
  if(!$('#v-demo').hidden) renderDemo();
  renderBranches();
  Live.paint();
});

/* zoom */
function setZoom(m, instant){
  mode = m; const sc = $('#scroller'), tr = $('#track'); if(!sc) return;
  const vw = sc.clientWidth - LW, nx = nowH();
  const pph = m==='fit' ? Math.max(14, vw/TOTAL) : m==='full' ? 60 : Math.max(30, vw/6);
  tr.classList.toggle('nomove', !!instant || H.reduced()); tr.dataset.zoom = m==='fit'?'fit':'zoomed';
  tr.style.setProperty('--pph', pph.toFixed(2));
  $$('[data-zoom]',$('.zoom')).forEach(b => b.setAttribute('aria-pressed', b.dataset.zoom===m));
  const left = m==='fit' ? 0 : Math.max(0, nx*pph - 0.3*vw);
  const go = () => sc.scrollTo({left, behavior: instant||H.reduced()?'auto':'smooth'});
  if(instant||H.reduced()) requestAnimationFrame(go); else setTimeout(go, 340);
}
/* scrubber */
function scrub(h){
  const tr = $('#track'), sc = $('#scroller'), cross = $('#cross'), tip = $('#tip'); if(!tr) return;
  h = Math.max(0, Math.min(TOTAL, h)); crossH = h;
  const pph = parseFloat(tr.style.getPropertyValue('--pph')) || 44, x = h*pph;
  cross.style.display = 'block'; cross.style.left = x+'px';
  const t = at(h), m = curMsAt(h);
  const pT = Live.projection('tokens'), pE = Live.projection('money'), tok = valAt(H.tokSeries,h,pT&&pT.v,S.tokSum), eur = valAt(H.eurSeries,h,pE&&pE.v,S.eur);
  const act = lanesAll.filter(l => l.bars.some(b => (b.state==='active'||b.state==='done') && barStart(b)<=h && h<=barEnd(b))).map(l=>l.agent);
  tip.innerHTML = '<b>'+H.dayHHMM(t)+(h>nowH()?' (future)':'')+'</b><div class="m">'+(m? m.id+' · '+esc(m.name):'Before M1')+'</div><div>Active: '+(act.length?esc(act.join(', ')):'nobody')+'</div><div>'+(tok.v==null ? 'No projection yet (needs 4 h of data)' : 'Tokens Σ <b>'+H.k(tok.v)+'</b> · <b>'+H.eur(eur.v)+'</b>'+(tok.proj?' <span class="m">(projected)</span>':''))+'</div>';
  tip.style.display = 'block'; tip.classList.add('on');
  const vis = x + LW - sc.scrollLeft, flip = vis > sc.clientWidth - 280;
  tip.style.left = (flip ? x-230 : x+10)+'px';
  ['rowTok','rowEur'].forEach((id,k) => { const row = $('#'+id), dot = row.querySelector('.cdot'), vv = k?eur.v:tok.v; dot.style.display='block'; dot.style.left = x+'px'; if(vv==null){ dot.style.display='none'; return; } dot.style.top = row._y(Math.max(vv,0))+'px'; });
}
function unscrub(){ const c = $('#cross'); if(c){ c.style.display='none'; $('#tip').classList.remove('on'); $('#tip').style.display='none'; $$('.cdot').forEach(d=>d.style.display='none'); } crossH = null; }
function wireMap(){
  const tr = $('#track'), sc = $('#scroller');
  tr.addEventListener('pointermove', e => { if(e.pointerType==='touch' && !e.buttons) return; const r = tr.getBoundingClientRect(), x = e.clientX - r.left - LW; if(x<0){ unscrub(); return; } const pph = parseFloat(tr.style.getPropertyValue('--pph'))||44; scrub(x/pph); });
  tr.addEventListener('pointerleave', () => { if(document.activeElement!==tr) unscrub(); });
  tr.addEventListener('blur', unscrub);
  tr.addEventListener('keydown', e => { if(e.key!=='ArrowLeft' && e.key!=='ArrowRight') return; e.preventDefault(); const pph = parseFloat(tr.style.getPropertyValue('--pph'))||44;
    const h = (crossH===null ? nowH() : crossH) + (e.key==='ArrowRight'?0.25:-0.25); scrub(h); const x = Math.max(0,Math.min(TOTAL,h))*pph; if(x < sc.scrollLeft+20 || x > sc.scrollLeft+sc.clientWidth-LW-20) sc.scrollLeft = Math.max(0,x - (sc.clientWidth-LW)/2); });
  $$('[data-zoom]',$('.zoom')).forEach(b => b.addEventListener('click', () => setZoom(b.dataset.zoom)));
  tr.addEventListener('click', e => { const b = e.target.closest('#idleBtn'); if(!b) return; idleOpen = b.getAttribute('aria-expanded')!=='true'; b.setAttribute('aria-expanded',idleOpen); b.textContent = idleOpen ? '- hide idle' : '+ '+hidden.length+' idle'; $$('.mr.idle').forEach(r => r.hidden = !idleOpen); mapSig = ''; });
  const pop = $('#pop');
  const openPop = (bar, ev) => { const l = lanesAll.find(x=>x.agent===bar.dataset.agent), b = l.bars[+bar.dataset.i], ag = DATA.agents.find(a=>a.n===l.agent), title = (b.issue===ag.issue? ag.title : b.state==='done'?'Finished work':'Planned work');
    const seen = (DATA.tokens.lastSeen||{})[l.agent], tkn = S['ta.'+l.agent];
    pop.innerHTML = '<button class="btn ibtn x" aria-label="Close">✕</button><b class="mono">'+esc(b.issue)+'</b><div>'+esc(title)+'</div><div class="muted">'+esc(l.agent)+' · '+b.state+'</div><div class="muted">'+H.dayHHMM(at(barStart(b)))+' to '+(b.to==='now'?'now':H.dayHHMM(at(barEnd(b))))+'</div><div>'+(tkn==null ? 'No token reading for this agent.' : 'Tokens since build start (all of '+esc(l.agent)+'): <b class="mono">'+H.k(tkn)+'</b>')+'</div>'+(seen ? '<div class="muted">Last session activity '+Live.ago(Date.now()-new Date(seen))+' ago</div>' : '');
    pop.hidden = false; const r = bar.getBoundingClientRect(); pop.style.top = Math.min(innerHeight-170, r.bottom+8)+'px'; pop.style.left = Math.max(8,Math.min(innerWidth-300, r.left))+'px'; $('.x',pop).onclick = () => pop.hidden = true; $('.x',pop).focus(); };
  tr.addEventListener('click', e => { const bar = e.target.closest('.bar'); if(bar){ openPop(bar,e); e.stopPropagation(); } });
  tr.addEventListener('keydown', e => { if((e.key==='Enter'||e.key===' ') && e.target.classList.contains('bar')){ e.preventDefault(); openPop(e.target,e); } });
  document.addEventListener('click', e => { if(!pop.hidden && !pop.contains(e.target)) pop.hidden = true; });
  document.addEventListener('keydown', e => { if(e.key==='Escape') pop.hidden = true; });
}

/* ---------- branches (MIN-4461): open, merged and closed branches of the repo, from the feed's `branches` block (MIN-4460) ---------- */
const LINEAR = 'https://linear.app/minhos/issue/';
const safeUrl = u => /^https:\/\/[^\s"'<>]+$/.test(u||'') ? u : '';
const rel = iso => { if(!iso) return ''; const ms = Date.now() - new Date(iso); if(isNaN(ms)) return ''; const m = Math.floor(ms/6e4);
  return m<1 ? 'just now' : m<60 ? m+' min ago' : m<1440 ? Math.floor(m/60)+' h ago' : Math.floor(m/1440)+' d ago'; };
const ab = (v, base) => v ? '<span class="ab" title="'+esc(v.ahead+' commit'+(v.ahead===1?'':'s')+' ahead of, '+v.behind+' behind '+base)+'"><b class="up">↑'+v.ahead+'</b> <span class="dn'+(v.behind>0?' behind':'')+'">↓'+v.behind+'</span></span>' : '<span class="muted" title="Not comparable with '+esc(base)+' (branch deleted)">gone</span>';
const cnt = n => n==null ? '<b class="unk">unknown</b>' : '<b>'+n+'</b>';
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
const BR_HEAD = '<div class="brh" aria-hidden="true"><span class="n">Branch</span><span class="p">Pull request</span><span class="a">vs staging</span><span class="a">vs main</span><span class="f">Files, lines</span><span class="w">Last activity</span><span class="i">Issue</span></div>';
function branchesHTML(){
  const B = DATA.branches;
  if(!B) return '<section class="card brcard" data-blk="branches"><div class="card-h"><h2>Branches</h2>'+blkTag('branches')+'<span class="upd"></span></div><div class="blkmsg"></div></section>';
  const t = B.totals || {}, items = B.items || [], open = items.filter(x=>x.state==='open'), closed = items.filter(x=>x.state!=='open'), noPr = B.prSource==='none';
  const err = Live.rec.branches && Live.rec.branches.error;
  const tiles = '<div class="brtot" role="group" aria-label="Branch totals">'
    + '<div class="bt"><span class="k">Open on GitHub</span>'+cnt(t.openOnRemote)+'<span class="s">pushed branches, not yet merged</span></div>'
    + '<div class="bt"><span class="k">Open incl. local</span>'+cnt(t.open)+'<span class="s">'+(t.open!=null && t.openOnRemote!=null ? (t.open-t.openOnRemote)+' only on this Mac' : 'with local-only branches')+'</span></div>'
    + '<div class="bt"><span class="k">Merged today</span>'+cnt(t.mergedToday)+'<span class="s">'+(t.merged==null ? 'pull request state unknown' : t.merged+' merged in all')+'</span></div>'
    + '<div class="bt"><span class="k">Closed</span>'+cnt(t.closed)+'<span class="s">closed without merging</span></div></div>';
  const emptyClosed = noPr ? 'Pull request state is unknown without GitHub access, so merged and closed branches are not listed.' : 'No merged or closed branches yet.';
  return '<section class="card brcard" data-blk="branches"><div class="card-h"><h2>'+esc(B.repo || 'Branches')+'</h2>'+blkTag('branches')+'<span class="upd"></span></div><div class="blkmsg"></div>'
    + (err ? '<p class="brwarn" role="note"><b>Partial reading.</b> '+esc(err.message)+'. Pull request state may be missing; branch names, commits and file counts are from local git.</p>' : '')
    + tiles
    + '<h3 class="sub brsub">Open <span class="num">'+open.length+'</span></h3>'+(open.length ? BR_HEAD+'<ul class="brl">'+open.map(b=>branchRow(b,'open')).join('')+'</ul>' : '<p class="muted bre">No open branches.</p>')
    + '<h3 class="sub brsub">Merged and closed <span class="num">'+closed.length+'</span></h3>'+(closed.length ? BR_HEAD+'<ul class="brl">'+closed.map(b=>branchRow(b,'closed')).join('')+'</ul>' : '<p class="muted bre">'+emptyClosed+'</p>')
    + (B.truncated ? '<p class="note muted">The list is cut to the newest branches. The totals above count every branch.</p>' : '')
    + '<p class="note muted">Read from git and GitHub on the Mac. Faded rows have no commits of their own and are not on GitHub. Compared with <span class="mono">'+esc((B.bases||['main','staging']).join('</span> and <span class="mono">'))+'</span>.</p></section>';
}
let brSig = '';
function renderBranches(force){
  const v = $('#v-branches'); if(!v) return;
  const sig = JSON.stringify([DATA.branches, Math.floor(Date.now()/6e4), Live.rec.branches]);
  if(!force && sig===brSig) return; brSig = sig;
  const keepY = window.scrollY;
  v.innerHTML = '<div class="pagehead"><h1>Branches</h1><p class="muted">Which branches are open, what was merged, and how big each one is. Newest first.</p></div>'+branchesHTML();
  Live.paint(v); if(keepY) window.scrollTo(0, keepY);
}

/* ---------- exercises ---------- */
const seen = new Set();
function renderExercises(){
  if(!EX.length){ $('#v-exercises').innerHTML = '<div class="pagehead"><h1>Exercises</h1><p class="muted">The workshop pages are not published on this page yet.</p></div>'; return; }
  $('#v-exercises').innerHTML = '<div class="pagehead"><h1>Exercises</h1><p class="muted">Seven workshop pages, one template. The room recommended; nothing is decided. '+H.src('none','SAMPLE · copied text')+'</p></div>'+'<div class="excovers">'+H.exCards(i=>'#/exercises/'+EX[i].n)+'</div>';
}
function renderEx(i){
  if(!EX.length){ $('#v-ex').innerHTML = '<div class="pagehead"><h1>Exercises</h1><p class="muted">The workshop pages are not published on this page yet.</p></div>'; return; }
  seen.add(i);
  const strip = '<div class="strip-s"><ol class="series" aria-label="Workshop series">'+EX.map((e,j)=>'<li><a href="#/exercises/'+e.n+'" title="'+esc(e.n+' · '+e.t)+'" aria-label="'+esc(e.t)+'"'+(j===i?' aria-current="page"':'')+(seen.has(j)&&j!==i?' class="seen"':'')+'>'+e.n+'</a>'+(j<EX.length-1?'<i></i>':'')+'</li>').join('')+'</ol></div>';
  $('#v-ex').innerHTML = strip + H.exercisePage(i,{href:j=>'#/exercises/'+EX[j].n});
  H.wireExercise($('#v-ex'), null);
  window.scrollTo(0,0);
}

/* ---------- decks ---------- */
let viewerT0 = 0, viewerTimer = 0;
function renderDecks(){
  if(!CONTENT.decks.short.slides.length && !CONTENT.decks.full.slides.length){ $('#v-decks').innerHTML = '<div class="pagehead"><h1>Decks</h1><p class="muted">Decks are not published on this page yet.</p></div>'; return; }
  $('#v-decks').innerHTML = '<div class="pagehead"><h1>Decks</h1><p class="muted">Two decks, equal weight. Thumbnails show the slide title and headline from the content files; the real HTML decks open from a local file link. '+H.src('none','SAMPLE · copied text')+'</p></div><div class="posters">'
   + ['short','full'].map(k=>{ const d = H.deckInfo(k); return '<article class="card poster" data-k="'+k+'">'+H.slideTile(k,0)+'<h2>'+esc(d.label)+' · '+d.slides.length+' slides</h2><p class="muted">'+esc(d.sub)+' · '+esc(d.ver)+'</p><div class="actions"><a class="btn primary" href="#/decks/'+k+'/1" data-present>Present ▸</a><a class="btn" href="'+d.file+'" target="_blank" rel="noopener" title="Opens the deck HTML from the pix-pitching-deck-draft worktree on this machine">Open ↗</a></div></article>'; }).join('')+'</div>';
  $$('[data-present]').forEach(a => a.addEventListener('click', e => { const r = a.closest('.poster').getBoundingClientRect(); const v = $('#viewer'); v.style.setProperty('--ox', (r.left+r.width/2)+'px'); v.style.setProperty('--oy', (r.top+r.height/2)+'px'); }));
}
function renderViewer(k, n){
  const v = $('#viewer'), d = H.deckInfo(k), tot = d.slides.length; if(!tot){ closeViewer(); return; } n = Math.min(tot, Math.max(1,n||1));
  const wasOpen = v.classList.contains('open');
  v.innerHTML = '<div class="vh"><a class="btn" href="#/decks" aria-label="Close viewer (Esc)">✕</a><b>'+esc(d.label)+'</b><span class="mono num">'+n+' / '+tot+'</span><span style="margin-left:auto" class="mono" title="Rehearsal clock, counts up from Present">⏱ <span id="vt">00:00</span></span>'
    + '<a class="btn" href="#/decks/'+k+'/'+Math.max(1,n-1)+'" aria-label="Previous slide">‹</a><a class="btn" href="#/decks/'+k+'/'+Math.min(tot,n+1)+'" aria-label="Next slide">›</a><button class="btn" id="vf" title="Fullscreen (f)">⛶</button></div>'
    + '<div class="vs"><div class="slidebox'+(wasOpen?' fade':'')+'">'+H.slideTile(k,n-1)+'</div></div>'
    + '<div class="notes">Speaker notes: in source, <span class="mono">'+esc(d.file.replace(/^.*docs\//,'docs/').replace('.html','-content.md'))+'</span></div>'
    + '<div class="dots">'+d.slides.map((s,j)=>'<i class="'+(j===n-1?'on':'')+'"></i>').join('')+'</div>'
    + '<div class="vr">'+d.slides.map((s,j)=>'<a href="#/decks/'+k+'/'+(j+1)+'"'+(j===n-1?' aria-current="true"':'')+' aria-label="Slide '+s.n+': '+esc(s.t)+'">'+H.slideTile(k,j,'thumb')+'</a>').join('')+'</div>';
  if(!wasOpen){ v.classList.add('open'); viewerT0 = Date.now(); clearInterval(viewerTimer); viewerTimer = setInterval(()=>{ const s = Math.floor((Date.now()-viewerT0)/1000), el = $('#vt'); if(el) el.textContent = pad2(Math.floor(s/60))+':'+pad2(s%60); }, 1000); }
  else { const s = Math.floor((Date.now()-viewerT0)/1000); $('#vt').textContent = pad2(Math.floor(s/60))+':'+pad2(s%60); }
  $('#vf').onclick = () => { if(document.fullscreenElement) document.exitFullscreen(); else v.requestFullscreen && v.requestFullscreen(); };
  const cur = $('.vr [aria-current]',v); if(cur) cur.scrollIntoView({block:'nearest',inline:'center'});
  if(!wasOpen) setTimeout(()=>$('.vh a',v).focus({preventScroll:true}),40);
}
function closeViewer(){ const v = $('#viewer'); v.classList.remove('open'); clearInterval(viewerTimer); if(document.fullscreenElement) document.exitFullscreen(); }

/* ---------- demo flight path ---------- */
let sel = 4;
function renderDemo(){
  const d = DATA.demo, st = d.steps;
  if(!st.length){ $('#v-demo').innerHTML = '<div class="pagehead"><h1>Demo product</h1><p class="muted">No demo steps are published on this page yet.</p></div>'; return; }
  if(sel >= st.length) sel = 0;
  const nodes = st.map((s,i)=>'<li><div class="node"><button role="radio" class="'+s.s+'" aria-checked="'+(i===sel)+'" tabindex="'+(i===sel?0:-1)+'" data-i="'+i+'" aria-label="Step '+s.n+', '+H.stepWord(s.s)+': '+esc(s.t)+'"><span aria-hidden="true">'+H.ragGlyph(s.s)+'</span>'+s.n+'</button><span class="seg '+s.s+'"></span></div><div class="lab">'+esc(s.t)+'</div></li>').join('');
  const cur = st[sel], hasUrl = /^https?:\/\//.test(d.url || '');
  $('#v-demo').innerHTML = '<div class="pagehead" data-blk="hand" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><h1 style="margin-right:auto">Demo product</h1>'+blkTag('hand')+'<span class="upd"></span></div>'
   + '<section class="card" data-blk="hand"><div class="blkmsg"></div><div class="kvrow"><span><span class="k">Link</span>'+(hasUrl ? H.rag(d.deploy.state, 'Live: '+(d.deploy.label||'')) : '<span class="chip">No link yet</span>')+'</span><span class="mono">'+esc(d.url)+'</span><button class="btn" id="copyLink"'+(hasUrl?'':' disabled aria-disabled="true"')+'>Copy</button>'+(hasUrl ? '<a class="btn" href="'+esc(d.url)+'" target="_blank" rel="noopener">Open ↗</a>' : '<span class="btn" aria-disabled="true" style="opacity:.5">Open ↗</span>')+'</div>'
   + '<div class="kvrow"><span><span class="k">Build</span>'+H.rag(d.build.state,d.build.label+' '+d.build.at)+'</span><span><span class="k">Deploy</span>'+H.rag(d.deploy.state,d.deploy.label)+'</span><span><span class="k">Clean runs</span><span class="medal" id="medal"></span> <b class="mono"><span data-v="clean"></span> of '+d.cleanTarget+'</b></span><span class="muted">Counted by hand by the CTO or Release</span></div>'
   + '<ol class="flight" role="radiogroup" aria-label="The 8 demo steps">'+nodes+'</ol>'
   + '<div id="stepdetail" role="status" style="padding:12px 14px;background:var(--surface-2);border-radius:var(--r-1)"><b>Selected: '+cur.n+' '+H.ragGlyph(cur.s)+' '+esc(cur.t)+'</b> '+H.rag(cur.s)+'<div class="muted" style="margin-top:4px">'+esc(d.notes[cur.n] || 'No note yet.')+' Set by hand by the CTO or Release after each run (MIN-4445 item 2).</div></div></section>';
  paintMedal(); H.hydrate($('#v-demo'));
  const fl = $('.flight'); fl.addEventListener('click', e => { const b = e.target.closest('button[data-i]'); if(b){ sel = +b.dataset.i; renderDemo(); $$('.flight button')[sel].focus(); } });
  fl.addEventListener('keydown', e => { if(e.key==='ArrowRight'||e.key==='ArrowLeft'){ e.preventDefault(); sel = Math.min(7,Math.max(0,sel+(e.key==='ArrowRight'?1:-1))); renderDemo(); $$('.flight button')[sel].focus(); } });
  $('#copyLink').onclick = async () => { if(!hasUrl) return; const ok = await H.copy(d.url); $('#copyLink').textContent = ok?'Copied':'Copy failed'; setTimeout(()=>{ const b=$('#copyLink'); if(b) b.textContent='Copy'; },1500); };
  Live.paint($('#v-demo'));
}
function paintMedal(){ const m = $('#medal'); if(m) m.innerHTML = Array.from({length:DATA.demo.cleanTarget},(_,i)=>'<i class="'+(i<S.clean?'on':'')+'"></i>').join(''); }

/* ---------- router ---------- */
let rendered = {};
function moveInd(nomove){ const t = $('#tabs'), cur = $('.tab[aria-current="page"]',t), ind = $('.ind',t); if(!cur) return; t.classList.toggle('nomove', !!nomove); ind.style.transform = 'translateX('+cur.offsetLeft+'px) scaleX('+(cur.offsetWidth/100)+')'; }
let lastView = null;
function route(){
  const p = location.hash.replace(/^#\/?/,'').split('/'), v = p[0]||'timeline';
  const view = v==='exercises' && p[1] ? 'ex' : v, tab = v==='exercises'?'exercises':v==='timeline'||v==='branches'||v==='decks'||v==='demo'?v:'timeline';
  $$('.tab').forEach(a => { if(a.dataset.t===tab) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current'); });
  const changed = lastView !== view;
  if(view==='ex'){ const i = Math.max(0, EX.findIndex(e=>e.n===p[1])); renderEx(i); }
  else if(view==='exercises') renderExercises();
  else if(view==='decks'){ if(!rendered.decks){ renderDecks(); rendered.decks = 1; } }
  else if(view==='demo') renderDemo();
  else if(view==='branches') renderBranches(true);
  $$('.view').forEach(s => { const on = s.dataset.view===view; s.hidden = !on; if(on && changed && !H.reduced()){ s.classList.remove('fade'); void s.offsetWidth; s.classList.add('fade'); } });
  if(v==='decks' && p[1]){ renderViewer(p[1]==='full'?'full':'short', +p[2]||1); } else closeViewer();
  if(changed && view!=='ex') window.scrollTo(0,0);
  lastView = view; requestAnimationFrame(()=>moveInd(!changed));
}
document.addEventListener('keydown', e => {
  const open = $('#viewer').classList.contains('open'); if(!open) return;
  const p = location.hash.replace(/^#\/?/,'').split('/'), k = p[1]==='full'?'full':'short', n = +p[2]||1, tot = CONTENT.decks[k].slides.length;
  if(!tot) return;
  if(e.key==='Escape'){ location.hash = '#/decks'; }
  else if(e.key==='ArrowRight'){ location.hash = '#/decks/'+k+'/'+Math.min(tot,n+1); } else if(e.key==='ArrowLeft'){ location.hash = '#/decks/'+k+'/'+Math.max(1,n-1); }
  else if(e.key==='f'){ $('#vf').click(); }
});
window.addEventListener('hashchange', route);

/* ---------- boot ---------- */
H.tickUpd = () => Live.paint();     // the 1 s loop in common.js: block ages, "Mac silent", header status
renderTimeline(); wireMap();
H.hero({ el:$('#cd'), root:$('#band'), onTick:(now)=>{ $('#clock').textContent = H.clockStr(now)+(H.overridden?' (?now)':''); const m = now.getMinutes(); if(m!==lastMin){ lastMin = m; paintDyn(); if(!$('#v-branches').hidden) renderBranches(); } } });
paintDyn(); setZoom('next6', true); Live.paint();
const feed = Feed.start({ paused:() => H.sim.paused, onSnapshot:s => Live.apply(s), onError:e => Live.fail(e) });
document.addEventListener('click', e => { if(e.target.closest('[data-act="pause"]') && !H.sim.paused) feed.refresh(); Live.paint(); });
window.addEventListener('resize', () => { if(mode==='fit') setZoom('fit', true); moveInd(true); });
route();
})();
