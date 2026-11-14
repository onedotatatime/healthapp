"""Tests for the `branches` block of dashboard/snapshot.py (MIN-4460).
Git is real: every test builds a small repository (and a bare `origin`) in a temp folder, so refs, ahead/behind and
numstat are what git says. Only `gh` is faked, because its answer is a JSON document and the logged-out case needs a
non-zero exit. No test touches the network, the founder's repo or his `gh` login."""
import copy, json, os, subprocess, sys, tempfile, unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
import snapshot as sn  # noqa: E402

HAND = json.load(open(os.path.join(os.path.dirname(HERE), 'hand-set.sample.json')))
CFG = HAND['config']
TZ = sn.parse(HAND['buildStart']).tzinfo                      # +02:00: "today" is the Athens day
NOW = sn.parse('2026-11-14T16:50:00Z')
GH = 'GH-FAKE'
FAKE_GH_TOKEN = 'gh' + 'p_' + 'A' * 30


def sh(repo, *args, **env):
    e = dict(os.environ, GIT_CONFIG_GLOBAL='/dev/null', GIT_CONFIG_SYSTEM='/dev/null', **env)
    r = subprocess.run(['git', '-c', 'user.name=Tester', '-c', 'user.email=t@example.com', '-C', repo] + list(args),
                       capture_output=True, text=True, env=e)
    assert r.returncode == 0, (args, r.stderr)
    return r.stdout.strip()


def commit(repo, path, lines, when, who='Tester', mail='t@example.com', msg='c'):
    with open(os.path.join(repo, path), 'w') as f:
        f.write('x\n' * lines)
    sh(repo, 'add', path)
    sh(repo, '-c', 'user.name=%s' % who, '-c', 'user.email=%s' % mail, 'commit', '-q', '-m', msg,
       GIT_COMMITTER_DATE=when, GIT_AUTHOR_DATE=when)


def pr(n, head, state, base='staging', title=None, merged=None, closed=None, add=1, dele=0, files=1, login='onedotatatime', oid=None):
    return {'number': n, 'state': state, 'headRefName': head, 'baseRefName': base, 'url': 'https://github.com/o/r/pull/%d' % n,
            'title': title or 't%d' % n, 'mergedAt': merged, 'closedAt': closed or merged, 'additions': add, 'deletions': dele,
            'changedFiles': files, 'author': {'login': login}, 'headRefOid': oid or '0' * 40}


