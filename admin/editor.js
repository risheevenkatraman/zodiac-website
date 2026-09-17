// Decap selects formats at collection level. This collection mixes JSON objects
// with top-level arrays used by the website and FACEIT importer.
CMS.registerCustomFormat('zodiac-json', 'json', {
  fromFile: (text) => {
    const data = JSON.parse(text);
    return Array.isArray(data) ? { items: data } : data;
  },
  toFile: (data) => JSON.stringify(Array.isArray(data.items) ? data.items : data, null, 2) + '\n',
});
CMS.init();
