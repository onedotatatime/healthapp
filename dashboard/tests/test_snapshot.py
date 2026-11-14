"""Tests for dashboard/snapshot.py. Run: python3 -m unittest discover -s dashboard/tests
Fixtures are synthetic; the usage test compares against the real code of conductor's bin/usage when it is present."""
import copy, json, os, re, subprocess, sys, tempfile, threading, unittest
from datetime import timedelta
from http.server import BaseHTTPRequestHandler, HTTPServer

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
import snapshot as sn  # noqa: E402

USAGE_BIN = os.path.expanduser(sn.USAGE_BIN_DEFAULT)
HAND = json.load(open(os.path.join(os.path.dirname(HERE), 'hand-set.sample.json')))
RATES = json.load(open(os.path.join(os.path.dirname(HERE), 'rates.json')))
NOW = sn.parse('2026-11-14T15:00:00Z')
FAKE_KEY = 'lin' + '_api_FAKEKEYFORTESTSONLY0123456789'


def issue(ident, state, stype, who='Pix Elidis', role='Product Designer', ms='M1 · Setup', started=None, done=None, rels=()):
    return {'identifier': ident, 'title': 't ' + ident, 'state': {'name': state, 'type': stype},
            'assignee': {'name': who}, 'labels': {'nodes': [{'name': role, 'parent': {'name': 'Role'}}]},
            'projectMilestone': {'name': ms} if ms else None, 'startedAt': started, 'completedAt': done,
            'inverseRelations': {'nodes': [{'type': 'blocks', 'issue': {'identifier': b, 'state': {'type': bt}}} for b, bt in rels]}}


def write_usage_fixture(root):
    p = os.path.join(root, '-proj-healthapp-x')
    os.makedirs(os.path.join(p, 'sess1', 'subagents'))
    line = lambda rid, t, model, i, cw, cr, o: json.dumps({'type': 'assistant', 'timestamp': t, 'requestId': rid, 'message': {
        'id': 'm' + rid, 'model': model, 'usage': {'input_tokens': i, 'cache_creation_input_tokens': cw, 'cache_read_input_tokens': cr, 'output_tokens': o}}})
    open(os.path.join(p, 'sess1.jsonl'), 'w').write('\n'.join([
        line('r1', '2026-11-14T12:30:00Z', 'claude-sonnet-5-5', 10, 100, 1000, 20),
        line('r2', '2026-11-14T13:10:00Z', 'claude-fable-5-2', 1, 0, 0, 1)]) + '\n')
    sub = os.path.join(p, 'sess1', 'subagents', 'agent-a.jsonl')
    open(sub, 'w').write(line('r1', '2026-11-14T12:30:00Z', 'claude-sonnet-5-5', 10, 100, 1000, 20) + '\n')   # same request again: counted once
    json.dump({'agentType': 'backend-minhos'}, open(sub[:-6] + '.meta.json', 'w'))
    other = os.path.join(root, '-proj-conductor')
    os.makedirs(other)
    open(os.path.join(other, 's.jsonl'), 'w').write(line('r9', '2026-11-14T12:40:00Z', 'claude-sonnet-5-5', 999999, 0, 0, 0) + '\n')


class Model(unittest.TestCase):
    def test_family_alias_and_unpriced(self):
        t = RATES['models']
        self.assertEqual(sn.resolve_model('claude-sonnet-5-5', t), 'claude-sonnet-5')
        self.assertEqual(sn.resolve_model('claude-fable-5-2', t), 'claude-fable-5-1')
        self.assertEqual(sn.resolve_model('claude-haiku-4-5', t), 'claude-haiku-4-5-20251001')
        self.assertEqual(sn.resolve_model('claude-opus-5-5', t), 'claude-opus-5-5')       # exact beats the shorter family row
        self.assertIsNone(sn.resolve_model('<synthetic>', t))
        self.assertIsNone(sn.resolve_model('gpt-9', t))


