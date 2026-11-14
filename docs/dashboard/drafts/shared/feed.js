/* Transport for the live dashboard: ONE module. Views never call fetch; they get snapshots from Feed.start(...).
   To change the transport (URL, auth, push instead of poll) change only this file and feed-config.js.
   Contract: snapshot schema 1, see dashboard/README.md and MIN-4456. */
(function(){
'use strict';
const cfg = window.FEED_CONFIG || {};
const KEY_LS = 'hd-feed-key', GW_LS = 'hd-feed-gw';
const ls = { get:k=>{ try{ return localStorage.getItem(k); }catch(e){ return null; } }, set:(k,v)=>{ try{ localStorage.setItem(k,v); }catch(e){} } };

/* Read the viewer key (#k=) and the public gateway key (#a=) from the address bar once, keep them in localStorage, then remove both from the URL. */
(function takeKeys(){
  try{
    const h = location.hash.replace(/^#/, '');
    if(!h) return;
    const keep = [];
    h.split('&').forEach(part => {
      const i = part.indexOf('='), n = i<0 ? part : part.slice(0,i), v = i<0 ? '' : part.slice(i+1);
      if(n==='k' && v) ls.set(KEY_LS, decodeURIComponent(v));
      else if(n==='a' && v) ls.set(GW_LS, decodeURIComponent(v));
      else if(part) keep.push(part);
    });
    if(keep.length !== h.split('&').filter(Boolean).length)
      history.replaceState(null, '', location.pathname + location.search + (keep.length ? '#'+keep.join('&') : ''));
  }catch(e){}
})();

function feedUrl(){
  const base = new URL(cfg.url || 'snapshot.json', location.href);
  const q = new URLSearchParams(location.search).get('feed');          // ?feed=<url> for tests; same origin as the page only
  if(q){ try{ const u = new URL(q, location.href); if(u.origin===location.origin) return u; }catch(e){} }
  return base;
}

async function fetchSnapshot(){
  const url = feedUrl(), base = new URL(cfg.url || 'snapshot.json', location.href), headers = {};
  const key = ls.get(KEY_LS), gw = ls.get(GW_LS);
  if(url.origin===base.origin && url.origin!==location.origin){   // keys go only to the configured feed origin, never to the page's own origin or any other
    if(key) headers[cfg.keyHeader||'x-dashboard-key'] = key;
    if(gw){ headers['Authorization'] = 'Bearer '+gw; headers['apikey'] = gw; }
  }
  const ctl = new AbortController(), to = setTimeout(()=>ctl.abort(), cfg.timeoutMs||15000);
  try{
    const r = await fetch(url.href, { headers, cache:'no-store', signal:ctl.signal });
    if(!r.ok) throw new Error(r.status===401||r.status===403 ? 'Key missing or wrong, open the link from the installer again (HTTP '+r.status+')'
      : r.status===404 ? 'No snapshot has been pushed yet (HTTP 404)'
      : r.status===503 ? 'The feed is not configured on the server (HTTP 503)'
      : r.status===502 ? 'The feed could not read its storage (HTTP 502)' : 'The feed answered HTTP '+r.status);
    let j; try{ j = await r.json(); }catch(e){ throw new Error('The feed did not return valid JSON'); }
    if(!j || j.schema!==1 || typeof j.blocks!=='object') throw new Error('The feed has an unknown format (schema '+(j&&j.schema)+')');
    return j;
  }catch(e){
    if(e.name==='AbortError') throw new Error('The feed did not answer in '+Math.round((cfg.timeoutMs||15000)/1000)+' s');
    if(e instanceof TypeError) throw new Error('The feed is unreachable (network or blocked)');
    throw e;
  }finally{ clearTimeout(to); }
}

/* Poll: first read now, then every pollMs; skips while the tab is hidden or paused, and reads at once when the tab returns. */
function start(o){
  let timer = 0, busy = false, last = 0;
  const gap = () => (o.pollMs||cfg.pollMs||60000);
  async function tick(force){
    if(busy) return; if(!force && (document.hidden || (o.paused && o.paused()))) return;
    busy = true;
    try{ const s = await fetchSnapshot(); last = Date.now(); o.onSnapshot(s); }
    catch(e){ last = Date.now(); o.onError(e); }
    finally{ busy = false; }
  }
  const loop = () => { clearTimeout(timer); timer = setTimeout(async()=>{ await tick(false); loop(); }, gap()); };
  document.addEventListener('visibilitychange', () => { if(!document.hidden && Date.now()-last >= gap()/2) tick(true); });
  tick(true).then(loop);
  return { refresh:()=>tick(true) };
}
window.Feed = { start, fetchSnapshot, feedUrl, hasKey:()=>!!ls.get(KEY_LS) };
})();
