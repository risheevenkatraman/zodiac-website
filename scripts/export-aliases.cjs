const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'out');
// Next's segment export currently preserves Windows separators inside segment
// filenames. The browser requests dot-separated names on every platform.
function normalizeSegments(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const child = path.join(directory, entry.name);
    if (entry.name.startsWith('__next.')) {
      for (const file of fs.readdirSync(child, { recursive: true })) {
        const source = path.join(child, file);
        if (fs.statSync(source).isFile()) {
          fs.copyFileSync(
            source,
            path.join(directory, entry.name + '.' + file.split(path.sep).join('.')),
          );
        }
      }
    } else normalizeSegments(child);
  }
}
normalizeSegments(output);
// Keep bookmarks and registered Shopify OAuth callbacks on their existing URLs.
for (const folder of ['', 'teams', 'players', 'staff']) {
  for (const file of fs.readdirSync(path.join(root, folder))) {
    if (!file.endsWith('.html') || file === 'index.html') continue;
    const generated = path.join(output, folder, file.slice(0, -5), 'index.html');
    if (!fs.existsSync(generated)) throw new Error(`Missing exported route: ${file}`);
    fs.copyFileSync(generated, path.join(output, folder, file));
  }
}
fs.writeFileSync(path.join(output, '.nojekyll'), '');
console.log('Added compatible .html URLs to the Next.js export.');
