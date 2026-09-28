import type { ContentData } from './types';
import { cache } from 'react';
import catalog from './page-catalog.cjs';
import content from './content-data';

export const readData = cache(
  <K extends keyof ContentData>(name: K): ContentData[K] => content[name],
);
const pages = cache(() => catalog.pageCatalog());
export const pageFiles = cache(() => pages().map((page) => page.file));
export const readPage = cache((file: string) => pages().find((page) => page.file === file) || null);
