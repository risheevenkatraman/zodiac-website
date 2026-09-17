const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const formats = new Map();
vm.runInNewContext(fs.readFileSync('admin/editor.js', 'utf8'), {
  CMS: {
    registerCustomFormat: (name, extension, value) => {
      formats.set(name, value);
    },
    init() {},
  },
});
const config = JSON.parse(fs.readFileSync('admin/config.yml', 'utf8'));
for (const collection of config.collections) {
  // Decap chooses the formatter from the collection, not individual files.
  const format = formats.get(collection.format);
  assert.ok(format, `Missing registered collection formatter: ${collection.name}`);
  for (const file of collection.files) {
    const content = fs.readFileSync(file.file, 'utf8');
    const original = JSON.parse(content);
    const data = format.fromFile(content);
    for (const field of file.fields)
      assert.ok(field.name in data, `Missing field ${file.file}: ${field.name}`);
    if (Array.isArray(original)) {
      assert.ok(Array.isArray(data.items), `Missing editor list: ${file.file}`);
      assert.equal(data.items.length, original.length, `Incorrect list count: ${file.file}`);
    }
    assert.deepEqual(JSON.parse(format.toFile(data)), original, `Data loss: ${file.file}`);
  }
}
const events = config.collections[0].files.find((file) => file.name === 'events');
assert.equal(events.fields[0].fields.find((field) => field.name === 'date').format, 'YYYY-MM-DD');
console.log(
  'Editor checks passed: existing JSON round-trips without data loss, content fields, and calendar date format.',
);