@unittest.skipUnless(os.path.isfile(USAGE_BIN), 'conductor bin/usage not present')
class Usage(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        write_usage_fixture(self.tmp.name)
        self.cfg = dict(HAND['config'], _deadline=HAND['deadline'], eurPerUsd=1000)
        self.since = sn.parse(HAND['buildStart'])

    def test_total_equals_bin_usage_and_filter_and_dedupe(self):
        data, rows, U = sn.build_usage(self.cfg, NOW, self.since, self.tmp.name, USAGE_BIN, 'healthapp')
        ref = [r for r in U.collect(self.tmp.name, self.since) if 'healthapp' in r['proj']]
        self.assertEqual(round(sum(r['w'] for r in ref)), data['totalWeighted'])
        self.assertEqual(data['totalWeighted'], 410 + 6)            # r1 once (10+200+100+100), r2 = 1+5; the conductor folder is excluded
        # r1 charged to the subagent file, as bin/usage does; every other configured agent is a zero row, not a missing one (MIN-4583)
        self.assertEqual(data['perAgent'][0], {'n': 'Cron', 'v': 410, 'mins': 0.0, 'runs': 1})
        self.assertEqual(len(data['perAgent']), 13)
        self.assertEqual({a['n'] for a in data['perAgent']}, {a['n'] for a in self.cfg['agents']})
        for a in data['perAgent'][1:]:
            self.assertEqual((a['v'], a['mins'], a['runs']), (0, 0.0, 0))
        self.assertEqual(data['lastSeen']['Cron'], '2026-11-14T12:30:00Z')

    def test_minutes_and_runs_per_agent(self):
        # Two runs of Cron (two subagent files) and one of Pix. Gaps count up to PAUSE_S (300 s) each; the 25-minute silence in Cron's
        # first run counts as 5, not 25, and a run of one request is 0 minutes.
        tmp = tempfile.TemporaryDirectory()
        p = os.path.join(tmp.name, '-proj-healthapp-y')
        os.makedirs(os.path.join(p, 'sess2', 'subagents'))
        n = [0]

        def line(t):
            n[0] += 1
            return json.dumps({'type': 'assistant', 'timestamp': t, 'requestId': 'q%d' % n[0], 'message': {
                'id': 'mm%d' % n[0], 'model': 'claude-sonnet-5-5', 'usage': {'input_tokens': 1, 'cache_creation_input_tokens': 0, 'cache_read_input_tokens': 0, 'output_tokens': 0}}})

        def run(name, agent, times):
            f = os.path.join(p, 'sess2', 'subagents', name + '.jsonl')
            open(f, 'w').write('\n'.join(line(t) for t in times) + '\n')
            json.dump({'agentType': agent}, open(f[:-6] + '.meta.json', 'w'))
        run('a1', 'backend-minhos', ['2026-11-14T12:00:00Z', '2026-11-14T12:02:00Z', '2026-11-14T12:27:00Z', '2026-11-14T12:28:00Z'])   # 2 + 5 + 1 = 8
        run('a2', 'backend-minhos', ['2026-11-14T13:00:00Z', '2026-11-14T13:03:30Z'])                                                        # 3.5
        run('a3', 'design-minhos', ['2026-11-14T13:10:00Z'])                                                                                 # 0
        for i in range(7):                                                      # built-in agents are kept, the biggest five only
            run('u%d' % i, 'built-in-%d' % i, ['2026-11-14T13:20:00Z'] * (i + 1))
        data, rows, U = sn.build_usage(self.cfg, NOW, self.since, tmp.name, USAGE_BIN, 'healthapp')
        by = {a['n']: a for a in data['perAgent']}
        self.assertEqual(len(data['perAgent']), 13 + 5)
        self.assertEqual([a['n'] for a in data['perAgent'] if a['n'].startswith('built-in')], ['built-in-6', 'built-in-5', 'built-in-4', 'built-in-3', 'built-in-2'])
        self.assertEqual((by['Cron']['mins'], by['Cron']['runs']), (11.5, 2))
        self.assertEqual((by['Pix']['mins'], by['Pix']['runs']), (0.0, 1))
        self.assertEqual((by['Ren']['mins'], by['Ren']['runs'], by['Ren']['v']), (0.0, 0, 0))
        self.assertEqual(by['Cron']['v'], 6)        # n and v are what they were: weighted tokens, 6 requests of 1 input token
        self.assertEqual(sum(a['runs'] for a in data['perAgent'] if a['n'] in ('Cron', 'Pix')), 3)

    def test_zero_rows_follow_config_order_and_are_stable(self):
        # the zero-token agents come in config order, never set order, so ranks do not reshuffle between runs
        runs = [[a['n'] for a in sn.build_usage(self.cfg, NOW, self.since, self.tmp.name, USAGE_BIN, 'healthapp')[0]['perAgent'][1:]]
                for _ in range(2)]
        want = [a['n'] for a in self.cfg['agents'] if a['n'] != 'Cron']
        self.assertEqual(runs[0], want)
        self.assertEqual(runs[0], runs[1])

    def test_run_minutes_caps_idle_gaps_and_ignores_order(self):
        U = sn.load_usage_module(USAGE_BIN)
        t = lambda m: sn.parse('2026-11-14T12:00:00Z') + __import__('datetime').timedelta(minutes=m)
        ev = lambda *ms: [{'t': t(m)} for m in ms]
        self.assertEqual(sn.run_minutes(U, ev(0, 2, 30, 31)), 8.0)
        self.assertEqual(sn.run_minutes(U, ev(31, 0, 30, 2)), 8.0)       # file order does not matter
        self.assertEqual(sn.run_minutes(U, ev(5)), 0)
        self.assertEqual(sn.run_minutes(U, []), 0)

    def test_money_by_model_exact(self):
        data, rows, U = sn.build_usage(self.cfg, NOW, self.since, self.tmp.name, USAGE_BIN, 'healthapp')
        m = sn.build_money(self.cfg, NOW, self.since, rows, U, RATES)
        # r1 sonnet-5: (10*2 + 20*10 + 100*2.5 + 1000*0.2)/1e6 USD = 670e-6; r2 fable-5-1: (1*10 + 1*50)/1e6 = 60e-6; EUR x1000
        self.assertAlmostEqual(m['estimateEUR'], 0.73, places=2)
        self.assertTrue(m['estimate'])
        self.assertEqual(m['rateCard']['aliased'], {'claude-sonnet-5-5': 'claude-sonnet-5', 'claude-fable-5-2': 'claude-fable-5-1'})
        self.assertEqual(m['rateCard']['unpricedTokens'], 0)
        self.assertAlmostEqual(m['estimateSeries'][-1], m['estimateEUR'], places=2)


class Linear(unittest.TestCase):
    def test_counts_partition_and_roles(self):
        nodes = [issue('A-1', 'Done', 'completed', done='2026-11-14T13:00:00Z', started='2026-11-14T12:30:00Z'),
                 issue('A-2', 'In Progress', 'started', started='2026-11-14T13:10:00Z'),
                 issue('A-3', 'In Review', 'started', who='Ren Derakis', role='Frontend Engineer'),
                 issue('A-4', 'Todo', 'unstarted', ms=None),
                 issue('A-5', 'Todo', 'unstarted', rels=[('A-2', 'started')]),          # blocked by an open issue
                 issue('A-6', 'Todo', 'unstarted', rels=[('A-1', 'completed')]),         # blocker done: open, not blocked
                 issue('A-8', 'Todo', 'unstarted', rels=[('A-2', 'started'), ('A-1', 'completed')]),   # one open blocker is enough
                 issue('A-9', 'Todo', 'unstarted', rels=[('A-2', 'started')]),
                 issue('A-7', 'Canceled', 'canceled')]                                   # excluded from everything
        r = sn.summarize_linear(nodes, HAND['config'], HAND['milestones'], NOW, sn.parse(HAND['buildStart']), {'Pix': '2026-11-14T14:57:00Z'})
        t = r['tasks']
        self.assertEqual((t['done'], t['inProgress'], t['inReview'], t['open'], t['blocked'], t['total']), (1, 1, 1, 2, 3, 8))
        self.assertEqual(t['done'] + t['inProgress'] + t['inReview'] + t['open'] + t['blocked'], t['total'])
        self.assertEqual(sum(t['byRole'].values()), t['total'])
        self.assertEqual(t['byRole']['Frontend'], 1)
        m1 = r['milestones'][0]
        self.assertEqual((m1['id'], m1['done'], m1['total']), ('M1', 1, 7))              # A-4 has no milestone, A-7 canceled
        pix = next(a for a in r['agents'] if a['n'] == 'Pix')
        self.assertEqual((pix['state'], pix['issue'], pix['last']), ('active', 'A-2', '3m'))
        self.assertEqual(next(l for l in r['lanes'] if l['agent'] == 'Pix')['bars'][0]['issue'], 'A-1')


    def test_cto_is_told_by_role_label_and_founder_issues_are_the_founders(self):
        # The CTO agent writes under the founder's Linear account. An issue assigned to that account is the
        # CTO's only when it carries the CTO Role label; otherwise it is the founder's.
        F = HAND['config']['founder']['linear']
        nodes = [issue('F-1', 'In Progress', 'started', who=F, role='Founder', started='2026-11-14T13:00:00Z'),   # founder's own Q issue
                 issue('F-2', 'Todo', 'unstarted', who=F, role='Founder'),
                 issue('C-1', 'In Progress', 'started', who=F, role='System Architect', started='2026-11-14T13:30:00Z'),
                 issue('C-2', 'In Review', 'started', who=F, role='System Architect', started='2026-11-14T13:40:00Z')]
        nodes[1]['labels'] = {'nodes': []}                               # a founder issue with no Role label at all
        r = sn.summarize_linear(nodes, HAND['config'], HAND['milestones'], NOW, sn.parse(HAND['buildStart']), {})
        cto = next(a for a in r['agents'] if a['n'] == 'CTO')
        self.assertEqual((cto['state'], cto['issue']), ('active', 'C-2'))   # the newest started of the CTO's two
        self.assertEqual([b['issue'] for b in next(l for l in r['lanes'] if l['agent'] == 'CTO')['bars']], ['C-1', 'C-2'])
        self.assertEqual((r['tasks']['byRole']['Founder'], r['tasks']['byRole']['CTO']), (2, 2))
        self.assertNotIn('Other', r['tasks']['byRole'])
        only_founder = [n for n in nodes if n['identifier'].startswith('F-')]
        r2 = sn.summarize_linear(only_founder, HAND['config'], HAND['milestones'], NOW, sn.parse(HAND['buildStart']), {})
        self.assertEqual(next(a for a in r2['agents'] if a['n'] == 'CTO')['state'], 'idle')   # F-1 is started and assigned to the founder


    def test_all_thirteen_agents_are_listed_and_the_shared_identities_are_not_double_counted(self):
        # Founder, 2026-11-14: "we need to show ALL agents here". Scrum writes in Linear as Back, SEO as Anna, JobScout as Spast, under the
        # same Role labels: Linear cannot tell them apart, so they carry `linear: null` and every issue stays with the agent it is assigned to.
        cfg = HAND['config']
        self.assertEqual([a['n'] for a in cfg['agents']], ['Back', 'Anna', 'Pix', 'Ren', 'Cron', 'CTO', 'Spast', 'Release', 'CEO', 'E2E', 'Scrum', 'SEO', 'JobScout'])
        by_type = {a['agentType'] for a in cfg['agents']}
        self.assertTrue({'scrum-minhos', 'seo-minhos', 'jobscout-minhos'} <= by_type)
        for n in ('Scrum', 'SEO', 'JobScout'):
            self.assertIsNone(next(a for a in cfg['agents'] if a['n'] == n)['linear'])
        nodes = [issue('B-1', 'In Progress', 'started', who='Back Logakis', role='Product Manager', started='2026-11-14T13:00:00Z'),
                 issue('N-1', 'In Progress', 'started', who='Anna Lytica', role='Marketing Lead', started='2026-11-14T13:05:00Z'),
                 issue('S-1', 'In Progress', 'started', who='Spast Arxidas', role='Sales Lead', started='2026-11-14T13:10:00Z'),
                 issue('B-2', 'Done', 'completed', who='Back Logakis', role='Product Manager', started='2026-11-14T12:10:00Z', done='2026-11-14T12:50:00Z')]
        r = sn.summarize_linear(nodes, cfg, HAND['milestones'], NOW, sn.parse(HAND['buildStart']), {'Scrum': '2026-11-14T14:30:00Z'})
        self.assertEqual(len(r['agents']), 13)
        self.assertEqual(len(r['lanes']), 13)
        self.assertNotIn('_warning', r)
        who = {a['n']: a for a in r['agents']}
        self.assertEqual((who['Back']['state'], who['Back']['issue']), ('active', 'B-1'))
        self.assertEqual((who['Anna']['state'], who['Anna']['issue']), ('active', 'N-1'))
        self.assertEqual((who['Spast']['state'], who['Spast']['issue']), ('active', 'S-1'))
        for n in ('Scrum', 'SEO', 'JobScout'):                     # idle cleanly: no issue, no title, no lane bars
            self.assertEqual((who[n]['state'], who[n]['issue'], who[n]['title']), ('idle', '-', '-'))
            self.assertEqual(next(l for l in r['lanes'] if l['agent'] == n)['bars'], [])
        self.assertEqual((who['Scrum']['last'], who['SEO']['last']), ('30m', '-'))   # last-seen still comes from its own transcripts
        bars = [b['issue'] for l in r['lanes'] for b in l['bars']]
        self.assertEqual(sorted(bars), ['B-1', 'B-2', 'N-1', 'S-1'])                  # every issue appears in exactly one lane
        self.assertEqual(r['tasks']['byRole']['Product'], 2)

    def test_two_agents_given_the_same_identity_never_show_the_same_issues_twice(self):
        # A config mistake (Scrum given Back's Linear name) must not copy Back's issues onto Scrum: the first agent keeps the identity,
        # the later one shows idle, and the block carries a warning so nobody reads the page as clean.
        cfg = copy.deepcopy(HAND['config'])
        next(a for a in cfg['agents'] if a['n'] == 'Scrum')['linear'] = 'Back Logakis'
        next(a for a in cfg['agents'] if a['n'] == 'JobScout')['roleLabel'] = 'Sales Lead'
        next(a for a in cfg['agents'] if a['n'] == 'Spast')['roleLabel'] = 'Sales Lead'
        nodes = [issue('B-1', 'In Progress', 'started', who='Back Logakis', role='Product Manager', started='2026-11-14T13:00:00Z'),
                 issue('S-1', 'In Progress', 'started', who='Spast Arxidas', role='Sales Lead', started='2026-11-14T13:10:00Z')]
        r = sn.summarize_linear(nodes, cfg, HAND['milestones'], NOW, sn.parse(HAND['buildStart']), {})
        who = {a['n']: a for a in r['agents']}
        self.assertEqual((who['Back']['issue'], who['Scrum']['state'], who['Scrum']['issue']), ('B-1', 'idle', '-'))
        self.assertEqual((who['Spast']['issue'], who['JobScout']['state']), ('S-1', 'idle'))
        self.assertEqual(sorted(b['issue'] for l in r['lanes'] for b in l['bars']), ['B-1', 'S-1'])
        self.assertIn('Scrum shares the Linear identity "Back Logakis" of Back', r['_warning'])
        self.assertIn('JobScout shares the Linear identity "Sales Lead" of Spast', r['_warning'])


class Server(BaseHTTPRequestHandler):
    mode = 'ok'
    seen_auth = []
    seen_headers = []

    def do_POST(self):
        Server.seen_auth.append(self.headers.get('Authorization'))
        Server.seen_headers.append({k.lower(): v for k, v in self.headers.items()})
        self.rfile.read(int(self.headers.get('Content-Length', 0)))
        body = json.dumps({'errors': [{'message': 'Authentication required, not authenticated'}]} if Server.mode == 'errors' else
                          {'data': {'project': {'name': 'p', 'issues': {'nodes': [issue('A-1', 'Todo', 'unstarted')], 'pageInfo': {'hasNextPage': False, 'endCursor': None}}}}}).encode()
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *a):
        pass