class World:
    """origin.git + a working clone with main, staging and a handful of branches (see the comments)."""
    def __init__(self, tmp):
        self.origin = os.path.join(tmp, 'origin.git')
        self.repo = os.path.join(tmp, 'repo')
        self.wt = os.path.join(tmp, 'wt-spike')
        subprocess.run(['git', 'init', '-q', '--bare', '-b', 'main', self.origin], check=True)
        subprocess.run(['git', 'init', '-q', '-b', 'main', self.repo], check=True)
        r = self.repo
        sh(r, 'remote', 'add', 'origin', self.origin)
        commit(r, 'README', 1, '2026-11-14T10:00:00Z')
        sh(r, 'push', '-q', 'origin', 'main')
        sh(r, 'checkout', '-q', '-b', 'staging')
        commit(r, 's.txt', 1, '2026-11-14T10:30:00Z')
        sh(r, 'push', '-q', 'origin', 'staging')
        # open PR, cut from staging, 2 commits, Cron's author address
        sh(r, 'checkout', '-q', '-b', 'feat/min-4450-a', 'staging')
        commit(r, 'a.txt', 3, '2026-11-14T11:00:00Z', 'Cron', 'hello+backend@minhos.ai')
        commit(r, 'a2.txt', 1, '2026-11-14T11:30:00Z', 'Cron', 'hello+backend@minhos.ai')
        sh(r, 'push', '-q', 'origin', 'feat/min-4450-a')
        # merged PR whose branch is still on the remote, cut from main
        sh(r, 'checkout', '-q', '-b', 'fix/min-4451-b', 'main')
        commit(r, 'b.txt', 2, '2026-11-14T09:00:00Z')
        sh(r, 'push', '-q', 'origin', 'fix/min-4451-b')
        # closed (not merged) PR, still on the remote
        sh(r, 'checkout', '-q', '-b', 'feat/closed-d', 'main')
        commit(r, 'd.txt', 1, '2026-11-14T08:00:00Z')
        sh(r, 'push', '-q', 'origin', 'feat/closed-d')
        # local only, no PR, cut from main, has a worktree
        sh(r, 'checkout', '-q', '-b', 'spike/local-only', 'main')
        commit(r, 'sp.txt', 4, '2026-11-14T12:00:00Z')
        sh(r, 'checkout', '-q', 'main')
        sh(r, 'worktree', 'add', '-q', self.wt, 'spike/local-only')
        # local only, no PR, cut from staging
        sh(r, 'checkout', '-q', '-b', 'feat/nopr-from-staging', 'staging')
        commit(r, 'n.txt', 5, '2026-11-14T12:30:00Z')
        with open(os.path.join(r, 'n.bin'), 'wb') as f:
            f.write(b'\x00\x01\x02' * 50)                   # numstat shows `-  -  n.bin`: a file, no lines
        sh(r, 'add', 'n.bin')
        sh(r, 'commit', '-q', '-m', 'bin', GIT_COMMITTER_DATE='2026-11-14T12:31:00Z', GIT_AUTHOR_DATE='2026-11-14T12:31:00Z')
        # a fresh worktree branch with no work
        sh(r, 'branch', 'wip/idle-empty', 'main')
        sh(r, 'checkout', '-q', 'main')
        self.prs = [
            pr(11, 'feat/min-4450-a', 'OPEN', title='feat a', add=4, files=2),
            pr(12, 'fix/min-4451-b', 'MERGED', base='main', merged='2026-11-14T13:00:00Z', add=2),
            pr(14, 'feat/closed-d', 'CLOSED', base='main', closed='2026-11-14T08:30:00Z'),
            # ref gone: merged 22:30Z on the 13th = 00:30 Athens on the 14th (today in Athens, yesterday in UTC)
            pr(13, 'chore/gone-c', 'MERGED', base='staging', title='docs (MIN-4460) gone', merged='2026-11-13T22:30:00Z', add=138, dele=18, files=13, login='someone'),
            # ref gone: merged 21:30Z on the 13th = 23:30 Athens on the 13th (yesterday)
            pr(10, 'chore/gone-old', 'MERGED', base='staging', merged='2026-11-13T21:30:00Z'),
        ]
        self.prs[0]['headRefOid'] = sh(r, 'rev-parse', 'origin/feat/min-4450-a')      # gh and the local refs agree

    def runner(self, gh, log=None, timeouts=None):
        def run(argv, cwd, timeout):
            if log is not None:
                log.append(list(argv))
            if timeouts is not None:
                timeouts.append((argv[0], timeout))
            if argv[0] == GH:
                return gh(argv)
            return sn.default_runner(argv, cwd, timeout)
        return run

    def ok_gh(self):
        return lambda argv: (0, json.dumps(self.prs), '')

    def block(self, gh=None, nodes=None, log=None, timeouts=None, bcfg=None):
        return sn.build_branches(dict(repoPath=self.repo, **(bcfg or {})), NOW, TZ, nodes, CFG['agents'], CFG['roleLabels'],
                                 self.runner(gh or self.ok_gh(), log, timeouts), GH)


def node(ident, who=None, label=None):
    labels = [{'name': label, 'parent': {'name': 'Role'}}] if label else []
    return {'identifier': ident, 'assignee': {'name': who} if who else None, 'labels': {'nodes': labels}}


_WORLD = {}


def setUpModule():
    _WORLD['tmp'] = tempfile.TemporaryDirectory()
    _WORLD['w'] = World(_WORLD['tmp'].name)


def tearDownModule():
    _WORLD['tmp'].cleanup()


