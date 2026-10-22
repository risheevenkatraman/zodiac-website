"""Export missing PNG marks from existing vector contours (Playwright/Edge)."""
import base64
import json
import re
import struct
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'assets/constellations'


def main():
    contours = json.loads((ASSETS / 'contours.json').read_text())
    width, height = struct.unpack('>II', (ASSETS / 'goat.png').read_bytes()[16:24])
    with sync_playwright() as p:
        browser = p.chromium.launch(channel='msedge', headless=True)
        page = browser.new_page()
        for name in ('monkey', 'dragon', 'zodiac'):
            target = ASSETS / f'{name}.png'
            if target.exists():
                continue
            contour = contours[name]
            vertices = [tuple(map(float, pair)) for pair in
                        re.findall(r'(-?[\d.]+),(-?[\d.]+)', contour)]
            xs, ys = zip(*vertices)
            scale = min((width - 32) / (max(xs) - min(xs)),
                        (height - 32) / (max(ys) - min(ys)))
            cx, cy = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2
            svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}">
              <defs><linearGradient id="purple" x1="0" y1="0" x2="1" y2="1">
                <stop stop-color="#bda9ef"/><stop offset=".5" stop-color="#9369dd"/>
                <stop offset="1" stop-color="#7142bf"/>
              </linearGradient></defs>
              <path transform="translate({width/2} {height/2}) scale({scale}) translate({-cx} {-cy})"
                d="{contour}" fill="url(#purple)" fill-rule="evenodd"/>
            </svg>'''
            encoded = page.evaluate('''async ({svg, width, height}) => {
                const image = new Image();
                image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
                await image.decode();
                const canvas = document.createElement('canvas');
                canvas.width = width; canvas.height = height;
                canvas.getContext('2d').drawImage(image, 0, 0);
                return canvas.toDataURL('image/png').split(',')[1];
            }''', {'svg': svg, 'width': width, 'height': height})
            target.write_bytes(base64.b64decode(encoded))
            print(f'Created {target.name} ({width} x {height}, transparent PNG)')
        browser.close()


if __name__ == '__main__':
    main()
