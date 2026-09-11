import unittest
from unittest.mock import Mock

from inspect_faceit_match import inspect_match
from sync_matches import SyncError


class InspectionTests(unittest.TestCase):
    def test_details_404_does_not_prevent_listing_probe(self):
        client = Mock()
        client.get.side_effect = [
            {'match_id': 'match-1', 'competition_id': 'competition-1', 'teams': {}},
            SyncError('HTTP 404'),
            {'items': [{'match_id': 'match-1'}]},
        ]
        result = inspect_match(client, 'match-1')['competition_probes']
        self.assertFalse(result['/championships/competition-1']['accessible'])
        self.assertTrue(result['/championships/competition-1/matches']['accessible'])
        client.get.assert_called_with('/championships/competition-1/matches',
                                      type='all', offset=0, limit=1)

    def test_both_endpoints_unavailable_are_reported(self):
        client = Mock()
        client.get.side_effect = [
            {'match_id': 'match-1', 'competition_id': 'competition-1', 'teams': {}},
            SyncError('HTTP 404'), SyncError('HTTP 404'),
        ]
        result = inspect_match(client, 'match-1')['competition_probes']
        self.assertTrue(all(not probe['accessible'] for probe in result.values()))


if __name__ == '__main__':
    unittest.main()