class BranchesBase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp, cls.w = _WORLD['tmp'], _WORLD['w']

    def items(self, d):
        return {i['name']: i for i in d['items']}


class Contract(BranchesBase):
    def test_values_come_from_git_and_the_prs(self):
        d = self.w.block()
        self.assertNotIn('_warning', d)
        self.assertEqual((d['repo'], d['prSource'], d['truncated']), (None, 'gh', False))   # origin is a local bare path here: no owner/repo to name
        t = d['items']
        a = self.items(d)['feat/min-4450-a']
        self.assertEqual(a['state'], 'open')
        self.assertEqual(a['pr'], {'number': 11, 'state': 'OPEN', 'url': 'https://github.com/o/r/pull/11', 'base': 'staging', 'mergedAt': None, 'closedAt': None})
        self.assertEqual(a['vsStaging'], {'ahead': 2, 'behind': 0})
        self.assertEqual(a['vsMain'], {'ahead': 3, 'behind': 0})           # staging's own commit + its two
        self.assertEqual((a['statsBase'], a['files'], a['added'], a['removed']), ('staging', 2, 4, 0))   # a.txt 3 + a2.txt 1
        self.assertEqual(a['lastCommitAt'], '2026-11-14T11:30:00Z')
        self.assertEqual(a['lastCommitAuthor'], 'Cron')
        self.assertEqual((a['onRemote'], a['hasWorktree']), (True, False))
        self.assertEqual((a['issue'], a['issueFrom']), ('MIN-4450', 'branch'))
        self.assertEqual([i['name'] for i in t][:4], ['feat/nopr-from-staging', 'spike/local-only', 'feat/min-4450-a', 'wip/idle-empty'],
                         'open first, newest commit first')

    def test_nearest_base_for_a_branch_without_a_pr(self):
        it = self.items(self.w.block())
        sp = it['spike/local-only']                                         # cut from main: staging is 1 behind, 1 commit ahead of both
        self.assertEqual((sp['statsBase'], sp['vsMain'], sp['vsStaging']), ('main', {'ahead': 1, 'behind': 0}, {'ahead': 1, 'behind': 1}))
        self.assertEqual((sp['files'], sp['added']), (1, 4))
        self.assertEqual((sp['onRemote'], sp['hasWorktree'], sp['pr']), (False, True, None))
        ns = it['feat/nopr-from-staging']                                   # cut from staging: main is 2 behind-the-base, so staging is nearest
        self.assertEqual((ns['statsBase'], ns['vsStaging']['ahead'], ns['vsMain']['ahead']), ('staging', 2, 3))
        self.assertEqual((ns['files'], ns['added'], ns['removed']), (2, 5, 0))      # n.txt 5 lines + a binary file that has none

    def test_ahead_behind_is_counted_against_staging_and_the_block_says_so(self):
        d = self.w.block()
        self.assertEqual(d['base'], 'staging')
        a = self.items(d)['feat/min-4450-a']
        self.assertEqual((a['vsStaging'], a['vsMain']), ({'ahead': 2, 'behind': 0}, {'ahead': 3, 'behind': 0}))   # vsMain stays as the extra

    def test_stale_remote_refs_show_up_when_gh_knows_better(self):
        d = self.w.block()
        self.assertEqual((d['staleRefs'], d.get('_warning')), (0, None))
        moved = copy.deepcopy(self.w.prs)
        moved[0]['headRefOid'] = 'f' * 40                                   # gh says the head is elsewhere: the local ref is old
        d = self.w.block(gh=lambda argv: (0, json.dumps(moved), ''))
        self.assertEqual(d['staleRefs'], 1)
        self.assertEqual(d['_warning'], 'local remote-tracking refs are behind gh for 1 open PR; ahead/behind and file counts may be old (this job never fetches)')
        unfetched = self.w.prs + [pr(30, 'feat/never-fetched', 'OPEN'), pr(31, 'feat/never-fetched-2', 'OPEN')]
        d = self.w.block(gh=lambda argv: (0, json.dumps(unfetched), ''))   # open PRs with no local origin/ ref at all
        self.assertEqual(d['staleRefs'], 2)
        self.assertIn('2 open PRs', d['_warning'])

    def test_states_and_totals(self):
        d = self.w.block()
        it = self.items(d)
        self.assertEqual((it['fix/min-4451-b']['state'], it['feat/closed-d']['state'], it['chore/gone-c']['state']), ('merged', 'closed', 'merged'))
        # open = 3 live without PR + 1 open PR; on remote or with a PR = just the open PR
        self.assertEqual(d['totals'], {'open': 4, 'openOnRemote': 1, 'total': 8, 'merged': 3, 'mergedToday': 2, 'closed': 1})

    def test_merged_today_uses_the_deadlines_time_zone(self):
        it = self.items(self.w.block())
        self.assertIn('chore/gone-c', it)                                   # 22:30Z on the 13th is 00:30 Athens on the 14th
        d = self.w.block()
        self.assertEqual(d['totals']['mergedToday'], 2)                     # fix-b (13:00Z) and gone-c; gone-old (21:30Z) is yesterday
        wrong = sn.build_branches(dict(repoPath=self.w.repo), NOW, sn.timezone.utc, None, CFG['agents'], CFG['roleLabels'], self.w.runner(self.w.ok_gh()), GH)
        self.assertEqual(wrong['totals']['mergedToday'], 1)                 # the same data read in UTC differs: the zone is load-bearing

    def test_a_deleted_branch_is_remembered_by_its_pr(self):
        g = self.items(self.w.block())['chore/gone-c']
        self.assertEqual((g['vsMain'], g['vsStaging'], g['lastCommitAt'], g['onRemote'], g['hasWorktree']), (None, None, None, False, False))
        self.assertEqual((g['statsBase'], g['files'], g['added'], g['removed']), ('staging', 13, 138, 18))
        self.assertEqual(g['lastCommitAuthor'], 'someone')                  # the PR author's login when no commit is left
        self.assertEqual((g['issue'], g['issueFrom']), ('MIN-4460', 'pr'))  # not in the branch name, found in the PR title

    def test_one_pr_per_branch_an_open_one_wins(self):
        w = self.w
        prs = w.prs + [pr(15, 'feat/min-4450-a', 'CLOSED', closed='2026-11-14T09:00:00Z'), pr(9, 'feat/closed-d', 'OPEN')]
        d = w.block(gh=lambda argv: (0, json.dumps(prs), ''))
        it = self.items(d)
        self.assertEqual((it['feat/min-4450-a']['pr']['number'], it['feat/min-4450-a']['state']), (11, 'open'))   # open #11 beats newer closed #15
        self.assertEqual((it['feat/closed-d']['pr']['number'], it['feat/closed-d']['state']), (9, 'open'))        # open #9 beats closed #14

    def test_list_is_capped_but_totals_count_everything(self):
        many = self.w.prs + [pr(100 + i, 'old/b%d' % i, 'MERGED', merged='2026-11-12T10:%02d:00Z' % (i % 60)) for i in range(50)]
        d = self.w.block(gh=lambda argv: (0, json.dumps(many), ''))
        self.assertTrue(d['truncated'])
        self.assertEqual(sum(i['state'] != 'open' for i in d['items']), 50)      # the CTO's cap, written as the literal
        self.assertEqual(d['totals']['total'], 8 + 50)
        self.assertEqual(d['totals']['merged'], 3 + 50)
        self.assertEqual(d['totals']['open'], 4)                            # every open branch is listed

    def test_fixture_and_generated_items_have_the_same_keys(self):
        fx = json.load(open(os.path.join(os.path.dirname(HERE), 'fixtures', 'snapshot.example.json')))
        gen = self.w.block()
        self.assertEqual(sorted(fx['branches']), sorted(k for k in gen))      # includes `base` and `staleRefs`
        self.assertEqual(sorted(fx['branches']['totals']), sorted(gen['totals']))
        for i in fx['branches']['items'] + gen['items']:
            self.assertEqual(sorted(i), sorted(gen['items'][0]))
        for i in fx['branches']['items']:
            if i['pr']:
                self.assertEqual(sorted(i['pr']), sorted(gen['items'][2]['pr']))
        self.assertIn('branches', fx['blocks'])
        self.assertEqual(sorted(fx['blocks']['branches']), ['asOf', 'error'])


