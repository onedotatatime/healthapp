#!/usr/bin/env python3
"""snapshot.py — builds one dashboard snapshot (contract v1, MIN-4456) and writes it to a file and/or pushes it.

    snapshot.py [--out PATH] [--push] [--home DIR] [--hand PATH] [--rates PATH] [--root DIR] [--now ISO]

Stdlib only (Python 3.9+). Four blocks, each with its own asOf and error:
  linear  Linear GraphQL, READ-ONLY queries (a test fails if this file contains a write operation)
  usage   ~/.claude/projects transcripts, read through the same scan()/build_run() code as conductor's bin/usage
  money   usage tokens by model x rates.json x eurPerUsd. An estimate at API list price, never a bill
  hand    ~/.healthapp-dashboard/hand-set.json (credits, demo steps, clean runs, milestone metadata)
A block that fails keeps its last good value, gets a newer `error`, keeps its old `asOf`; the others stay fresh.
No key is ever printed, logged or put in the snapshot (see assert_clean).
"""
import argparse, bisect, collections, importlib.machinery, importlib.util, json, os, re, sys, urllib.request, urllib.error
from datetime import datetime, timedelta, timezone

SCHEMA = 1
INTERVAL_SEC = 180
SERIES_STEP_MIN = 15
LINEAR_API = 'https://api.linear.app/graphql'
# Built from pieces so that the repo-wide key grep does not match this definition.
SECRET_RE = re.compile('|'.join(['lin' + '_api_', 'eyJ' + '[A-Za-z0-9_-]{30,}', 'sb' + '_secret_', 'SUPABASE_SERVICE' + r'_ROLE_KEY\s*[=:]\s*\S{20,}', 'sbp' + '_[A-Za-z0-9]{20,}']))
HOME_DEFAULT = '~/.healthapp-dashboard'
USAGE_BIN_DEFAULT = '~/AppDevelopment/conductor/bin/usage'
ENV_AGENTS = '~/.claude/.env.agents'
BLOCKS = ('linear', 'usage', 'money', 'hand')


class BlockError(Exception):
    pass


