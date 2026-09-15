const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
let format;
vm.runInNewContext(fs.readFileSync('admin/editor.js', 'utf8'), {
  CMS: { registerCustomFormat: (name, extension, value) => { format = value; }, init() {} }
});
const config = JSON.parse(fs.readFileSync('admin/config.yml', 'utf8'));
for (const file of config.collections[0].files) {
  const content = fs.readFileSync(file.file, 'utf8');
  if (file.format === 'zodiac-list') {
    assert.deepEqual(JSON.parse(format.toFile(format.fromFile(content))), JSON.parse(content));
  } else {
    const data = JSON.parse(content);
    for (const field of file.fields) assert.ok(field.name in data, `Missing field ${file.file}: ${field.name}`);
  }
}
const events = config.collections[0].files.find(file => file.name === 'events');
assert.equal(events.fields[0].fields.find(field => field.name === 'date').format, 'YYYY-MM-DD');
console.log('Editor checks passed: existing JSON round-trips without data loss, content fields, and calendar date format.');
