// Preserve the existing top-level JSON arrays used by the website and FACEIT importer.
CMS.registerCustomFormat('zodiac-list', 'json', {
  fromFile: text => ({ items: JSON.parse(text) }),
  toFile: data => JSON.stringify(data.items, null, 2) + '\n'
});
CMS.init();