class Agent(BranchesBase):
    def test_agent_from_the_linear_issue_then_from_the_author(self):
        nodes = [node('MIN-4450', 'Cron Jobbidis', 'Backend Engineer'), node('MIN-4451', 'Founder Person', 'System Architect')]
        it = self.items(self.w.block(nodes=nodes))
        self.assertEqual((it['feat/min-4450-a']['agent'], it['feat/min-4450-a']['agentFrom']), ('Cron', 'issue'))
        self.assertEqual((it['fix/min-4451-b']['agent'], it['fix/min-4451-b']['agentFrom']), ('CTO', 'issue'))   # told by its Role label, not the assignee
        it2 = self.items(self.w.block(nodes=None))                          # Linear down this run: the author address still says who
        self.assertEqual((it2['feat/min-4450-a']['agent'], it2['feat/min-4450-a']['agentFrom']), ('Cron', 'author'))
        self.assertEqual((it2['fix/min-4451-b']['agent'], it2['fix/min-4451-b']['agentFrom']), (None, None))     # Tester <t@example.com>: unknown, not guessed

    def test_slug_is_read_from_github_urls_only(self):
        for url, want in (('https://github.com/onedotatatime/healthapp.git\n', 'onedotatatime/healthapp'),
                          ('git@github.com:onedotatatime/healthapp.git', 'onedotatatime/healthapp'),
                          ('https://user:pw@github.com/onedotatatime/healthapp', 'onedotatatime/healthapp'),   # credentials never come along
                          ('/tmp/x/origin.git', None), ('', None), ('https://example.com/a/b.git', None)):
            self.assertEqual(sn.slug_of(url), want, url)
        self.assertEqual(self.w.block(bcfg={'slug': 'o/r'})['repo'], 'o/r')                                   # the config wins

    def test_issue_regex_takes_only_whole_ids(self):
        self.assertEqual(sn.issue_of(('branch', 'feat/min-4450-a'))[0], 'MIN-4450')
        self.assertEqual(sn.issue_of(('branch', 'chore/MIN-12'))[0], 'MIN-12')
        self.assertEqual(sn.issue_of(('branch', 'feat/admin-4450'))[0], None)    # `admin-4450` is not a MIN id
        self.assertEqual(sn.issue_of(('branch', 'feat/min-12345678'))[0], None)
        self.assertEqual(sn.issue_of(('branch', 'x'), ('pr', 'fix (MIN-7)')), ('MIN-7', 'pr'))


