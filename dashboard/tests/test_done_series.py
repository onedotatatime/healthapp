"""doneSeries (MIN-4765, CTO call on MIN-4764): cumulative done counts per 15-minute bucket, for the dev-timeline replay page.
Run: python3 -m unittest discover -s dashboard/tests. Fixtures are synthetic: no real issue ids, titles or counts."""
import copy
import json
import os
import re
import sys
import unittest
from datetime import timedelta
from unittest import mock

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
import snapshot as sn  # noqa: E402

HAND = json.load(open(os.path.join(os.path.dirname(HERE), 'hand-set.sample.json')))
SINCE = sn.parse(HAND['buildStart'])
NOW = SINCE + timedelta(hours=3, minutes=7)               # a partial last bucket: 13 buckets
FREEZE = sn.parse(HAND['freeze'])
TYPES = {'done': 'completed', 'prog': 'started', 'open': 'unstarted', 'canceled': 'canceled', 'dup': 'duplicate', 'backlog': 'backlog'}
SECRET_TITLE = 'secret title '
MILESTONES = HAND['milestones']
ROLES = HAND['config']['roleLabels']


def at(minutes):
    return sn.iso(SINCE + timedelta(minutes=minutes))


def node(ident, st, parent=None, ms=None, done_min=None, started_min=None, **over):
    n = {'identifier': ident, 'title': SECRET_TITLE + ident, 'state': {'name': 'In Review' if st == 'rev' else st.title(), 'type': TYPES.get(st, 'started')},
         'parent': {'identifier': parent} if parent else None, 'inverseRelations': {'nodes': []}, 'description': '', 'priority': 3,
         'labels': {'nodes': []}, 'assignee': {'name': 'Cron Jobbidis'}, 'projectMilestone': {'name': ms + ' · Name'} if ms else None,
         'startedAt': at(started_min) if started_min is not None else None, 'completedAt': at(done_min) if done_min is not None else None,
         'children': {'nodes': []}}
    n.update(over)
    return n


def cfg(**kw):
    return dict(HAND['config'], **kw)


def two_dirs():
    return {'directionRoots': [{'n': 1, 'title': 'A', 'roots': ['R1']}, {'n': 2, 'title': 'B', 'roots': ['R1', 'R2']}]}


# R1 (umbrella) -> A(done M1), B(done M2), C(open); R2 (umbrella) -> D(done M2), E(canceled), F(dup), G(backlog); X is under neither root.
NODES = [
    node('R1', 'prog', ms='M1'), node('A', 'done', 'R1', 'M1', done_min=20), node('B', 'done', 'R1', 'M2', done_min=50), node('C', 'open', 'R1', 'M2'),
    node('R2', 'prog'), node('D', 'done', 'R2', 'M2', done_min=50), node('E', 'canceled', 'R2', 'M2', done_min=70), node('F', 'dup', 'R2'), node('G', 'backlog', 'R2'),
    node('X', 'done', None, 'M3', done_min=100),
]


def live_counts(nodes, c):
    """What the dashboard shows right now, read the way the live blocks compute it."""
    lin = sn.summarize_linear(nodes, c, MILESTONES, NOW, SINCE, {})
    dirs = {}
    for d in sn.build_directions(nodes, c, NOW, FREEZE):
        dirs[str(d['n'])] = int(re.match(r'(\d+) of \d+ done', d['note']).group(1)) if d['note'] != 'no issues mapped' else 0
    return lin['tasks']['done'], {m['id']: m['done'] for m in lin['milestones']}, dirs


