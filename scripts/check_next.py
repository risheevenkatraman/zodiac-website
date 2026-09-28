"""Browser regression checks against the React static export; build first."""
import functools
import json
import os
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def copyfile(self, source, outputfile):
        try:
            super().copyfile(source, outputfile)
        except (ConnectionAbortedError, ConnectionResetError, BrokenPipeError):
            pass


server = ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(QuietHandler, directory=str(ROOT / 'out')))
threading.Thread(target=server.serve_forever, daemon=True).start()
base = os.environ.get('ZODIAC_TEST_URL', f'http://127.0.0.1:{server.server_port}')
teams = json.loads((ROOT / 'data/players.json').read_text(encoding='utf-8'))
try:
    with sync_playwright() as p:
        browser = p.chromium.launch(channel='msedge', headless=True)
        page = browser.new_page(viewport={'width': 1440, 'height': 1000})
        page.route('**/data/store.json', lambda route: route.fulfill(json={}))
        page.route('**/data/account.json', lambda route: route.fulfill(json={'enabled': False}))
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.on('console', lambda message: errors.append(message.text) if message.type == 'error' else None)
        page.goto(base + '/')
        page.wait_for_function('document.fonts.status === "loaded"')
        page.evaluate('window.__navigationTest = true')
        page.get_by_role('link', name='Meet the teams', exact=True).click()
        page.wait_for_url('**/teams/')
        assert page.evaluate('window.__navigationTest === true'), 'Expected client-side navigation'
        page.locator('a.team-card').filter(has_text='Piggies').click()
        page.wait_for_url('**/teams/overwatch-team2/')
        page.wait_for_selector('.team-constellation.is-forming')
        page.locator('.star-label').first.focus()
        expect(page.locator('.player-star.is-active')).to_have_count(1)
        page.locator('.star-label').first.click()
        expect(page.locator('.player-accordion details[open]')).to_have_count(1)
        assert page.url.endswith('/teams/overwatch-team2/'), 'Star should open the inline profile'
        assert page.evaluate('window.__navigationTest === true')
        page.get_by_role('link', name='Staff', exact=True).click()
        page.wait_for_url('**/staff/')
        page.locator('summary').first.click()
        expect(page.locator('details[open]')).to_have_count(1)
        page.get_by_role('link', name='Partners', exact=True).click()
        page.wait_for_url('**/partnerships/')
        page.emulate_media(reduced_motion='reduce')
        page.get_by_role('button', name='Show Parsertime').click()
        expect(page.locator('#partner-details')).to_be_visible()
        expect(page.get_by_role('link', name="Explore Parsertime's product")).to_have_attribute('href', 'https://parsertime.app/')

        for route in ('/store/', '/account/', '/account.html'):
            page.emulate_media(reduced_motion='no-preference')
            page.goto(base + route)
            page.wait_for_function("""() => [...document.querySelectorAll('.commerce-header-art .home-star-cluster')]
                .some(el => el.getAnimations().some(a => a.effect.getTiming().duration === 3000))""")
            page.emulate_media(reduced_motion='reduce')
            page.wait_for_function("""() => [...document.querySelectorAll('.commerce-header-art .home-star-cluster')]
                .every(el => !el.getAnimations().length && getComputedStyle(el).opacity === '1')""")
            if 'account' in route:
                page.get_by_text('Customer accounts and Stars are coming soon.', exact=False).wait_for()
            else:
                page.wait_for_function("!document.querySelector('#store-status').textContent.includes('Loading')")

        static = browser.new_page(java_script_enabled=False)
        static.goto(base + '/teams/overwatch-team2.html')
        expect(static.locator('.star-label')).to_have_count(len(next(t for t in teams if t['name'] == 'Piggies')['players']))
        static.locator('.star-label').first.click()
        assert '/players/' in static.url
        expect(static.locator('#intro-heading')).to_be_visible()
        assert not errors, errors
        response = page.goto(base + '/missing-migration-page/')
        assert response.status == 404
        browser.close()
        print('React browser checks passed: client navigation, inline profiles, partner selection, commerce formation, reduced motion, legacy URLs, and no-JavaScript profiles.')
finally:
    server.shutdown()
    server.server_close()
