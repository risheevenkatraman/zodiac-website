"""Offline checks using the documented FACEIT response shape."""
import json
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import patch

from sync_matches import Faceit, SyncError, merge_events, season_matches, sync

SOURCE = {'provider': 'faceit', 'team': 'Zodiac', 'team_id': 'zodiac-id',
          'game': 'Overwatch', 'season': 10, 'timezone': 'UTC'}


def match(day=15, **changes):
    result = {'match_id': 'match-1', 'status': 'SCHEDULED',
              'game': 'ow2', 'competition_id': 'competition-1',
              'competition_type': 'championship',
              'competition_name': 'S10 NA Master Central - Regular Season',
              'scheduled_at': int(datetime(2026, 10, day, 1, tzinfo=timezone.utc).timestamp()),
              'teams': {'faction1': {'faction_id': 'zodiac-id', 'name': 'Zodiac'},
                        'faction2': {'faction_id': 'opponent-id', 'name': 'Opponent'}}}
    result.update(changes)
    return result


class FixtureClient:
    def __init__(self, matches):
        self.matches = matches

    def get(self, path):
        if path.startswith('/teams/'):
            return {'game': 'ow2'}
        return {'game_id': 'ow2', 'name': 'FACEIT League Season 10'}

    def items(self, path, **params):
        if path == '/search/championships':
            return [{'competition_id': 'competition-1', 'name': 'FACEIT League Season 10'},
                    {'competition_id': 'wrong-season', 'name': 'FACEIT League Season 100'}]
        if path != '/championships/competition-1/matches':
            raise AssertionError('Unexpected competition')
        return self.matches


