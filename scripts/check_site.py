"""Check local links, assets, profile coverage, and reproducible generation."""
import json
import posixpath
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

from build_players import build

ROOT = Path(__file__).resolve().parents[1]


class Page(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.ids, self.links = set(), []
        self.h1s = 0
        self.feed(source)

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if 'id' in attrs:
            assert attrs['id'] not in self.ids, f'Duplicate ID: {attrs["id"]}'
            self.ids.add(attrs['id'])
        self.h1s += tag == 'h1'
        for attribute in ('href', 'src'):
            if attribute in attrs:
                self.links.append(attrs[attribute])


pages = {path.relative_to(ROOT).as_posix(): Page(path.read_text(encoding='utf-8')) for path in ROOT.rglob('*.html')}
for name, page in pages.items():
    assert page.h1s == 1, f'{name}: expected one main heading'
    for link in page.links:
        url = urlsplit(link)
        if url.scheme or url.netloc:
            continue
        target = posixpath.normpath(posixpath.join(posixpath.dirname(name), unquote(url.path))) if url.path else name
        assert (ROOT / target).is_file(), f'{name}: missing {target}'
        if url.fragment and target in pages:
            assert url.fragment in pages[target].ids, f'{name}: missing anchor {link}'

teams = json.loads((ROOT / 'data/players.json').read_text(encoding='utf-8'))
ids = set()
for team in teams:
    for player in team['players']:
        assert player['id'] not in ids, 'Player IDs must be unique'
        ids.add(player['id'])
        target = f'players/player-{player["id"]}.html'
        assert '../' + target in pages[team['page']].links, f'Unlinked player: {target}'
        assert '../' + team['page'] in pages[target].links, f'Missing team return link: {target}'
        assert {'intro-heading', 'pool-heading', 'social-heading'} <= pages[target].ids

before = {path: path.read_bytes() for path in ROOT.rglob('*.html')}
build()
assert all(path.read_bytes() == content for path, content in before.items()), 'Generated pages were out of date'
print(f'Checked {len(pages)} pages, all local links/assets, and {len(ids)} player profiles. Generation is reproducible.')
