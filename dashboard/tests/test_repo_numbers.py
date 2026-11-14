"""Tests for the `repo` block of dashboard/snapshot.py (MIN-4568): numbers only about the healthapp repo.
Two kinds of test. Values: a small real git repository (plus a bare `origin`) in a temp folder, so counts are what git says; only `gh` is
faked (its answer is a JSON document, and the logged-out case needs a non-zero exit). Failure paths: a stub runner stands in for BOTH git and
gh, so each command can be made to fail on its own. No test touches the network, the founder's repo or his `gh` login."""
import copy, json, os, re, subprocess, sys, tempfile, unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
import snapshot as sn  # noqa: E402

HAND = json.load(open(os.path.join(os.path.dirname(HERE), 'hand-set.sample.json')))
CFG = HAND['config']
SINCE = sn.parse(HAND['buildStart'])                   # Sat 14 Nov 12:00 +02:00 = 10:00Z
NOW = sn.parse('2026-11-14T16:00:00Z')                 # the 24 h window opens 2026-11-13T16:00Z
GH = 'GH-FAKE'

# What the real-git world below must produce (worked out by hand in the comments of World).
EXPECTED = {'branchesOpen': 3, 'branchesMerged': 2, 'prsOpen': 2, 'prsMerged': 3, 'prsTotal': 7,
            'commitsStaging': 4, 'commitsStaging24h': 2, 'commitsMain': 2, 'commitsMain24h': 1,
            'linesAdded': 182, 'linesRemoved': 6, 'filesChanged': 6, 'codeLines': 14, 'codeFiles': 4}
NAMES_AND_PATHS = ('feat/', 'fix/', 'gone/', 'a.txt', 'old.txt', 'vendor', 'package-lock', 'deps.lock', 'img.bin', 'docs/', 'README', 'origin.git')


def sh(repo, *args, **env):
    e = dict(os.environ, GIT_CONFIG_GLOBAL='/dev/null', GIT_CONFIG_SYSTEM='/dev/null', **env)
    r = subprocess.run(['git', '-c', 'user.name=Tester', '-c', 'user.email=t@example.com', '-C', repo] + list(args), capture_output=True, text=True, env=e)
    assert r.returncode == 0, (args, r.stderr)
    return r.stdout.strip()


def commit(repo, files, when, msg='c'):
    """files: {path: n lines of 'x' | bytes}"""
    for path, body in files.items():
        full = os.path.join(repo, path)
        os.makedirs(os.path.dirname(full), exist_ok=True)
        with open(full, 'wb') as f:
            f.write(body if isinstance(body, bytes) else b'x\n' * body)
        sh(repo, 'add', path)
    sh(repo, 'commit', '-q', '-m', msg, GIT_COMMITTER_DATE=when, GIT_AUTHOR_DATE=when)


def pr(n, head, state, base='staging', oid='0' * 40):
    """All the fields `gh pr list` is asked for by either block: the same stub answers the branches block when the whole snapshot is built."""
    done = '2026-11-14T13:00:00Z' if state != 'OPEN' else None
    return {'number': n, 'state': state, 'headRefName': head, 'headRefOid': oid, 'baseRefName': base, 'url': 'https://github.com/o/r/pull/%d' % n,
            'title': 't%d' % n, 'mergedAt': done if state == 'MERGED' else None, 'closedAt': done, 'additions': 1, 'deletions': 0, 'changedFiles': 1,
            'author': {'login': 'someone'}}


