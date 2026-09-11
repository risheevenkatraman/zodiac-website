"""Read public match metadata through the authenticated FACEIT Data API."""
import json
import os
import sys

from sync_matches import Faceit, SyncError, identifier


def inspect_match(client, match_id):
    match = client.get('/matches/' + identifier(match_id))
    fields = ('match_id', 'game', 'competition_id', 'competition_type',
              'competition_name', 'organizer_id', 'region', 'status',
              'scheduled_at', 'started_at', 'finished_at')
    result = {field: match.get(field) for field in fields}
    teams = match.get('teams')
    if not isinstance(teams, dict):
        raise SyncError('Match response is missing teams')
    result['teams'] = {
        side: {field: team.get(field) for field in ('faction_id', 'name')}
        for side, team in teams.items() if isinstance(team, dict)
    }
    return result


if __name__ == '__main__':
    try:
        key = os.environ.get('FACEIT_API_KEY', '').strip()
        if not key:
            raise SyncError('Set the FACEIT_API_KEY repository secret.')
        match_id = os.environ.get('FACEIT_MATCH_ID', '').strip()
        print(json.dumps(inspect_match(Faceit(key), match_id), indent=2, ensure_ascii=False))
    except (SyncError, ValueError, KeyError, OSError) as error:
        print(f'Match inspection failed: {error}', file=sys.stderr)
        sys.exit(1)
