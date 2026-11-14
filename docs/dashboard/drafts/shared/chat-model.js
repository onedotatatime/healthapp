/* Dashboard chat, the pure part (MIN-4498): the words, the one-word-per-agent rule, money and time formats. No DOM, no network, so
   `node` can test it (dashboard/tests/test_chat_ui_model.py). Texts are the CTO's final wording (MIN-4496, MIN-4495) and Pix's frames. */
(function(root){
'use strict';

/* code -> [tone, text]. {Agent} is the display name, {N} the cap. The bridge sends its own `reason`; this table is for what the page
   knows before it asks (a busy agent, a full cap, a bridge that is not there) and for a bridge that sent a code with no text. */
const STRIP = {
  working:        ['neutral', "Waiting for {Agent}'s answer. You can write again when it arrives."],
  acting:         ['neutral', '{Agent} is working on {issue} in its own branch.'],
  not_local:      ['neutral', 'Chat works on this Mac only. Open the dashboard with open.sh.'],
  down:           ['warn',    'Chat bridge not reachable. Chat works on this Mac only.'],
  chat_off:       ['warn',    'Chat is switched off on this Mac.'],
  busy_session:   ['neutral', '{Agent} is still answering this chat.'],
  agent_busy:     ['warn',    '{Agent} is already working. Wait for it to finish, or stop it.'],
  cap_reached:    ['warn',    '{N} agents are already answering. Try again when one finishes.'],
  chat_full:      ['neutral', 'This chat is full. Start a new chat.'],
  finished:       ['neutral', 'This chat is finished. Start a new chat.'],
  budget_reached: ['bad',     "Today's chat budget is used up. It resets at midnight."],
  too_long:       ['warn',    'Keep it under 4,000 characters.'],
  act_off:        ['warn',    'Acting is switched off on this Mac. {Agent} can still answer.'],
  yes_expired:    ['neutral', 'This request expired. Ask again.'],
  bad_row:        ['bad',     '{Agent} cannot run this from the chat. Ask the coordinator.'],
  forbidden:      ['bad',     'Not from the chat: merges, production, deletes, money, databases and your exams. Ask the coordinator.'],
  rate_limited:   ['warn',    '{Agent} is rate limited. Try again in a minute.'],
  empty:          ['warn',    'Write a message first.'],
  unknown_session:['warn',    'No such chat. Start a new one.'],
  unknown_proposal:['warn',   'No such request.'],
  bad_request:    ['warn',    'The bridge did not understand that. Nothing was sent.'],
  send_failed:    ['bad',     'Message not sent. Nothing reached {Agent}.'],
  forbidden_http: ['warn',    'Chat works on this Mac only. Open the dashboard with open.sh.'],
};
const fill = (t, o) => String(t).replace(/\{(\w+)\}/g, (m, k) => o && o[k] != null ? o[k] : m);
function strip(code, o){ const s = STRIP[code] || STRIP.bad_request; return { tone:s[0], text:fill(s[1], o) }; }
/* proposal.refused is one of these; the same table. A budget refusal on a proposal reads differently from one on a message. */
function refusedText(code, o){ return code==='budget_reached' ? fill("This would pass today's chat budget. It resets at midnight.", o) : strip(code, o).text; }

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

const M = { STRIP, strip, refusedText, fill, money, elapsed, pad2, kindLabel, issueOk, rowOf, summary, proposalView, resultView };
root.ChatModel = M;
if(typeof module !== 'undefined' && module.exports) module.exports = M;
})(typeof window !== 'undefined' ? window : globalThis);