class Failures(BranchesBase):
    def check_local_only(self, d, why):
        self.assertEqual(d['_warning'], why)
        self.assertEqual(d['prSource'], 'none')
        self.assertTrue(all(i['pr'] is None for i in d['items']))
        self.assertEqual((d['totals']['merged'], d['totals']['closed'], d['totals']['mergedToday']), (None, None, None))
        names = {i['name'] for i in d['items']}
        self.assertEqual(names, {'feat/min-4450-a', 'fix/min-4451-b', 'feat/closed-d', 'spike/local-only', 'feat/nopr-from-staging', 'wip/idle-empty'})
        a = self.items(d)['feat/min-4450-a']
        self.assertEqual((a['vsStaging'], a['files'], a['added']), ({'ahead': 2, 'behind': 0}, 2, 4))      # local git is still all there
        self.assertEqual(d['totals']['open'], 6)                                                          # without PRs nothing is known to be closed

    def test_gh_logged_out(self):
        err = 'To get started with GitHub CLI, please run:  gh auth login\nAlternatively, populate the GH_TOKEN environment variable'
        self.check_local_only(self.w.block(gh=lambda argv: (4, '', err)), 'gh not authenticated')

    def test_gh_missing(self):
        def gone(argv):
            raise FileNotFoundError(argv[0])
        self.check_local_only(self.w.block(gh=gone), 'gh not installed')

    def test_gh_other_failure_and_not_json(self):
        d = self.w.block(gh=lambda argv: (1, '', 'HTTP 502: server error'))
        self.assertTrue(d['_warning'].startswith('gh failed: HTTP 502'))
        d = self.w.block(gh=lambda argv: (0, '<html>', ''))
        self.assertEqual(d['_warning'], 'gh failed: answer was not JSON')

    def test_a_gh_timeout_is_a_warning_with_local_data_not_a_failed_snapshot(self):
        d = self.w.block(gh=lambda argv: (124, '', 'timed out after 10s'))
        self.assertEqual(d['_warning'], 'gh failed: timed out after 10s')
        self.assertEqual((d['prSource'], d['staleRefs']), ('none', None))
        self.assertGreater(len(d['items']), 0)

    def test_partial_block_is_fresh_data_with_an_error_and_never_fails_the_snapshot(self):
        state = {}
        sn.run_block(state, 'branches', lambda: self.w.block(gh=lambda argv: (4, '', 'gh auth login')), NOW)
        b = state['branches']
        self.assertEqual(b['asOf'], sn.iso(NOW))                            # fresh
        self.assertEqual(b['error'], {'message': 'gh not authenticated', 'at': sn.iso(NOW)})
        self.assertGreater(len(b['data']['items']), 0)                      # and the data is there
        self.assertNotIn('_warning', b['data'])                             # the private key never reaches the snapshot

    def test_a_dead_block_keeps_its_last_good_value_and_the_others_stay_fresh(self):
        def nokey():
            raise sn.BlockError('no key')
        good = dict(copy.deepcopy(HAND), )
        good['config'] = dict(good['config'], branches={'repoPath': self.w.repo})
        state = {}
        s1 = sn.build(NOW, good, {'models': {}, 'source': 's'}, state, '/nonexistent', '/nonexistent', nokey, runner=self.w.runner(self.w.ok_gh()), gh_bin=GH)
        self.assertIsNone(s1['blocks']['branches']['error'])
        self.assertEqual(len(s1['branches']['items']), 8)
        later = NOW + sn.timedelta(minutes=5)
        bad = copy.deepcopy(good)
        bad['config']['branches'] = {'repoPath': os.path.join(self.tmp.name, 'no-such-folder')}
        s2 = sn.build(later, bad, {'models': {}, 'source': 's'}, state, '/nonexistent', '/nonexistent', nokey, runner=self.w.runner(self.w.ok_gh()), gh_bin=GH)
        b = s2['blocks']['branches']
        self.assertEqual(b['asOf'], sn.iso(NOW))                            # old asOf
        self.assertEqual(b['error'], {'message': 'repo folder not found', 'at': sn.iso(later)})   # no path in it
        self.assertEqual(len(s2['branches']['items']), 8)                   # last good value
        self.assertEqual(s2['blocks']['hand']['asOf'], sn.iso(later))       # another block stays fresh
        self.assertIsNone(s2['blocks']['hand']['error'])
        self.assertEqual(s2['tasks'] if 'tasks' in s2 else None, None)      # linear failed on its own (no key): untouched by branches


