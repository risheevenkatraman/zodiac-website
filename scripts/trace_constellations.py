"""Trace the local brand marks into static SVG contours (requires Playwright/Edge)."""
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


def trace(pixels):
    occupied = {tuple(point) for point in pixels}
    xs, ys = zip(*occupied)
    scale = 330 / max(max(xs) - min(xs), max(ys) - min(ys))
    cx, cy = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2
    edges = {}
    for x, y in sorted(occupied):
        for neighbor, start, end in (
            ((x, y - 1), (x, y), (x + 1, y)),
            ((x + 1, y), (x + 1, y), (x + 1, y + 1)),
            ((x, y + 1), (x + 1, y + 1), (x, y + 1)),
            ((x - 1, y), (x, y + 1), (x, y)),
        ):
            if neighbor not in occupied:
                edges.setdefault(start, []).append(end)
    paths = []
    while edges:
        start = current = next(iter(edges))
        contour = [start]
        while current in edges:
            following = edges[current].pop()
            if not edges[current]:
                del edges[current]
            current = following
            contour.append(current)
            if current == start:
                break
        # Remove collinear vertices while retaining the animal's internal details.
        simple = []
        for point in contour:
            while len(simple) > 1:
                a, b = simple[-2:]
                if (b[0] - a[0]) * (point[1] - b[1]) != (b[1] - a[1]) * (point[0] - b[0]):
                    break
                simple.pop()
            simple.append(point)
        if len(simple) > 3:
            coords = [f'{450 + (x - cx) * scale:.1f},{280 + (y - cy) * scale:.1f}' for x, y in simple]
            paths.append('M' + 'L'.join(coords) + 'Z')
    return ''.join(paths)


def main():
    server = ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(QuietHandler, directory=str(ROOT)))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(channel='msedge', headless=True)
            page = browser.new_page()
            page.goto(f'http://127.0.0.1:{server.server_port}')
            contours = json.loads((ROOT / 'assets/constellations/contours.json').read_text())
            for shape in ('pig', 'ox', 'goat', 'tiger', 'zodiac'):
                source = 'assets/zodiac-logo.png' if shape == 'zodiac' else f'assets/constellations/{shape}.png'
                pixels = page.evaluate('''async (source) => {
                    const image = new Image(); image.src = source; await image.decode();
                    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 240;
                    const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0, 240, 240);
                    const data = ctx.getImageData(0, 0, 240, 240).data, points = [];
                    for (let y = 0; y < 240; y++) for (let x = 0; x < 240; x++) {
                        const i = (y * 240 + x) * 4;
                        if (data[i + 3] > 100 && Math.max(data[i], data[i + 1], data[i + 2]) > 65) points.push([x, y]);
                    }
                    return points;
                }''', source)
                contours[shape] = trace(pixels)
            (ROOT / 'assets/constellations/contours.json').write_text(json.dumps(contours, indent=2) + '\n', encoding='utf-8')
            browser.close()
    finally:
        server.shutdown()
        server.server_close()


if __name__ == '__main__':
    main()