class Blocks(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.srv = HTTPServer(('127.0.0.1', 0), Server)
        threading.Thread(target=cls.srv.serve_forever, daemon=True).start()
        cls.api = 'http://127.0.0.1:%d/graphql' % cls.srv.server_port

    @classmethod
    def tearDownClass(cls):
        cls.srv.shutdown()

    def run_build(self, state, now, mode):
        Server.mode = mode
        return sn.build(now, copy.deepcopy(HAND), RATES, state, '/nonexistent-transcripts', USAGE_BIN, lambda: FAKE_KEY, self.api)

    def test_failed_source_keeps_last_good_and_others_stay_fresh(self):
        state = {}
        snap1 = self.run_build(state, NOW, 'ok')
        self.assertIsNone(snap1['blocks']['linear']['error'])
        self.assertEqual(snap1['tasks']['total'], 1)
        later = NOW + timedelta(minutes=5)
        snap2 = self.run_build(state, later, 'errors')
        b = snap2['blocks']
        self.assertEqual(b['linear']['asOf'], sn.iso(NOW))                     # old asOf
        self.assertIn('Authentication required', b['linear']['error']['message'])   # newer error, GraphQL error on a 200 is a failure
        self.assertEqual(b['linear']['error']['at'], sn.iso(later))
        self.assertEqual(snap2['tasks']['total'], 1)                            # last good value kept
        self.assertEqual(b['hand']['asOf'], sn.iso(later))                      # other blocks fresh
        self.assertIsNone(b['hand']['error'])
        self.assertIsNotNone(b['usage']['error'])                                # a failing usage source...
        if os.path.isfile(USAGE_BIN):   # in CI conductor's bin/usage is absent, so usage fails one step earlier
            self.assertIn('transcript folder not found', b['usage']['error']['message'])
        self.assertIn('usage unavailable', b['money']['error']['message'])             # ...fails money with it, honestly
        self.assertEqual(snap2['generatedAt'], sn.iso(later))
        self.assertIn(FAKE_KEY, Server.seen_auth)                               # the key was sent to Linear...
        sn.assert_clean(json.dumps(snap2))                                      # ...and is nowhere in the snapshot
        self.assertNotIn(FAKE_KEY, json.dumps(snap2))

    def test_push_sends_gateway_jwt_in_authorization_and_push_key_in_its_own_header(self):
        Server.seen_headers.clear()
        key, anon = 'push-key-' + 'k' * 40, 'anon-' + 'a' * 40
        self.assertEqual(sn.push('{"schema":1}', self.api, key, anon), 200)
        h = Server.seen_headers[-1]
        self.assertEqual(h['x-dashboard-key'], key)
        self.assertEqual(h['authorization'], 'Bearer ' + anon)
        self.assertEqual(h['apikey'], anon)
        self.assertNotIn(key, h['authorization'])

    def test_push_config_needs_all_three_pieces(self):
        with tempfile.TemporaryDirectory() as home:
            self.assertIsNone(sn.load_push_config(home))
            json.dump({'url': 'https://x', 'anon': 'a'}, open(os.path.join(home, 'push.json'), 'w'))
            self.assertIsNone(sn.load_push_config(home))                 # no push.key yet
            open(os.path.join(home, 'push.key'), 'w').write('kkk\n')
            self.assertEqual(sn.load_push_config(home), {'url': 'https://x', 'anon': 'a', 'key': 'kkk'})
            json.dump({'url': 'https://x'}, open(os.path.join(home, 'push.json'), 'w'))
            self.assertIsNone(sn.load_push_config(home))                 # no anon

    def test_bad_hand_file_is_a_hand_error_only(self):
        hand = copy.deepcopy(HAND)
        hand['demo']['steps'] = hand['demo']['steps'][:7]
        Server.mode = 'ok'
        snap = sn.build(NOW, hand, RATES, {}, '/nonexistent', USAGE_BIN, lambda: FAKE_KEY, self.api)
        self.assertIn('8 entries', snap['blocks']['hand']['error']['message'])
        self.assertIsNone(snap['blocks']['linear']['error'])


SAMPLE_DIRECTIONS = os.path.join(os.path.dirname(HERE), 'directions.sample.json')
GOAL_TITLES = ['Scan \u2192 AI reads', 'Store extracted data', 'Store + analyse original files (staging and main)', 'Real analysis + projection', 'Real matching']


def direction(n=1, **over):
    d = {'n': n, 'title': 'T%s' % n, 'status': 'on_track', 'note': 'ok', 'updatedAt': '2026-11-14T22:00:00+02:00'}
    d.update(over)
    return d


class Directions(unittest.TestCase):
    """MIN-4497: the five directions of the project goal, from a hand-set file, in the snapshot as `directions`."""

    def setUp(self):
        self.tmp = tempfile.mkdtemp(prefix='directions-')
        self.addCleanup(lambda: __import__('shutil').rmtree(self.tmp, ignore_errors=True))
        self.path = os.path.join(self.tmp, 'directions.json')

    def write(self, doc):
        with open(self.path, 'w') as f:
            f.write(doc if isinstance(doc, str) else json.dumps(doc))

    def snap(self, directions):
        import unittest.mock as mock
        with mock.patch.object(sn, 'fetch_linear', return_value=[]), mock.patch.object(sn, 'build_branches', return_value={}):
            return sn.build(NOW, copy.deepcopy(HAND), RATES, {}, '/nonexistent', USAGE_BIN, lambda: FAKE_KEY, directions=directions)

    def test_the_seed_example_has_the_five_titles_all_not_started(self):
        seed = json.load(open(SAMPLE_DIRECTIONS))
        self.assertEqual([d['title'] for d in seed['directions']], GOAL_TITLES)
        self.assertEqual([d['n'] for d in seed['directions']], [1, 2, 3, 4, 5])
        self.assertEqual({d['status'] for d in seed['directions']}, {'not_started'})
        got, warn = sn.read_directions(SAMPLE_DIRECTIONS)
        self.assertIsNone(warn)
        self.assertEqual(len(got), 5)
        snap = self.snap((got, warn))
        self.assertEqual([d['title'] for d in snap['directions']], GOAL_TITLES)
        self.assertEqual(sorted(snap['directions'][0]), ['n', 'note', 'status', 'title', 'updatedAt'])
        self.assertIsNone(snap['blocks']['hand']['error'])
        sn.assert_clean(json.dumps(snap))

    def test_a_missing_file_omits_the_field_and_says_nothing(self):
        self.assertEqual(sn.read_directions(self.path), (None, None))
        snap = self.snap(sn.read_directions(self.path))
        self.assertNotIn('directions', snap)
        self.assertIsNone(snap['blocks']['hand']['error'])
        self.assertNotIn('directions', self.snap(None))                      # build() called the old way (no argument) is the same

    def test_every_status_and_a_hand_edited_file_come_through_sorted_by_n(self):
        self.write({'directions': [direction(3, status='off_track', note='x'), direction(1, status='on_track'), direction(2, status='at_risk', note=''),
                                   direction(5, status='not_started', note='')]})
        got, warn = sn.read_directions(self.path)
        self.assertIsNone(warn)
        self.assertEqual([(d['n'], d['status']) for d in got], [(1, 'on_track'), (2, 'at_risk'), (3, 'off_track'), (5, 'not_started')])
        self.assertEqual(sn.DIRECTION_STATUSES, ('on_track', 'at_risk', 'off_track', 'not_started'))

    def test_a_bad_file_omits_the_field_and_puts_the_reason_on_the_hand_block_only(self):
        bad = {
            'not json': '{"directions": [',
            'a list, not an object': '[]',
            'no directions key': {'x': 1},
            'empty list': {'directions': []},
            'six entries': {'directions': [direction(i % 5 + 1) for i in range(6)]},
            'duplicate n': {'directions': [direction(1), direction(1)]},
            'n 0': {'directions': [direction(0)]},
            'n 6': {'directions': [direction(6)]},
            'n true': {'directions': [direction(True)]},
            'n text': {'directions': [direction('1')]},
            'bad status': {'directions': [direction(1, status='green')]},
            'status case': {'directions': [direction(1, status='On_Track')]},
            'missing key': {'directions': [{'n': 1, 'title': 'T', 'status': 'on_track', 'note': ''}]},
            'extra key': {'directions': [dict(direction(1), owner='x')]},
            'empty title': {'directions': [direction(1, title='  ')]},
            'long title': {'directions': [direction(1, title='x' * 121)]},
            'note not text': {'directions': [direction(1, note=None)]},
            'long note': {'directions': [direction(1, note='x' * 301)]},
            'no updatedAt time': {'directions': [direction(1, updatedAt='soon')]},
            'updatedAt without offset': {'directions': [direction(1, updatedAt='2026-11-14T22:00:00')]},
            'updatedAt not text': {'directions': [direction(1, updatedAt=1763150400)]},
            'a key in the note': {'directions': [direction(1, note='see ' + FAKE_KEY)]},
            'a key in the title': {'directions': [direction(1, title='eyJ' + 'a' * 40)]},
        }
        for name, doc in bad.items():
            with self.subTest(name):
                self.write(doc)
                got, warn = sn.read_directions(self.path)
                self.assertIsNone(got)
                self.assertTrue(warn and warn.startswith('directions.json'), warn)
                self.assertNotIn(FAKE_KEY, warn)                                   # the reason never repeats the text
                snap = self.snap((got, warn))
                self.assertNotIn('directions', snap)
                self.assertEqual(snap['blocks']['hand']['error']['message'], warn)
                self.assertEqual(snap['blocks']['hand']['asOf'], sn.iso(NOW))      # the hand data itself is fresh and complete
                self.assertEqual(snap['deadline'], HAND['deadline'])
                self.assertIn('demo', snap)
                self.assertIsNone(snap['blocks']['linear']['error'])

    def test_an_unreadable_file_is_a_warning_not_a_crash(self):
        os.makedirs(self.path)                                                       # a folder where the file should be
        got, warn = sn.read_directions(self.path)
        self.assertIsNone(got)
        self.assertIn('cannot be read', warn)

    def test_a_hand_file_error_still_wins_on_the_hand_block(self):
        hand = copy.deepcopy(HAND)
        hand['demo']['steps'] = hand['demo']['steps'][:7]
        import unittest.mock as mock
        with mock.patch.object(sn, 'fetch_linear', return_value=[]), mock.patch.object(sn, 'build_branches', return_value={}):
            snap = sn.build(NOW, hand, RATES, {}, '/nonexistent', USAGE_BIN, lambda: FAKE_KEY, directions=([direction(1)], None))
        self.assertIn('8 entries', snap['blocks']['hand']['error']['message'])

    def test_main_reads_the_file_from_the_home_folder_or_from_the_flag(self):
        import io, unittest.mock as mock, contextlib
        home = os.path.join(self.tmp, 'home')
        os.makedirs(home)
        out = os.path.join(self.tmp, 'out.json')
        hand = os.path.join(os.path.dirname(HERE), 'hand-set.sample.json')

        def run(*extra):
            with mock.patch.object(sn, 'fetch_linear', return_value=[]), mock.patch.object(sn, 'build_branches', return_value={}), mock.patch.object(sn, 'linear_key', lambda *a, **k: FAKE_KEY), \
                    contextlib.redirect_stdout(io.StringIO()):
                code = sn.main(['--home', home, '--hand', hand, '--root', '/nonexistent', '--out', out, '--now', '2026-11-14T15:00:00Z'] + list(extra))
            self.assertEqual(code, 0)
            return json.load(open(out))
        self.assertNotIn('directions', run())                                         # no file in the home folder: omitted
        self.write({'directions': [direction(2, status='at_risk', note='from the home folder')]})
        os.replace(self.path, os.path.join(home, 'directions.json'))
        got = run()['directions']
        self.assertEqual([(d['n'], d['status'], d['note']) for d in got], [(2, 'at_risk', 'from the home folder')])
        other = os.path.join(self.tmp, 'other.json')
        with open(other, 'w') as f:
            json.dump({'directions': [direction(4, status='off_track', note='from the flag')]}, f)
        got = run('--directions', other)['directions']
        self.assertEqual([(d['n'], d['status']) for d in got], [(4, 'off_track')])
        with open(os.path.join(home, 'directions.json'), 'w') as f:                     # a typo: the snapshot is still written, the panel is empty
            f.write('{"directions": [')
        snap = run()
        self.assertNotIn('directions', snap)
        self.assertEqual(snap['blocks']['hand']['error']['message'], 'directions.json: not valid JSON')

    def test_install_seeds_the_file_once_and_never_overwrites_it(self):
        src = open(os.path.join(os.path.dirname(HERE), 'install.sh')).read()
        lines = [l for l in src.splitlines() if 'directions' in l and not l.lstrip().startswith('#')]
        self.assertEqual(len(lines), 1, lines)
        self.assertTrue(lines[0].startswith('[ -f "$HOME_DIR/directions.json" ] || cp "$SRC/directions.sample.json"'), lines[0])


class Safety(unittest.TestCase):
    def test_reader_has_no_write_operation(self):
        src = open(os.path.join(os.path.dirname(HERE), 'snapshot.py')).read()
        code = '\n'.join(l for l in src.splitlines() if not l.strip().startswith('#'))
        self.assertFalse(re.search(r'\bmutation\b', code, re.I))
        self.assertTrue(re.search(r'query\(\$pid', code))

    def test_secret_shaped_strings_are_refused_and_errors_redacted(self):
        for bad in (FAKE_KEY, 'eyJ' + 'a' * 40, 'sb' + '_secret_abc', 'sbp' + '_' + 'a' * 24, 'SUPABASE_SERVICE' + '_ROLE_KEY=' + 'a' * 30):
            with self.assertRaises(sn.BlockError):
                sn.assert_clean('{"x":"%s"}' % bad)
        self.assertNotIn(FAKE_KEY, sn.clean('boom ' + FAKE_KEY))
        sn.assert_clean('{"x":"fine"}')
        sn.assert_clean('{"t":"RLS: service_role grants and a short eyJ prefix"}')   # ordinary words are not keys

    def test_installer_is_valid_shell_and_stays_inside_its_limits(self):
        path = os.path.join(os.path.dirname(HERE), 'install.sh')
        self.assertEqual(subprocess.run(['bash', '-n', path]).returncode, 0)
        src = open(path).read()
        code = '\n'.join(l for l in src.splitlines() if not l.strip().startswith('#'))
        self.assertNotIn('--prune', code)                                   # would delete conductor's own functions
        self.assertNotRegex(code, r'secrets\s+unset')
        self.assertNotRegex(code, r'functions\s+(deploy|delete)')          # the installer never deploys
        for m in re.finditer(r'supabase secrets set[^\n]*', code):
            self.assertIn('--project-ref', m.group(0))
            self.assertIn('>/dev/null', m.group(0))                         # nothing printed
        self.assertNotRegex(code, r'(?m)^\s*(echo|printf)[^\n]*\$\(cat[^\n]*\.key')   # no echo of a key file
        self.assertIn('| pbcopy', code)                                     # the URL with the keys goes to the clipboard only
        self.assertIn('chmod 600', code)

    def test_no_key_pattern_in_dashboard_or_supabase(self):
        # The patterns of snapshot.py (built from pieces) over every file under dashboard/ and supabase/.
        root = os.path.dirname(os.path.dirname(HERE))
        hits, seen = [], 0
        for top in ('dashboard', 'supabase'):
            for d, dirs, files in os.walk(os.path.join(root, top)):
                dirs[:] = [x for x in dirs if x not in ('__pycache__', 'node_modules', '.git')]
                for f in files:
                    path = os.path.join(d, f)
                    try:
                        text = open(path, encoding='utf-8').read()
                    except (UnicodeDecodeError, OSError):
                        continue
                    seen += 1
                    if sn.SECRET_RE.search(text):
                        hits.append(os.path.relpath(path, root))
        self.assertGreater(seen, 10, 'the scan must actually see the files')
        self.assertEqual(hits, [])


if __name__ == '__main__':
    unittest.main()
