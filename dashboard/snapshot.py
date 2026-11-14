#!/usr/bin/env python3
"""snapshot.py — builds one dashboard snapshot (contract v1, MIN-4456) and writes it to a file and/or pushes it.

    snapshot.py [--out PATH] [--push] [--home DIR] [--hand PATH] [--directions PATH] [--rates PATH] [--root DIR] [--now ISO]

Stdlib only (Python 3.9+). Five blocks, each with its own asOf and error:
  linear  Linear GraphQL, READ-ONLY queries (a test fails if this file contains a write operation); also the `forecast` block (MIN-4565)
  usage   ~/.claude/projects transcripts, read through the same scan()/build_run() code as conductor's bin/usage
  money   usage tokens by model x rates.json x eurPerUsd. An estimate at API list price, never a bill
  hand    ~/.healthapp-dashboard/hand-set.json (credits, demo steps, clean runs, milestone metadata)
  branches  the healthapp repo's branches: local git (read-only: no fetch, no lock, no write) and PRs through one `gh pr list` call (MIN-4460)
  repo      numbers only about the same repo: branches, PRs, commits, lines of code (MIN-4568). Same read-only git and one more `gh pr list`; every field names its source in build_repo
Besides the blocks, `directions` (the project goal's five directions and their status, MIN-4497) is read from ~/.healthapp-dashboard/directions.json,
a second hand-set file: summary text only, no patient data. A missing file omits the field; a bad file omits it too and puts the reason in blocks.hand.error.
A block that fails keeps its last good value, gets a newer `error`, keeps its old `asOf`; the others stay fresh.
No key is ever printed, logged or put in the snapshot (see assert_clean).
"""
import argparse, bisect, collections, importlib.machinery, importlib.util, json, os, re, shutil, statistics, subprocess, sys, urllib.request, urllib.error
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

SCHEMA = 1
INTERVAL_SEC = 180
SERIES_STEP_MIN = 15
LINEAR_API = 'https://api.linear.app/graphql'
# Built from pieces so that the repo-wide key grep does not match this definition.
SECRET_RE = re.compile('|'.join(['lin' + '_api_', 'eyJ' + '[A-Za-z0-9_-]{30,}', 'sb' + '_secret_', 'SUPABASE_SERVICE' + r'_ROLE_KEY\s*[=:]\s*\S{20,}', 'sbp' + '_[A-Za-z0-9]{20,}',
                                'gh' + '[pousr]_[A-Za-z0-9]{20,}', 'github' + '_pat_[A-Za-z0-9_]{20,}']))
HOME_DEFAULT = '~/.healthapp-dashboard'
USAGE_BIN_DEFAULT = '~/AppDevelopment/conductor/bin/usage'
ENV_AGENTS = '~/.claude/.env.agents'
BLOCKS = ('linear', 'usage', 'money', 'hand', 'branches', 'repo')


