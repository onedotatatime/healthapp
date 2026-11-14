/* Off-track alert: one full-screen dialog when the verdict is Off track, listing every RED reason and what to do.
   Its own block on purpose (own file, own CSS): it reads H.flags() and touches nothing else. Loaded after common.js.
   Rules:
   - Live data only. It never opens on sample data, before the first feed reading, or after a feed error.
   - The founder closes it (Close button or Esc). No timer, no outside click. Closed reasons are remembered per browser.
   - It opens again only for a red reason that was not in the alert he closed. A reason that clears is forgotten,
     but only while live data is good: before the first reading there are no reasons, and forgetting then would
     bring the alert back on every reload.
   - It never breaks the page: the whole entry point is in try/catch, every row is escaped, no inline script. */
(function(){
'use strict';
try{
  if(!window.H || !H.flags || !H.esc) return;
  const KEY = 'hd-offtrack-closed';
  const esc = H.esc;
  const read = () => { try{ const a = JSON.parse((H.lsGet && H.lsGet(KEY)) || '[]'); return Array.isArray(a) ? a.filter(x => typeof x==='string').slice(0,200) : []; }catch(e){ return []; } };
  let closed = new Set(read());            // reasons the founder already closed; also kept in memory when storage is blocked
  const save = () => { try{ H.lsSet && H.lsSet(KEY, JSON.stringify(Array.from(closed))); }catch(e){} };

  let dlg = null, body = null, desc = null, closeBtn = null, lastFocus = null;
  let seen = new Set(), fresh = [], sig = '', pending = false, lastMinute = 0;

  /* Live data that is good: the feed has been read, did not fail, and the verdict inputs have readings.
     Anything else: do nothing at all (no open, no prune), so the stored set survives a reload. */
  const ready = () => !!(window.HD_LIVE && window.Live && Live.loaded && !Live.feedErr && Live.state && Live.state('derived').s==='ok');
  const red = () => (H.alertReasons ? H.alertReasons() : H.flags().filter(f => f.level==='bad'));

  function asOf(){
    try{ const t = Live.meta && Live.meta.generatedAt; const d = t && H.parse(t); return d && !isNaN(d) ? 'Data as of '+H.hhmm(d)+', Athens time.' : ''; }catch(e){ return ''; }
  }

  function build(){
    dlg = document.createElement('dialog');
    dlg.className = 'hd-alert';
    dlg.setAttribute('role', 'alertdialog');
    dlg.setAttribute('aria-labelledby', 'hd-alert-title');
    dlg.setAttribute('aria-describedby', 'hd-alert-desc');
    dlg.innerHTML =
      '<div class="hd-alert-scroll"><div class="hd-alert-wrap">'
      + '<h2 class="hd-alert-title" id="hd-alert-title"><span class="hd-alert-g" aria-hidden="true">■</span>OFF TRACK</h2>'
      + '<div id="hd-alert-desc"></div>'
      + '</div></div>'
      + '<div class="hd-alert-foot"><span class="hd-alert-asof"></span>'
      + '<button type="button" class="btn primary hd-alert-close" autofocus>Close</button></div>';
    document.body.appendChild(dlg);
    desc = dlg.querySelector('#hd-alert-desc');
    closeBtn = dlg.querySelector('.hd-alert-close');
    closeBtn.addEventListener('click', () => shut(true));
    // Native Esc (if it ever gets past the capture listener below) closes through the same path.
    dlg.addEventListener('cancel', e => { e.preventDefault(); shut(true); });
  }

  const row = f => '<li class="hd-alert-row'+(fresh.indexOf(f.id)>=0 ? ' is-new' : '')+'" data-id="'+esc(f.id)+'">'
    + '<span class="hd-alert-g" aria-hidden="true">■</span><div>'
    + '<p class="hd-alert-why">'+(fresh.indexOf(f.id)>=0 ? '<span class="hd-alert-new">New</span> ' : '')+esc(f.plain || f.text || '')+'</p>'
    + (f.act ? '<p class="hd-alert-act">'+esc(f.act)+'</p>' : '')
    + '</div></li>';

  /* new reasons first (most recent first), then the rest in the order H.flags() gives them */
  function ordered(list){
    const rank = id => { const i = fresh.indexOf(id); return i<0 ? 1e6 : i; };
    return list.map((f,i) => ({f,i})).sort((a,b) => (rank(a.f.id)-rank(b.f.id)) || (a.i-b.i)).map(x => x.f);
  }

  function paint(list){
    desc.innerHTML = '<p class="hd-alert-sentence">'+esc(H.sentence('off', list.length))+'</p>'
      + '<ul class="hd-alert-list">'+ordered(list).map(row).join('')+'</ul>';
    dlg.querySelector('.hd-alert-asof').textContent = asOf();
  }

  function open(list, knownBefore){
    if(!dlg) build();
    lastFocus = document.activeElement;
    // "New" only separates new from already-closed reasons; on a first open everything is new, so nothing is marked.
    fresh = knownBefore ? list.filter(f => !closed.has(f.id)).map(f => f.id) : [];
    seen = new Set(list.map(f => f.id));
    paint(list);
    document.documentElement.classList.add('hd-alert-open');
    if(typeof dlg.showModal==='function') dlg.showModal(); else dlg.setAttribute('open','');
    closeBtn.focus({preventScroll:true});
  }

  function shut(byFounder){
    if(!dlg || !dlg.open) return;
    if(byFounder){ closed = new Set(red().map(f => f.id)); fresh = []; save(); }   // remember what he has now seen
    try{ dlg.close(); }catch(e){ dlg.removeAttribute('open'); }
    document.documentElement.classList.remove('hd-alert-open');
    const to = lastFocus; lastFocus = null;
    if(to && to.isConnected && typeof to.focus==='function') try{ to.focus({preventScroll:true}); }catch(e){}
  }

  function evaluate(){
    try{
      if(!ready()) return;
      const list = red(), ids = list.map(f => f.id), isOpen = !!(dlg && dlg.open);
      // forget reasons that are no longer red (a reason that returns counts as new)
      const kept = new Set(Array.from(closed).filter(id => ids.indexOf(id)>=0));
      if(kept.size !== closed.size){ closed = kept; save(); }
      if(!list.length){ if(isOpen) shut(false); sig = ''; return; }
      const newIds = ids.filter(id => !closed.has(id));
      if(!isOpen){
        if(!newIds.length) return;
        sig = list.map(f => f.id+'|'+f.plain+'|'+f.act).join('\n');
        open(list, closed.size>0);
        return;
      }
      // open: show a reason that appeared since it opened, first and marked New; touch the DOM only when something changed
      const added = ids.filter(id => !seen.has(id));
      added.forEach(id => { seen.add(id); fresh.unshift(id); });
      fresh = fresh.filter(id => ids.indexOf(id)>=0);
      const next = list.map(f => f.id+'|'+f.plain+'|'+f.act).join('\n');
      if(next !== sig || added.length){ sig = next; paint(list); }
    }catch(e){ /* never break the page */ }
  }
  // setTimeout, not rAF: rAF does not run in a hidden tab
  const soon = () => { if(pending) return; pending = true; setTimeout(() => { pending = false; evaluate(); }, 0); };

  // Esc closes the alert and stops there: the pages also listen for Esc (drawer, popover, deck viewer).
  window.addEventListener('keydown', e => {
    try{
      if(e.key==='Escape' && dlg && dlg.open){ e.preventDefault(); e.stopImmediatePropagation(); shut(true); }
    }catch(err){}
  }, true);

  H.on('live', soon);          // Direction B: a feed reading (or a feed failure) arrived
  H.on('change', soon);        // Direction A: its data changed
  const everyMinute = () => { const t = Date.now(); if(t-lastMinute < 6e4) return; lastMinute = t; soon(); };
  if(H.onSecond) H.onSecond(everyMinute); else setInterval(everyMinute, 6e4);
  soon();
}catch(e){ /* the page keeps working without the alert */ }
})();
