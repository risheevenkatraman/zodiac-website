"""Check public layouts and homepage content using Playwright and Microsoft Edge."""
import functools
import json
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def copyfile(self, source, outputfile):
        try:
            super().copyfile(source, outputfile)
        except (ConnectionAbortedError, BrokenPipeError, ConnectionResetError):
            pass  # Navigation can cancel in-flight image responses.


server = ThreadingHTTPServer(
    ('127.0.0.1', 0), functools.partial(QuietHandler, directory=str(ROOT))
)
threading.Thread(target=server.serve_forever, daemon=True).start()
base = f'http://127.0.0.1:{server.server_port}'
pages = list(ROOT.glob('*.html')) + [
    path for folder in ('teams', 'players', 'staff')
    for path in (ROOT / folder).glob('*.html')
]
try:
    with sync_playwright() as p:
        browser = p.chromium.launch(channel='msedge', headless=True)
        page = browser.new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        for width in (320, 390, 1440):
            page.set_viewport_size({'width': width, 'height': 1000})
            for path in pages:
                page.goto(base + '/' + path.relative_to(ROOT).as_posix())
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), (path, width)
            for team in json.loads((ROOT / 'data/players.json').read_text(encoding='utf-8')):
                page.goto(base + '/' + team['page'])
                labels = page.locator('.star-label')
                assert labels.count() == len(team['players'])
                for player in team['players']:
                    label = page.locator(f'.star-label[data-player="{player["id"]}"]')
                    assert label.locator('span').inner_text() == player['name']
                    assert label.get_attribute('href') == f'../players/player-{player["id"]}.html'
                    label.focus()
                    assert 'is-active' in page.locator(f'.player-star[data-player="{player["id"]}"]').get_attribute('class')
                boxes = [labels.nth(i).bounding_box() for i in range(labels.count())]
                for i, a in enumerate(boxes):
                    for b in boxes[i + 1:]:
                        assert a['x'] + a['width'] <= b['x'] or b['x'] + b['width'] <= a['x'] or a['y'] + a['height'] <= b['y'] or b['y'] + b['height'] <= a['y'], (team['name'], width, 'Overlapping player labels')
                page.evaluate('document.activeElement.blur()')
                page.locator('.team-constellation').screenshot(path=str(ROOT / f'.test-output/constellation-{team["name"].lower()}-{width}.png'))
            page.goto(base + '/index.html')
            page.wait_for_function("document.querySelector('.hero h1').textContent === 'Written in the Stars'")
            assert page.get_by_role('heading', level=1).count() == 1
            assert page.locator('.home-team-grid .team-card').count() == 5
            assert page.locator('.hero-intro').inner_text().startswith('A shared passion.')
            assert '?' not in page.locator('.home-hero').inner_text()
            page.get_by_role('link', name='Meet the teams').click()
            assert page.url.endswith('/teams.html')
            page.goto(base + '/index.html')
            page.screenshot(path=str(ROOT / f'.test-output/home-{width}.png'), full_page=True)
        page.emulate_media(reduced_motion='reduce')
        assert page.locator('.button').first.evaluate("el => getComputedStyle(el).transitionDuration") == '0s'
        page.route('**/data/site.json', lambda route: route.abort())
        page.reload()
        assert page.get_by_role('heading', name='Written in the Stars').is_visible()
        assert not errors, errors
        static_page = browser.new_page(java_script_enabled=False)
        static_page.goto(base + '/teams/overwatch-team2.html')
        static_page.locator('.star-label').first.click()
        assert '/players/player-' in static_page.url
        page.goto(base + '/teams/valorant-team1.html')
        assert page.locator('.star-label').count() == 0
        assert page.locator('.constellation-empty').is_visible()
        browser.close()
        print(f'Design checks passed: {len(pages)} pages at 320, 390, and 1440px; homepage content, links, fallback, and reduced motion.')
finally:
    server.shutdown()
    server.server_close()
