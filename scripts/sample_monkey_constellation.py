"""Sample the monkey in the local Zodiac banner (requires Playwright/Edge)."""
import base64
import json
from pathlib import Path

from playwright.sync_api import sync_playwright
from trace_constellations import trace

ROOT = Path(__file__).resolve().parents[1]


def main():
    source = base64.b64encode((ROOT / 'assets/zodiac-banner.png').read_bytes()).decode()
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
    points = [[round(450 + (x-cx)*scale, 1), round(280 + (y-cy)*scale, 1), 0.8]
              for x, y in pixels if x % 2 == 0 and y % 2 == 0]
    for filename, value in [('points.json', points), ('contours.json', trace(pixels))]:
        path = ROOT / 'assets/constellations' / filename
        data = json.loads(path.read_text())
        data['monkey'] = value
        output = json.dumps(data, separators=(',', ':')) if filename == 'points.json' else json.dumps(data, indent=2)
        path.write_text(output + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
