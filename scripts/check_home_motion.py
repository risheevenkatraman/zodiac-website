"""Check the exported home constellation in Edge: build first, then run with Playwright."""

import functools
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


server = ThreadingHTTPServer(
    ('127.0.0.1', 0), functools.partial(QuietHandler, directory=str(ROOT / 'out'))
)
threading.Thread(target=server.serve_forever, daemon=True).start()
base = f'http://127.0.0.1:{server.server_port}'

SCROLL_TO_TEAMS = """() => window.scrollTo({
    top: scrollY + document.querySelector('.home-team-chart').getBoundingClientRect().top - 100,
    behavior: 'instant'
})"""
TEAMS_SETTLED = """() => [...document.querySelectorAll('.home-team-cluster')].every(e => {
    const style = getComputedStyle(e);
    return style.opacity === '1' && new DOMMatrix(style.transform).isIdentity;
})"""

try:
    with sync_playwright() as p:
        browser = p.chromium.launch(channel='msedge', headless=True)
        page = browser.new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        for width in (390, 1440):
            page.set_viewport_size({'width': width, 'height': 900})
            page.goto(base)
            page.wait_for_function("document.querySelector('.home-team-cluster').style.opacity === '0'")
            page.evaluate(SCROLL_TO_TEAMS)
            page.wait_for_function("document.querySelector('.home-team-cluster').getAnimations().length > 0")
            # The same 320 SVG units must become the same screen distance at any width.
            page.evaluate("""() => {
                for (const e of document.querySelectorAll('.home-team-cluster')) {
                    const animation = e.getAnimations()[0];
                    animation.pause();
                    animation.currentTime = 0;
                }
            }""")
            offsets = page.evaluate("""() => {
                const groups = [...document.querySelectorAll('.home-team-cluster')];
                const scale = document.querySelector('.home-team-chart').getBoundingClientRect().width / 480;
                return groups.map((e, i) => {
                    const matrix = new DOMMatrix(getComputedStyle(e).transform);
                    const angle = i * 2 * Math.PI / groups.length;
                    return Math.hypot(matrix.e - Math.cos(angle) * 320 * scale,
                                      matrix.f - Math.sin(angle) * 320 * scale);
                });
            }""")
            assert max(offsets) < 0.01, offsets
            # Every layer still contains widely scattered stars, not a preformed spatial tile.
            assert page.locator('.home-team-cluster svg').evaluate_all("""svgs => svgs.every(svg => {
                const bounds = svg.getBBox();
                return bounds.width > 300 && bounds.height > 300;
            })""")
            assert page.locator('.home-star-cluster').evaluate_all(
                'groups => groups.every(e => e.getAnimations().length === 0)'
            ), 'Offscreen hero animation must stop'
            page.evaluate("""() => {
                for (const e of document.querySelectorAll('.home-team-cluster')) e.getAnimations()[0].play();
            }""")
            page.wait_for_function(TEAMS_SETTLED)
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
            assert page.locator('.home-team-chart a').count() == 7
            # Each SVG owns its gradients, without duplicate IDs or missing fills.
            assert page.locator('.home-team-cluster path[fill^="url"]').evaluate_all("""paths => paths.every(e => {
                const id = e.getAttribute('fill').slice(5, -1);
                return e.ownerSVGElement.querySelectorAll(`[id="${id}"]`).length === 1
                    && document.querySelectorAll(`[id="${id}"]`).length === 1;
            })""")
            for team in ('overwatch-team1', 'overwatch-team2'):
                star_team = 'flagship' if team.endswith('team1') else team
                link = page.locator(f'.home-team-legend [data-team="{team}"]')
                link.hover()
                page.wait_for_function("""team => [...document.querySelectorAll(`[data-star-team="${team}"]`)]
                    .every(e => e.getAnimations().some(a => a.playState === 'running'))""", arg=star_team)
                page.mouse.move(0, 0)
                link.focus()
                page.wait_for_function("""team => [...document.querySelectorAll(`[data-star-team="${team}"]`)]
                    .every(e => getComputedStyle(e).opacity === '1')""", arg=star_team)
                page.evaluate('document.activeElement.blur()')
            # Reversing direction in-flight must still settle into the correct formation.
            for _ in range(2):
                page.evaluate("window.scrollTo({top: 0, behavior: 'instant'})")
                page.wait_for_timeout(120)
                page.evaluate(SCROLL_TO_TEAMS)
                page.wait_for_timeout(120)
            page.wait_for_function(TEAMS_SETTLED)
            # Rapid re-entry must animate from scattered stars rather than snap.
            page.evaluate("window.scrollTo({top: 0, behavior: 'instant'})")
            page.wait_for_timeout(80)
            page.evaluate(SCROLL_TO_TEAMS)
            page.wait_for_function("""() => document.querySelector('.home-team-cluster')
                .getAnimations().some(a => a.playState === 'running' && a.currentTime < 1500)""")
            effects = page.locator('.home-team-cluster').evaluate_all(
                "els => { window.__starEffects = els.map(el => el.getAnimations()[0]); return els.length; }"
            )
            for _ in range(3):
                page.evaluate("window.scrollTo({top: 0, behavior: 'instant'})")
                page.wait_for_timeout(80)
                page.evaluate(SCROLL_TO_TEAMS)
                page.wait_for_timeout(80)
            assert page.locator('.home-team-cluster').evaluate_all(
                "els => els.every((el, i) => el.getAnimations()[0] === window.__starEffects[i])"
            ), 'Rapid re-entry must reuse animation effects'
            page.wait_for_function(TEAMS_SETTLED)
            page.emulate_media(reduced_motion='reduce')
            page.wait_for_function("""() => [...document.querySelectorAll('.home-team-cluster, .home-star-cluster')]
                .every(e => e.getAnimations().length === 0 && getComputedStyle(e).opacity === '1')""")
            page.emulate_media(reduced_motion='no-preference')
            print(f'{width}px: formation, scatter distances, offscreen cleanup, links, gradients, hover/focus, reversal, reduced motion passed')
        # The server-rendered artwork and navigation also remain usable without hydration.
        static_page = browser.new_page(java_script_enabled=False)
        static_page.goto(base)
        assert static_page.locator('.home-team-chart a').count() == 7
        assert static_page.locator('.home-team-cluster').evaluate_all(
            "groups => groups.every(e => getComputedStyle(e).opacity === '1')"
        )
        assert not errors, errors
        browser.close()
finally:
    server.shutdown()