class Safety(BranchesBase):
    def test_only_read_commands_run(self):
        log = []
        self.w.block(log=log)
        git_cmds = {a[1] for a in log if a[0] == 'git'}
        self.assertEqual(git_cmds, {'rev-parse', 'remote', 'for-each-ref', 'worktree', 'rev-list', 'diff'})   # no fetch (CTO, MIN-4460)
        for a in log:
            if a[0] == 'git' and a[1] == 'worktree':
                self.assertEqual(a[2:4], ['list', '--porcelain'])           # never `worktree add|remove|prune`
        gh = [a for a in log if a[0] == GH]
        self.assertEqual(len(gh), 1)
        self.assertEqual(gh[0][1:4], ['pr', 'list', '--state'])             # one list call, no `pr merge|close|edit`

    def test_the_branches_code_has_no_write_word(self):
        # The CTO: a test fails on these words. Scan the executable source of the branches section, comments stripped.
        src = open(os.path.join(os.path.dirname(HERE), 'snapshot.py')).read()
        sec = src[src.index('- branches (MIN-4460)'):src.index('- hand\n')]
        code = '\n'.join(l.split('  #')[0] for l in sec.splitlines() if not l.strip().startswith('#'))
        for w in ("'fetch'", "'pull'", "'push'", "'merge'", "'prune'", "'remove'", "'checkout'", "'reset'", "'clean'", "'gc'",
                  "'-d'", "'-D'", "'close'", "'edit'", "'create'", "'--delete'", "'delete'", "'mutation'", '"fetch"', '"mutation"'):
            self.assertNotIn(w, code, w)
        self.assertNotIn('git fetch', code)
        self.assertEqual(code.count("'pr', 'list'"), 1)                     # one gh call

    def test_every_command_runs_without_optional_locks(self):
        rc, out, _ = sn.default_runner(['sh', '-c', 'printf %s "$GIT_OPTIONAL_LOCKS"'], self.w.repo, 10)
        self.assertEqual((rc, out), (0, '0'))

    def test_one_gh_call_with_a_ten_second_timeout(self):
        timeouts = []
        self.w.block(timeouts=timeouts)
        gh = [t for t in timeouts if t[0] == GH]
        self.assertEqual(gh, [(GH, 10)])

    def test_the_whole_snapshot_has_no_home_folder_path(self):
        home = os.path.expanduser('~')
        err = 'boom reading %s/.config/gh/hosts.yml and /Users/somebody/x' % home
        good = copy.deepcopy(HAND)
        good['config'] = dict(good['config'], branches={'repoPath': self.w.repo})
        def nokey():
            raise sn.BlockError('no key at %s/.claude/.env.agents' % home)
        snap = sn.build(NOW, good, {'models': {}, 'source': 's'}, {}, home + '/nonexistent', home + '/nonexistent/bin/usage', nokey,
                        runner=self.w.runner(lambda argv: (1, '', err)), gh_bin=GH)
        text = json.dumps(snap)
        self.assertIn('gh failed', text)                                    # the dirty text really went through the block
        self.assertNotIn(home, text)
        self.assertNotIn('/Users/', text)

    def test_nothing_local_or_personal_leaves_the_block(self):
        text = json.dumps(self.w.block())
        for needle in (self.tmp.name, self.w.wt, os.path.expanduser('~'), '@minhos.ai', 'example.com', 'hello+'):
            self.assertNotIn(needle, text)
        sn.assert_clean(text)

    def test_tokens_and_home_paths_in_gh_errors_are_redacted(self):
        err = 'boom %s at %s/.config/gh' % (FAKE_GH_TOKEN, os.path.expanduser('~'))
        d = self.w.block(gh=lambda argv: (1, '', err))
        self.assertNotIn(FAKE_GH_TOKEN, d['_warning'])
        self.assertIn('[redacted]', d['_warning'])
        self.assertNotIn(os.path.expanduser('~'), d['_warning'])
        for bad in (FAKE_GH_TOKEN, 'github' + '_pat_' + 'B' * 30):
            with self.assertRaises(sn.BlockError):
                sn.assert_clean('{"x":"%s"}' % bad)

    def test_not_a_repository_is_a_block_error_not_a_crash(self):
        with tempfile.TemporaryDirectory() as empty:
            with self.assertRaises(sn.BlockError) as cm:
                sn.build_branches({'repoPath': empty}, NOW, TZ, None, CFG['agents'], CFG['roleLabels'], self.w.runner(self.w.ok_gh()), GH)
            self.assertIn('git rev-parse failed', str(cm.exception))
            self.assertNotIn(empty, str(cm.exception))


if __name__ == '__main__':
    unittest.main()
