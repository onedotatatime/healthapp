"""Tests for the `forecast` block of dashboard/snapshot.py (MIN-4565). Run: python3 -m unittest discover -s dashboard/tests
The maths is checked against numbers worked out by hand in each test, never against the function's own output."""
import copy, json, os, sys, unittest
from datetime import timedelta

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
import snapshot as sn  # noqa: E402

HAND = json.load(open(os.path.join(os.path.dirname(HERE), 'hand-set.sample.json')))
SINCE = sn.parse('2026-11-14T12:00:00+02:00')      # Sat 12:00 Athens = 10:00Z
FREEZE = sn.parse('2026-11-15T13:00:00+02:00')     # Sun 13:00
SUBMIT = sn.parse('2026-11-15T17:00:00+02:00')     # Sun 17:00
CFG = {}


def at(hours_after_start):
    return SINCE + timedelta(hours=hours_after_start)


def est(n):
    return 'Estimate · x\nagent: y\nest. time:   %s min\nest. tokens: 1' % n


def node(ident, state='Todo', minutes=60, ms='M3 · Diary', prio=3, desc=None, parent=None, kids=(), blocks=(), done_at=None, title=None):
    stype = {'Done': 'completed', 'Todo': 'unstarted', 'In Progress': 'started', 'In Review': 'started',
             'Backlog': 'backlog', 'Canceled': 'canceled', 'Duplicate': 'duplicate'}[state]
    return {'identifier': ident, 'title': title or 't ' + ident, 'priority': prio,
            'description': desc if desc is not None else (est(minutes) if minutes is not None else 'no block here'),
            'parent': parent, 'children': {'nodes': [{'identifier': k} for k in kids]},
            'state': {'name': state, 'type': stype}, 'assignee': {'name': 'Cron Jobbidis'}, 'labels': {'nodes': []},
            'projectMilestone': {'name': ms} if ms else None,
            'startedAt': None, 'completedAt': done_at,
            'inverseRelations': {'nodes': [{'type': 'blocks', 'issue': {'identifier': b, 'state': {'type': bt}, 'assignee': {'name': who}}}
                                           for b, bt, who in blocks]}}


def fc(nodes, now, cfg=CFG):
    return sn.build_forecast(nodes, cfg, now, SINCE, FREEZE, SUBMIT)


def done3(minutes=60, when=None):
    """Three done issues, so the pace is trusted: 3 x `minutes`."""
    return [node('D-%d' % i, 'Done', minutes, done_at=sn.iso(when or at(1))) for i in range(3)]


class Parser(unittest.TestCase):
    def test_normal_block(self):
        self.assertEqual(sn.parse_estimate(est(35)), 35)

    def test_no_block(self):
        self.assertIsNone(sn.parse_estimate('Just prose. est. tokens: 12000'))
        self.assertIsNone(sn.parse_estimate(None))
        self.assertIsNone(sn.parse_estimate('est. time: 2 h'))          # no minutes unit: not guessed, counts at the median

    def test_tilde_and_range_take_the_first_number(self):
        self.assertEqual(sn.parse_estimate('est. time: ~35 min'), 35)
        self.assertEqual(sn.parse_estimate('est. time: 30-45 min'), 30)
        self.assertEqual(sn.parse_estimate('est. time: 20 to 40 min'), 20)
        self.assertEqual(sn.parse_estimate('**est. time:** 12 min'), 12)

    def test_parent_with_sub_issues_counts_zero_and_its_children_count(self):
        nodes = [node('P-1', 'Todo', 500, kids=['C-1', 'C-2']), node('C-1', 'Todo', 20, parent={'identifier': 'P-1', 'parent': None}),
                 node('C-2', 'In Progress', 40, parent={'identifier': 'P-1', 'parent': None})]
        r = fc(nodes, at(2))['remaining']
        self.assertEqual((r['issues'], r['minutes']), (2, 60))          # not 560


