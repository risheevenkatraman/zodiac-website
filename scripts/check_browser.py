"""Optional browser smoke check: pip install playwright, with Microsoft Edge installed."""
import functools
import json
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import threading

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


server = ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(QuietHandler, directory=str(ROOT)))
thread = threading.Thread(target=server.serve_forever, daemon=True)
thread.start()
base = f'http://127.0.0.1:{server.server_port}'
try:
    with sync_playwright() as p:
        browser = p.chromium.launch(channel='msedge', headless=True)
        page = browser.new_page(viewport={'width': 390, 'height': 844})
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(base + '/account.html')
        page.get_by_text('Customer accounts and Stars are coming soon.', exact=False).wait_for()
        assert page.locator('#account-login').is_hidden()
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        page.route('**/data/account.json', lambda route: route.fulfill(json={
            'enabled': True, 'shopDomain': 'zodiac.myshopify.com', 'clientId': 'client',
            'customerApiUrl': 'https://customer.test/graphql', 'rewardsApiUrl': 'https://rewards.test'}))
        page.add_init_script("sessionStorage.setItem('zodiac.customer', JSON.stringify({access_token:'test-token',expires:Date.now()+3600000}));")
        page.route('https://customer.test/graphql', lambda route: route.fulfill(json={
            'data': {'customer': {'id': 'gid://shopify/Customer/10', 'displayName': 'Zodiac Fan'}}}))
        result = {'stars': 150, 'lifetimeStars': 350, 'tier': 'Zodiac Silver',
            'nextTier': {'name': 'Zodiac Gold', 'stars': 750}, 'policy': 'Earn Stars with Zodiac.',
            'reward': {'redemptionStars': 100, 'discountAmount': '5.00', 'minimumPurchase': '25.00', 'currency': 'USD'},
            'redemptions': [], 'orders': [{'name': '#1001', 'stars': 350}]}
        page.route('https://rewards.test/me/stars', lambda route: route.fulfill(json=result))
        def redeem(route):
            assert 'requestId' in route.request.post_data_json
            result['stars'] = 50
            result['redemptions'] = [{'id': 'test', 'status': 'READY', 'code': 'ZODIAC-TEST', 'amount': '5.00', 'minimumPurchase': '25.00'}]
            route.fulfill(json={'accepted': True})
        page.route('https://rewards.test/me/redeem', redeem)
        page.reload()
        page.get_by_text('Zodiac Silver', exact=True).wait_for()
        assert page.locator('#stars-balance').inner_text() == '150'
        page.locator('#stars-redeem').click()
        page.get_by_text('ZODIAC-TEST', exact=False).wait_for()
        assert page.locator('#stars-balance').inner_text() == '50'
        assert page.locator('#stars-redeem').is_disabled()
        assert page.locator('#member-tier').text_content() == 'Zodiac Silver'
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        (ROOT / '.test-output').mkdir(exist_ok=True)
        page.evaluate('window.scrollTo(0, 0)')
        page.screenshot(path=str(ROOT / '.test-output/account-mobile.png'), full_page=True)
        page.set_viewport_size({'width': 1440, 'height': 1000})
        page.screenshot(path=str(ROOT / '.test-output/account-desktop.png'), full_page=True)
        assert not errors, errors
        page.goto(base + '/admin/index.html')
        page.get_by_role('button', name='Login with GitHub').wait_for(timeout=45000)
        assert not errors, errors
        print('Browser checks passed: launch state, mobile layout, account tier, discount redemption, and Decap editor login.')
        browser.close()
finally:
    server.shutdown()
    server.server_close()
