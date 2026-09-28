// Shared by Next's route generator and the static-export compatibility writer.
const fs = require('node:fs');
const path = require('node:path');

/**
 * @template {keyof import('./types').ContentData} K
 * @param {K} name
 * @param {string} [root]
 * @returns {import('./types').ContentData[K]}
 */
function readData(name, root = process.cwd()) {
  return JSON.parse(fs.readFileSync(path.join(root, 'data', `${name}.json`), 'utf8'));
}

/** @returns {import('./types').Page[]} */
function pageCatalog(root = process.cwd()) {
  /** @type {import('./types').Page[]} */
  const pages = Object.entries(readData('pages', root)).map(([file, metadata]) => ({
    file,
    kind: /** @type {import('./types').StaticPageKind} */ (file.replace('.html', '')),
    ...metadata,
  }));
  const rosters = readData('players', root);
  const teams = readData('teams', root);
  const teamPages = new Set(teams.map((team) => team.page));
  const rosterPages = new Set();
  for (const roster of rosters) {
    if (!teamPages.has(roster.page) || rosterPages.has(roster.page))
      throw new Error(`Unknown or duplicate team page: ${roster.page}`);
    rosterPages.add(roster.page);
  }
  for (const team of teams) {
    if (!/^teams\/[a-z0-9-]+\.html$/.test(team.page))
      throw new Error(`Invalid team page: ${team.page}`);
    const roster = rosters.find((item) => item.page === team.page);
    const current = { ...team, players: roster?.players || [] };
    pages.push({ file: team.page, kind: 'team', title: team.title, team: current });
    for (const person of current.players) {
      validatePerson(person, 'player');
      pages.push({
        file: `players/player-${person.id}.html`,
        kind: 'player',
        title: `${person.name} — ${team.name} ${team.game} | Zodiac Esports`,
        description: `Meet ${person.name}, ${person.role} for ${team.name} in ${team.game}. Read their introduction and find their social links.`,
        person,
        team: current,
      });
    }
  }
  for (const person of readData('staff', root)) {
    validatePerson(person, 'staff');
    pages.push({
      file: `staff/staff-${person.id}.html`,
      kind: 'staff-profile',
      title: `${person.name} — Staff | Zodiac Esports`,
      description: `Meet ${person.name}, ${person.role} at Zodiac Esports. Read their introduction and explore their social links.`,
      person,
    });
  }
  const files = new Set();
  for (const page of pages) {
    if (files.has(page.file)) throw new Error(`Duplicate page: ${page.file}`);
    files.add(page.file);
  }
  return pages;
}

/** @param {import('./types').Person} person @param {string} kind */
function validatePerson(person, kind) {
  if (!/^[a-z0-9-]+$/.test(person.id)) throw new Error(`Invalid ${kind} ID: ${person.id}`);
  for (const social of person.socials || []) {
    const url = new URL(social.url);
    if (url.protocol !== 'https:' || !url.hostname)
      throw new Error(`Social links must be absolute HTTPS URLs: ${social.url}`);
  }
}

module.exports = { readData, pageCatalog };