class Scope(unittest.TestCase):
    def test_what_is_in_and_out(self):
        nodes = [node('IN-1', 'Todo', 10), node('IN-2', 'In Progress', 20), node('IN-3', 'In Review', 999),
                 node('OUT-backlog', 'Backlog', 100), node('OUT-canceled', 'Canceled', 100), node('OUT-dup', 'Duplicate', 100),
                 node('OUT-m1', 'Todo', 100, ms='M1 · Setup'), node('OUT-nomilestone', 'Todo', 100, ms=None),
                 node('OUT-doneold', 'Done', 100, done_at=sn.iso(SINCE - timedelta(minutes=1)))]
        r = fc(nodes, at(2))
        self.assertEqual((r['remaining']['issues'], r['remaining']['minutes'], r['remaining']['in_review']), (2, 30, 1))
        self.assertEqual(r['done']['issues'], 0)

    def test_dashboard_subtree_is_out_by_following_the_parent_chain_not_the_label(self):
        root = {'identifier': 'MIN-4445', 'parent': None}
        nodes = [node('MIN-4445', 'In Progress', 0, kids=['MIN-4564']),
                 node('MIN-4564', 'In Progress', 12, parent=root, kids=['MIN-4565']),
                 node('MIN-4565', 'Todo', 35, parent={'identifier': 'MIN-4564', 'parent': root}),      # two levels below the root
                 node('MIN-9', 'Todo', 25)]
        nodes.append(node('MIN-4565-deep', 'Todo', 99, parent={'identifier': 'MIN-4565', 'parent': {'identifier': 'MIN-4564'}}))  # three levels: found through the nodes
        r = fc(nodes, at(2))['remaining']
        self.assertEqual((r['issues'], r['minutes']), (1, 25))

    def test_done_counts_only_since_build_start_and_in_scope_on_both_sides(self):
        nodes = [node('D-in', 'Done', 40, done_at=sn.iso(at(1))), node('D-old', 'Done', 40, done_at=sn.iso(SINCE - timedelta(hours=1))),
                 node('D-dash', 'Done', 40, parent={'identifier': 'MIN-4445', 'parent': None}, done_at=sn.iso(at(1)))]
        d = fc(nodes, at(2))['done']
        self.assertEqual((d['issues'], d['minutes']), (1, 40))          # dashboard work leaves pace too


class Defaults(unittest.TestCase):
    def test_median_of_all_estimated_issues_done_and_open(self):
        nodes = [node('D-1', 'Done', 10, done_at=sn.iso(at(1))), node('D-2', 'Done', 20, done_at=sn.iso(at(1))),
                 node('T-1', 'Todo', 30), node('T-2', 'Todo', 40), node('T-3', 'Todo', 100),
                 node('D-none', 'Done', None, done_at=sn.iso(at(1))), node('T-none', 'Todo', None)]
        r = fc(nodes, at(2))
        # estimated: 10, 20, 30, 40, 100 -> median 30. Both unestimated issues count at 30.
        self.assertEqual(r['remaining']['default_minutes'], 30)
        self.assertEqual(r['remaining']['default_source'], 'median')
        self.assertEqual(r['done']['minutes'], 10 + 20 + 30)
        self.assertEqual(r['done']['no_estimate'], ['D-none'])
        self.assertEqual(r['remaining']['no_estimate'], ['T-none'])
        self.assertEqual(r['remaining']['minutes'], 30 + 40 + 100 + 30)

    def test_fewer_than_five_estimated_uses_thirty_and_says_so(self):
        nodes = [node('T-%d' % i, 'Todo', 200) for i in range(4)] + [node('T-none', 'Todo', None)]
        r = fc(nodes, at(2))['remaining']
        self.assertEqual((r['default_minutes'], r['default_source']), (30, 'fallback'))     # the median would have been 200
        self.assertEqual(r['minutes'], 4 * 200 + 30)


