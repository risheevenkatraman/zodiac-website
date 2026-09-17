"""Production Next.js navigation, motion, responsive layout, and compatibility checks."""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
BASE = os.environ.get('ZODIAC_TEST_URL', 'http://127.0.0.1:3000')
teams = json.loads((ROOT / 'data/players.json').read_text(encoding='utf-8'))
with sync_playwright() as p:
    browser = p.chromium.launch(channel='msedge', headless=True)
    page = browser.new_page(viewport={'width': 1440, 'height': 1000})
    page.route('**/data/store.json', lambda route: route.fulfill(json={}))
    page.route('**/data/account.json', lambda route: route.fulfill(json={'enabled': False}))
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.on('response', lambda response: errors.append(f'{response.status}: {response.url}') if response.status >= 400 else None)
    page.on('console', lambda message: errors.append(message.text) if message.type == 'error' else None)
    page.goto(BASE + '/')
    page.wait_for_function('document.fonts.status === "loaded"')
    page.evaluate('window.__navigationTest = true')
    page.get_by_role('link', name='Meet the teams', exact=True).click()
    page.wait_for_url('**/teams/')
    assert page.evaluate('window.__navigationTest === true'), 'Expected client-side Next navigation'
    page.locator('a.team-card').filter(has_text='Piggies').click()
    page.wait_for_url('**/teams/overwatch-team2/')
    page.wait_for_selector('.team-constellation.is-forming')
    page.locator('#main-content').focus()
    assert page.locator('.team-constellation.is-forming').count() == 1
    page.wait_for_function("document.querySelector('.constellation-dust circle').getAnimations().length > 0")
    page.screenshot(path=str(ROOT / '.test-output/next-constellation-forming.png'), full_page=True)
    page.wait_for_selector('.team-constellation:not(.is-forming)')
    page.get_by_role('button', name='Replay constellation').click()
    page.wait_for_selector('.team-constellation.is-forming')
    page.wait_for_selector('.team-constellation:not(.is-forming)')
    page.locator('.star-label').first.focus()
    assert page.locator('.player-star.is-active').count() == 1
    page.locator('#roster-search').fill('SamiR')
    assert page.locator('.roster-card').count() == 1
    page.locator('#roster-search').fill('no match')
    assert page.locator('.roster-card').count() == 0
    page.locator('#roster-search').fill('')
    page.locator('.star-label').first.click()
    page.wait_for_url('**/players/**')
    assert page.evaluate('window.__navigationTest === true')
    page.get_by_role('link', name='Teams', exact=True).click()
    page.locator('a.team-card').filter(has_text='Ox').click()
    page.wait_for_selector('.team-constellation.is-forming')
    page.emulate_media(reduced_motion='reduce')
    page.wait_for_selector('.team-constellation:not(.is-forming)')
    for width in (320, 390, 1440):
        page.set_viewport_size({'width': width, 'height': 1000})
        for route in ('/', '/teams/', '/staff/', '/socials/', '/account/', '/store/', *['/' + team['page'].replace('.html', '/') for team in teams]):
            page.goto(BASE + route)
            page.wait_for_function('document.fonts.status === "loaded"')
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), (route, width)
            expect(page.locator('main h1')).to_have_count(1)
        page.goto(BASE + '/')
        page.screenshot(path=str(ROOT / f'.test-output/next-home-{width}.png'), full_page=True)
    page.goto(BASE + '/teams/overwatch-team2.html')
    assert page.locator('.star-label').count() == 6
    assert page.locator('.team-constellation.is-forming').count() == 0
    assert page.locator('.constellation-dust circle').first.evaluate('el => getComputedStyle(el).animationName') == 'none'
    page.route('**/data/account.json', lambda route: route.fulfill(json={'enabled': False}))
    page.goto(BASE + '/account.html')
    page.get_by_text('Customer accounts and Stars are coming soon.', exact=False).wait_for()
    page.route('**/data/store.json', lambda route: route.fulfill(json={}))
    page.goto(BASE + '/store/')
    page.wait_for_function("!document.querySelector('#store-status')?.textContent.includes('Loading')")
    static = browser.new_page(java_script_enabled=False)
    static.goto(BASE + '/teams/overwatch-team2/')
    assert static.locator('.star-label').count() == 6
    static.locator('.star-label').first.click()
    assert '/players/' in static.url
    assert not errors, errors
    browser.close()
print('Next.js checks passed: client navigation, constellation assembly, roster search, reduced motion, mobile layout, legacy URLs, commerce initialization, and no-JavaScript profile links.')
