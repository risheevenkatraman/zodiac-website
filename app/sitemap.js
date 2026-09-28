import { pageFiles } from '../lib/content';
import { pageHref } from '../lib/paths';
import { absoluteUrl } from '../lib/seo';

export const dynamic = 'force-static';

export default function sitemap() {
  return pageFiles().map((file) => ({ url: absoluteUrl(pageHref(file)) }));
}
