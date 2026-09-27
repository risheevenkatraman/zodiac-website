"""Check dedicated team formations against the exported site in Edge."""
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
        except (ConnectionAbortedError, ConnectionResetError, BrokenPipeError):
            pass  # Navigation can cancel image requests.


server = ThreadingHTTPServer(
    ('127.0.0.1', 0), functools.partial(QuietHandler, directory=str(ROOT / 'out'))
)
threading.Thread(target=server.serve_forever, daemon=True).start()
base = f'http://127.0.0.1:{server.server_port}'
teams = json.loads((ROOT / 'data/players.json').read_text(encoding='utf-8'))

try:
    with sync_playwright() as p:
        browser = p.chromium.launch(channel='msedge', headless=True)
        page = browser.new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        for width in (390, 1440):
            page.set_viewport_size({'width': width, 'height': 1000})
            for team in teams:
                page.goto(base + '/' + team['page'].replace('.html', '/'))
                if not page.locator('.team-constellation').count():
                    continue
                page.locator('.constellation-map').scroll_into_view_if_needed()
                page.wait_for_selector('.team-constellation.is-forming')
                layers = page.locator('.team-layer-map > .team-star-cluster')
                assert layers.count() == 12
                assert layers.evaluate_all('''els => els.every(el => {
                    const effect = el.getAnimations()[0]?.effect;
                    return el.tagName === 'DIV' && effect?.getTiming().duration === 3000
                        && getComputedStyle(el).willChange.includes('transform');
                })''')
                assert page.locator('.team-star-cluster circle').evaluate_all(
                    'els => els.length > 0 && els.every(el => el.getAnimations().length === 0)'
                ), 'Individual stars should not animate or require per-frame updates'
                # Finishing by keyboard focus must reveal every layer and keep links usable.
                labels = page.locator('.star-label')
                if labels.count() and 'overwatch-team2' not in team['page']:
                    labels.first.focus()
                page.wait_for_selector('.team-constellation:not(.is-forming):not(.is-waiting)')
                assert layers.evaluate_all('''els => els.every(el => {
                    const s = getComputedStyle(el);
                    return s.opacity === '1' && s.transform === 'none' && s.willChange === 'auto';
                })''')
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
                if width == 1440 and 'overwatch-team2' in team['page']:
                    page.locator('.team-constellation').screenshot(
                        path=str(ROOT / '.test-output/team-formation-settled.png')
                    )
            print(f'{width}px: all team formations, grouped layers, cleanup, focus, and overflow passed')
        page.emulate_media(reduced_motion='reduce')
        page.reload()
        page.wait_for_function('document.fonts.status === "loaded"')
        assert page.locator('.team-star-cluster').evaluate_all(
            "els => els.every(el => !el.getAnimations().length && getComputedStyle(el).opacity === '1')"
        )
        static = browser.new_page(java_script_enabled=False)
        static.goto(page.url)
        assert static.locator('.team-star-cluster').evaluate_all(
            "els => els.length === 12 && els.every(el => getComputedStyle(el).opacity === '1')"
        )
        assert not errors, errors
        browser.close()
finally:
    server.shutdown()