class Verdict(unittest.TestCase):
    """3 done x 60 min = 180 min in 6 h: pace 30 min/h. `todo` minutes left finish at now + todo/30 h."""

    def setUp(self):
        self.now = at(6)                                                 # Sat 18:00
        self.done = done3(60, at(2))

    def go(self, todo_min):
        return fc(self.done + [node('T-1', 'Todo', todo_min)], self.now)

    def test_finish_is_now_plus_minutes_over_pace(self):
        r = self.go(300)                                                 # 10 h at 30 min/h
        self.assertEqual(r['pace_min_per_hour'], 30.0)
        self.assertEqual(r['finish_at'], '2026-11-15T04:00:00+02:00')
        self.assertEqual(r['finish_label'], 'Sun 04:00')

    def test_boundaries(self):
        # 18:00 Sat + 18 h = 12:00 Sun exactly: On track. One more minute: At risk.
        self.assertEqual(self.go(540)['verdict'], 'on')
        self.assertEqual(self.go(541)['verdict'], 'risk')
        # + 23 h = 17:00 Sun exactly: At risk. One more minute: Off track.
        self.assertEqual(self.go(690)['verdict'], 'risk')
        self.assertEqual(self.go(691)['verdict'], 'off')

    def test_early_pace_caps_on_track_at_risk_but_never_lifts_off(self):
        two = [node('D-%d' % i, 'Done', 90, done_at=sn.iso(at(2))) for i in range(2)]     # 2 done = early; pace 180/6 = 30
        r = fc(two + [node('T-1', 'Todo', 60)], self.now)
        self.assertTrue(r['early_pace'])
        self.assertEqual(r['verdict'], 'risk')                           # would be On track by finish alone (20:00 Sat)
        r = fc(two + [node('T-1', 'Todo', 900)], self.now)
        self.assertEqual(r['verdict'], 'off')
        self.assertFalse(self.go(60)['early_pace'])

    def test_pace_zero_with_work_left_is_off_and_has_no_finish(self):
        r = fc([node('T-1', 'Todo', 60), node('T-2', 'Todo', 10, prio=4)], self.now)
        self.assertEqual((r['pace_min_per_hour'], r['finish_at'], r['finish_label'], r['verdict']), (0.0, None, None, 'off'))
        self.assertEqual(r['cut'], [])                                   # no pace, no finish to cut towards
        json.dumps(r, allow_nan=False)                                   # no NaN, no infinity

    def test_nothing_remaining_finishes_now_and_nothing_to_cut(self):
        r = fc(self.done, self.now)
        self.assertEqual((r['remaining']['minutes'], r['finish_at'], r['verdict']), (0, sn.athens_iso(self.now), 'on'))
        self.assertEqual(r['cut'], [])
        r0 = fc([], self.now)                                            # an empty board: pace 0 and nothing left is not "off"
        self.assertEqual((r0['pace_min_per_hour'], r0['verdict']), (0.0, 'risk'))
        json.dumps(r0, allow_nan=False)

    def test_no_time_elapsed_is_pace_zero_not_a_division_by_zero(self):
        r = fc(done3(60, SINCE) + [node('T-1', 'Todo', 60)], SINCE)
        self.assertEqual((r['elapsed_hours'], r['pace_min_per_hour'], r['verdict']), (0.0, 0.0, 'off'))

    def test_tiny_pace_does_not_overflow(self):
        slow = [node('D-%d' % i, 'Done', 0.001, done_at=sn.iso(at(1))) for i in range(3)]
        r = fc(slow + [node('T-1', 'Todo', 10 ** 9)], at(2))
        self.assertEqual(r['verdict'], 'off')
        json.dumps(r, allow_nan=False)

    def test_in_review_counts_zero_minutes_but_is_counted(self):
        r = fc(self.done + [node('R-1', 'In Review', 500), node('T-1', 'Todo', 60)], self.now)
        self.assertEqual((r['remaining']['minutes'], r['remaining']['in_review'], r['remaining']['issues']), (60, 1, 1))


