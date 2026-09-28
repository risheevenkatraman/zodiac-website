const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pageCatalog } = require('../lib/page-catalog.cjs');

// Exercise publish-like JSON changes in an isolated fixture, never the real content.
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'zodiac-content-'));
try {
  fs.mkdirSync(path.join(root, 'data'));
  for (const name of ['pages', 'teams', 'players', 'staff'])
    fs.copyFileSync(`data/${name}.json`, path.join(root, 'data', `${name}.json`));
  const write = (name, data) =>
    fs.writeFileSync(path.join(root, 'data', `${name}.json`), JSON.stringify(data));
  const rosters = JSON.parse(fs.readFileSync('data/players.json', 'utf8'));
  const staff = JSON.parse(fs.readFileSync('data/staff.json', 'utf8'));
  const before = pageCatalog(root);
  const player = {
    ...rosters[0].players[0],
    id: 'cms-test-player',
    name: 'CMS <player> & name',
    introduction: 'Published biography update.',
  };
  rosters[0].players.push(player);
  staff.push({ id: 'cms-test-staff', name: 'New staff', role: 'Coach' });
  write('players', rosters);
  write('staff', staff);
  let pages = pageCatalog(root);
  assert.equal(pages.length, before.length + 2);
  assert.equal(
    pages.find((page) => page.file === 'players/player-cms-test-player.html').person.introduction,
    player.introduction,
  );
  assert.ok(pages.some((page) => page.file === 'staff/staff-cms-test-staff.html'));
  player.introduction = 'Second edit';
  write('players', rosters);
  assert.equal(
    pageCatalog(root).find((page) => page.file === 'players/player-cms-test-player.html').person
      .introduction,
    'Second edit',
  );
  rosters[0].players.pop();
  staff.pop();
  write('players', rosters);
  write('staff', staff);
  assert.deepEqual(pageCatalog(root), before);
  rosters[0].players.push(rosters[0].players[0]);
  write('players', rosters);
  assert.throws(() => pageCatalog(root), /Duplicate page/);
  rosters[0].players.pop();
  rosters[0].players[0].id = '../invalid';
  write('players', rosters);
  assert.throws(() => pageCatalog(root), /Invalid player ID/);
  console.log(
    'CMS routing checks passed: add, edit, remove, optional staff fields, duplicate IDs, and invalid IDs.',
  );
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
