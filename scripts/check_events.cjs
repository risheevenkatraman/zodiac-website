const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

// Keep the network loader idle while exercising the actual date parser.
const context = vm.createContext({ fetch: () => new Promise(() => {}) });
vm.runInContext(fs.readFileSync('js/events.js', 'utf8'), context);
const parse = context.parseEvents;
const event = (date, name = 'Event', description = 'Description') => ({ name, description, date });
assert.equal(parse([event('2026-02-30')]).length, 0);
assert.equal(parse([event('2026-13-01')]).length, 0);
assert.equal(parse([event('2026-10-01T12:00:00')]).length, 0);
assert.equal(parse([event('2026-10-01', 'Missing', '')]).length, 0);
assert.equal(parse([]).length, 0);
assert.throws(() => parse({}), /JSON array/);
assert.throws(() => parse(null), /JSON array/);
assert.equal(parse([null, 42, {}, { name: 42, description: 'Invalid', date: '2026-10-01' }]).length, 0);
assert.equal(parse([event('2028-02-29')]).length, 1);
assert.equal(parse([event('2026-02-29')]).length, 0);
const events = parse([event('2026-11-01', 'Later'), event('2026-10-01', 'Earlier')]);
assert.equal(events[0].name, 'Earlier');
assert.equal(events[0].value.getHours(), 12);
assert.equal(parse([event('2026-10-01', '<img onerror=alert(1)>')])[0].name, '<img onerror=alert(1)>');
assert.equal(parse([event(' 2026-10-01 ', ' Trimmed ')])[0].name, 'Trimmed');
const saved = JSON.parse(fs.readFileSync('data/events.json', 'utf8'));
assert.equal(parse(saved).length, saved.length);
vm.runInContext(fs.readFileSync('js/announcement.js', 'utf8'), context);
const announcement = JSON.parse(fs.readFileSync('data/announcement.json', 'utf8'));
assert.equal(context.parseAnnouncement(announcement).title, announcement.title);
for (const invalid of [null, [], 'text', { title: 42, message: {}, image: false }]) {
  assert.equal(context.parseAnnouncement(invalid).title, 'Welcome to Zodiac Esports');
}
assert.equal(context.parseAnnouncement({ title: ' Custom ' }).title, 'Custom');
console.log('JSON content, invalid shapes, defaults, date validation, ordering, and plain-text parsing passed.');