def iso(t):
    return t.astimezone(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')


def parse(s):
    t = datetime.fromisoformat(s.replace('Z', '+00:00'))
    return t if t.tzinfo else t.replace(tzinfo=timezone.utc)


def clean(msg):
    """An error text safe to publish: no key-shaped string, one line, short."""
    msg = SECRET_RE.sub('[redacted]', str(msg)).replace('\n', ' ')
    return msg[:300]


def assert_clean(text):
    m = SECRET_RE.search(text)
    if m:
        raise BlockError('snapshot refused: contains a key-shaped string (%s...)' % m.group(0)[:6])


# ----------------------------------------------------------------------------- usage / money

def load_usage_module(path):
    path = os.path.expanduser(path)
    loader = importlib.machinery.SourceFileLoader('conductor_usage', path)
    spec = importlib.util.spec_from_loader('conductor_usage', loader)
    mod = importlib.util.module_from_spec(spec)
    loader.exec_module(mod)
    return mod


def collect_rows(U, root, since, until, name_filter):
    """Same loop as U.collect(), but keeps the events and can filter project directories by name.
    Request dedupe goes through the same `seen` set and U.scan(), so totals equal bin/usage's for the same files."""
    import glob
    rows, seen = [], set()
    for proj in sorted(os.listdir(root)):
        if U.is_sealed(proj) or (name_filter and name_filter not in proj):
            continue
        files = glob.glob(os.path.join(root, proj, '**', '*.jsonl'), recursive=True)
        for p in sorted(files, key=lambda p: (not os.path.exists(p[:-6] + '.meta.json'), p)):
            if U.is_sealed(p) or os.path.getmtime(p) < since.timestamp():
                continue
            ev, refused = U.scan(p, since, seen, until)
            if not ev:
                continue
            r = U.build_run(ev, refused)
            r['events'] = ev
            if os.sep + 'subagents' + os.sep in p:
                sess_dir = p.split(os.sep + 'subagents' + os.sep)[0]
                meta = {}
                mp = p[:-6] + '.meta.json'
                if os.path.exists(mp):
                    try:
                        with open(mp) as mf:
                            meta = json.load(mf)
                    except Exception:
                        pass
                r.update(kind='agent', agent=meta.get('agentType', '?'),
                         session=U.title_of(sess_dir + '.jsonl') or os.path.basename(sess_dir)[:8])
            else:
                r.update(kind='chat', agent='(coordinator chat)', session=U.title_of(p) or os.path.basename(p)[:8])
            rows.append(r)
    return rows


def weigh(U, e):
    W = U.W
    return e['inp'] * W['inp'] + e['cw'] * W['cw'] + e['cr'] * W['cr'] + e['out'] * W['out']


def bucketize(points, start, end, step_min):
    """points: sorted [(t, value)]. Cumulative sum sampled at start+step, start+2*step ... until end (inclusive of the last partial step)."""
    n = int((end - start).total_seconds() // (step_min * 60)) + 1
    times = [t for t, _ in points]
    cum, run = [], 0.0
    for _, v in points:
        run += v
        cum.append(run)
    out = []
    for i in range(1, n + 1):
        edge = min(start + timedelta(minutes=step_min * i), end)
        k = bisect.bisect_right(times, edge)
        out.append(cum[k - 1] if k else 0.0)
    return out


def project_line(series, start, end, deadline, step_min, key=1):
    """Straight line to the deadline using the slope of the last 2 h (or the whole series if shorter)."""
    if not series:
        return None
    steps = min(len(series), 120 // step_min)
    first = series[-steps - 1] if len(series) > steps else 0.0
    slope = (series[-1] - first) / (steps * step_min)          # per minute
    mins = max(0.0, (deadline - end).total_seconds() / 60)
    return {'at': iso(deadline), 'v': round(series[-1] + slope * mins, 2 if key == 2 else 0)}


def build_usage(cfg, now, since, root, usage_bin, name_filter):
    U = load_usage_module(usage_bin)
    if not os.path.isdir(root):
        raise BlockError('transcript folder not found: %s' % root)
    rows = collect_rows(U, root, since, None, name_filter)
    names = {a['agentType']: a['n'] for a in cfg['agents']}
    per_agent, last_seen = collections.Counter(), {}
    per_chat = collections.Counter()
    points = []
    for r in rows:
        who = names.get(r['agent'], r['agent']) if r['kind'] == 'agent' else None
        per_chat[r['session']] += r['w']
        if who:
            per_agent[who] += r['w']
            if who not in last_seen or r['last'] > last_seen[who]:
                last_seen[who] = r['last']
        points.extend((e['t'], weigh(U, e)) for e in r['events'])
    points.sort(key=lambda x: x[0])
    series = bucketize(points, since, now, SERIES_STEP_MIN)
    total = sum(r['w'] for r in rows)
    deadline = parse(cfg['_deadline'])
    top = lambda c, n: [{'n': k, 'v': int(round(v))} for k, v in c.most_common(n)]
    data = {
        'agentCaps': cfg['agentCaps'], 'chatCaps': cfg['chatCaps'],
        'perAgent': top(per_agent, 12), 'perChat': top(per_chat, 8),
        'series': [int(round(x)) for x in series], 'seriesFrom': iso(since), 'seriesStepMin': SERIES_STEP_MIN,
        'projection': project_line(series, since, now, deadline, SERIES_STEP_MIN),
        'window': {'since': iso(since), 'until': iso(now)},
        'scope': "projects whose folder name contains '%s'" % name_filter if name_filter else 'all projects',
        'totalWeighted': int(round(total)),
        'lastSeen': {k: iso(v) for k, v in last_seen.items()},
    }
    return data, rows, U


def resolve_model(model, table):
    """Exact row, else the nearest row of the same family: claude-sonnet-5-5 -> claude-sonnet-5, claude-fable-5-2 -> claude-fable-5-1.
    Returns (rate row name or None)."""
    if model in table:
        return model
    parts = model.split('-')
    for k in range(len(parts) - 1, 1, -1):
        prefix = '-'.join(parts[:k])
        cands = sorted(m for m in table if m == prefix or m.startswith(prefix + '-'))
        if cands:
            return cands[-1]
    return None


def build_money(cfg, now, since, rows, U, rates):
    table, eur = rates['models'], float(cfg['eurPerUsd'])
    used, aliased, unpriced = set(), {}, 0
    points = []
    total_usd = 0.0
    for r in rows:
        for e in r['events']:
            m = resolve_model(e['model'], table)
            toks = e['inp'] + e['cw'] + e['cr'] + e['out']
            if m is None:
                unpriced += toks
                continue
            used.add(m)
            if m != e['model']:
                aliased[e['model']] = m
            p = table[m]
            usd = (e['inp'] * p['input'] + e['out'] * p['output'] + e['cw'] * p['cache_write'] + e['cr'] * p['cache_read']) / 1e6
            total_usd += usd
            points.append((e['t'], usd * eur))
    points.sort(key=lambda x: x[0])
    series = bucketize(points, since, now, SERIES_STEP_MIN)
    return {
        'estimate': True,
        'estimateEUR': round(total_usd * eur, 2),
        'estimateSeries': [round(x, 2) for x in series],
        'projection': project_line(series, since, now, parse(cfg['_deadline']), SERIES_STEP_MIN, key=2),
        'rateCard': {'source': rates['source'], 'eurPerUsd': eur, 'cacheWriteTtl': rates.get('cacheWriteTtl', '5m'),
                     'label': 'estimate at API list price, not a bill',
                     'usedModels': sorted(used), 'aliased': aliased, 'unpricedTokens': unpriced},
    }


# ----------------------------------------------------------------------------- linear

LINEAR_QUERY = """
query($pid:String!,$after:String){
  project(id:$pid){
    name
    issues(first:25, after:$after){
      nodes{
        identifier title
        state{name type}
        assignee{name}
        labels(first:10){nodes{name parent{name}}}
        projectMilestone{name}
        startedAt completedAt
        inverseRelations(first:10){nodes{type issue{identifier state{type}}}}
      }
      pageInfo{hasNextPage endCursor}
    }
  }
}
"""


def linear_key(env=None, env_file=ENV_AGENTS):
    env = os.environ if env is None else env
    k = env.get('LINEAR_API_KEY_BACKEND')
    if k:
        return k
    path = os.path.expanduser(env_file)
    if os.path.isfile(path):
        for line in open(path):
            line = line.strip()
            if line.startswith('LINEAR_API_KEY_BACKEND='):
                return line.split('=', 1)[1].strip().strip('"\'')
    raise BlockError('LINEAR_API_KEY_BACKEND not found (environment or %s)' % env_file)


def fetch_linear(project_id, key, api=LINEAR_API, timeout=20):
    nodes, after = [], None
    for _ in range(20):
        body = json.dumps({'query': LINEAR_QUERY, 'variables': {'pid': project_id, 'after': after}}).encode()
        req = urllib.request.Request(api, data=body, headers={'Authorization': key, 'Content-Type': 'application/json'})
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                d = json.loads(resp.read().decode())
        except urllib.error.HTTPError as ex:
            try:
                detail = ex.read().decode()[:200]
            except Exception:
                detail = ''
            raise BlockError('Linear answered HTTP %s %s' % (ex.code, clean(detail)))
        except Exception as ex:
            raise BlockError('Linear unreachable: %s' % ex)
        if d.get('errors'):                      # Linear reports failures as 200 + errors (MIN-2031)
            raise BlockError('Linear error: %s' % clean(d['errors'][0].get('message', d['errors'])))
        proj = (d.get('data') or {}).get('project')
        if not proj:
            raise BlockError('Linear returned no project for the configured id')
        conn = proj['issues']
        nodes.extend(conn['nodes'])
        if not conn['pageInfo']['hasNextPage']:
            return nodes
        after = conn['pageInfo']['endCursor']
    raise BlockError('Linear paging did not finish after 20 pages')


def fmt_ago(minutes):
    if minutes is None:
        return '-'
    m = int(minutes)
    return '%dm' % m if m < 60 else '%dh' % (m // 60) if m < 1440 else '%dd' % (m // 1440)


def role_label_name(n, role_labels):
    # The name of the issue's Role label (the `Role` label group), or None.
    return next((l['name'] for l in n['labels']['nodes']
                 if (l.get('parent') or {}).get('name') == 'Role' and l['name'] in role_labels), None)


def summarize_linear(nodes, cfg, hand_milestones, now, since, last_seen):
    role_labels = cfg['roleLabels']
    agents_cfg = cfg['agents']
    founder = cfg.get('founder') or {}   # {"linear": "<Linear account name>", "role": "Founder"}
    live = [n for n in nodes if n['state']['type'] != 'canceled']
    t = collections.Counter()
    by_role = collections.Counter()
    ms = collections.defaultdict(lambda: [0, 0])
    for n in live:
        st, name = n['state']['type'], n['state']['name']
        blocked = any(r['type'] == 'blocks' and r['issue']['state']['type'] not in ('completed', 'canceled')
                      for r in n['inverseRelations']['nodes'])
        if st == 'completed':
            t['done'] += 1
        elif name == 'In Review':
            t['inReview'] += 1
        elif st == 'started':
            t['inProgress'] += 1
        elif blocked:
            t['blocked'] += 1
        else:
            t['open'] += 1
        label = role_label_name(n, role_labels)
        role = role_labels[label] if label else None
        if role is None and founder.get('linear') and (n.get('assignee') or {}).get('name') == founder['linear']:
            role = founder.get('role', 'Founder')   # the founder's own issues (his Q issues) are not an agent's work
        by_role[role or 'Other'] += 1
        mname = (n.get('projectMilestone') or {}).get('name') or ''
        mid = mname.split(' ')[0] if mname else ''
        if mid:
            ms[mid][1] += 1
            if st == 'completed':
                ms[mid][0] += 1
    tasks = {k: t[k] for k in ('done', 'inProgress', 'inReview', 'open', 'blocked')}
    tasks['total'] = len(live)
    tasks['byRole'] = dict(by_role)
    milestones = []
    for m in hand_milestones:
        d, tot = ms.get(m['id'], [0, 0])
        milestones.append(dict(m, done=d, total=tot))
    current = next((m['id'] for m in milestones if m['total'] == 0 or m['done'] < m['total']), None)
    agents, lanes = [], []
    for a in agents_cfg:
        if a.get('roleLabel'):
            # An agent that writes under the founder's Linear account (the CTO) is told apart by its Role label,
            # never by the assignee name, or every issue assigned to the founder would count as the agent's.
            mine = [n for n in live if role_label_name(n, role_labels) == a['roleLabel']]
        else:
            mine = [n for n in live if a.get('linear') and (n.get('assignee') or {}).get('name') == a['linear']]
        active = [n for n in mine if n['state']['type'] == 'started']
        active.sort(key=lambda n: n.get('startedAt') or '', reverse=True)
        pick = active[0] if active else None
        ls = last_seen.get(a['n'])
        ago = (now - parse(ls)).total_seconds() / 60 if ls else None
        agents.append({'n': a['n'], 'role': a['role'], 'state': 'active' if pick else 'idle',
                       'issue': pick['identifier'] if pick else '-', 'title': pick['title'] if pick else '-',
                       'last': fmt_ago(ago)})
        bars = []
        for n in mine:
            if not n.get('startedAt'):
                continue
            frm = parse(n['startedAt'])
            to = parse(n['completedAt']) if n.get('completedAt') else None
            if to and to < since:
                continue
            bars.append({'issue': n['identifier'], 'from': iso(max(frm, since)), 'to': iso(to) if to else 'now',
                         'state': 'done' if n['state']['type'] == 'completed' else 'active'})
        bars.sort(key=lambda b: b['from'])
        lanes.append({'agent': a['n'], 'bars': bars})
    return {'milestones': milestones, 'current': current, 'tasks': tasks, 'agents': agents, 'lanes': lanes}


# ----------------------------------------------------------------------------- hand

def build_hand(hand):
    need = ('deadline', 'buildStart', 'freeze', 'submitBy', 'milestones', 'credits', 'demo')
    miss = [k for k in need if k not in hand]
    if miss:
        raise BlockError('hand-set.json is missing: %s' % ', '.join(miss))
    for k in ('deadline', 'buildStart', 'freeze', 'submitBy'):
        parse(hand[k])
    steps = hand['demo'].get('steps', [])
    if len(steps) != 8 or any(s.get('s') not in ('pass', 'warn', 'fail', 'idle') for s in steps):
        raise BlockError('hand-set.json: demo.steps must be 8 entries with s = pass|warn|fail|idle')
    return dict([(k, hand[k]) for k in ('deadline', 'buildStart', 'freeze', 'submitBy')] +
                [('milestonesMeta', hand['milestones']), ('credits', hand['credits']), ('demo', hand['demo']),
                 ('current', hand.get('current'))])


# ----------------------------------------------------------------------------- assemble

def run_block(state, name, fn, now):
    """Run one block. On success: new data + asOf=now. On failure: keep the last good data and asOf, record the error."""
    try:
        data = fn()
        state[name] = {'asOf': iso(now), 'data': data, 'error': None}
    except Exception as ex:
        prev = state.get(name) or {'asOf': None, 'data': None}
        state[name] = {'asOf': prev.get('asOf'), 'data': prev.get('data'),
                       'error': {'message': clean(ex), 'at': iso(now)}}


def build(now, hand, rates, state, root, usage_bin, key_fn, api=LINEAR_API):
    cfg = dict(hand['config'])
    cfg['_deadline'] = hand['deadline']
    since = parse(hand['buildStart'])
    holder = {}

    run_block(state, 'hand', lambda: build_hand(hand), now)

    def usage():
        data, rows, U = build_usage(cfg, now, since, root, usage_bin, cfg.get('projectFilter'))
        holder['rows'], holder['U'] = rows, U
        return data
    run_block(state, 'usage', usage, now)

    def money():
        if 'rows' not in holder:
            raise BlockError('usage unavailable this run, so no new estimate')
        return build_money(cfg, now, since, holder['rows'], holder['U'], rates)
    run_block(state, 'money', money, now)

    def linear():
        nodes = fetch_linear(cfg['linearProjectId'], key_fn(), api)
        meta = (state.get('hand') or {}).get('data') or {}
        ls = ((state.get('usage') or {}).get('data') or {}).get('lastSeen', {})
        return summarize_linear(nodes, cfg, meta.get('milestonesMeta', hand['milestones']), now, since, ls)
    run_block(state, 'linear', linear, now)

    g = lambda b: (state.get(b) or {}).get('data') or {}
    h, lin, us, mo = g('hand'), g('linear'), g('usage'), g('money')
    snap = {
        'schema': SCHEMA, 'intervalSec': INTERVAL_SEC, 'generatedAt': iso(now),
        'blocks': {b: {'asOf': (state.get(b) or {}).get('asOf'), 'error': (state.get(b) or {}).get('error')} for b in BLOCKS},
    }
    for k in ('deadline', 'buildStart', 'freeze', 'submitBy'):
        if k in h:
            snap[k] = h[k]
    if lin:
        snap.update({k: lin[k] for k in ('milestones', 'current', 'tasks', 'agents', 'lanes')})
    elif h:
        snap['milestones'] = h.get('milestonesMeta', [])
    if h.get('current'):
        snap['current'] = h['current']
    if us:
        snap['tokens'] = us
    if mo or h:
        snap['money'] = dict(mo, credits=h.get('credits', []))
    if h:
        snap['demo'] = h['demo']
    return snap


def push(snapshot_text, url, key, anon):
    # The Supabase gateway checks a JWT in Authorization (the public anon key); the function then checks the
    # dedicated push key in x-dashboard-key. Neither value is printed or logged.
    req = urllib.request.Request(url, data=snapshot_text.encode(), method='POST',
                                 headers={'Authorization': 'Bearer ' + anon, 'apikey': anon,
                                          'x-dashboard-key': key, 'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            return resp.status
    except urllib.error.HTTPError as ex:
        raise BlockError('push refused: HTTP %s' % ex.code)
    except Exception as ex:
        raise BlockError('push failed: %s' % clean(ex))


def load_push_config(home):
    # <home>/push.json (mode 600): {"url": ingest URL, "anon": public gateway key}; the push key is <home>/push.key (mode 600).
    try:
        conf = json.load(open(os.path.join(home, 'push.json')))
        key = open(os.path.join(home, 'push.key')).read().strip()
    except (OSError, ValueError):
        return None
    if not (conf.get('url') and conf.get('anon') and key):
        return None
    return {'url': conf['url'], 'anon': conf['anon'], 'key': key}


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    here = os.path.dirname(os.path.abspath(__file__))
    ap.add_argument('--home', default=HOME_DEFAULT)
    ap.add_argument('--hand')
    ap.add_argument('--rates', default=os.path.join(here, 'rates.json'))
    ap.add_argument('--root', default='~/.claude/projects')
    ap.add_argument('--usage-bin', default=USAGE_BIN_DEFAULT)
    ap.add_argument('--out')
    ap.add_argument('--push', action='store_true', help='POST to the ingest URL in <home>/push.json with <home>/push.key')
    ap.add_argument('--now')
    a = ap.parse_args(argv)
    home = os.path.expanduser(a.home)
    os.makedirs(home, exist_ok=True)
    hand_path = os.path.expanduser(a.hand or os.path.join(home, 'hand-set.json'))
    state_path = os.path.join(home, 'state.json')
    now = parse(a.now) if a.now else datetime.now(timezone.utc)
    hand = json.load(open(hand_path))
    rates = json.load(open(a.rates))
    state = json.load(open(state_path)) if os.path.isfile(state_path) else {}
    snap = build(now, hand, rates, state, os.path.expanduser(a.root), a.usage_bin, linear_key)
    text = json.dumps(snap, separators=(',', ':'), sort_keys=False)
    assert_clean(text)
    tmp = state_path + '.tmp'
    with open(tmp, 'w') as f:
        json.dump(state, f)
    os.replace(tmp, state_path)
    if a.out:
        with open(os.path.expanduser(a.out), 'w') as f:
            f.write(text)
    status = ', '.join('%s=%s' % (b, 'ERR' if snap['blocks'][b]['error'] else 'ok') for b in BLOCKS)
    if a.push:
        conf = load_push_config(home)
        if not conf:
            print('push skipped: %s missing or incomplete' % os.path.join(home, 'push.json'), file=sys.stderr)
            return 3
        code = push(text, conf['url'], conf['key'], conf['anon'])
        status += ', pushed HTTP %s' % code
    print('%s %s (%d bytes)' % (iso(now), status, len(text)))
    return 0


if __name__ == '__main__':
    sys.exit(main())
