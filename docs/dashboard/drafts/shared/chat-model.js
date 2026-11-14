/* Dashboard chat, the pure part (MIN-4498): the words, the one-word-per-agent rule, money and time formats. No DOM, no network, so
   `node` can test it (dashboard/tests/test_chat_ui.py). Texts are the CTO's final wording (MIN-4496, MIN-4495) and Pix's frames. */
(function(root){
'use strict';

/* The page's own texts. CTO decision 2cc7efc9 (MIN-4497): the bridge is the one source of words. A refusal shows the bridge's `reason`
   and a role `error` message shows its `text`, exactly as sent; no text per refusal code lives here. What is here has no bridge answer
   behind it: a state the page reads (working, acting, acting switched off) or a bridge that is not there. {Agent} is the display name. */
const PAGE = {
  working:   "Waiting for {Agent}'s answer. You can write again when it arrives.",
  acting:    '{Agent} is working on {issue} in its own branch.',
  not_local: 'Chat works on this Mac only. Open the dashboard with open.sh.',
  down:      'Chat bridge not reachable. Chat works on this Mac only.',
  act_off:   'Acting is switched off on this Mac. {Agent} can still answer.',     // state 15: shown for an open proposal when /chat/health says act:false
  refused:   'This request was not allowed from the chat.',                         // a refused proposal that came with no `reason` (until the bridge sends one)
};
const fill = (t, o) => String(t).replace(/\{(\w+)\}/g, (m, k) => o && o[k] != null ? o[k] : m);
const text = (key, o) => fill(PAGE[key], o);
/* Tone and icon per code (Pix's reference frame 12:405 binds these, not the words). Unknown codes are warn. */
const NEUTRAL = ['busy_session', 'chat_full', 'finished', 'yes_expired', 'declined', 'unknown_session', 'unknown_proposal'];
const BAD = ['budget_reached', 'forbidden', 'bad_row'];
const toneOf = code => NEUTRAL.indexOf(code) >= 0 ? 'neutral' : BAD.indexOf(code) >= 0 ? 'bad' : 'warn';

const money = n => { n = +n; if(!isFinite(n)) return ''; if(n > 0 && n < 0.01) return '<$0.01'; return '$' + n.toFixed(2); };
const pad2 = n => String(n).padStart(2, '0');
const elapsed = ms => { const s = Math.max(0, Math.floor(ms / 1000)); return pad2(Math.floor(s / 60)) + ':' + pad2(s % 60); };
const kindLabel = k => k==='handoff' ? 'Linear only' : 'Change on a new branch';
const issueOk = s => /^[A-Za-z][A-Za-z0-9]{1,9}-\d{1,6}$/.test(s || '');

/* Which of the agent's sessions drives the card row: needs_yes > acting > working. Sessions with `waiting` only add the Reply chip. */
function pick(sessions, state){ return (sessions || []).find(s => s.state === state) || null; }

/* One word per agent, first match wins (Pix, MIN-4496). `a` is the feed's agent {n, role, state, issue, title, last}; `sessions` is the
   bridge's list for that agent or null when unknown; `peek` maps a session id to {summary, issue} read from its thread. */
function rowOf(a, sessions, peek, nowMs){
  const known = Array.isArray(sessions), pk = peek || {};
  const reply = known && sessions.some(s => s.state === 'waiting');
  const base = { tone:'idle', ring:false, word:'Idle', detail:'', reply, rank:3, sid:null };
  let s;
  if((s = pick(sessions, 'needs_yes'))){
    const p = pk[s.id] || {};
    return Object.assign(base, { tone:'warn', word:'Needs your yes', detail:p.summary || s.title || '', rank:0, sid:s.id, kind:'needs_yes' });
  }
  if((s = pick(sessions, 'acting'))){
    const p = pk[s.id] || {}, t0 = Date.parse(s.lastAt);
    return Object.assign(base, { tone:'brand', ring:true, word:'Acting' + (p.issue ? ' on ' + p.issue : ''),
      detail:isFinite(t0) && nowMs ? elapsed(nowMs - t0) : '', rank:1, sid:s.id, kind:'acting' });
  }
  if((s = pick(sessions, 'working')))
    return Object.assign(base, { tone:'brand', word:'Answering you', detail:s.title || '', rank:2, sid:s.id, kind:'working' });
  const task = a.issue && a.issue !== '-' ? [a.issue, a.title].filter(Boolean).join(' ') : '';
  if(a.state === 'active') return Object.assign(base, { tone:'ok', ring:true, word:'Active', detail:task, kind:'active' });
  return Object.assign(base, { word:'Idle', detail:task || (known && !sessions.length ? 'no chat yet' : ''), kind:'idle' });
}

/* The header line: parts with 0 are left out; only "needs your yes" is amber and counted as needing him. */
function summary(rows){
  const c = k => rows.filter(r => r.kind === k).length, n = c('needs_yes'), ac = c('acting'), w = c('working'), out = [];
  if(n) out.push({ tone:'warn', text:'▲ ' + n + ' needs your yes' });
  if(ac) out.push({ tone:'brand', text:ac + ' acting' });
  if(w) out.push({ tone:'brand', text:w + ' answering' });
  return out;
}

/* Proposal as the thread shows it: which buttons, which line. `actOn` is /chat/health `act`. `nowMs` flips an open proposal to expired. */
function proposalView(p, actOn, nowMs){
  let status = p.status;
  if(status === 'open' && p.expiresAt && nowMs && Date.parse(p.expiresAt) < nowMs) status = 'expired';
  if(status === 'open') return actOn ? { status, buttons:true } : { status, buttons:false, line:['warn', 'act_off'] };
  if(status === 'refused') return { status, buttons:false, line:['bad', p.refused || 'forbidden'] };
  if(status === 'expired') return { status, buttons:false, line:['neutral', 'yes_expired'], ghost:true };
  if(status === 'declined') return { status, buttons:false, line:['neutral', 'declined'], ghost:true };
  return { status, buttons:false };            // accepted
}

const RESULT = {
  done:    { tone:'ok',   word:'Done',                      glyph:'●' },
  stopped: { tone:'warn', word:'Stopped by you',            glyph:'■' },
  failed:  { tone:'bad',  word:'Did not finish',            glyph:'■' },
  timeout: { tone:'warn', word:'Stopped after the time limit', glyph:'▲' },
};
function resultView(r){
  const v = Object.assign({}, RESULT[r.outcome] || RESULT.failed);
  if(r.outcome === 'timeout' && r.minutes) v.word = 'Stopped after ' + Math.round(r.minutes) + ' minutes';
  v.note = r.outcome === 'failed' ? 'Did not finish: ' + (r.summary || 'no reason given') : (r.summary || '');
  v.release = r.outcome === 'done' && !!r.branch;
  return v;
}

const M = { PAGE, text, toneOf, fill, money, elapsed, pad2, kindLabel, issueOk, rowOf, summary, proposalView, resultView };
root.ChatModel = M;
if(typeof module !== 'undefined' && module.exports) module.exports = M;
})(typeof window !== 'undefined' ? window : globalThis);
