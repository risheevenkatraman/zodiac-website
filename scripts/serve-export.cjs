const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../out');
const types = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain',
};
http
  .createServer((request, response) => {
    const url = new URL(request.url, 'http://localhost');
    let filename;
    try {
      filename = path.resolve(root, '.' + decodeURIComponent(url.pathname));
    } catch {
      response.writeHead(400).end();
      return;
    }
    if (!filename.startsWith(root + path.sep) && filename !== root) {
      response.writeHead(403).end();
      return;
    }
    if (fs.existsSync(filename) && fs.statSync(filename).isDirectory())
      filename = path.join(filename, 'index.html');
    if (!fs.existsSync(filename)) {
      response.writeHead(404, { 'Content-Type': 'text/html' });
      response.end(fs.readFileSync(path.join(root, '404.html')));
      return;
    }
    response.writeHead(200, {
      'Content-Type': types[path.extname(filename)] || 'application/octet-stream',
    });
    fs.createReadStream(filename).pipe(response);
  })
  .listen(Number(process.env.PORT || 3000), '127.0.0.1', () =>
    console.log('Next.js export: http://localhost:' + (process.env.PORT || 3000)),
  );
