import Link from './SiteLink';
import { asset, basePath, pageHref } from '../lib/paths';

// Page components use site-root content paths; commerce keeps full-document navigation.
export default function PageLink({ href, documentNavigation = false, children, ...props }) {
  if (/^(?:[a-z]+:|\/\/|#)/i.test(href))
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  const [file, suffix = ''] = href.replace(/^\//, '').split(/(?=[?#])/);
  if (!file.endsWith('.html'))
    return (
      <a href={asset(file) + suffix} {...props}>
        {children}
      </a>
    );
  const route = pageHref(file) + suffix;
  return documentNavigation || ['store.html', 'account.html'].includes(file) ? (
    <a href={basePath + route} {...props}>
      {children}
    </a>
  ) : (
    <Link href={route} {...props}>
      {children}
    </Link>
  );
}