class Cut(unittest.TestCase):
    def setUp(self):
        self.now = at(6)
        self.done = done3(60, at(2))                                     # pace 30 min/h

    def test_priority_low_first_then_largest_estimate_and_stops_at_the_freeze(self):
        # 1500 min left at 30 min/h = 50 h -> Mon 20:00. The freeze (Sun 13:00) is 19 h = 570 min of work away.
        todo = [node('URG', 'Todo', 300, prio=1), node('HIGH', 'Todo', 300, prio=2), node('MED-s', 'Todo', 100, prio=3),
                node('MED-L', 'Todo', 200, prio=3), node('LOW', 'Todo', 300, prio=4), node('NONE', 'Todo', 300, prio=0)]
        r = fc(self.done + todo, self.now)
        self.assertEqual(r['verdict'], 'off')
        # none, low, medium (biggest first), high; urgent stays. Minutes left after each cut: 1200, 900, 700, 600, 300.
        self.assertEqual([c['id'] for c in r['cut']], ['NONE', 'LOW', 'MED-L', 'MED-s', 'HIGH'])
        self.assertEqual([c['finish_after'] for c in r['cut']],
                         ['2026-11-16T10:00:00+02:00', '2026-11-16T00:00:00+02:00', '2026-11-15T17:20:00+02:00',
                          '2026-11-15T14:00:00+02:00', '2026-11-15T04:00:00+02:00'])
        self.assertTrue(r['cut_reaches_freeze'])
        self.assertEqual(r['cut_source'], 'priority')
        self.assertEqual(r['cut'][-1]['finish_after_label'], 'Sun 04:00')

    def test_product_list_goes_first_then_the_fallback_order(self):
        todo = [node('A', 'Todo', 400, prio=4), node('B', 'Todo', 400, prio=1), node('C', 'Todo', 400, prio=3)]
        r = fc(self.done + todo, self.now, {'forecast': {'cutOrder': ['B', 'NOT-OPEN']}})
        self.assertEqual([c['id'] for c in r['cut']][:2], ['B', 'A'])
        self.assertEqual(r['cut_source'], 'list')

    def test_cut_is_empty_unless_off_and_says_when_it_cannot_reach_the_freeze(self):
        self.assertEqual(fc(self.done + [node('T', 'Todo', 60)], self.now)['cut'], [])
        r = fc(self.done + [node('T', 'Todo', 3000)], self.now)         # even with everything cut, the one issue is all there is
        self.assertEqual(r['verdict'], 'off')
        self.assertEqual([c['id'] for c in r['cut']], ['T'])
        self.assertEqual(r['cut'][0]['finish_after'], sn.athens_iso(self.now))
        self.assertTrue(r['cut_reaches_freeze'])                         # nothing left finishes now, before the freeze
        r = fc(self.done + [node('T', 'Todo', 3000), node('IR', 'In Review', 5)], self.now)
        self.assertEqual([c['id'] for c in r['cut']], ['T'])             # In Review has no minutes to cut


class Blocked(unittest.TestCase):
    def test_who_the_blocker_is_and_resolved_blockers_do_not_count(self):
        nodes = [node('B-1', 'Todo', 10, blocks=[('X-1', 'started', 'Ren Derakis'), ('X-2', 'completed', 'Pix Elidis')]),
                 node('B-2', 'Todo', 10, blocks=[('X-3', 'canceled', 'Pix Elidis')]),
                 node('B-3', 'In Review', 10, blocks=[('X-4', 'unstarted', None)]), node('B-4', 'Todo', 10)]
        nodes[2]['inverseRelations']['nodes'][0]['issue']['assignee'] = None
        r = fc(nodes, at(2))
        self.assertEqual(r['blocked'], [
            {'id': 'B-1', 'title': 't B-1', 'waits_on': [{'id': 'X-1', 'who': 'Ren Derakis'}]},
            {'id': 'B-3', 'title': 't B-3', 'waits_on': [{'id': 'X-4', 'who': 'unassigned'}]}])
        self.assertEqual(r['remaining']['minutes'], 30)                 # blocked issues stay in the sum (B-1, B-2, B-4)