class MatchSyncTests(unittest.TestCase):
    def test_reference_match_bypasses_unavailable_championship_details(self):
        fixture = match()
        client = FixtureClient([fixture])
        def get(path):
            if path == '/teams/zodiac-id':
                return {'game': 'ow2'}
            if path == '/matches/match-1':
                return fixture
            raise SyncError('HTTP 404')
        source = dict(SOURCE, reference_match_id='match-1', championship_ids=['competition-1'])
        with patch.object(client, 'get', side_effect=get):
            self.assertEqual(len(merge_events([], [source], client)), 1)

    def test_fixture_metadata_rejects_wrong_game_season_or_competition(self):
        for changes in ({'game': 'cs2'}, {'competition_name': 'S11 NA'},
                        {'competition_id': 'wrong-id'}):
            with self.assertRaises(SyncError):
                merge_events([], [SOURCE], FixtureClient([match(**changes)]))

    def test_reschedule_replaces_same_match_and_keeps_manual_events(self):
        manual = {'name': 'Community night', 'description': 'Games', 'date': '2026-10-01'}
        first = merge_events([manual], [SOURCE], FixtureClient([match()]))
        second = merge_events(first, [SOURCE], FixtureClient([match(18)]))
        self.assertEqual(len(second), 2)
        self.assertEqual(second[0], manual)
        self.assertEqual(second[1]['description'], 'Zodiac vs Opponent')
        self.assertEqual(second[1]['date'], '2026-10-18')
        self.assertEqual(second, merge_events(second, [SOURCE], FixtureClient([match(18)])))

    def test_cancelled_finished_and_undated_matches_are_removed(self):
        initial = merge_events([], [SOURCE], FixtureClient([match()]))
        for changes in ({'status': 'CANCELLED'}, {'status': 'FINISHED'}, {'scheduled_at': 0}):
            self.assertEqual(merge_events(initial, [SOURCE], FixtureClient([match(**changes)])), [])

    def test_timezone_rollover(self):
        source = dict(SOURCE, timezone='America/New_York')
        result = merge_events([], [source], FixtureClient([match()]))
        self.assertEqual(result[0]['date'], '2026-10-14')

    def test_timezone_observes_daylight_saving(self):
        source = dict(SOURCE, timezone='America/New_York')
        for month, expected in [(7, '2026-07-15'), (12, '2026-12-14')]:
            scheduled = int(datetime(2026, month, 15, 4, 30, tzinfo=timezone.utc).timestamp())
            result = merge_events([], [source], FixtureClient([match(scheduled_at=scheduled)]))
            self.assertEqual(result[0]['date'], expected)

    def test_other_teams_are_excluded_and_shared_matches_deduplicated(self):
        unrelated = match(match_id='unrelated', teams={
            'faction1': {'faction_id': 'other-1', 'name': 'Other'},
            'faction2': {'faction_id': 'other-2', 'name': 'Another'}})
        other = dict(SOURCE, team='Opponent', team_id='opponent-id')
        result = merge_events([], [SOURCE, other], FixtureClient([match(), unrelated]))
        self.assertEqual(len(result), 1)

    def test_no_matching_fixtures_is_an_error(self):
        with self.assertRaisesRegex(SyncError, 'No Season 10 fixtures'):
            merge_events([], [SOURCE], FixtureClient([]))

    def test_bad_response_or_opponent_fails(self):
        for changes in ({'teams': None}, {'status': None}, {'scheduled_at': 'tomorrow'}):
            with self.assertRaises(SyncError):
                merge_events([], [SOURCE], FixtureClient([match(**changes)]))
        fixture = match()
        del fixture['teams']['faction2']['name']
        with self.assertRaises(SyncError):
            merge_events([], [SOURCE], FixtureClient([fixture]))

    def test_season_number_has_boundaries(self):
        self.assertTrue(season_matches('OW League SEASON 10 EU', 10))
        self.assertFalse(season_matches('OW League Season 100', 10))
        self.assertTrue(season_matches('S10 NA Master Central - Regular Season', 10))
        self.assertFalse(season_matches('S100 NA Master Central', 10))
        self.assertFalse(season_matches('S11 NA Master Central', 10))

    def test_short_season_discovery(self):
        client = FixtureClient([match()])
        original_items = client.items
        def items(path, **params):
            if path == '/search/championships':
                if params['name'] == 'Season 10':
                    return []
                self.assertEqual(params['name'], 'S10')
                return [{'competition_id': 'competition-1',
                         'name': 'S10 NA Master Central - Regular Season'}]
            return original_items(path, **params)
        with patch.object(client, 'items', side_effect=items), patch.object(
                client, 'get', side_effect=lambda path: {'game': 'ow2'}
                if path.startswith('/teams/') else {
                    'game_id': 'ow2', 'name': 'S10 NA Master Central - Regular Season'}):
            self.assertEqual(len(merge_events([], [SOURCE], client)), 1)

    def test_verified_championship_and_team_alias(self):
        fixture = match(scheduled_at=1789606800)
        fixture['teams']['faction1']['name'] = 'Grimoire'
        fixture['teams']['faction2']['name'] = 'VTY Truth Nuke'
        client = FixtureClient([fixture])
        source = dict(SOURCE, championship_ids=['competition-1'], timezone='America/New_York')
        with patch.object(client, 'items', wraps=client.items) as items, patch.object(
                client, 'get', side_effect=lambda path: {'game': 'ow2'}
                if path.startswith('/teams/') else {
                    'game_id': 'ow2', 'name': 'S10 NA Master Central - Regular Season'}):
            result = merge_events([], [source], client)
            items.assert_called_once_with('/championships/competition-1/matches', type='all')
            self.assertEqual(result[0]['description'], 'Zodiac vs VTY Truth Nuke')

    def test_failure_does_not_write_partial_events(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'data').mkdir()
            events = root / 'data/events.json'
            events.write_text('[]\n', encoding='utf-8')
            (root / 'data/match_sources.json').write_text(json.dumps([SOURCE, SOURCE]), encoding='utf-8')
            with patch('sync_matches.source_matches', side_effect=[[match()], SyncError('offline')]):
                with self.assertRaises(SyncError):
                    sync(root, FixtureClient([]))
            self.assertEqual(events.read_text(encoding='utf-8'), '[]\n')

    def test_pagination_and_invalid_pages(self):
        client = Faceit('test-key')
        first = [{'match_id': str(i)} for i in range(100)]
        with patch.object(client, 'get', side_effect=[{'items': first}, {'items': [match()]}]) as get:
            self.assertEqual(len(list(client.items('/matches'))), 101)
            self.assertEqual(get.call_args.kwargs['offset'], 100)
        with patch.object(client, 'get', return_value={'items': first}):
            with self.assertRaisesRegex(SyncError, 'repeated'):
                list(client.items('/matches'))
        with patch.object(client, 'get', return_value={}):
            with self.assertRaises(SyncError):
                list(client.items('/matches'))


if __name__ == '__main__':
    unittest.main()
