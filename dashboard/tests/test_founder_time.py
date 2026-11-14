"""Tests for the founder_time block (MIN-4559). Synthetic transcripts only. Run: python3 -m unittest discover -s dashboard/tests"""
import json, os, sys, tempfile, unittest
from datetime import timedelta

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
import snapshot as sn  # noqa: E402

SINCE = sn.parse('2026-11-14T10:00:00Z')
NOW = sn.parse('2026-11-14T20:00:00Z')
TZ = SINCE.tzinfo
CANARY = 'CANARY-MESSAGE-TEXT-DO-NOT-LEAK'


def human(t, branch='main', text=CANARY):
    return {'type': 'user', 'turnOrigin': 'human', 'timestamp': t, 'gitBranch': branch, 'message': {'role': 'user', 'content': text}}


def node(i, parent=None):
    return {'identifier': i, 'parent': {'identifier': parent} if parent else None}


class FounderTime(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = self.tmp.name

    def tearDown(self):
        self.tmp.cleanup()

    def chat(self, name, records, proj='-x-healthapp-a', sub=None):
        d = os.path.join(self.root, proj, *([sub] if sub else []))
        os.makedirs(d, exist_ok=True)
        open(os.path.join(d, name + '.jsonl'), 'w').write('\n'.join(json.dumps(r) for r in records) + '\n')

    def block(self, nodes=None, cfg=None, dirs=None):
        chats = sn.read_founder_chats(self.root, 'healthapp', SINCE, NOW)
        return sn.build_founder_time(chats, nodes, cfg or {}, dirs, NOW, SINCE, TZ)

    def test_only_the_founders_own_messages_count(self):
        recs = [human('2026-11-14T11:00:00Z'),
                {'type': 'user', 'turnOrigin': 'human', 'isMeta': True, 'timestamp': '2026-11-14T11:01:00Z'},
                {'type': 'user', 'turnOrigin': 'human', 'isSidechain': True, 'timestamp': '2026-11-14T11:02:00Z'},
                {'type': 'user', 'turnOrigin': 'sdk', 'timestamp': '2026-11-14T11:03:00Z'},
                {'type': 'user', 'timestamp': '2026-11-14T11:04:00Z', 'message': {'content': [{'type': 'tool_result'}]}},
                {'type': 'assistant', 'timestamp': '2026-11-14T11:05:00Z'},
                human('2026-11-14T09:00:00Z')]                                    # before the window
        self.chat('s1', recs)
        self.chat('agent-1', [human('2026-11-14T12:00:00Z')], sub='s1/subagents')   # a sub-agent transcript is not the founder
        b = self.block()
        self.assertEqual(b['messages'], 1)
        self.assertEqual(b['total_minutes'], 2.0)                                    # the last message counts FT_LAST_MIN

    def test_minutes_cap_the_gap_and_run_across_chats_without_double_counting(self):
        self.chat('a', [{'type': 'custom-title', 'customTitle': 'chat a'}, human('2026-11-14T11:00:00Z'), human('2026-11-14T11:04:00Z')])
        self.chat('b', [{'type': 'custom-title', 'customTitle': 'chat b'}, human('2026-11-14T11:02:00Z'), human('2026-11-14T13:00:00Z')])
        b = self.block()
        # 11:00->11:02 =2 (a), 11:02->11:04 =2 (b), 11:04->13:00 capped 10 (a), 13:00 last =2 (b)
        self.assertEqual(b['total_minutes'], 16.0)
        by = {r['chat']: r['minutes'] for r in b['per_chat']}
        self.assertEqual(sorted(by.values()), [4.0, 12.0])
        self.assertEqual(b['per_day'], [{'date': '2026-11-14', 'minutes': 16.0}])

    def test_days_follow_the_deadline_timezone(self):
        self.chat('a', [human('2026-11-14T21:30:00Z')])                              # 23:30 +02:00, still the 14th
        self.chat('b', [human('2026-11-14T22:30:00Z')])                              # 00:30 +02:00, the 15th
        now = sn.parse('2026-11-15T02:00:00Z')
        chats = sn.read_founder_chats(self.root, 'healthapp', SINCE, now)
        b = sn.build_founder_time(chats, None, {}, None, now, SINCE, sn.parse('2026-11-14T12:00:00+02:00').tzinfo)
        self.assertEqual([d['date'] for d in b['per_day']], ['2026-11-14', '2026-11-15'])

    def test_tag_by_title_and_branch_and_parent_inheritance_and_buckets_partition(self):
        nodes = [node('MIN-1', None), node('MIN-2', 'MIN-1'), node('MIN-3', 'MIN-2'), node('MIN-9')]
        cfg = {'directionRoots': {'MIN-1': [1, 2]}}
        self.chat('t', [{'type': 'custom-title', 'customTitle': 'work on MIN-3'}, human('2026-11-14T11:00:00Z')])       # deep child of a root
        self.chat('g', [human('2026-11-14T11:02:00Z', branch='fix/min-9-something')])                                    # under no root
        self.chat('u', [human('2026-11-14T11:04:00Z', branch='main')])                                                   # no issue at all
        b = self.block(nodes, cfg)
        d = {x['key']: x['minutes'] for x in b['per_direction']}
        self.assertEqual((d['1'], d['2']), (1.0, 1.0))                                                                   # 2 min split over two directions
        self.assertEqual((d['none'], d['untagged']), (2.0, 2.0))
        self.assertEqual(sum(d.values()), b['total_minutes'])
        self.assertEqual(b['toward_goal_minutes'], 2.0)
        self.assertEqual(b['share_toward_goal'], 0.333)
        self.assertEqual(b['biggest_drain']['off_goal_minutes'], 2.0)

    def test_a_chat_on_several_issues_splits_its_minutes_by_issue(self):
        nodes = [node('MIN-1'), node('MIN-2')]
        self.chat('t', [{'type': 'custom-title', 'customTitle': 'MIN-1 and MIN-2'}, human('2026-11-14T11:00:00Z')])
        b = self.block(nodes, {'directionRoots': {'MIN-1': [3]}})
        d = {x['key']: x['minutes'] for x in b['per_direction']}
        self.assertEqual((d['3'], d['none']), (1.0, 1.0))

    def test_no_message_text_reaches_the_block(self):
        self.chat('t', [{'type': 'custom-title', 'customTitle': 'MIN-5'}, human('2026-11-14T11:00:00Z')])
        self.assertNotIn(CANARY, json.dumps(self.block([node('MIN-5')])))

    def test_empty_window_has_no_share_and_no_drain(self):
        b = self.block()
        self.assertEqual((b['total_minutes'], b['share_toward_goal'], b['biggest_drain']), (0, None, None))

    def test_build_wires_the_block_and_a_failure_keeps_the_rest(self):
        state = {}
        sn.run_block(state, 'founder_time', lambda: (_ for _ in ()).throw(sn.BlockError('boom')), NOW)
        self.assertEqual(state['founder_time']['error']['message'], 'boom')
        self.assertIn('founder_time', sn.BLOCKS)

    def test_the_fixture_has_the_same_keys_as_the_generated_block(self):
        self.chat('t', [{'type': 'custom-title', 'customTitle': 'MIN-5'}, human('2026-11-14T11:00:00Z')])
        gen = self.block([node('MIN-5')], {'directionRoots': {'MIN-5': [1]}})
        fx = json.load(open(os.path.join(os.path.dirname(HERE), 'fixtures', 'snapshot.example.json')))['founder_time']
        self.assertEqual(sorted(fx), sorted(gen))
        self.assertEqual(sorted(fx['per_chat'][0]), sorted(gen['per_chat'][0]))
        self.assertEqual(sorted(fx['biggest_drain']), ['chat', 'issues', 'off_goal_minutes'])
        self.assertEqual([x['key'] for x in fx['per_direction']], [x['key'] for x in gen['per_direction']])


if __name__ == '__main__':
    unittest.main()
