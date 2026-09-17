import fs from 'node:fs';
import path from 'node:path';
import { cache } from 'react';

const root = process.cwd();
export const readData = cache((name) =>
  JSON.parse(fs.readFileSync(path.join(root, 'data', `${name}.json`), 'utf8')),
);
export const pageFiles = cache(() =>
  ['', 'teams', 'players', 'staff'].flatMap((folder) =>
    fs
      .readdirSync(path.join(root, folder))
      .filter((name) => name.endsWith('.html'))
      .map((name) => path.posix.join(folder, name)),
  ),
);
export const readPage = cache((file) => {
  if (!pageFiles().includes(file)) return null;
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  return {
    file,
    title: html.match(/<title>(.*?)<\/title>/s)?.[1] || 'Zodiac Esports',
    bodyClass: html.match(/<body[^>]*class="([^"]*)"/)?.[1] || '',
    content: html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1] || '',
  };
});