DIRECTION_STATUSES = ('on_track', 'at_risk', 'off_track', 'not_started')
DIRECTIONS_FILE = 'directions.json'


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
    home = os.path.expanduser('~')
    if len(home) > 1:
        msg = msg.replace(home, '~')              # a local path never leaves the Mac (MIN-4458)
    msg = re.sub(r'/(?:Users|home)/[^/\s:]+', '~', msg)   # and no other account's home folder either
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
    issues(first:20, after:$after){
      nodes{
        identifier title description priority
        parent{identifier parent{identifier}}
        children(first:1){nodes{identifier}}
        state{name type}
        assignee{name}
        labels(first:10){nodes{name parent{name}}}
        projectMilestone{name}
        startedAt completedAt
        inverseRelations(first:10){nodes{type issue{identifier state{type} assignee{name}}}}
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
    for _ in range(40):
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
    raise BlockError('Linear paging did not finish after 40 pages')


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


# ----------------------------------------------------------------------------- forecast (MIN-4565)
# Runs on the Mac. The description is read only to parse the estimate; the block carries ids, titles and numbers.

FORECAST_TZ = 'Europe/Athens'
MUST_MILESTONES = ('M2', 'M3', 'M4', 'M5', 'M6', 'M7')
DASHBOARD_ROOT = 'MIN-4445'                       # the dashboard is not needed for the demo: its whole subtree is out
OPEN_STATES = ('Todo', 'In Progress', 'In Review')
DEFAULT_MINUTES = 30                              # used when fewer than MIN_ESTIMATED issues carry an estimate
MIN_ESTIMATED = 5
EARLY_DONE = 3                                    # fewer done issues than this: the pace is not trusted, no "On track"
ON_TRACK_MARGIN = timedelta(hours=1)              # On track = finish at least one hour before the freeze
EST_RE = re.compile(r'est\.?\s*time\s*[:\uff1a]\s*\**\s*[~\u2248]?\s*(\d+(?:\.\d+)?)(?:\s*(?:-|\u2013|to)\s*\d+(?:\.\d+)?)?\s*min', re.I)
DAYS = ('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun')


def parse_estimate(description):
    """Minutes from the `est. time: <n> min` line of the Estimate block; the first number of `~35`, `30-45`. None when absent."""
    m = EST_RE.search(description or '')
    if not m:
        return None
    v = float(m.group(1))
    return int(v) if v == int(v) else v


def athens(t):
    return t.astimezone(ZoneInfo(FORECAST_TZ))


def athens_iso(t):
    return athens(t).isoformat(timespec='seconds') if t else None


def athens_label(t):
    if not t:
        return None
    a = athens(t)
    return '%s %s' % (DAYS[a.weekday()], a.strftime('%H:%M'))


def parent_map(nodes):
    """identifier -> parent identifier, from the fetched nodes, with the query's grandparent as the fallback for a parent
    that is not in the project."""
    parent = {}
    for n in nodes:
        p = n.get('parent') or {}
        if p.get('identifier'):
            parent[n['identifier']] = p['identifier']
            gp = (p.get('parent') or {}).get('identifier')
            if gp:
                parent.setdefault(p['identifier'], gp)
    return parent


def under_root(nodes, root):
    """Identifiers of every issue whose parent chain reaches `root` (root included). The chain is followed through the
    fetched nodes, with the query's grandparent as the fallback for a parent that is not in the project."""
    parent = parent_map(nodes)
    out = set()
    for n in nodes:
        cur, seen = n['identifier'], set()
        while cur and cur not in seen:
            if cur == root:
                out.add(n['identifier'])
                break
            seen.add(cur)
            cur = parent.get(cur)
    return out


def blockers_of(n):
    out = []
    for r in (n.get('inverseRelations') or {}).get('nodes', []):
        i = r.get('issue') or {}
        if r.get('type') == 'blocks' and (i.get('state') or {}).get('type') not in ('completed', 'canceled', 'duplicate'):
            out.append({'id': i.get('identifier'), 'who': (i.get('assignee') or {}).get('name') or 'unassigned'})
    return out


def forecast_times(pre_left, post_left, pace, now, freeze):
    """(finish_at, ready_at). Build work (M2 to M5) runs from now; M6 and M7 cannot start before the freeze (MIN-4564)."""
    finish = now + timedelta(hours=pre_left / pace) if pre_left > 0 else now
    ready = max(finish, freeze) + timedelta(hours=post_left / pace)
    return finish, ready


def clamped_times(pre_left, post_left, pace, now, freeze):
    """forecast_times for the cut walk: a finish too far away to represent is clamped to 100 years out, never an error."""
    far = now + timedelta(days=36500)
    try:
        finish, ready = forecast_times(pre_left, post_left, pace, now, freeze)
    except OverflowError:
        return far, far
    return min(finish, far), min(ready, far)


def cut_walk(items, order, pre_left, post_left, pace, now, freeze, submit):
    """Drop issues in the cut order. Pre items (M2 to M5) first, while the build finish is after the freeze; then post items
    (M6 and M7), while the full plan is ready after the submit time. `items` are open issues with minutes and a `phase`."""
    rank = {i: k for k, i in enumerate(order)}
    prio = lambda it: 5 if not it['priority'] else it['priority']          # Linear: 1 urgent .. 4 low, 0 none (cut first)

    def ordered(phase):
        its = [it for it in items if it['phase'] == phase]
        listed = sorted((it for it in its if it['id'] in rank), key=lambda it: rank[it['id']])
        rest = sorted((it for it in its if it['id'] not in rank), key=lambda it: (-prio(it), -it['minutes'], it['id']))
        return listed + rest, bool(listed)

    cuts = []
    finish, ready = clamped_times(pre_left, post_left, pace, now, freeze)
    pre, l1 = ordered('pre')
    post, l2 = ordered('post')
    for it in pre:
        if finish <= freeze:
            break
        pre_left -= it['minutes']
        finish, ready = clamped_times(pre_left, post_left, pace, now, freeze)
        cuts.append(cut_row(it, finish, ready))
    for it in post:
        if ready <= submit:
            break
        post_left -= it['minutes']
        finish, ready = clamped_times(pre_left, post_left, pace, now, freeze)
        cuts.append(cut_row(it, finish, ready))
    return cuts, bool(finish <= freeze and ready <= submit), bool(l1 or l2)


def cut_row(it, finish, ready):
    return {'id': it['id'], 'title': it['title'], 'minutes': it['minutes'], 'phase': it['phase'],
            'finish_after': athens_iso(finish), 'finish_after_label': athens_label(finish),
            'ready_after': athens_iso(ready), 'ready_after_label': athens_label(ready)}


POST_MILESTONES = ('M6', 'M7')                    # need the freeze first: "three clean runs after the freeze", then the submission


def build_forecast(nodes, cfg, now, since, freeze, submit):
    fcfg = cfg.get('forecast') or {}
    out_of_scope = under_root(nodes, fcfg.get('dashboardRoot', DASHBOARD_ROOT))
    parent = parent_map(nodes)
    own_ms = {n['identifier']: ((n.get('projectMilestone') or {}).get('name') or '').split(' ')[0] for n in nodes}

    def ms_of(ident):
        """The issue's milestone; none of its own: the nearest ancestor's, by the same walk as `under_root` (MIN-4564)."""
        seen = set()
        while ident and ident not in seen:
            if own_ms.get(ident):
                return own_ms[ident]
            seen.add(ident)
            ident = parent.get(ident)
        return ''

    cand = [n for n in nodes if ms_of(n['identifier']) in MUST_MILESTONES and n['identifier'] not in out_of_scope]
    in_scope = lambda n: n['state']['name'] in OPEN_STATES or (
        n['state']['type'] == 'completed' and n.get('completedAt') and parse(n['completedAt']) >= since)
    # a parent counts 0 only when one of its sub-issues is itself in scope; otherwise it counts its own estimate
    counted_by_kids = {parent[n['identifier']] for n in cand if in_scope(n) and n['identifier'] in parent}
    scope = [n for n in cand if n['identifier'] not in counted_by_kids]
    est = {n['identifier']: parse_estimate(n.get('description')) for n in scope}
    done = [n for n in scope if n['state']['type'] == 'completed' and n.get('completedAt') and parse(n['completedAt']) >= since]
    opened = [n for n in scope if n['state']['name'] in OPEN_STATES]
    estimated = [est[n['identifier']] for n in done + opened if est[n['identifier']] is not None]
    if len(estimated) >= MIN_ESTIMATED:
        default, source = round(statistics.median(estimated), 1), 'median'
        default = int(default) if default == int(default) else default
    else:
        default, source = DEFAULT_MINUTES, 'fallback'
    mins = lambda n: est[n['identifier']] if est[n['identifier']] is not None else default
    phase = lambda n: 'post' if ms_of(n['identifier']) in POST_MILESTONES else 'pre'
    todo = [n for n in opened if n['state']['name'] in ('Todo', 'In Progress')]
    review = [n for n in opened if n['state']['name'] == 'In Review']

    done_min = sum(mins(n) for n in done)
    pre_min = sum(mins(n) for n in todo if phase(n) == 'pre')
    post_min = sum(mins(n) for n in todo if phase(n) == 'post')
    rem_min = pre_min + post_min
    hours = (now - since).total_seconds() / 3600
    pace = done_min / hours if hours > 0 else 0.0
    on_by = freeze - ON_TRACK_MARGIN
    ready_on_by = submit - ON_TRACK_MARGIN

    finish = ready = None
    if rem_min <= 0:
        finish, ready = forecast_times(0, 0, 1.0, now, freeze)
    elif pace > 0:
        try:
            finish, ready = forecast_times(pre_min, post_min, pace, now, freeze)
        except OverflowError:
            finish = ready = None
    early = len(done) < EARLY_DONE
    if rem_min > 0 and finish is None:
        verdict = 'off'                               # pace 0 with work left
    else:
        verdict = 'on' if finish <= on_by and ready <= ready_on_by else 'risk' if ready <= submit else 'off'
        if early and verdict == 'on':
            verdict = 'risk'

    cut, reaches, listed = [], False, False
    if verdict == 'off' and pace > 0:
        items = [{'id': n['identifier'], 'title': n['title'], 'minutes': mins(n), 'priority': n.get('priority') or 0, 'phase': phase(n)}
                 for n in todo if mins(n) > 0]
        cut, reaches, listed = cut_walk(items, [str(i) for i in fcfg.get('cutOrder') or []], pre_min, post_min, pace, now, freeze, submit)

    blocked = [{'id': n['identifier'], 'title': n['title'], 'waits_on': b}
               for n in todo + review for b in [blockers_of(n)] if b]
    r1 = lambda v: round(v, 1)
    return {
        'tz': FORECAST_TZ, 'at': athens_iso(now), 'build_start': athens_iso(since), 'freeze': athens_iso(freeze),
        'submit': athens_iso(submit), 'on_by': athens_iso(on_by), 'ready_on_by': athens_iso(ready_on_by),
        'elapsed_hours': r1(max(hours, 0.0)),
        'done': {'issues': len(done), 'minutes': r1(done_min), 'no_estimate': [n['identifier'] for n in done if est[n['identifier']] is None]},
        'pace_min_per_hour': r1(pace), 'early_pace': early,
        'remaining': {'issues': len(todo), 'minutes': r1(rem_min), 'pre_minutes': r1(pre_min), 'post_minutes': r1(post_min),
                      'in_review': len(review),
                      'no_estimate': [n['identifier'] for n in todo if est[n['identifier']] is None],
                      'default_minutes': default, 'default_source': source},
        'blocked': blocked,
        'finish_at': athens_iso(finish), 'finish_label': athens_label(finish),
        'ready_at': athens_iso(ready), 'ready_label': athens_label(ready), 'verdict': verdict,
        'cut': cut, 'cut_source': 'list' if listed else 'priority', 'cut_reaches_freeze': reaches,
    }


# ----------------------------------------------------------------------------- branches (MIN-4460)

REPO_DEFAULT = '~/AppDevelopment/healthapp'
BRANCH_BASES = ('main', 'staging')
GH_CANDIDATES = ('/opt/homebrew/bin/gh', '/usr/local/bin/gh', '/usr/bin/gh')   # launchd's PATH has none of them
GH_FIELDS = 'number,state,headRefName,headRefOid,baseRefName,url,title,mergedAt,closedAt,additions,deletions,changedFiles,author'
ISSUE_RE = re.compile(r'(?<![a-z0-9])min-(\d{1,6})(?!\d)', re.I)
AUTHOR_TAG_RE = re.compile(r'^hello\+([a-z0-9]+)@', re.I)
MAX_OPEN_LISTED, MAX_CLOSED_LISTED = 60, 50      # the CTO's cap: at most 50 closed/merged branches (MIN-4460)
GH_TIMEOUT = 10                                     # seconds, one gh call per run
PRIMARY_BASE = 'staging'                            # the integration branch: ahead/behind is counted against it


def default_runner(argv, cwd, timeout):
    """(returncode, stdout, stderr). A missing binary raises FileNotFoundError; a timeout answers 124."""
    # GIT_OPTIONAL_LOCKS=0: `git status`-style reads must not take the index lock while agents use the same repo.
    env = dict(os.environ, GIT_OPTIONAL_LOCKS='0', GH_PROMPT_DISABLED='1', GH_NO_UPDATE_NOTIFIER='1', GIT_TERMINAL_PROMPT='0', NO_COLOR='1', LC_ALL='C')
    try:
        p = subprocess.run(argv, cwd=cwd, capture_output=True, text=True, timeout=timeout, env=env)
    except subprocess.TimeoutExpired:
        return 124, '', 'timed out after %ss' % timeout
    return p.returncode, p.stdout, p.stderr


def find_gh():
    return shutil.which('gh') or next((c for c in GH_CANDIDATES if os.path.isfile(c)), 'gh')


def git_out(runner, repo, *args, timeout=30):
    rc, out, err = runner(['git'] + list(args), repo, timeout)
    if rc != 0:
        raise BlockError('git %s failed: %s' % (args[0], clean(err.strip()) or 'exit %d' % rc))
    return out


def issue_of(*texts):
    for kind, t in texts:
        m = ISSUE_RE.search(t or '')
        if m:
            return 'MIN-%s' % m.group(1), kind
    return None, None


def agent_for_node(n, agents_cfg, role_labels):
    """The agent whose issue this is: same two rules as summarize_linear (Role label for roleLabel agents, else assignee name)."""
    for a in agents_cfg:
        if a.get('roleLabel') and role_label_name(n, role_labels) == a['roleLabel']:
            return a['n']
    for a in agents_cfg:
        if not a.get('roleLabel') and a.get('linear') and (n.get('assignee') or {}).get('name') == a['linear']:
            return a['n']
    return None


def slug_of(url):
    """owner/repo from a github.com remote URL (https, ssh, with or without credentials); None for anything else."""
    m = re.search(r'github\.com[:/]([^/:@\s]+/[^/\s]+?)(?:\.git)?/?\s*$', url or '')
    return m.group(1) if m else None


def read_gh_prs(runner, repo, gh_bin):
    """({head branch: its PR}, None) or (None, reason). Never raises: a missing or logged-out gh is data, not a failure."""
    try:
        rc, out, err = runner([gh_bin, 'pr', 'list', '--state', 'all', '--limit', '200', '--json', GH_FIELDS], repo, GH_TIMEOUT)
    except FileNotFoundError:
        return None, 'gh not installed'
    if rc != 0:
        low = err.lower()
        if 'gh auth login' in low or 'not logged' in low or 'authentication' in low or 'bad credentials' in low or 'http 401' in low:
            return None, 'gh not authenticated'
        return None, 'gh failed: %s' % (clean(err.strip()) or 'exit %d' % rc)
    try:
        prs = json.loads(out)
    except ValueError:
        return None, 'gh failed: answer was not JSON'
    by_head = {}
    for pr in prs:
        h = pr.get('headRefName')
        cur = by_head.get(h)
        # one PR per branch: an open one wins, else the newest
        if cur is None or (pr['state'] == 'OPEN' and cur['state'] != 'OPEN') or (
                (pr['state'] == 'OPEN') == (cur['state'] == 'OPEN') and pr['number'] > cur['number']):
            by_head[h] = pr
    return by_head, None


def read_refs(runner, repo):
    """{branch name: {'local': row, 'remote': row}} from one for-each-ref call; rows carry sha, time, author, email."""
    fmt = '%1f'.join(['%(refname)', '%(objectname)', '%(committerdate:iso-strict)', '%(authorname)', '%(authoremail)'])
    out = git_out(runner, repo, 'for-each-ref', '--format=' + fmt, 'refs/heads', 'refs/remotes/origin')
    refs = collections.defaultdict(dict)
    for line in out.splitlines():
        f = line.split('\x1f')
        if len(f) < 5:
            continue
        ref, sha, when, who, mail = f[:5]
        if ref.startswith('refs/heads/'):
            kind, name = 'local', ref[len('refs/heads/'):]
        elif ref.startswith('refs/remotes/origin/'):
            kind, name = 'remote', ref[len('refs/remotes/origin/'):]
        else:
            continue
        if name == 'HEAD':
            continue
        refs[name][kind] = {'ref': ref, 'sha': sha, 't': parse(when), 'author': who, 'mail': mail.strip('<>')}
    return refs


def ahead_behind(runner, repo, base_ref, tip):
    out = git_out(runner, repo, 'rev-list', '--left-right', '--count', '%s...%s' % (base_ref, tip))
    behind, ahead = (int(x) for x in out.split())
    return {'ahead': ahead, 'behind': behind}


def diff_stats(runner, repo, base_ref, tip):
    out = git_out(runner, repo, 'diff', '--numstat', '%s...%s' % (base_ref, tip))
    files = added = removed = 0
    for line in out.splitlines():
        a, r, _ = line.split('\t', 2)
        files += 1
        added += int(a) if a.isdigit() else 0       # a binary file shows '-'
        removed += int(r) if r.isdigit() else 0
    return files, added, removed


def build_branches(bcfg, now, tz, nodes, agents_cfg, role_labels, runner=default_runner, gh_bin=None):
    """The branches block. Local git is the floor; `gh` adds PR state. If only gh fails the block still returns,
    with PR fields null and a `_warning` that run_block turns into blocks.branches.error."""
    repo = os.path.expanduser(bcfg.get('repoPath') or REPO_DEFAULT)
    bases = tuple(bcfg.get('bases') or BRANCH_BASES)
    if not os.path.isdir(repo):
        raise BlockError('repo folder not found')
    git_out(runner, repo, 'rev-parse', '--git-dir')
    slug = bcfg.get('slug')
    if not slug:
        rc, url, _ = runner(['git', 'remote', 'get-url', 'origin'], repo, 10)
        slug = slug_of(url) if rc == 0 else None
    warnings = []
    # No `git fetch` here (CTO, MIN-4460): the job only reads. Remote state comes from `gh`; the remote-tracking refs are
    # used as they are, and `staleRefs` / a warning say when `gh` knows better than they do.
    refs = read_refs(runner, repo)
    base_ref = {}
    for b in bases:
        r = refs.get(b, {})
        base_ref[b] = (r.get('remote') or r.get('local') or {}).get('ref')
    worktrees = set()
    for line in git_out(runner, repo, 'worktree', 'list', '--porcelain').splitlines():
        if line.startswith('branch refs/heads/'):
            worktrees.add(line[len('branch refs/heads/'):])
    prs, gh_err = read_gh_prs(runner, repo, gh_bin or find_gh())
    if gh_err:
        warnings.append(gh_err)
    prs = prs or {}
    stale = None
    if not gh_err:
        # an open PR whose head the local origin/<branch> does not have, or has at another commit: the refs are behind gh
        stale = sum(1 for h, p in prs.items() if p['state'] == 'OPEN' and h not in bases
                    and (refs.get(h, {}).get('remote') or {}).get('sha') != p.get('headRefOid'))
        if stale:
            warnings.append('local remote-tracking refs are behind gh for %d open PR%s; ahead/behind and file counts may be old '
                            '(this job never fetches)' % (stale, '' if stale == 1 else 's'))
    nodes_by_id = {n['identifier']: n for n in (nodes or [])}
    day_start = now.astimezone(tz).replace(hour=0, minute=0, second=0, microsecond=0)

    # 1. every branch that is not a base: live refs (local or remote) plus the head of every PR
    entries = []
    for name in sorted(set(n for n in refs if n not in bases) | set(n for n in prs if n and n not in bases)):
        rs = refs.get(name, {})
        tip = max(rs.values(), key=lambda r: r['t']) if rs else None
        pr = prs.get(name)
        state = {'OPEN': 'open', 'MERGED': 'merged', 'CLOSED': 'closed'}[pr['state']] if pr else 'open'
        ended = (pr or {}).get('mergedAt') or (pr or {}).get('closedAt')
        when = parse(ended) if ended else None
        entries.append({'name': name, 'state': state, 'tip': tip, 'pr': pr, 'rs': rs, 'sort': (when or (tip['t'] if tip else None) or now)})
    totals = {'open': sum(e['state'] == 'open' for e in entries),
              'openOnRemote': sum(e['state'] == 'open' and ('remote' in e['rs'] or bool(e['pr'])) for e in entries),
              'total': len(entries), 'merged': None, 'mergedToday': None, 'closed': None}
    if not gh_err:
        totals['merged'] = sum(e['state'] == 'merged' for e in entries)
        totals['closed'] = sum(e['state'] == 'closed' for e in entries)
        totals['mergedToday'] = sum(e['state'] == 'merged' and parse(e['pr']['mergedAt']) >= day_start for e in entries)

    # 2. order and cap on cheap data, then spend git calls only on what is listed
    opens = sorted((e for e in entries if e['state'] == 'open'), key=lambda e: e['sort'], reverse=True)
    rest = sorted((e for e in entries if e['state'] != 'open'), key=lambda e: e['sort'], reverse=True)
    listed = opens[:MAX_OPEN_LISTED] + rest[:MAX_CLOSED_LISTED]
    truncated = len(listed) < len(entries)
    items = []
    for e in listed:
        tip, pr = e['tip'], e['pr']
        tref = tip['ref'] if tip else None
        vs = {b: (ahead_behind(runner, repo, base_ref[b], tref) if tref and base_ref[b] else None) for b in bases}
        sbase = None
        if pr and pr.get('baseRefName') in bases:
            sbase = pr['baseRefName']
        elif tref:
            known = [b for b in bases if vs[b]]
            sbase = min(known, key=lambda b: vs[b]['ahead']) if known else None   # the nearest base
        files = added = removed = None
        if tref and sbase and base_ref[sbase]:
            files, added, removed = diff_stats(runner, repo, base_ref[sbase], tref)
        elif pr:                                          # the ref is gone (deleted after merge): the PR remembers the size
            files, added, removed = pr.get('changedFiles'), pr.get('additions'), pr.get('deletions')
        issue, issue_from = issue_of(('branch', e['name']), ('pr', (pr or {}).get('title')))
        agent, agent_from = None, None
        if issue and issue in nodes_by_id:
            agent = agent_for_node(nodes_by_id[issue], agents_cfg, role_labels)
            agent_from = 'issue' if agent else None
        if not agent and tip:
            m = AUTHOR_TAG_RE.match(tip['mail'])
            hit = next((a['n'] for a in agents_cfg if m and a['role'].lower() == m.group(1).lower()), None)
            agent, agent_from = (hit, 'author') if hit else (None, None)
        items.append({
            'name': e['name'], 'state': e['state'], 'onRemote': 'remote' in e['rs'], 'hasWorktree': e['name'] in worktrees,
            'pr': {'number': pr['number'], 'state': pr['state'], 'url': pr['url'], 'base': pr.get('baseRefName'),
                   'mergedAt': pr.get('mergedAt'), 'closedAt': pr.get('closedAt')} if pr else None,
            'vsMain': vs.get('main'), 'vsStaging': vs.get('staging'), 'statsBase': sbase,
            'files': files, 'added': added, 'removed': removed,
            'lastCommitAt': iso(tip['t']) if tip else None,
            'lastCommitAuthor': (tip['author'] if tip else ((pr or {}).get('author') or {}).get('login')) or None,
            'issue': issue, 'issueFrom': issue_from, 'agent': agent, 'agentFrom': agent_from})
    data = {'repo': slug, 'bases': list(bases), 'base': PRIMARY_BASE if PRIMARY_BASE in bases else bases[0], 'staleRefs': stale, 'prSource': 'none' if gh_err else 'gh',
            'truncated': truncated, 'totals': totals, 'items': items}
    if warnings:
        data['_warning'] = '; '.join(warnings)
    return data


# ----------------------------------------------------------------------------- hand

def build_hand(hand, warning=None):
    need = ('deadline', 'buildStart', 'freeze', 'submitBy', 'milestones', 'credits', 'demo')
    miss = [k for k in need if k not in hand]
    if miss:
        raise BlockError('hand-set.json is missing: %s' % ', '.join(miss))
    for k in ('deadline', 'buildStart', 'freeze', 'submitBy'):
        parse(hand[k])
    steps = hand['demo'].get('steps', [])
    if len(steps) != 8 or any(s.get('s') not in ('pass', 'warn', 'fail', 'idle') for s in steps):
        raise BlockError('hand-set.json: demo.steps must be 8 entries with s = pass|warn|fail|idle')
    data = dict([(k, hand[k]) for k in ('deadline', 'buildStart', 'freeze', 'submitBy')] +
                [('milestonesMeta', hand['milestones']), ('credits', hand['credits']), ('demo', hand['demo']),
                 ('current', hand.get('current'))])
    if warning:                                       # a bad directions.json: the hand data is fresh, and the reason is on the block
        data['_warning'] = warning
    return data


# ----------------------------------------------------------------------------- directions

def check_directions(doc):
    """The directions of a parsed file, or raises BlockError with the reason. {"directions": [{n, title, status, note, updatedAt}, ...]}, 1 to 5
    entries, n an integer 1..5 and unique, status one of DIRECTION_STATUSES, updatedAt an ISO time with an offset. Sorted by n. Text only."""
    items = doc.get('directions') if isinstance(doc, dict) else None
    if not isinstance(items, list) or not 1 <= len(items) <= 5:
        raise BlockError('directions.json: "directions" must be a list of 1 to 5 entries')
    out, seen = [], set()
    for i, d in enumerate(items):
        where = 'directions.json entry %d' % (i + 1)
        if not isinstance(d, dict) or set(d) != {'n', 'title', 'status', 'note', 'updatedAt'}:
            raise BlockError('%s: needs exactly n, title, status, note, updatedAt' % where)
        n = d['n']
        if isinstance(n, bool) or not isinstance(n, int) or not 1 <= n <= 5 or n in seen:
            raise BlockError('%s: n must be a different whole number from 1 to 5' % where)
        seen.add(n)
        if not isinstance(d['title'], str) or not d['title'].strip() or len(d['title']) > 120:
            raise BlockError('%s: title must be 1 to 120 characters' % where)
        if d['status'] not in DIRECTION_STATUSES:
            raise BlockError('%s: status must be %s' % (where, ' | '.join(DIRECTION_STATUSES)))
        if not isinstance(d['note'], str) or len(d['note']) > 300:
            raise BlockError('%s: note must be text of at most 300 characters' % where)
        try:
            if not isinstance(d['updatedAt'], str) or datetime.fromisoformat(d['updatedAt'].replace('Z', '+00:00')).tzinfo is None:
                raise ValueError('needs text with an offset')           # no offset would be read as UTC, and the page shows "updated N min ago"
        except Exception:
            raise BlockError('%s: updatedAt must be an ISO time with an offset, such as 2026-11-14T22:00:00+02:00' % where)
        if SECRET_RE.search(d['title'] + ' ' + d['note']):
            raise BlockError('%s: the text looks like it holds a key' % where)
        out.append({'n': n, 'title': d['title'].strip(), 'status': d['status'], 'note': d['note'], 'updatedAt': d['updatedAt']})
    return sorted(out, key=lambda x: x['n'])


def read_directions(path):
    """(directions | None, warning | None). A missing file is (None, None): the field is omitted and the page says "not reported yet". A file that
    cannot be read or fails the check is (None, reason): omitted too, and the reason goes to blocks.hand.error so a typo is never silent."""
    try:
        with open(path) as f:
            raw = f.read()
    except FileNotFoundError:
        return None, None
    except OSError:
        return None, 'directions.json: the file cannot be read'
    try:
        return check_directions(json.loads(raw)), None
    except BlockError as ex:
        return None, str(ex)
    except ValueError:
        return None, 'directions.json: not valid JSON'


# ----------------------------------------------------------------------------- repo numbers (MIN-4568)

REPO_PR_LIMIT = 1000                   # one `gh pr list` call; reaching the limit is reported, never hidden
REPO_LINES_TIMEOUT = 60                # seconds for the two git calls that walk history / the tree
# Pathspecs left out of `codeLines` (lockfiles, vendored and generated files). `git grep -I` already skips binary files.
LOC_EXCLUDE = ('**/node_modules/**', '**/vendor/**', '**/third_party/**', '**/package-lock.json', '**/pnpm-lock.yaml', '**/yarn.lock',
               '**/*.lock', '**/*.lockb', '**/*.min.js', '**/*.min.css', '**/*.map')
REPO_FIELDS = ('branchesOpen', 'branchesMerged', 'prsOpen', 'prsMerged', 'prsTotal',
               'commitsStaging', 'commitsStaging24h', 'commitsMain', 'commitsMain24h',
               'linesAdded', 'linesRemoved', 'filesChanged', 'codeLines', 'codeFiles')


def gh_failure(rc, err):
    low = err.lower()
    if 'gh auth login' in low or 'not logged' in low or 'authentication' in low or 'bad credentials' in low or 'http 401' in low:
        return 'gh not authenticated'
    return 'gh failed: %s' % (clean(err.strip()) or 'exit %d' % rc)


def repo_pr_counts(runner, repo, gh_bin, refs, bases):
    """Branch and PR numbers. Source: ONE `gh pr list --state all` (PR open/merged/total, merged branches) and the remote-tracking
    refs (branches that exist on origin). Needs gh: without it `merged` is unknowable, so every field of the group is left out."""
    try:
        rc, out, err = runner([gh_bin, 'pr', 'list', '--state', 'all', '--limit', str(REPO_PR_LIMIT), '--json', 'number,state,headRefName,headRefOid'],
                              repo, GH_TIMEOUT)
    except FileNotFoundError:
        raise BlockError('gh not installed')
    if rc != 0:
        raise BlockError(gh_failure(rc, err))
    try:
        prs = json.loads(out)
        newest = {}                                    # newest PR per head branch decides whether that branch is still open
        for p in prs:
            if p['headRefName'] not in newest or p['number'] > newest[p['headRefName']]['number']:
                newest[p['headRefName']] = p
        states = [p['state'] for p in prs]
    except (ValueError, TypeError, KeyError):
        raise BlockError('gh failed: answer was not the expected JSON')
    on_remote = {n for n, r in refs.items() if 'remote' in r and n not in bases}
    open_pr_heads = {h for h, p in newest.items() if p['state'] == 'OPEN' and h not in bases}
    finished = {h for h, p in newest.items() if p['state'] != 'OPEN'}
    data = {'branchesOpen': len((on_remote | open_pr_heads) - finished),
            'branchesMerged': len({p['headRefName'] for p in prs if p['state'] == 'MERGED' and p['headRefName'] not in bases}),
            'prsOpen': states.count('OPEN'), 'prsMerged': states.count('MERGED'), 'prsTotal': len(prs)}
    warns = []
    if len(prs) >= REPO_PR_LIMIT:
        warns.append('gh returned %d PRs, the most it is asked for: PR and merged-branch totals may be low' % len(prs))
    stale = sum(1 for h in open_pr_heads if (refs.get(h, {}).get('remote') or {}).get('sha') != newest[h].get('headRefOid'))
    if stale:
        warns.append('local remote-tracking refs are behind gh for %d open PR%s; commit and line numbers may be old (this job never fetches)'
                     % (stale, '' if stale == 1 else 's'))
    return data, warns


def repo_commits(runner, repo, ref, now):
    """Commits reachable from `ref`: all of them (`git rev-list --count`) and those committed in the 24 h before `now` (`--since`)."""
    total = int(git_out(runner, repo, 'rev-list', '--count', ref).strip())
    day = int(git_out(runner, repo, 'rev-list', '--count', '--since=' + iso(now - timedelta(hours=24)), ref).strip())
    return total, day


def repo_lines(runner, repo, ref, since):
    """(added, removed, files) from `git log --first-parent --numstat` on `ref` since the build start: every integrated commit
    (a squash merge is one commit, a merge commit shows its diff against the first parent), summed. `files` counts distinct paths
    touched. A binary file counts as a file with no lines."""
    out = git_out(runner, repo, 'log', '--first-parent', '-M', '--numstat', '--format=', '--since=' + iso(since), ref, timeout=REPO_LINES_TIMEOUT)
    added = removed = 0
    paths = set()
    for line in out.splitlines():
        f = line.split('\t', 2)
        if len(f) != 3:
            continue
        added += int(f[0]) if f[0].isdigit() else 0
        removed += int(f[1]) if f[1].isdigit() else 0
        paths.add(f[2])
    return added, removed, len(paths)


def repo_code_size(runner, repo, ref):
    """(lines, files) of tracked text files at `ref`, minus LOC_EXCLUDE: one `git grep -I -c ''` (every line matches, binary files are
    skipped, `ref:path:count` per file). Paths are read and dropped, never published."""
    argv = ['git', 'grep', '-I', '-c', '', ref, '--', '.'] + [':(exclude,glob)' + p for p in LOC_EXCLUDE]
    rc, out, err = runner(argv, repo, REPO_LINES_TIMEOUT)
    if rc == 1 and not err.strip():                    # grep's own "no match": an empty tree
        return 0, 0
    if rc != 0:
        raise BlockError('git grep failed: %s' % (clean(err.strip()) or 'exit %d' % rc))
    lines = files = 0
    for row in out.splitlines():
        count = row.rsplit(':', 1)[-1]
        if count.isdigit():
            lines += int(count)
            files += 1
    return lines, files


def build_repo(rcfg, now, since, runner=default_runner, gh_bin=None):
    """The repo block: numbers only, no branch name, path or title (safe in the public stub bundle, CTO 7d254d3d). Read-only like the
    branches block (no fetch, no lock). Groups fail on their own: a group that cannot be read leaves its fields OUT and adds its reason to
    `_warning` (run_block turns it into blocks.repo.error). Only when nothing at all could be read does the block fail (last good kept)."""
    repo = os.path.expanduser(rcfg.get('repoPath') or REPO_DEFAULT)
    if not os.path.isdir(repo):
        raise BlockError('repo folder not found')
    git_out(runner, repo, 'rev-parse', '--git-dir')
    data, warns = {}, []

    def group(label, fn):
        try:
            got = fn()
        except BlockError as ex:
            warns.append('%s: %s' % (label, ex))
        except Exception as ex:                        # git missing, a stub raising: data, not a crash
            warns.append('%s: %s' % (label, clean(ex)))
        else:
            data.update(got)
    try:
        refs = read_refs(runner, repo)
    except Exception as ex:
        refs = None
        warns.append('refs: %s' % clean(ex))
    ref_of = {}
    for b in BRANCH_BASES:
        r = (refs or {}).get(b, {})
        ref_of[b] = (r.get('remote') or r.get('local') or {}).get('ref')

    def need(base):
        if refs is None:
            raise BlockError('refs unreadable')
        if not ref_of[base]:
            raise BlockError('no %s branch found' % base)
        return ref_of[base]

    # branches and PRs: source is gh (PR states) plus the origin/* refs (which branches still exist)
    def prs():
        if refs is None:
            raise BlockError('refs unreadable')
        got, w = repo_pr_counts(runner, repo, gh_bin or find_gh(), refs, BRANCH_BASES)
        warns.extend(w)
        return got
    group('prs', prs)
    # commits: git rev-list --count on origin/<base> (else the local branch), total and the last 24 h
    for base in BRANCH_BASES:
        def commits(base=base):
            total, day = repo_commits(runner, repo, need(base), now)
            return {'commits' + base.capitalize(): total, 'commits' + base.capitalize() + '24h': day}
        group('commits ' + base, commits)

    # lines added / removed / files changed since the build start: git log --first-parent --numstat on the integration branch (staging)
    def lines():
        a, r, f = repo_lines(runner, repo, need(PRIMARY_BASE), since)
        return {'linesAdded': a, 'linesRemoved': r, 'filesChanged': f}
    group('lines', lines)

    # total lines in the repo: git grep -I -c '' on staging, minus LOC_EXCLUDE
    def code():
        n, f = repo_code_size(runner, repo, need(PRIMARY_BASE))
        return {'codeLines': n, 'codeFiles': f}
    group('code', code)
    if not data:
        raise BlockError('nothing readable: ' + '; '.join(warns))
    ordered = {k: data[k] for k in REPO_FIELDS if k in data}
    if warns:
        ordered['_warning'] = '; '.join(warns)
    return ordered


# ----------------------------------------------------------------------------- assemble

def run_block(state, name, fn, now):
    """Run one block. On success: new data + asOf=now. On failure: keep the last good data and asOf, record the error."""
    try:
        data = fn()
        # A block may succeed with a warning (branches without `gh`): fresh data AND an error, so no one reads it as clean.
        warn = data.pop('_warning', None) if isinstance(data, dict) else None
        state[name] = {'asOf': iso(now), 'data': data, 'error': {'message': clean(warn), 'at': iso(now)} if warn else None}
    except Exception as ex:
        prev = state.get(name) or {'asOf': None, 'data': None}
        state[name] = {'asOf': prev.get('asOf'), 'data': prev.get('data'),
                       'error': {'message': clean(ex), 'at': iso(now)}}


def build(now, hand, rates, state, root, usage_bin, key_fn, api=LINEAR_API, runner=default_runner, gh_bin=None, directions=None):
    """`directions` is read_directions()'s (list | None, warning | None); omitted means the file does not exist."""
    dirs, dirs_warning = directions or (None, None)
    cfg = dict(hand['config'])
    cfg['_deadline'] = hand['deadline']
    since = parse(hand['buildStart'])
    holder = {}

    run_block(state, 'hand', lambda: build_hand(hand, dirs_warning), now)

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
        holder['nodes'] = nodes
        meta = (state.get('hand') or {}).get('data') or {}
        ls = ((state.get('usage') or {}).get('data') or {}).get('lastSeen', {})
        data = summarize_linear(nodes, cfg, meta.get('milestonesMeta', hand['milestones']), now, since, ls)
        try:                                           # a forecast that fails must not blank the rest of the linear block
            data['forecast'] = build_forecast(nodes, cfg, now, since, parse(hand['freeze']), parse(hand['submitBy']))
        except Exception as ex:
            data['_warning'] = 'forecast not computed: %s' % ex
        return data
    run_block(state, 'linear', linear, now)

    def branches():
        tz = parse(hand['buildStart']).tzinfo            # "today" is the deadline's own day (+02:00)
        return build_branches(cfg.get('branches') or {}, now, tz, holder.get('nodes'), cfg['agents'], cfg['roleLabels'], runner, gh_bin)
    run_block(state, 'branches', branches, now)

    def repo_numbers():
        rcfg = dict(cfg.get('branches') or {}, **(cfg.get('repo') or {}))      # the same repoPath unless config.repo names another
        return build_repo(rcfg, now, since, runner, gh_bin)
    run_block(state, 'repo', repo_numbers, now)

    g = lambda b: (state.get(b) or {}).get('data') or {}
    h, lin, us, mo, br, rp = g('hand'), g('linear'), g('usage'), g('money'), g('branches'), g('repo')
    snap = {
        'schema': SCHEMA, 'intervalSec': INTERVAL_SEC, 'generatedAt': iso(now),
        'blocks': {b: {'asOf': (state.get(b) or {}).get('asOf'), 'error': (state.get(b) or {}).get('error')} for b in BLOCKS},
    }
    for k in ('deadline', 'buildStart', 'freeze', 'submitBy'):
        if k in h:
            snap[k] = h[k]
    if lin:
        snap.update({k: lin[k] for k in ('milestones', 'current', 'tasks', 'agents', 'lanes')})
        if lin.get('forecast'):
            snap['forecast'] = lin['forecast']
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
    if dirs:
        snap['directions'] = dirs
    if br:
        snap['branches'] = br
    if rp:
        snap['repo'] = rp
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
    ap.add_argument('--directions', help='the five directions of the project goal (default <home>/directions.json); a missing file omits the field')
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
    directions = read_directions(os.path.expanduser(a.directions or os.path.join(home, DIRECTIONS_FILE)))
    snap = build(now, hand, rates, state, os.path.expanduser(a.root), a.usage_bin, linear_key, directions=directions)
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
    # One line for the job's log (CTO, MIN-4460): proves `gh` ran and could read its login under launchd's PATH.
    br, berr = snap.get('branches') or {}, snap['blocks']['branches']['error']
    print('%s branches: prSource=%s, staleRefs=%s, gh=%s, error=%s' % (
        iso(now), br.get('prSource', 'none'), br.get('staleRefs'), find_gh(), berr['message'] if berr else 'none'))
    rp, rerr = snap.get('repo') or {}, snap['blocks']['repo']['error']
    print('%s repo: fields=%d/%d, error=%s' % (iso(now), len(rp), len(REPO_FIELDS), rerr['message'] if rerr else 'none'))
    return 0


if __name__ == '__main__':
    sys.exit(main())
