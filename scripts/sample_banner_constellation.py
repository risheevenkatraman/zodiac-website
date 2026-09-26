"""Sample only the banner's central mark and animal ring into reusable SVG stars."""
import argparse
import base64
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument('--dense', action='store_true', help='Sample finer stars for the larger homepage map.')
args = parser.parse_args()
ROOT = Path(__file__).resolve().parents[1]
with sync_playwright() as p:
    browser = p.chromium.launch(channel='msedge', headless=True)
    page = browser.new_page()
    source = base64.b64encode((ROOT / 'assets/uploads/zodiac-banner.png').read_bytes()).decode()
    points = page.evaluate('''async ({source, dense}) => {
      const image = new Image();
      image.src = 'data:image/png;base64,' + source;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 500;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, 510, 0, 500, 500, 0, 0, 500, 500);
      const {data} = ctx.getImageData(0, 0, 500, 500);
      const stars = [];
      const step = dense ? 2 : 3;
      // Pick the most saturated pixel in each cell to retain the fine animal strokes.
      for (let y = 0; y < 500; y += step) {
        for (let x = 0; x < 500; x += step) {
          let best = 40, point;
          for (let dy = 0; dy < step && y + dy < 500; dy++) {
            for (let dx = 0; dx < step && x + dx < 500; dx++) {
              const i = ((y + dy) * 500 + x + dx) * 4;
              const saturation = Math.max(...data.slice(i, i+3)) - Math.min(...data.slice(i, i+3));
              if (data[i+3] > 100 && saturation > best) {
                best = saturation;
                point = [x+dx, y+dy];
              }
            }
          }
          if (point) stars.push([
            +(450 + (point[0]-250)*0.88).toFixed(2),
            +(280 + (point[1]-250)*0.88).toFixed(2),
            dense ? 0.58 : (stars.length % 17 === 0 ? 1.15 : 0.65)
          ]);
        }
      }
      return stars;
    }''', {'source': source, 'dense': args.dense})
    browser.close()
(ROOT / ('assets/constellations/banner-stars-dense.json' if args.dense else 'assets/constellations/banner-stars.json')).write_text(json.dumps(points, separators=(',', ':')) + '\n')
print(f'Sampled {len(points)} stars from the central banner artwork.')
