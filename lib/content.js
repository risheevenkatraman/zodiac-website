import { cache } from 'react';
import catalog from './page-catalog.cjs';

export const readData = cache((name) => catalog.readData(name));
const pages = cache(() => catalog.pageCatalog());
export const pageFiles = cache(() => pages().map((page) => page.file));
export const readPage = cache((file) => pages().find((page) => page.file === file) || null);