class World:
    def __init__(self, tmp):
        self.origin, self.repo = os.path.join(tmp, 'origin.git'), os.path.join(tmp, 'repo')
        subprocess.run(['git', 'init', '-q', '--bare', '-b', 'main', self.origin], check=True)
        subprocess.run(['git', 'init', '-q', '-b', 'main', self.repo], check=True)
        r = self.repo
        sh(r, 'remote', 'add', 'origin', self.origin)
        commit(r, {'README': 1}, '2026-11-13T09:00:00Z')                                  # main 1
        sh(r, 'checkout', '-q', '-b', 'staging')
        commit(r, {'old.txt': 7}, '2026-11-13T12:00:00Z')                                 # staging 2: before the build and outside the 24 h
        commit(r, {'a.txt': 10, 'package-lock.json': 100, 'vendor/v.js': 50, 'deps.lock': 20, 'img.bin': b'\x00\x01\x02' * 40},
               '2026-11-14T11:00:00Z')                                                    # staging 3: +180 lines, 5 files (the binary has no lines)
        commit(r, {'a.txt': 4, 'docs/n.md': 2}, '2026-11-14T15:00:00Z')                    # staging 4: a.txt 10 -> 4 is -6, n.md +2, 2 more paths (one repeated)
        sh(r, 'push', '-q', 'origin', 'staging')
        sh(r, 'checkout', '-q', 'main')
        commit(r, {'m2.txt': 3}, '2026-11-14T14:00:00Z')                                  # main 2, inside the 24 h
        sh(r, 'push', '-q', 'origin', 'main')
        for b in ('feat/open-1', 'feat/open-2', 'fix/done-1', 'feat/closed-1'):
            sh(r, 'checkout', '-q', '-b', b, 'staging')
            commit(r, {b.replace('/', '_') + '.txt': 2}, '2026-11-14T13:00:00Z')
            sh(r, 'push', '-q', 'origin', b)
        sh(r, 'checkout', '-q', '-b', 'wip/local-only', 'main')                           # never pushed: not a remote branch
        commit(r, {'w.txt': 1}, '2026-11-14T13:30:00Z')
        sh(r, 'checkout', '-q', 'main')
        self.prs = [pr(11, 'feat/open-1', 'OPEN', oid=sh(r, 'rev-parse', 'origin/feat/open-1')),     # open; an older closed PR (9) must not close the branch
                    pr(9, 'feat/open-1', 'CLOSED'),
                    pr(12, 'fix/done-1', 'MERGED'),                                                    # merged, branch still on the remote
                    pr(13, 'gone/merged-2', 'MERGED'),                                                 # merged, branch deleted
                    pr(14, 'feat/closed-1', 'CLOSED'),                                                 # closed without merge, still on the remote
                    pr(15, 'feat/open-3', 'OPEN'),                                                     # open PR whose ref this clone has not fetched
                    pr(16, 'staging', 'MERGED', base='main')]                                          # the release PR: a PR, not a feature branch

    def runner(self, gh, log=None, timeouts=None):
        def run(argv, cwd, timeout):
            if log is not None:
                log.append(list(argv))
            if timeouts is not None:
                timeouts.append((argv[0], timeout))
            return gh(argv) if argv[0] == GH else sn.default_runner(argv, cwd, timeout)
        return run

    def ok_gh(self):
        return lambda argv: (0, json.dumps(self.prs), '')

    def block(self, gh=None, now=NOW, since=SINCE, log=None, timeouts=None, repoPath=None):
        return sn.build_repo({'repoPath': repoPath or self.repo}, now, since, self.runner(gh or self.ok_gh(), log, timeouts), GH)


_WORLD = {}


def setUpModule():
    _WORLD['tmp'] = tempfile.TemporaryDirectory()
    _WORLD['w'] = World(_WORLD['tmp'].name)


def tearDownModule():
    _WORLD['tmp'].cleanup()