class Time(unittest.TestCase):
    def test_athens_time_from_the_timezone_database_not_a_fixed_offset(self):
        self.assertEqual(sn.athens_iso(sn.parse('2026-11-15T10:12:00Z')), '2026-11-15T12:12:00+02:00')
        self.assertEqual(sn.athens_iso(sn.parse('2026-07-15T10:12:00Z')), '2026-07-15T13:12:00+03:00')   # summer time: a fixed +02:00 would fail here
        self.assertEqual(sn.athens_label(sn.parse('2026-11-15T07:12:00Z')), 'Sun 09:12')
        self.assertEqual(sn.athens_label(sn.parse('2026-11-14T22:30:00Z')), 'Sun 00:30')                   # past midnight Athens: the next day's name
        self.assertIsNone(sn.athens_label(None))

    def test_the_block_carries_the_constants_in_athens_time(self):
        r = fc([], at(1))
        self.assertEqual((r['tz'], r['freeze'], r['submit'], r['on_by'], r['build_start']),
                         ('Europe/Athens', '2026-11-15T13:00:00+02:00', '2026-11-15T17:00:00+02:00',
                          '2026-11-15T12:00:00+02:00', '2026-11-14T12:00:00+02:00'))


class Feed(unittest.TestCase):
    def test_block_reaches_the_snapshot_without_any_description_text(self):
        nodes = [node('T-1', 'Todo', 60, desc=est(60) + '\nSECRET-PROSE do not publish'), node('D-1', 'Done', 30, done_at=sn.iso(at(1)),
                                                                                         desc=est(30) + '\nMORE-PROSE')]
        real = sn.fetch_linear
        sn.fetch_linear = lambda *a, **k: nodes
        try:
            snap = sn.build(at(2), copy.deepcopy(HAND), {'models': {}}, {}, '/nonexistent-transcripts', '/nonexistent-bin', lambda: 'k')
        finally:
            sn.fetch_linear = real
        self.assertIsNone(snap['blocks']['linear']['error'])
        self.assertEqual(snap['forecast']['done']['minutes'], 30)
        self.assertEqual(snap['forecast']['remaining']['minutes'], 60)
        text = json.dumps(snap)
        self.assertNotIn('SECRET-PROSE', text)
        self.assertNotIn('MORE-PROSE', text)
        sn.assert_clean(text)

    def test_a_failing_forecast_does_not_blank_the_linear_block(self):
        real_f, real_b = sn.fetch_linear, sn.build_forecast
        sn.fetch_linear = lambda *a, **k: [node('T-1', 'Todo', 60)]
        def boom(*a, **k):
            raise ValueError('boom')
        sn.build_forecast = boom
        try:
            snap = sn.build(at(2), copy.deepcopy(HAND), {'models': {}}, {}, '/nonexistent-transcripts', '/nonexistent-bin', lambda: 'k')
        finally:
            sn.fetch_linear, sn.build_forecast = real_f, real_b
        self.assertIn('forecast not computed: boom', snap['blocks']['linear']['error']['message'])
        self.assertNotIn('forecast', snap)
        self.assertEqual(snap['tasks']['open'], 1)                       # the rest of the linear block is fresh

    def test_query_asks_for_what_the_forecast_reads_and_is_read_only(self):
        for field in ('description', 'priority', 'parent{identifier parent{identifier}}', 'children(first:1)', 'assignee{name}}}}', 'issues(first:20'):
            self.assertIn(field, sn.LINEAR_QUERY)
        self.assertNotIn('mutation', sn.LINEAR_QUERY)


if __name__ == '__main__':
    unittest.main()
