/* Dashboard chat, the page side (MIN-4498). Talks to dashboard/chat_bridge.py on the page's own origin (127.0.0.1) and to nothing else.
   Contract: MIN-4495 and MIN-4497 (CTO decisions dfe40a71, 285bad11). Design: Pix, Figma "Dashboard chat", review on MIN-4496.
   - The key arrives once in the address fragment (#c=, put there by open.sh), is removed from the bar, and lives in memory only.
   - On any other host (the Pages bundle) or on a plain file server the chat is a calm sentence, never a call that fails.
   - Every state the bridge can answer has a place: working, needs_yes, acting, waiting, finished; the proposal and result cards. */
(function(){
'use strict';
const { $, $$, esc } = H, M = window.ChatModel;
const isLocal = location.protocol === 'http:' && location.hostname === '127.0.0.1';
let key = null;

/* ---------- the key: read from #c= once, drop it from the bar, keep it in memory ---------- */
function takeKey(){
  try{
    const h = location.hash.replace(/^#/, ''); if(!h) return;
    const keep = []; let took = false;
    h.split('&').forEach(part => {
      const i = part.indexOf('='), n = i < 0 ? part : part.slice(0, i), v = i < 0 ? '' : part.slice(i + 1);
      if(n === 'c' && v){ took = true; if(isLocal) key = decodeURIComponent(v); }
      else if(part) keep.push(part);
    });
    if(took) history.replaceState(null, '', location.pathname + location.search + (keep.length ? '#' + keep.join('&') : ''));
  }catch(e){}
}
takeKey();
window.addEventListener('hashchange', () => { const had = key; takeKey(); if(key && key !== had){ S.mode = 'probing'; tick(true); } });

/* ---------- state ---------- */
/* mode: host (not 127.0.0.1) | nokey | probing | absent (no bridge answered, or it refused the key) | up | down (it was up, now silent) */
const S = { mode: isLocal ? (key ? 'probing' : 'nokey') : 'host', health: null, sessions: {}, peek: {} };
let cur = null, timer = 0, busy = false, fastN = 0;
const live = () => S.mode === 'up' || S.mode === 'down';
const agents = () => (typeof DATA !== 'undefined' && DATA.agents) || [];
const hm = iso => { const d = new Date(iso); return isNaN(d) ? '' : H.hhmm(d); };
const sing = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');

async function api(method, path, body){
  if(!key) return { status: 0, json: {} };
  const opt = { method, headers: { 'x-chat-key': key }, cache: 'no-store' };
  if(body !== undefined){ opt.headers['Content-Type'] = 'application/json'; opt.body = JSON.stringify(body); }
  try{
    const r = await fetch(path, opt); let j = {};
    try{ j = await r.json(); }catch(e){}
    return { status: r.status, json: (j && typeof j === 'object') ? j : {} };
  }catch(e){ return { status: 0, json: {} }; }
}

async function probe(){
  if(!isLocal){ S.mode = 'host'; return; }
  if(!key){ S.mode = 'nokey'; return; }
  const r = await api('GET', '/chat/health');
  if(r.status === 200 && r.json.ok){ S.mode = 'up'; S.health = r.json; return; }
  S.mode = (r.status === 0 && S.mode === 'up') || S.mode === 'down' && r.status === 0 ? 'down' : 'absent';
}

/* the card's data: every agent's sessions, one GET per agent (the bridge lists by agent; ten local calls every 10 s) */
async function loadAll(){
  if(S.mode !== 'up') return;
  await Promise.all(agents().map(async a => { const r = await api('GET', '/chat/sessions?agent=' + encodeURIComponent(a.n)); if(r.status === 200) S.sessions[a.n] = r.json.sessions || []; }));
  await Promise.all(Object.values(S.sessions).flat().filter(s => (s.state === 'needs_yes' || s.state === 'acting') && (!S.peek[s.id] || S.peek[s.id].lastAt !== s.lastAt)).map(async s => {
    const r = await api('GET', '/chat/sessions/' + s.id); if(r.status !== 200) return;
    const ps = (r.json.messages || []).filter(m => m.proposal && (m.proposal.status === 'open' || m.proposal.status === 'accepted')), p = ps.length ? ps[ps.length - 1].proposal : null;
    S.peek[s.id] = { lastAt: s.lastAt, summary: p ? p.summary : '', issue: p && M.issueOk(p.issue) ? p.issue : '' };
  }));
}

/* ---------- the "Who is working" card ---------- */
const rows = () => agents().map(a => ({ a, r: M.rowOf(a, S.sessions[a.n], S.peek, Date.now()) }));
function lastTime(a){ const ss = S.sessions[a.n] || []; return ss.length ? hm(ss.reduce((m, s) => Date.parse(s.lastAt) > Date.parse(m.lastAt) ? s : m).lastAt) : (a.last ? a.last + ' ago' : ''); }
function paintCard(){
  const box = $('#whoList'); if(!box) return;
  const ag = agents();
  if(!ag.length){ box.innerHTML = '<p class="muted bre">No agents in the feed yet.</p>'; return; }
  if(!live()){
    const note = S.mode === 'probing' ? '' : '<p class="muted note chnote">' + esc(isLocal ? M.text('not_local') : 'Chat runs on the local Mac only.') + '</p>';
    box.innerHTML = M.orderFeed(ag).map(H.agentRow).join('') + note;      // every agent is a row (MIN-4575): no cap, no "+N more"
    return;
  }
  const all = M.order(rows());
  const sum = M.summary(all.map(x => x.r));
  box.innerHTML = '<div class="chsum" role="status">' + (sum.length ? sum.map(s => '<span class="t-' + (s.tone === 'warn' ? 'warn' : 'brand') + '">' + esc(s.text) + '</span>').join(' · ') : '<span class="muted">Click an agent to talk to it.</span>')
    + (S.mode === 'down' ? ' <span class="t-warn">· bridge not reachable</span>' : '') + '</div>'
    + all.map(({ a, r }) => '<a class="arow chrow" href="#/chat/' + encodeURIComponent(a.n) + '" data-agrow="' + esc(a.n) + '" data-kind="' + r.kind + '" aria-label="' + esc('Chat with ' + a.n + ', ' + r.word) + '">'
      + '<span class="av" aria-hidden="true">' + esc(H.initials(a.n)) + '</span>'
      + '<div class="ainfo"><div class="aname"><b>' + esc(a.n) + '</b> ' + (a.role !== a.n ? '<span class="muted">' + esc(a.role) + '</span>' : '') + '</div>'
      + '<div class="atask"><i class="dot ' + r.tone + (r.ring ? ' ring' : '') + '" aria-hidden="true"></i><b class="rw ' + r.tone + '">' + esc(r.word) + '</b>'
      + (r.detail ? ' <span class="mono"' + (r.kind === 'acting' ? ' data-chel="' + esc(r.sid) + '"' : '') + '>' + esc(r.detail) + '</span>' : '') + '</div></div>'
      + '<div class="astat">' + (r.reply ? '<span class="chip brand rep" title="This chat has an answer for you"><span aria-hidden="true">●</span> Reply</span>' : '') + '<span class="last muted">' + esc(lastTime(a)) + '</span></div></a>').join('');
}

/* ---------- the drawer ---------- */
const GLYPH = { neutral: '○', warn: '▲', bad: '■' };
const agentRec = n => agents().find(a => a.n === n) || null;
const ownBusy = c => !!(c.session && (c.session.state === 'working' || c.session.state === 'acting'));
const sessList = c => { const l = (S.sessions[c.agent] || []).slice(); return l; };

function mount(body, agent){
  unmount(); lastSig = {};
  body.classList.add('chatbody');
  const a = agentRec(agent);
  cur = { agent, role: a ? a.role : '', body, sid: null, newMode: false, session: null, msgs: [], loaded: false, events: [], lastN: 0, notice: null, stopping: false, sending: false,
          opt: null, text: '', busyYes: {}, localRefused: {}, wasBusy: false };
  body.innerHTML = '<div class="chat"><div class="ch-top" id="chTop"></div><div class="ch-sess" id="chSess"></div><div class="ch-thread" id="chThread" role="log" aria-live="polite" aria-label="' + esc('Chat with ' + agent) + '" tabindex="0"></div>'
    + '<div class="ch-strip-slot" id="chStrip"></div><form class="ch-comp" id="chForm" autocomplete="off"><div class="ch-row"><textarea id="chatText" rows="2" maxlength="4000" aria-label="' + esc('Message to ' + agent) + '"></textarea>'
    + '<button class="btn primary ibtn" type="submit" id="chSend" aria-label="Send (Enter)" title="Send (Enter)">↑</button></div><p class="ch-help">' + esc(agent) + ' answers, and acts only after your yes. Do not paste exam content here.</p></form></div>';
  const ta = $('#chatText', body);
  ta.addEventListener('keydown', e => {
    if(e.key === 'Enter' && !e.shiftKey && !e.isComposing){ e.preventDefault(); send(); }
    else if(e.key === 'Escape'){ location.hash = '#/'; }
  });
  ta.addEventListener('input', () => { cur.text = ta.value; });
  $('#chForm', body).addEventListener('submit', e => { e.preventDefault(); send(); });
  body.addEventListener('click', onClick);
  paint();
  if(live()) loadAgent(); else if(S.mode === 'probing') tick(true);
  schedule();
}
function unmount(){ if(!cur) return; cur.body.classList.remove('chatbody'); cur.body.removeEventListener('click', onClick); cur = null; }

async function loadAgent(){
  const c = cur; if(!c) return;
  const r = await api('GET', '/chat/sessions?agent=' + encodeURIComponent(c.agent));
  if(c !== cur) return;
  if(r.status === 200){ S.sessions[c.agent] = r.json.sessions || []; }
  else if(r.status === 0) S.mode = 'down'; else if(r.status === 403) S.mode = 'absent';
  const l = sessList(c);
  if(!c.sid && !c.newMode && l.length) c.sid = l[0].id;
  if(c.sid) await loadThread(); else c.loaded = true;
  paint(); paintCard();
}
async function loadThread(){
  const c = cur; if(!c || !c.sid) return;
  const r = await api('GET', '/chat/sessions/' + c.sid);
  if(c !== cur) return;
  if(r.status === 200){
    const was = c.session ? c.session.state : null, st = r.json.session.state;
    c.session = r.json.session; c.msgs = r.json.messages || [];
    const list = S.sessions[c.agent];                     // the open chat is the freshest reading of itself: keep the list and the card in step
    if(list){ const i = list.findIndex(x => x.id === c.session.id); if(i >= 0) list[i] = c.session; else list.unshift(c.session); }
    if(st === 'working' || st === 'acting'){ if(was !== st && was !== null && !(was === 'working' || was === 'acting')) c.events = []; await loadEvents(); }
    else if(c.events.length && (was === 'working' || was === 'acting')){ c.events = []; }
    if(c.stopping && st !== 'working' && st !== 'acting') c.stopping = false;
    if(c.wasBusy && st !== 'working' && st !== 'acting'){ c.wasBusy = false; loadAll().then(paintCard); }
    c.wasBusy = st === 'working' || st === 'acting';
  } else if(r.status === 0){ S.mode = 'down'; }
  else if(r.status === 404){ c.sid = null; c.session = null; c.msgs = []; }
  c.loaded = true;
}
async function loadEvents(){
  const c = cur; if(!c || !c.sid) return;
  const r = await api('GET', '/chat/sessions/' + c.sid + '/events?after=' + c.lastN);
  if(c !== cur || r.status !== 200) return;
  (r.json.events || []).forEach(e => { if(e.n > c.lastN){ c.events.push(e); c.lastN = e.n; } });
  if(c.events.length > 30) c.events = c.events.slice(-30);
}

function schedule(){
  clearTimeout(timer);
  const fast = cur && ownBusy(cur);
  timer = setTimeout(() => tick(false), fast ? 2000 : 10000);
}
async function tick(force){
  if(busy){ return; }
  if(!isLocal || !key){ return; }
  if(document.hidden && !force){ schedule(); return; }
  busy = true;
  try{
    const c = cur, fast = c && ownBusy(c) && !force;
    if(c && c.notice && Date.now() - (c.notice.at || 0) > 20000){ c.notice = null; lastSig.stripSig = null; }
    if(!fast || ++fastN % 5 === 0){ await probe(); if(S.mode === 'up') await loadAll(); }
    if(c && c === cur){ if(S.mode === 'up' && c.sid) await loadThread(); else if(S.mode === 'up' && !c.sid && !c.newMode){ await loadAgent(); } if(c === cur) paint(); }
    paintCard();
  }finally{ busy = false; schedule(); }
}
document.addEventListener('visibilitychange', () => { if(!document.hidden && key) tick(true); });

/* ---------- painting ---------- */
function stateLine(c){
  const a = agentRec(c.agent) || { n: c.agent, state: 'idle', issue: '-', title: '' }, r = M.rowOf(a, S.sessions[c.agent], S.peek, Date.now());
  return { r, text: r.word + (r.detail && r.kind !== 'acting' ? ' · ' + r.detail : '') };
}
function composerState(c){
  const name = c.agent;
  if(S.mode !== 'up') return { on: false, ph: 'Chat is not available', newOn: false };
  if(!c.loaded) return { on: false, ph: 'Loading chats…', newOn: false };
  const st = c.session ? c.session.state : '';
  if(st === 'acting') return { on: false, ph: 'Composer is off while ' + name + ' works', newOn: false };
  if(st === 'working') return { on: false, ph: 'Composer is off until ' + name + ' answers', newOn: false };
  if(c.newMode || (c.session && (st === 'waiting' || st === 'needs_yes') && !c.session.full)) return { on: true, ph: 'Ask ' + name + '…', newOn: true };
  if(st === 'finished' || (c.session && c.session.full)) return { on: false, ph: 'This chat is finished', newOn: true };
  return { on: false, ph: 'Start a chat to write', newOn: true };
}

/* One strip at a time. Its words are the bridge's (a refusal's `reason`) except for the states the page reads itself (CTO 2cc7efc9). */
function stripFor(c){
  const o = { Agent: c.agent }, st = c.session ? c.session.state : '';
  if(S.mode === 'absent' || S.mode === 'nokey' || S.mode === 'host') return { k: 'x', tone: 'neutral', text: M.text('not_local', o) };
  if(S.mode === 'down') return { k: 'down', tone: 'warn', text: M.text('down', o), retry: true };
  if(S.mode === 'probing') return null;
  if(st === 'acting'){
    const p = [...c.msgs].reverse().map(m => m.proposal).find(x => x && x.status === 'accepted'), iss = p && M.issueOk(p.issue) ? p.issue : 'the issue';
    return { k: 'acting', tone: 'neutral', text: M.text('acting', Object.assign({ issue: iss }, o)), el: true, branch: c.session.branch, stop: true, events: true };
  }
  if(st === 'working') return { k: 'working', tone: 'neutral', text: M.text('working', o), stop: true, events: true };
  if(c.notice){
    const n = Object.assign({ k: 'notice' }, c.notice);
    if(n.code === 'agent_busy'){ const os = (S.sessions[c.agent] || []).find(x => x.state === 'working' || x.state === 'acting'); if(os){ n.stop = true; n.stopSid = os.id; } }
    return n;
  }
  return null;
}

let lastSig = {};
function paint(){
  const c = cur; if(!c) return;
  const body = c.body, cs = composerState(c), sl = stateLine(c);
  /* top: who, what state, the "Answers only" chip */
  const topHtml = '<span class="av lg" aria-hidden="true">' + esc(H.initials(c.agent)) + '</span><div class="ch-id"><div class="aname"><b>' + esc(c.agent) + '</b> <span class="muted">' + esc(c.role) + '</span></div>'
    + '<div class="ch-state"><i class="dot ' + sl.r.tone + (sl.r.ring ? ' ring' : '') + '" aria-hidden="true"></i><span>' + esc(sl.text) + '</span></div></div>'
    + (S.mode === 'up' && S.health && !S.health.act ? '<span class="chip" title="Acting is switched off on this Mac. Agents answer only.">Answers only</span>' : '');
  setHtml('top', $('#chTop', body), topHtml);
  /* sessions */
  const l = sessList(c), mark = s => ({ working: '◌ Working', waiting: 'Waiting for you', finished: 'Finished', needs_yes: '▲ Needs your yes', acting: '● Acting' }[s.state] || s.state);
  const sessHtml = '<div class="ch-sh"><span class="micro">Open chats · ' + l.length + '</span><button type="button" class="btn sm" id="chNew"' + (cs.newOn ? '' : ' disabled aria-disabled="true"') + '' + '>+ New chat</button></div>'
    + (l.length || c.newMode ? '<div class="ch-sl">' + (c.newMode ? '<div class="ch-srow on" aria-current="true"><span class="ttl">New chat</span><span class="mk">Not sent yet</span></div>' : '') + l.map(s => '<button type="button" class="ch-srow' + (!c.newMode && c.sid === s.id ? ' on' : '') + '" data-sid="' + esc(s.id) + '"' + (!c.newMode && c.sid === s.id ? ' aria-current="true"' : '') + '><span class="ttl">' + esc(s.title || 'Chat') + '</span><span class="mk">' + esc(mark(s)) + '</span>'
      + '<span class="sub mono">' + esc(sing(s.turns, 'turn') + ' · ' + M.money(s.costUsd) + ' · ' + hm(s.lastAt)) + '</span></button>').join('') + '</div>' : '');
  setHtml('sess', $('#chSess', body), sessHtml);
  /* thread */
  paintThread(c);
  /* strip */
  const st = stripFor(c), stSig = JSON.stringify([st, c.stopping]);
  if(lastSig.stripSig !== stSig){ lastSig.stripSig = stSig; lastSig.strip = null; lastSig.ev = null; }
  setHtml('strip', $('#chStrip', body), st ? stripHtml(c, st) : '');
  const evEl = $('#chEv', body);                            // the events list is updated in place, so the sentence above it is not re-announced on every poll
  if(evEl){ const h = evHtml(c); if(lastSig.ev !== h){ lastSig.ev = h; evEl.innerHTML = h; } }
  /* composer */
  const ta = $('#chatText', body), send = $('#chSend', body);
  ta.disabled = !cs.on; ta.placeholder = cs.ph; send.disabled = !cs.on || c.sending;
  if(c.sending) send.setAttribute('aria-busy', 'true'); else send.removeAttribute('aria-busy');
}
/* replace a region's HTML; a focused control inside it keeps focus (found again by id, or by the current row) so a poll never drops the keyboard */
function setHtml(k, el, html){
  if(!el || lastSig[k] === html) return;
  lastSig[k] = html;
  const a = document.activeElement, had = a && el.contains(a), id = had ? a.id : '', sid = had ? a.dataset.sid : '';
  el.innerHTML = html;
  if(had){ const t = (id && el.querySelector('#' + id)) || (sid && el.querySelector('[data-sid="' + sid + '"]')); if(t && !t.disabled) t.focus({ preventScroll: true }); }
}
/* the latest event only, one mono line in --ink-2: tool and path (CTO 2cc7efc9). The client keeps the last 30; the page shows one. */
function evHtml(c){
  const e = c.events[c.events.length - 1];
  return e ? esc(e.tool) + (e.target ? ' ' + esc(e.target) : '') : '';
}
function stripHtml(c, s){
  return '<div class="ch-strip tone-' + s.tone + '"><span class="g" aria-hidden="true">' + (s.k === 'acting' ? '\u25CF' : GLYPH[s.tone]) + '</span><div class="ch-sm"><span role="status">' + esc(s.text) + '</span>'
    + (s.el ? ' <span class="mono" id="chEl">' + esc(c.session ? M.since(Date.now(), c.session.turnStartedAt) : '') + '</span>' : '')
    + (s.branch ? '<div class="mono ch-br">' + esc(s.branch) + ' <a class="linkbtn" href="#/branches">See it in Branches \u203A</a></div>' : '')
    + (s.events ? '<p class="ch-ev mono" id="chEv" aria-label="What ' + esc(c.agent) + ' is doing, latest step" title="Latest step"></p>' : '') + '</div>'
    + (s.stop ? '<button type="button" class="btn sm" id="chStop"' + (s.stopSid ? ' data-stopsid="' + esc(s.stopSid) + '"' : '') + (c.stopping ? ' disabled aria-disabled="true">Stopping…' : '>■ Stop') + '</button>' : '')
    + (s.retry ? '<button type="button" class="btn sm" id="chRetryConn">Try again</button>' : '')
    + (s.k === 'notice' && s.retry2 ? '<button type="button" class="btn sm" id="chRetrySend">Retry</button>' : '') + '</div>';
}

/* ---------- the thread: appended, never rebuilt, so a reader and the scroll position are left alone ---------- */
function bubble(role, text, meta, cls){ return '<div class="ch-m ' + role + (cls ? ' ' + cls : '') + '"><div class="bub">' + esc(text) + '</div><div class="meta mono">' + esc(meta) + '</div></div>'; }
function rowsHtml(pairs){ return '<dl class="ch-kv">' + pairs.filter(Boolean).map(([k, v, raw]) => '<dt>' + esc(k) + '</dt><dd>' + (raw ? v : esc(v)) + '</dd>').join('') + '</dl>'; }
function proposalHtml(c, p){
  const loc = c.localRefused[p.id], actOn = !!(S.health && S.health.act);
  const v = loc ? { status: 'refused', buttons: false, line: [M.toneOf(loc.code), loc.code] } : M.proposalView(p, actOn, Date.now());
  const o = { Agent: c.agent }, issue = M.issueOk(p.issue) ? '<a href="https://linear.app/minhos/issue/' + esc(p.issue) + '" target="_blank" rel="noopener">' + esc(p.issue) + '<span class="sr"> (opens Linear)</span></a>' : 'New issue';
  let line = '';
  if(v.line){
    const code = v.line[1];
    const txt = code === 'declined' ? 'Declined' : code === 'yes_expired' ? 'Expired. Ask again.' : code === 'act_off' && !loc ? M.text('act_off', o)
      : (loc && loc.reason) || p.reason || M.text('refused', o);                    // the bridge's words; a refused proposal carries its `reason`
    line = '<div class="ch-pl t-' + v.line[0] + '"><span aria-hidden="true">' + (code === 'declined' || code === 'yes_expired' ? '○' : GLYPH[v.line[0]]) + '</span> ' + esc(txt) + '</div>';
  }
  const mins = Math.max(0, Math.round((Date.parse(p.expiresAt) - Date.now()) / 60000));
  const yesAt = v.status === 'accepted' ? '<div class="ch-pl t-ok"><span aria-hidden="true">●</span> ' + (p.acceptedAt && hm(p.acceptedAt) ? 'Yes at ' + esc(hm(p.acceptedAt)) : 'Yes given') + '</div>' : '';
  const btns = v.buttons ? '<div class="ch-btns"><button type="button" class="btn primary" data-yes="' + esc(p.id) + '"' + (c.busyYes[p.id] ? ' disabled aria-disabled="true"' : '') + '>Yes, do it</button><button type="button" class="btn" data-no="' + esc(p.id) + '"' + (c.busyYes[p.id] ? ' disabled aria-disabled="true"' : '') + '>No</button></div>'
    + '<p class="ch-note muted">One yes covers this one action. Typing a reply declines it. Expires in ' + mins + ' min.</p>' : '';
  return '<div class="ch-card prop st-' + v.status + (v.ghost ? ' ghost' : '') + '"><div class="micro">' + (v.status === 'open' ? 'Wants to act' : 'Request') + '</div><p class="sum">' + esc(p.summary) + '</p>'
    + rowsHtml([['Issue', issue, true], ['Kind', M.kindLabel(p.kind)], ['Lane', p.lane], p.model ? ['Runs on', p.model + ' · ' + p.effort] : null, ['Estimate', 'about ' + p.estMin + ' min · about ' + M.money(p.estUsd)],
      isFinite(+p.spentTodayUsd) && S.health ? ['Today', M.money(p.spentTodayUsd) + ' of $' + S.health.dailyUsd] : null]) + btns + yesAt + line + '</div>';
}
function resultHtml(r){
  const v = M.resultView(r);
  return '<div class="ch-card res t-' + v.tone + '"><div class="ch-rh"><b class="t-' + v.tone + '"><span aria-hidden="true">' + v.glyph + '</span> ' + esc(v.word) + '</b><span class="mono muted">' + esc((r.minutes && r.minutes < 1 ? '<1' : Math.round(r.minutes || 0)) + ' min · ' + M.money(r.costUsd)) + '</span></div>'
    + (v.note ? '<p class="sum">' + esc(v.note) + '</p>' : '')
    + rowsHtml([M.issueOk(r.issue) ? ['Issue', '<a href="https://linear.app/minhos/issue/' + esc(r.issue) + '" target="_blank" rel="noopener">' + esc(r.issue) + '<span class="sr"> (opens Linear)</span></a>', true] : null,
      r.branch ? ['Branch', '<span class="mono">' + esc(r.branch) + '</span>', true] : null, (r.commits != null || r.filesChanged != null) ? ['Changes', sing(r.commits || 0, 'commit') + ' · ' + sing(r.filesChanged || 0, 'file')] : null])
    + (v.release ? '<p class="ch-note muted">Release opens the PR to staging.</p>' : '') + '</div>';
}
function threadItems(c){
  const items = [];
  c.msgs.forEach((m, i) => {
    const who = m.role === 'you' ? 'You' : c.agent, meta = who + ' · ' + hm(m.at) + (m.costUsd != null ? ' · ' + M.money(m.costUsd) : '');
    let html;
    if(m.role === 'result' && m.result) html = '<div class="ch-m agent">' + resultHtml(m.result) + '<div class="meta mono">' + esc(meta) + '</div></div>';
    else if(m.role === 'error') html = bubble('error', m.text, c.agent + ' · ' + hm(m.at), 'bad');
    else html = '<div class="ch-m ' + (m.role === 'you' ? 'you' : 'agent') + '">' + (m.text ? '<div class="bub">' + esc(m.text) + '</div>' : '') + (m.proposal ? proposalHtml(c, m.proposal) : '') + '<div class="meta mono">' + esc(meta) + '</div></div>';
    items.push({ key: 'm' + i, sig: JSON.stringify([m, m.proposal ? [S.health && S.health.act, c.localRefused[m.proposal.id], c.busyYes[m.proposal.id], m.proposal.status === 'open' ? Math.floor(Date.now() / 60000) : 0, c.session && c.session.state] : 0]), html });
  });
  if(c.opt) items.push({ key: 'opt', sig: JSON.stringify(c.opt), html: bubble('you', c.opt.text, c.opt.failed ? 'Not sent' : 'Sending…', c.opt.failed ? 'bad' : 'sending') });
  return items;
}
function paintThread(c){
  const host = $('#chThread', c.body); if(!host) return;
  let items = threadItems(c), empty = '';
  if(S.mode !== 'up'){ empty = S.mode === 'probing' ? skel() : '<div class="ch-empty"><p>Chat works on this Mac only</p></div>'; }
  else if(!c.loaded) empty = skel();
  else if(!c.msgs.length && !c.opt) empty = c.newMode ? '<div class="ch-empty"><p>New chat with ' + esc(c.agent) + '. Ask a question below.</p></div>' : '<div class="ch-empty"><p>No open chats with ' + esc(c.agent) + '</p><button type="button" class="btn" data-newchat>+ New chat</button></div>';
  if(empty){ if(host._empty !== empty){ host._empty = empty; host.innerHTML = empty; host._items = null; } return; }
  host._empty = null;
  const near = host.scrollHeight - host.scrollTop - host.clientHeight < 80, kids = Array.from(host.children).filter(n => n._k);
  if(!host._items || host._items.sid !== c.sid || host._items.new !== c.newMode){ host.innerHTML = ''; kids.length = 0; host._items = { sid: c.sid, new: c.newMode }; }
  let i = 0; while(i < items.length && kids[i] && kids[i]._k === items[i].key && kids[i]._sig === items[i].sig) i++;
  const grew = items.length > kids.length || i < items.length;
  for(let j = kids.length - 1; j >= i; j--) kids[j].remove();
  for(let j = i; j < items.length; j++){ const t = document.createElement('div'); t.innerHTML = items[j].html; const n = t.firstElementChild; n._k = items[j].key; n._sig = items[j].sig; host.appendChild(n); }
  if(grew && (near || i === 0 || c.opt)) host.scrollTop = host.scrollHeight;
}
const skel = () => '<div class="ch-skel" aria-busy="true"><span class="muted">Loading chats…</span><i></i><i></i><i></i></div>';

/* ---------- actions ---------- */
function onClick(e){
  const c = cur; if(!c) return;
  const t = e.target;
  let b;
  if((b = t.closest('[data-sid]'))){ if(b.dataset.sid !== c.sid || c.newMode){ c.sid = b.dataset.sid; c.newMode = false; c.session = null; c.msgs = []; c.events = []; c.lastN = 0; c.loaded = false; c.notice = null; lastSig = {}; paint(); loadThread().then(() => { paint(); schedule(); }); } return; }
  if(t.closest('#chNew') || t.closest('[data-newchat]')){ if(composerState(c).newOn){ c.newMode = true; c.sid = null; c.session = null; c.msgs = []; c.events = []; c.notice = null; c.loaded = true; lastSig = {}; paint(); const ta = $('#chatText', c.body); if(!ta.disabled) ta.focus(); } return; }
  if((b = t.closest('[data-yes]'))){ answer(b.dataset.yes, true); return; }
  if((b = t.closest('[data-no]'))){ answer(b.dataset.no, false); return; }
  if((b = t.closest('#chStop'))){ stop(b.dataset.stopsid || c.sid); return; }
  if(t.closest('#chRetryConn')){ S.mode = 'probing'; paint(); tick(true).then(() => { if(cur) loadAgent(); }); return; }
  if(t.closest('#chRetrySend')){ c.notice = null; send(); return; }
}

async function send(){
  const c = cur; if(!c || c.sending) return;
  const ta = $('#chatText', c.body), text = (ta.value || '').trim();
  if(!text || ta.disabled) return;
  c.sending = true; c.notice = null; c.opt = { role: 'you', text, sending: true }; lastSig.stripSig = null; paint();
  const r = c.sid ? await api('POST', '/chat/sessions/' + c.sid + '/messages', { text }) : await api('POST', '/chat/sessions', { agent: c.agent, text });
  if(c !== cur) return;
  c.sending = false;
  if(r.status === 202 && r.json.session){
    ta.value = ''; c.text = ''; c.opt = null; c.newMode = false; c.sid = r.json.session.id; c.session = r.json.session; c.events = []; c.stopping = false; lastSig = {};
    c.msgs = c.msgs.slice(); await loadThread(); loadAll().then(paintCard); paint(); schedule();
    return;
  }
  const code = r.json.refused;
  if(r.status === 0 || (r.status >= 500 && !code) || r.status === 404 && !code){
    c.opt = { role: 'you', text, failed: true };
    c.notice = { tone: 'bad', text: r.json.reason || 'Not sent.', retry2: true, at: Date.now() };
    if(r.status === 0) S.mode = 'down';
  } else if(r.status === 403){ c.opt = null; S.mode = 'absent'; }
  else {
    c.opt = null;
    c.notice = { tone: M.toneOf(code), code, text: r.json.reason || 'Not sent.', at: Date.now() };
    if(code === 'chat_off' || code === 'cap_reached' || code === 'budget_reached' || code === 'agent_busy'){ probe().then(() => cur && paint()); }
    if(code === 'finished' || code === 'chat_full' || code === 'agent_busy') loadAgent();
  }
  lastSig.stripSig = null; paint();
  if(!ta.disabled) ta.focus();
}

async function answer(pid, yes){
  const c = cur; if(!c || !c.sid || c.busyYes[pid]) return;
  c.busyYes[pid] = true; paint();
  const r = await api('POST', '/chat/sessions/' + c.sid + '/proposals/' + encodeURIComponent(pid) + '/' + (yes ? 'yes' : 'no'));
  if(c !== cur) return;
  delete c.busyYes[pid];
  if(r.status === 200 || r.status === 202){ if(yes){ c.events = []; } await loadThread(); loadAll().then(paintCard); paint(); schedule(); return; }
  const code = r.json.refused || 'forbidden';
  if(yes) c.localRefused[pid] = { code, reason: r.json.reason };
  else c.notice = { tone: M.toneOf(code), code, text: r.json.reason || 'Not sent.', at: Date.now() };
  if(code === 'act_off' && S.health) S.health.act = false;
  lastSig = {}; paint();
}

async function stop(sid){
  const c = cur; if(!c || !sid || c.stopping) return;
  c.stopping = true; lastSig.stripSig = null; paint();
  const r = await api('POST', '/chat/sessions/' + sid + '/stop');
  if(c !== cur) return;
  if(r.status !== 200){ c.stopping = false; c.notice = { tone: 'warn', text: r.json.reason || 'Not stopped.', at: Date.now() }; }
  else if(c.notice && c.notice.code === 'agent_busy') c.notice = null;     // the refusal is answered: the other turn is stopped
  lastSig.stripSig = null;
  if(c.sid) await loadThread(); loadAgent(); paint(); schedule();
}

/* second tick: the acting clock in the strip and on the card, and an open proposal's minutes */
H.onSecond(() => {
  const c = cur; if(c && c.session && c.session.state === 'acting'){ const el = $('#chEl'); if(el) el.textContent = M.since(Date.now(), c.session.turnStartedAt); }
  $$('[data-chel]').forEach(el => { const s = Object.values(S.sessions).flat().find(x => x.id === el.dataset.chel); if(s) el.textContent = M.since(Date.now(), s.turnStartedAt); });
});

/* ---------- boot ---------- */
if(isLocal && key){ tick(true); }
window.Chat = { isLocal, live, mount, unmount, paintCard, calm: () => M.text('not_local'), get mode(){ return S.mode; }, refresh: () => tick(true) };
})();
