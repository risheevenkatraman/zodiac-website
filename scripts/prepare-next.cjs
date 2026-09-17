const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
for (const script of ['build_players.py', 'build_staff.py']) {
  execFileSync(
    process.env.PYTHON || (process.platform === 'win32' ? 'python' : 'python3'),
    [path.join(root, 'scripts', script)],
    {
      stdio: 'inherit',
    },
  );
}
// Only these public assets are staged. Backend, credentials, and source stay private.
const target = path.join(root, 'public');
fs.mkdirSync(target, { recursive: true });
for (const folder of ['assets', 'css', 'data', 'js', 'admin']) {
  const destination = path.join(target, folder);
  if (!destination.startsWith(target + path.sep)) throw new Error('Invalid staging destination');
  fs.rmSync(destination, { recursive: true, force: true });
  fs.cpSync(path.join(root, folder), destination, { recursive: true });
}
console.log('Prepared public assets and current roster content for Next.js.');
