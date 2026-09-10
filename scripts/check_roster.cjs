const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
let input;
const search = { value: '', addEventListener: (type, handler) => { input = handler; } };
const status = {};
const controls = { hidden: true };
const cards = ['Neightus Controller Signature agent: Omen', 'TR3NT Duelist Signature agent: Jett'].map(textContent => ({ textContent }));
const document = {
  querySelector: selector => ({ '#roster-search': search, '#roster-status': status, '.roster-tools': controls })[selector],
  querySelectorAll: () => cards
};
vm.runInNewContext(fs.readFileSync('js/roster.js', 'utf8'), { document });
assert.equal(controls.hidden, false);
for (const query of [' neIGHTus ', 'controller', 'omen']) {
  search.value = query;
  input();
  assert.equal(cards[0].hidden, false);
  assert.equal(cards[1].hidden, true);
}
search.value = 'no matching player';
input();
assert.ok(cards.every(card => card.hidden));
assert.match(status.textContent, /No players found/);
search.value = '';
input();
assert.ok(cards.every(card => !card.hidden));
assert.equal(status.textContent, '2 of 2 players');
console.log('Roster search by name, role, pick, empty results, and clearing passed.');