class Series(unittest.TestCase):
    def setUp(self):
        self.cfg = cfg(**two_dirs())
        self.ds = sn.build_done_series(NODES, self.cfg, MILESTONES, NOW, SINCE)

    def test_last_value_of_every_series_equals_the_live_count(self):
        total, ms, dirs = live_counts(NODES, self.cfg)
        self.assertEqual(self.ds['total'][-1], total)
        self.assertEqual({k: v[-1] for k, v in self.ds['byMilestone'].items()}, ms)
        self.assertEqual({k: v[-1] for k, v in self.ds['byDirection'].items()}, dirs)
        # and not vacuously: the fixture has real counts, and the directions differ from each other
        self.assertEqual((total, ms['M1'], ms['M2'], ms['M3'], dirs), (4, 1, 2, 1, {'1': 2, '2': 3}))

    def test_default_directions_and_a_real_shaped_config_agree_too(self):
        c = cfg()                                                     # the committed five-direction map, no override
        nodes = [node('MIN-4474', 'prog'), node('L1', 'done', 'MIN-4474', 'M1', done_min=5), node('MIN-4547', 'prog'), node('L2', 'done', 'MIN-4547', 'M4', done_min=9)]
        ds = sn.build_done_series(nodes, c, MILESTONES, NOW, SINCE)
        total, ms, dirs = live_counts(nodes, c)
        self.assertEqual(sorted(ds['byDirection']), ['1', '2', '3', '4', '5'])
        self.assertEqual({k: v[-1] for k, v in ds['byDirection'].items()}, dirs)
        self.assertEqual({k: v[-1] for k, v in ds['byMilestone'].items()}, ms)
        self.assertEqual(ds['total'][-1], total)
        self.assertEqual(dirs, {'1': 1, '2': 1, '3': 0, '4': 1, '5': 0})

    def test_shape_buckets_and_monotonic(self):
        ds = self.ds
        self.assertEqual(set(ds), {'seriesFrom', 'stepMin', 'total', 'byMilestone', 'byDirection'})
        self.assertEqual((ds['seriesFrom'], ds['stepMin']), (sn.iso(SINCE), 15))
        n = len(sn.bucketize([], SINCE, NOW, sn.SERIES_STEP_MIN))      # the same buckets as tokens.series
        self.assertEqual(n, 13)
        every = [ds['total']] + list(ds['byMilestone'].values()) + list(ds['byDirection'].values())
        self.assertEqual([len(s) for s in every], [n] * len(every))
        for s in every:
            self.assertEqual(s, sorted(s))
        self.assertEqual(list(ds['byMilestone']), [m['id'] for m in MILESTONES])
        self.assertEqual(list(ds['byDirection']), ['1', '2'])

    def test_each_issue_lands_in_the_bucket_of_its_completion(self):
        # completed at +20 -> bucket 2 (edge +30); +50 twice -> bucket 4 (edge +60); +100 -> bucket 7 (edge +105); canceled E never counts
        self.assertEqual(self.ds['total'], [0, 1, 1, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4])
        self.assertEqual(self.ds['byMilestone']['M2'], [0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2])
        self.assertEqual(self.ds['byDirection']['1'], [0, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2])
        self.assertEqual(self.ds['byDirection']['2'], [0, 1, 1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3])

    def test_whole_numbers_only_and_no_ids_titles_or_other_keys(self):
        def walk(v):
            if isinstance(v, dict):
                for k, x in v.items():
                    self.assertIsInstance(k, str)
                    yield from walk(x)
            elif isinstance(v, list):
                for x in v:
                    yield from walk(x)
            else:
                yield v
        leaves = list(walk({k: v for k, v in self.ds.items() if k not in ('seriesFrom', 'stepMin')}))
        self.assertTrue(leaves and all(type(x) is int for x in leaves))        # int, never float or bool
        text = json.dumps(self.ds)
        self.assertNotIn(SECRET_TITLE, text)
        for ident in [n['identifier'] for n in NODES]:
            self.assertIsNone(re.search(r'"%s"' % ident, text), ident)
        self.assertFalse(sn.SECRET_RE.search(text))
        self.assertLess(len(text), 6 * 1024)

    def test_size_with_the_real_window_stays_small(self):
        now = SINCE + timedelta(hours=51)                              # the whole build window, 204 steps plus the edge bucket
        ds = sn.build_done_series(NODES, cfg(), MILESTONES, now, SINCE)
        self.assertEqual(len(ds['total']), len(sn.bucketize([], SINCE, now, sn.SERIES_STEP_MIN)))
        self.assertEqual(len(ds['total']), 205)
        self.assertLess(len(json.dumps(ds, separators=(',', ':'))), 12 * 1024)     # far under the 256 KB ingest limit


