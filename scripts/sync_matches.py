"""Merge FACEIT fixtures into events for deployment. Requires FACEIT_API_KEY."""
import json
import os
import re
import sys
import time
from datetime import datetime
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
API = 'https://open.faceit.com/data/v4'


class SyncError(Exception):
    pass


class Faceit:
    def __init__(self, key):
        self.key = key
        self.cache = {}

    def get(self, path, **params):
        url = API + path + ('?' + urlencode(params) if params else '')
        if url in self.cache:
            return self.cache[url]
        request = Request(url, headers={
            'Authorization': 'Bearer ' + self.key,
            'Accept': 'application/json',
            'User-Agent': 'Zodiac-Match-Schedule/1.0',
        })
        for attempt in range(3):
            try:
                with urlopen(request, timeout=30) as response:
                    data = json.load(response)
                if not isinstance(data, dict):
                    raise SyncError(f'Invalid FACEIT response for {path}')
                self.cache[url] = data
                return data
            except HTTPError as error:
                if error.code in (429, 500, 502, 503, 504) and attempt < 2:
                    time.sleep(2 ** (attempt + 1))
                    continue
                hint = (' Check the FACEIT_API_KEY server-side secret.'
                        if error.code in (401, 403) else '')
                raise SyncError(f'FACEIT returned HTTP {error.code} for {path}.{hint}') from None
            except (URLError, TimeoutError):
                if attempt < 2:
                    time.sleep(2 ** (attempt + 1))
                    continue
                raise SyncError(f'Unable to reach FACEIT for {path}') from None
            except (ValueError, UnicodeError):
                raise SyncError(f'FACEIT returned invalid JSON for {path}') from None

    def items(self, path, **params):
        # Refuse partial results if an endpoint repeats pages or exceeds the cap.
        seen = set()
        for offset in range(0, 100000, 100):
            data = self.get(path, offset=offset, limit=100, **params)
            items = data.get('items')
            if not isinstance(items, list) or any(not isinstance(x, dict) for x in items):
                raise SyncError(f'Missing or invalid items in {path}')
            fingerprint = json.dumps(items, sort_keys=True)
            if items and fingerprint in seen:
                raise SyncError(f'FACEIT repeated a page for {path}')
            seen.add(fingerprint)
            yield from items
            if len(items) < 100:
                return
        raise SyncError(f'Pagination limit exceeded for {path}')


def identifier(value):
    if not isinstance(value, str) or not re.fullmatch(r'[a-zA-Z0-9-]+', value):
        raise SyncError('Missing or invalid FACEIT identifier')
    return quote(value, safe='')


def season_matches(name, season):
    return isinstance(name, str) and bool(re.search(rf'\b(?:season\s*|s){season}\b', name, re.I))


def team_factions(match):
    teams = match.get('teams')
    if not isinstance(teams, dict) or any(not isinstance(x, dict) for x in teams.values()):
        raise SyncError('FACEIT match is missing its teams')
    return list(teams.values())


def includes_team(match, team_id):
    return any(x.get('faction_id') == team_id for x in team_factions(match))


def source_matches(client, source):
    team_id = identifier(source['team_id'])
    team = client.get('/teams/' + team_id)
    game = team.get('game')
    if not isinstance(game, str) or not game:
        raise SyncError('FACEIT team response is missing the game ID')
    season = source['season']
    competitions = source.get('championship_ids')
    if not competitions:
        competitions = []
        for query in (f'Season {season}', f'S{season}'):
            candidates = client.items('/search/championships',
                                      name=query, game=game, type='all')
            competitions.extend(c['competition_id'] for c in candidates
                                if season_matches(c.get('name', ''), season))
    found = {}
    for competition in sorted(set(competitions)):
        path = '/championships/' + identifier(competition)
        details = client.get(path)
        if details.get('game_id') != game or not season_matches(details.get('name', ''), season):
            raise SyncError(f'Competition {competition} does not match the team game and Season {season}')
        for match in client.items(path + '/matches', type='all'):
            if includes_team(match, team_id):
                match_id = identifier(match.get('match_id'))
                found[match_id] = match
    if not found:
        raise SyncError(
            f'No Season {season} fixtures found for {source["team"]} in the FACEIT Data API. '
            'The team leagues page may use a separate league system. Supply verified '
            'championship_ids in data/match_sources.json if available; otherwise '
            'the league needs another supported data source. Existing live events were not changed.')
    return list(found.values())


def event_for(match, source):
    status = match.get('status')
    if not isinstance(status, str) or not status:
        raise SyncError('FACEIT match is missing its status')
    if status.upper() in {'CANCELLED', 'CANCELED', 'ABORTED', 'FINISHED'}:
        return None
    scheduled = match.get('scheduled_at')
    if scheduled is None or scheduled == 0:
        # FACEIT has not assigned a date; never invent one from creation time.
        return None
    if isinstance(scheduled, bool) or not isinstance(scheduled, (int, float)) or scheduled < 0:
        raise SyncError('Invalid scheduled_at in FACEIT match')
    opponents = [x for x in team_factions(match) if x.get('faction_id') != source['team_id']]
    if len(opponents) != 1 or not opponents[0].get('name'):
        raise SyncError('Scheduled FACEIT match is missing its opponent')
    date = datetime.fromtimestamp(scheduled, ZoneInfo(source['timezone'])).date().isoformat()
    return {
        'name': f'{source["game"]} — FACEIT Season {source["season"]}',
        'description': f'{source["team"]} vs {opponents[0]["name"]}',
        'date': date,
        'source': 'faceit',
        'match_id': identifier(match.get('match_id')),
    }


def merge_events(existing, sources, client):
    if not isinstance(existing, list) or any(not isinstance(x, dict) for x in existing):
        raise SyncError('events.json must contain a list of events')
    if not isinstance(sources, list) or not sources:
        raise SyncError('At least one match source is required')
    generated = {}
    for source in sources:
        if source.get('provider') != 'faceit':
            raise SyncError('Unsupported match source provider')
        if type(source.get('season')) is not int or source['season'] < 1:
            raise SyncError('Match sources require a positive season number')
        for match in source_matches(client, source):
            event = event_for(match, source)
            if event:
                # A match between two configured teams appears only once.
                generated.setdefault(event['match_id'], event)
    manual = [x for x in existing if x.get('source') != 'faceit']
    return sorted(manual + list(generated.values()),
                  key=lambda x: (x['date'], x['name'], x.get('match_id', '')))


def sync(root, client):
    path = root / 'data/events.json'
    existing = json.loads(path.read_text(encoding='utf-8'))
    sources = json.loads((root / 'data/match_sources.json').read_text(encoding='utf-8'))
    events = merge_events(existing, sources, client)
    # All sources must succeed before replacing the deployment's event data.
    output = json.dumps(events, ensure_ascii=False, indent=2) + '\n'
    temporary = path.with_suffix('.json.tmp')
    temporary.write_text(output, encoding='utf-8')
    temporary.replace(path)
    print(f'Synced {sum(x.get("source") == "faceit" for x in events)} scheduled FACEIT matches.')


if __name__ == '__main__':
    try:
        key = os.environ.get('FACEIT_API_KEY', '').strip()
        if not key:
            raise SyncError('Set the FACEIT_API_KEY GitHub Actions repository secret before syncing.')
        sync(ROOT, Faceit(key))
    except (SyncError, ValueError, KeyError, OSError) as error:
        print(f'Match sync failed: {error}', file=sys.stderr)
        sys.exit(1)
