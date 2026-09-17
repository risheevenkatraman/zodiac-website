export const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
export const asset = (path) =>
  /^https:\/\//i.test(path) ? path : `${basePath}/${path.replace(/^\/+/, '')}`;
export function pageHref(file) {
  return file === 'index.html' ? '/' : `/${file.replace(/\.html$/, '')}/`;
}
