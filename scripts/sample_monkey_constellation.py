"""Sample the monkey in the local Zodiac banner (requires Playwright/Edge)."""
import base64
import json
import math
import random
from pathlib import Path

from playwright.sync_api import sync_playwright
from trace_constellations import trace

ROOT = Path(__file__).resolve().parents[1]


def main():
    source = base64.b64encode((ROOT / 'assets/uploads/zodiac-banner.png').read_bytes()).decode()
    with sync_playwright() as p:
        browser = p.chromium.launch(channel='msedge', headless=True)
        page = browser.new_page()
        pixels = page.evaluate('''async (source) => {
            const image = new Image();
            image.src = 'data:image/png;base64,' + source; await image.decode();
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = 160;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(image, 840, 382, 80, 80, 0, 0, 160, 160);
            const {data} = ctx.getImageData(0, 0, 160, 160), pixels = [];
            for (let y = 0; y < 160; y++) for (let x = 0; x < 160; x++) {
                const i = (y * 160 + x) * 4;
                if (data[i+3] > 100 && Math.max(...data.slice(i, i+3)) - Math.min(...data.slice(i, i+3)) > 40)
                    pixels.push([x, y]);
            }
            return pixels;
        }''', source)
        browser.close()
    xs, ys = zip(*pixels)
    scale = 330 / max(max(xs) - min(xs), max(ys) - min(ys))
    cx, cy = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2
    # Match the other houses' scattered dust and varied radii, rather than
    # plotting identical stars on every second pixel of a regular grid.
    rng = random.Random(73)
    concentrations = [(48, 35, 21), (89, 74, 18), (112, 125, 24)]
    def density(x, y):
        return 0.35 + sum(math.exp(-((x-a)**2 + (y-b)**2) / (2 * spread**2))
                          for a, b, spread in concentrations)
    weighted = sorted(pixels, key=lambda p: -math.log(max(rng.random(), 1e-12)) / density(*p))
    points = [[round(450 + (x-cx)*scale, 1), round(280 + (y-cy)*scale, 1),
               round(rng.uniform(0.5, 1.8), 2)]
              for x, y in weighted[:850]]
    for filename, value in [('points.json', points), ('contours.json', trace(pixels))]:
        path = ROOT / 'assets/constellations' / filename
        data = json.loads(path.read_text())
        data['monkey'] = value
        output = json.dumps(data, separators=(',', ':')) if filename == 'points.json' else json.dumps(data, indent=2)
        path.write_text(output + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