class RealGit(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.w = _WORLD['w']

    def test_every_field_from_git_and_gh(self):
        d = self.w.block()
        warn = d.pop('_warning')
        self.assertEqual(d, EXPECTED)
        self.assertEqual(warn, 'local remote-tracking refs are behind gh for 1 open PR; commit and line numbers may be old (this job never fetches)')

    def test_branches_open_and_merged(self):
        d = self.w.block()
        # open = on origin or with an open PR, minus branches whose newest PR is merged/closed: open-1, open-2, open-3 (no ref, open PR)
        self.assertEqual((d['branchesOpen'], d['branchesMerged']), (3, 2))     # merged = distinct heads: done-1 and the deleted gone/merged-2, not `staging`
        no_open_3 = [p for p in self.w.prs if p['headRefName'] != 'feat/open-3']
        d2 = self.w.block(gh=lambda argv: (0, json.dumps(no_open_3), ''))
        self.assertEqual(d2['branchesOpen'], 2)
        self.assertNotIn('_warning', d2)                                        # and no stale-ref warning without the unfetched PR

    def test_prs_open_merged_total_count_every_pr(self):
        d = self.w.block()
        self.assertEqual((d['prsOpen'], d['prsMerged'], d['prsTotal']), (2, 3, 7))   # 7 = 2 open + 3 merged + 2 closed; the release PR counts here

    def test_commits_total_and_last_24_hours(self):
        d = self.w.block()
        self.assertEqual((d['commitsStaging'], d['commitsStaging24h'], d['commitsMain'], d['commitsMain24h']), (4, 2, 2, 1))
        later = self.w.block(now=sn.parse('2026-11-15T16:00:00Z'))              # a day later: the window moved, the totals did not
        self.assertEqual((later['commitsStaging'], later['commitsStaging24h'], later['commitsMain24h']), (4, 0, 0))

    def test_lines_since_the_build_start(self):
        d = self.w.block()
        self.assertEqual((d['linesAdded'], d['linesRemoved'], d['filesChanged']), (182, 6, 6))     # 180 + 2 added; 6 paths, a.txt counted once
        late = self.w.block(since=sn.parse('2026-11-14T13:00:00Z'))             # only the 15:00Z commit is inside
        self.assertEqual((late['linesAdded'], late['linesRemoved'], late['filesChanged']), (2, 6, 2))
        after = self.w.block(since=sn.parse('2026-11-14T16:00:00Z'))
        self.assertEqual((after['linesAdded'], after['linesRemoved'], after['filesChanged']), (0, 0, 0))   # nothing yet: zero, not omitted

    def test_a_merge_commit_counts_the_whole_branch_it_brings_once(self):
        # A branch commit older than the build start, brought in by a merge commit after it: the work arrived during the build.
        # `--first-parent` reads the merge against staging (+5 lines, 1 file); without it the old commit is filtered out and the merge shows nothing.
        with tempfile.TemporaryDirectory() as t:
            repo = os.path.join(t, 'r')
            subprocess.run(['git', 'init', '-q', '-b', 'main', repo], check=True)
            commit(repo, {'base.txt': 1}, '2026-11-13T09:00:00Z')
            sh(repo, 'checkout', '-q', '-b', 'staging')
            sh(repo, 'checkout', '-q', '-b', 'feat/old-work')
            commit(repo, {'feat.txt': 5}, '2026-11-13T10:00:00Z')
            sh(repo, 'checkout', '-q', 'staging')
            commit(repo, {'other.txt': 2}, '2026-11-14T11:00:00Z')
            sh(repo, 'merge', '-q', '--no-ff', '-m', 'merge feat', 'feat/old-work', GIT_COMMITTER_DATE='2026-11-14T12:00:00Z', GIT_AUTHOR_DATE='2026-11-14T12:00:00Z')
            d = self.w.block(repoPath=repo, gh=lambda argv: (0, '[]', ''))
            self.assertEqual((d['linesAdded'], d['linesRemoved'], d['filesChanged']), (7, 0, 2))      # other.txt 2 + feat.txt 5, each file once
            self.assertEqual(d['commitsStaging'], 4)

    def test_code_size_skips_lockfiles_vendor_and_binaries(self):
        d = self.w.block()
        # README 1 + old.txt 7 + a.txt 4 + docs/n.md 2. Left out: package-lock.json (100), vendor/v.js (50), deps.lock (20), img.bin (binary)
        self.assertEqual((d['codeLines'], d['codeFiles']), (14, 4))

    def test_code_size_counts_the_ref_not_the_working_copy(self):
        path = os.path.join(self.w.repo, 'untracked-big.txt')
        with open(path, 'w') as f:
            f.write('x\n' * 500)
        try:
            self.assertEqual(self.w.block()['codeLines'], 14)                  # an untracked file in the founder's checkout is nobody's code
        finally:
            os.remove(path)

    def test_numbers_only_nothing_that_names_a_branch_a_path_or_a_title(self):
        d = self.w.block()
        d.pop('_warning')
        self.assertEqual(set(d), set(sn.REPO_FIELDS))
        for k, v in d.items():
            self.assertIs(type(v), int, k)
        text = json.dumps(d)
        for w in NAMES_AND_PATHS + (self.w.repo, os.path.expanduser('~')):
            self.assertNotIn(w, text)
        self.assertEqual(list(d), list(sn.REPO_FIELDS))                       # a stable order for the page's tiles

    def test_the_warning_names_no_branch_or_path_either(self):
        warn = self.w.block()['_warning']
        for w in NAMES_AND_PATHS + (self.w.repo,):
            self.assertNotIn(w, warn)

    def test_a_repo_with_no_staging_branch_leaves_those_fields_out(self):
        with tempfile.TemporaryDirectory() as t:
            repo = os.path.join(t, 'r')
            subprocess.run(['git', 'init', '-q', '-b', 'main', repo], check=True)
            commit(repo, {'only.txt': 2}, '2026-11-14T11:00:00Z')
            d = self.w.block(repoPath=repo, gh=lambda argv: (0, '[]', ''))
            w = d.pop('_warning')
            self.assertEqual(d, {'branchesOpen': 0, 'branchesMerged': 0, 'prsOpen': 0, 'prsMerged': 0, 'prsTotal': 0, 'commitsMain': 1, 'commitsMain24h': 1})
            self.assertEqual(w.count('no staging branch found'), 3)            # commits staging, lines, code: one reason each
            self.assertNotIn('main', w.replace('no staging branch found', ''))   # main was fine

    def test_the_local_branch_is_used_when_origin_has_none(self):
        with tempfile.TemporaryDirectory() as t:
            repo = os.path.join(t, 'r')
            subprocess.run(['git', 'init', '-q', '-b', 'main', repo], check=True)
            commit(repo, {'a.txt': 2}, '2026-11-14T11:00:00Z')
            sh(repo, 'branch', 'staging')
            d = self.w.block(repoPath=repo, gh=lambda argv: (0, '[]', ''))
            self.assertEqual((d['commitsStaging'], d['commitsMain'], d['codeLines'], d['linesAdded']), (1, 1, 2, 2))


# ----------------------------------------------------------------------------- failure paths, with git and gh both stubbed

def ref_rows(names):
    return ''.join('\x1f'.join(['refs/remotes/origin/' + n, 'a' * 40, '2026-11-14T11:00:00+00:00', 'T', '<t@example.com>']) + '\n' for n in names)


class Stub:
    """A runner that answers every command from a table keyed on the git subcommand ('gh' for gh). A key mapped to None = default answer."""
    def __init__(self, **over):
        self.answers = {
            'rev-parse': (0, '.git\n', ''),
            'for-each-ref': (0, ref_rows(['staging', 'main', 'feat/x']), ''),
            'rev-list': (0, '9\n', ''),
            'log': (0, '5\t1\tp/one\n3\t0\tp/two\n-\t-\tbin\n', ''),
            'grep': (0, 'origin/staging:p/one:10\norigin/staging:p/two:5\n', ''),
            'gh': (0, json.dumps([pr(1, 'feat/x', 'OPEN', oid='a' * 40), pr(2, 'old', 'MERGED')]), ''),
        }
        self.answers.update(over)
        self.calls = []

    def __call__(self, argv, cwd, timeout):
        self.calls.append(list(argv))
        key = 'gh' if argv[0] == GH else argv[1]
        a = self.answers[key]
        if isinstance(a, Exception):
            raise a
        return a(argv) if callable(a) else a

    def block(self, repo, **kw):
        return sn.build_repo({'repoPath': repo}, NOW, SINCE, self, GH)


class FailurePaths(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)

    def test_the_stub_baseline_gives_every_field(self):
        d = Stub().block(self.tmp.name)
        self.assertNotIn('_warning', d)
        self.assertEqual(d, {'branchesOpen': 1, 'branchesMerged': 1, 'prsOpen': 1, 'prsMerged': 1, 'prsTotal': 2,
                             'commitsStaging': 9, 'commitsStaging24h': 9, 'commitsMain': 9, 'commitsMain24h': 9,
                             'linesAdded': 8, 'linesRemoved': 1, 'filesChanged': 3, 'codeLines': 15, 'codeFiles': 2})

    def only_missing(self, d, fields):
        self.assertEqual(set(sn.REPO_FIELDS) - set(d) - {'_warning'}, set(fields))

    def test_gh_not_installed(self):
        d = Stub(gh=FileNotFoundError('gh')).block(self.tmp.name)
        self.only_missing(d, ('branchesOpen', 'branchesMerged', 'prsOpen', 'prsMerged', 'prsTotal'))
        self.assertEqual(d['_warning'], 'prs: gh not installed')
        self.assertEqual(d['commitsStaging'], 9)                              # the git numbers do not depend on gh

    def test_gh_not_logged_in(self):
        d = Stub(gh=(4, '', 'To get started with GitHub CLI, please run:  gh auth login')).block(self.tmp.name)
        self.assertEqual(d['_warning'], 'prs: gh not authenticated')
        self.only_missing(d, ('branchesOpen', 'branchesMerged', 'prsOpen', 'prsMerged', 'prsTotal'))

    def test_gh_error_text_is_cleaned(self):
        home = os.path.expanduser('~')
        d = Stub(gh=(1, '', 'boom reading %s/.config/gh/hosts.yml and /Users/somebody/x' % home)).block(self.tmp.name)
        self.assertTrue(d['_warning'].startswith('prs: gh failed: boom reading ~/.config/gh/hosts.yml'))
        self.assertNotIn(home, d['_warning'])
        self.assertNotIn('/Users/somebody', d['_warning'])

    def test_gh_timeout(self):
        d = Stub(gh=(124, '', 'timed out after 10s')).block(self.tmp.name)
        self.assertEqual(d['_warning'], 'prs: gh failed: timed out after 10s')

    def test_gh_answer_is_not_json_or_not_the_shape_we_read(self):
        for body in ('not json', '{"a": 1}', json.dumps([{'number': 1}]), json.dumps(['x'])):
            d = Stub(gh=(0, body, '')).block(self.tmp.name)
            self.assertEqual(d['_warning'], 'prs: gh failed: answer was not the expected JSON', body)
            self.only_missing(d, ('branchesOpen', 'branchesMerged', 'prsOpen', 'prsMerged', 'prsTotal'))

    def test_hitting_the_pr_limit_is_reported(self):
        many = json.dumps([pr(i, 'b%d' % i, 'MERGED') for i in range(sn.REPO_PR_LIMIT)])
        d = Stub(gh=(0, many, '')).block(self.tmp.name)
        self.assertEqual(d['prsTotal'], sn.REPO_PR_LIMIT)                     # still reported, with a reason beside it
        self.assertIn('the most it is asked for', d['_warning'])
        one_less = json.dumps([pr(i, 'b%d' % i, 'MERGED') for i in range(sn.REPO_PR_LIMIT - 1)])
        self.assertNotIn('_warning', Stub(gh=(0, one_less, '')).block(self.tmp.name))

    def test_staging_commit_count_fails_alone(self):
        def rev_list(argv):
            return (128, '', 'fatal: bad revision') if 'refs/remotes/origin/staging' in argv else (0, '4\n', '')
        d = Stub(**{'rev-list': rev_list}).block(self.tmp.name)
        self.only_missing(d, ('commitsStaging', 'commitsStaging24h'))
        self.assertEqual((d['commitsMain'], d['commitsMain24h']), (4, 4))
        self.assertEqual(d['_warning'], 'commits staging: git rev-list failed: fatal: bad revision')

    def test_the_24_hour_count_failing_drops_the_pair_not_just_one(self):
        d = Stub(**{'rev-list': lambda argv: (128, '', 'bad') if any(a.startswith('--since=') for a in argv) and 'refs/remotes/origin/main' in argv else (0, '2\n', '')}).block(self.tmp.name)
        self.only_missing(d, ('commitsMain', 'commitsMain24h'))               # never a total next to a missing 24 h figure that looks like zero

    def test_the_log_failing_leaves_the_lines_out(self):
        d = Stub(log=(128, '', 'fatal: your current branch appears to be broken')).block(self.tmp.name)
        self.only_missing(d, ('linesAdded', 'linesRemoved', 'filesChanged'))
        self.assertEqual(d['_warning'], 'lines: git log failed: fatal: your current branch appears to be broken')
        self.assertEqual(d['codeLines'], 15)

    def test_the_log_timing_out_leaves_the_lines_out(self):
        d = Stub(log=(124, '', 'timed out after 60s')).block(self.tmp.name)
        self.assertIn('lines: git log failed: timed out after 60s', d['_warning'])
        self.only_missing(d, ('linesAdded', 'linesRemoved', 'filesChanged'))

    def test_grep_failing_leaves_the_code_size_out(self):
        d = Stub(grep=(128, '', 'fatal: bad object origin/staging')).block(self.tmp.name)
        self.only_missing(d, ('codeLines', 'codeFiles'))
        self.assertEqual(d['_warning'], 'code: git grep failed: fatal: bad object origin/staging')

    def test_grep_finding_nothing_is_zero_not_a_failure(self):
        d = Stub(grep=(1, '', '')).block(self.tmp.name)
        self.assertEqual((d['codeLines'], d['codeFiles']), (0, 0))
        self.assertNotIn('_warning', d)
        d2 = Stub(grep=(1, '', 'some real error')).block(self.tmp.name)       # exit 1 WITH a message is a failure
        self.only_missing(d2, ('codeLines', 'codeFiles'))

    def test_grep_rows_with_colons_in_the_path_still_count(self):
        d = Stub(grep=(0, 'origin/staging:a:b/c.txt:7\norigin/staging:d.txt:3\nunparseable row\n', '')).block(self.tmp.name)
        self.assertEqual((d['codeLines'], d['codeFiles']), (10, 2))

    def test_numstat_rows_that_are_not_numstat_are_ignored(self):
        d = Stub(log=(0, '\n2\t1\tx\nweird\n4\t4\tx\n', '')).block(self.tmp.name)
        self.assertEqual((d['linesAdded'], d['linesRemoved'], d['filesChanged']), (6, 5, 1))

    def test_unreadable_refs_fail_the_block_because_nothing_is_readable(self):
        with self.assertRaises(sn.BlockError) as cm:
            Stub(**{'for-each-ref': (128, '', 'fatal: bad ref')}).block(self.tmp.name)
        msg = str(cm.exception)
        self.assertIn('nothing readable', msg)
        self.assertEqual(msg.count('refs unreadable'), 5)                     # prs, commits staging, commits main, lines, code: each says why
        self.assertIn('refs: git for-each-ref failed: fatal: bad ref', msg)

    def test_nothing_readable_fails_the_block(self):
        every = (128, '', 'fatal: broken')
        with self.assertRaises(sn.BlockError) as cm:
            Stub(**{'rev-list': every, 'log': every, 'grep': every, 'gh': every}).block(self.tmp.name)
        self.assertTrue(str(cm.exception).startswith('nothing readable: '))

    def test_git_missing_in_a_group_is_a_reason_not_a_crash(self):
        d = Stub(grep=FileNotFoundError('git')).block(self.tmp.name)
        self.assertIn('code: git', d['_warning'])
        self.only_missing(d, ('codeLines', 'codeFiles'))

    def test_a_missing_folder_or_a_non_repository_fails_the_block(self):
        with self.assertRaises(sn.BlockError) as cm:
            Stub().block(os.path.join(self.tmp.name, 'no-such-folder'))
        self.assertEqual(str(cm.exception), 'repo folder not found')
        with self.assertRaises(sn.BlockError) as cm:
            Stub(**{'rev-parse': (128, '', 'fatal: not a git repository')}).block(self.tmp.name)
        self.assertIn('not a git repository', str(cm.exception))


class InTheSnapshot(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.w = _WORLD['w']

    def snap(self, state, repo=None, gh=None, now=NOW, nokey=True):
        hand = copy.deepcopy(HAND)
        hand['config'] = dict(hand['config'], branches={'repoPath': repo or self.w.repo})

        def key():
            raise sn.BlockError('no key')
        home = os.path.expanduser('~')
        return sn.build(now, hand, {'models': {}, 'source': 's'}, state, home + '/nonexistent', home + '/nonexistent/bin/usage', key,
                        runner=self.w.runner(gh or self.w.ok_gh()), gh_bin=GH)

    def test_block_and_data_sit_where_the_page_reads_them(self):
        s = self.snap({})
        self.assertEqual(s['blocks']['repo']['asOf'], sn.iso(NOW))
        self.assertTrue(s['blocks']['repo']['error']['message'].startswith('local remote-tracking refs are behind gh for 1 open PR'))   # the stale-ref warning
        self.assertEqual(s['repo'], EXPECTED)
        self.assertNotIn('_warning', s['repo'])
        self.assertEqual(sorted(s['blocks']['repo']), ['asOf', 'error'])
        self.assertIsNotNone(s['branches'])                                   # the branches block is untouched

    def test_a_partial_failure_is_fresh_with_an_error_and_the_field_is_absent(self):
        s = self.snap({}, gh=lambda argv: (4, '', 'gh auth login'))
        self.assertEqual(s['blocks']['repo']['asOf'], sn.iso(NOW))
        self.assertEqual(s['blocks']['repo']['error']['message'], 'prs: gh not authenticated')
        self.assertNotIn('prsTotal', s['repo'])                               # omitted, never null or a guess
        self.assertEqual(s['repo']['commitsStaging'], 4)

    def test_a_whole_block_failure_keeps_the_last_good_value_and_its_old_asOf(self):
        state = {}
        s1 = self.snap(state)
        self.assertEqual(s1['repo'], EXPECTED)
        later = sn.parse('2026-11-14T16:03:00Z')
        s2 = self.snap(state, repo=os.path.join(self.w.repo, 'no-such-folder'), now=later)
        self.assertEqual(s2['repo'], EXPECTED)                                # last good
        self.assertEqual(s2['blocks']['repo']['asOf'], sn.iso(NOW))           # old
        self.assertEqual(s2['blocks']['repo']['error']['message'], 'repo folder not found')
        self.assertEqual(s2['blocks']['hand']['asOf'], sn.iso(later))         # another block stays fresh
        self.assertIsNone(s2['blocks']['hand']['error'])

    def test_the_repo_block_cannot_fail_the_others(self):
        s = self.snap({}, repo=os.path.join(self.w.repo, 'no-such-folder'))
        self.assertNotIn('repo', s)                                           # no last good yet: no field, an error
        self.assertEqual(s['blocks']['repo']['error']['message'], 'repo folder not found')
        self.assertIsNone(s['blocks']['hand']['error'])

    def test_config_repo_can_name_another_folder(self):
        hand = copy.deepcopy(HAND)
        hand['config'] = dict(hand['config'], branches={'repoPath': os.path.join(self.w.repo, 'nope')}, repo={'repoPath': self.w.repo})
        home = os.path.expanduser('~')

        def key():
            raise sn.BlockError('no key')
        s = sn.build(NOW, hand, {'models': {}, 'source': 's'}, {}, home + '/nonexistent', home + '/nonexistent/bin/usage', key,
                     runner=self.w.runner(self.w.ok_gh()), gh_bin=GH)
        self.assertEqual(s['repo'], EXPECTED)
        self.assertEqual(s['blocks']['branches']['error']['message'], 'repo folder not found')

    def test_the_snapshot_text_passes_the_key_check_and_holds_no_repo_path(self):
        text = json.dumps(self.snap({}), separators=(',', ':'))
        sn.assert_clean(text)
        self.assertNotIn(self.w.repo, text)
        self.assertEqual(json.loads(text)['repo'], EXPECTED)

    def test_the_example_snapshot_carries_the_block_with_the_same_fields(self):
        fx = json.load(open(os.path.join(os.path.dirname(HERE), 'fixtures', 'snapshot.example.json')))
        self.assertEqual(list(fx['repo']), list(sn.REPO_FIELDS))
        self.assertEqual(sorted(fx['blocks']['repo']), ['asOf', 'error'])
        self.assertEqual(list(fx['repo']), list(self.w.block().keys())[:len(sn.REPO_FIELDS)])
        for v in fx['repo'].values():
            self.assertIs(type(v), int)

    def test_the_readme_names_every_field_and_its_source(self):
        text = open(os.path.join(os.path.dirname(HERE), 'README.md')).read()
        sec = text[text.index('## Repo block'):]
        sec = sec[:sec.index('\n## ', 5)] if '\n## ' in sec[5:] else sec
        for f in sn.REPO_FIELDS:
            row = next((l for l in sec.splitlines() if '`%s`' % f in l), None)
            self.assertIsNotNone(row, f)
            self.assertRegex(row, r'git |gh ', f)                              # each field's row says where the number comes from


class Safety(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.w = _WORLD['w']

    def test_only_read_commands_run(self):
        log = []
        self.w.block(log=log)
        self.assertEqual({a[1] for a in log if a[0] == 'git'}, {'rev-parse', 'for-each-ref', 'rev-list', 'log', 'grep'})   # no fetch
        gh = [a for a in log if a[0] == GH]
        self.assertEqual(len(gh), 1)
        self.assertEqual(gh[0][1:4], ['pr', 'list', '--state'])
        self.assertEqual(gh[0][gh[0].index('--limit') + 1], str(sn.REPO_PR_LIMIT))      # the total depends on asking for them all
        self.assertEqual(sn.REPO_PR_LIMIT, 1000)
        grep = next(a for a in log if a[:2] == ['git', 'grep'])
        self.assertEqual(grep[2:4], ['-I', '-c'])
        self.assertTrue(all(p.startswith(':(exclude,glob)') for p in grep[grep.index('--') + 2:]))

    def test_one_gh_call_with_a_ten_second_timeout(self):
        timeouts = []
        self.w.block(timeouts=timeouts)
        self.assertEqual([t for t in timeouts if t[0] == GH], [(GH, 10)])
        self.assertEqual({t for a, t in timeouts if a == 'git'} - {10, 30, 60}, set())

    def test_the_repo_code_has_no_write_word(self):
        src = open(os.path.join(os.path.dirname(HERE), 'snapshot.py')).read()
        sec = src[src.index('- repo numbers (MIN-4568)'):src.index('- assemble\n')]
        code = '\n'.join(l.split('  #')[0] for l in sec.splitlines() if not l.strip().startswith('#'))
        for w in ("'fetch'", "'pull'", "'push'", "'merge'", "'prune'", "'remove'", "'checkout'", "'reset'", "'clean'", "'gc'",
                  "'-d'", "'-D'", "'close'", "'edit'", "'create'", "'--delete'", "'delete'", "'mutation'", '"fetch"', '"mutation"', "'--exec'", "'--output'"):
            self.assertNotIn(w, code, w)
        self.assertEqual(code.count("'pr', 'list'"), 1)


if __name__ == '__main__':
    unittest.main()
