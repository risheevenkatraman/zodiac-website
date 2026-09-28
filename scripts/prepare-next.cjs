const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
// Validate CMS IDs and links before generating routes directly from JSON.
require('../lib/page-catalog.cjs').pageCatalog(root);
// Only these public assets are staged. Backend, credentials, and source stay private.
const target = path.join(root, 'public');
fs.mkdirSync(target, { recursive: true });
for (const folder of ['assets', 'css', 'data', 'js', 'admin']) {
  const destination = path.join(target, folder);
  if (!destination.startsWith(target + path.sep)) throw new Error('Invalid staging destination');
  fs.rmSync(destination, { recursive: true, force: true });
  fs.cpSync(path.join(root, folder), destination, { recursive: true });
}
console.log('Prepared public assets for Next.js; pages render directly from JSON and React.');
