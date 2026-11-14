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
        self.assertEqual(data['perAgent'], [{'n': 'Cron', 'v': 410}])   # r1 charged to the subagent file, as bin/usage does
        self.assertEqual(data['lastSeen']['Cron'], '2026-11-14T12:30:00Z')

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