class Edges(unittest.TestCase):
    def series(self, nodes):
        return sn.build_done_series(nodes, cfg(**two_dirs()), MILESTONES, NOW, SINCE)

    def test_no_nodes_gives_zeros_of_the_right_length(self):
        ds = self.series([])
        self.assertEqual(ds['total'], [0] * 13)
        self.assertTrue(all(s == [0] * 13 for s in ds['byMilestone'].values()))

    def test_completed_before_the_window_counts_from_bucket_one(self):
        ds = self.series([node('A', 'done', done_min=-600)])
        self.assertEqual(ds['total'][0], 1)

    def test_completed_in_the_future_counts_at_the_end_and_never_gets_lost(self):
        ds = self.series([node('A', 'done', done_min=99999)])
        self.assertEqual(ds['total'], [0] * 12 + [1])

    def test_a_done_issue_without_completedAt_still_counts_so_the_last_value_matches(self):
        ds = self.series([node('A', 'done', started_min=31), node('B', 'done')])
        self.assertEqual((ds['total'][0], ds['total'][2], ds['total'][-1]), (1, 2, 2))   # B (no stamp at all) from the start, A at its start

    def test_only_completed_issues_count(self):
        ds = self.series([node('A', 'prog', started_min=5), node('B', 'rev', started_min=5), node('C', 'canceled', done_min=5), node('D', 'dup', done_min=5), node('E', 'backlog')])
        self.assertEqual(ds['total'], [0] * 13)

    def test_an_umbrella_parent_is_not_counted_in_a_direction(self):
        nodes = [node('R1', 'done', done_min=10), node('A', 'done', 'R1', done_min=20)]      # R1 done with a done child: one leaf, not two
        ds = self.series(nodes)
        self.assertEqual(ds['byDirection']['1'][-1], 1)
        self.assertEqual(ds['total'][-1], 2)                                                  # tasks.done counts every completed issue, umbrella included


class InBuild(unittest.TestCase):
    """The snapshot carries the block, keeps the last good one when a pass cannot compute it, and stays valid for the ingest."""
    def build(self, nodes, state=None, hand=None):
        hand = hand or copy.deepcopy(HAND)
        hand['config'] = dict(hand['config'], **two_dirs())
        home = os.path.expanduser('~')
        with mock.patch.object(sn, 'fetch_linear', lambda *a, **k: nodes):
            return sn.build(NOW, hand, {'models': {}, 'source': 's'}, {} if state is None else state, home + '/nonexistent', home + '/nonexistent/bin/usage',
                            lambda: 'k', runner=lambda argv, cwd, timeout: (1, '', 'x'), gh_bin='x')

    def test_snapshot_has_the_block_and_the_last_values_match_its_own_live_counts(self):
        snap = self.build(NODES)
        self.assertIsNone(snap['blocks']['linear']['error'])
        ds = snap['doneSeries']
        self.assertEqual(ds['total'][-1], snap['tasks']['done'])
        self.assertEqual({k: v[-1] for k, v in ds['byMilestone'].items()}, {m['id']: m['done'] for m in snap['milestones']})
        self.assertEqual(ds['byDirection']['1'][-1], 2)
        self.assertLess(len(json.dumps(snap)), 256 * 1024)

    def test_a_failure_keeps_the_last_good_block_and_warns(self):
        state = {}
        good = self.build(NODES, state)
        self.assertIn('doneSeries', good)
        with mock.patch.object(sn, 'build_done_series', side_effect=ValueError('boom')):
            again = self.build(NODES, state)
        self.assertEqual(again['doneSeries'], good['doneSeries'])
        self.assertIn('doneSeries not computed: boom', again['blocks']['linear']['error']['message'])
        self.assertIn('tasks', again)                                                          # the rest of the linear block is not blanked


if __name__ == '__main__':
    unittest.main()
