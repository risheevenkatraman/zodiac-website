import type { ReactNode, AnchorHTMLAttributes } from 'react';
import type { Page } from '../lib/types';
import Link from './SiteLink';
import { asset, basePath, pageHref } from '../lib/paths';
import PageMotion from './PageMotion';
import CommerceScripts from './CommerceScripts';
import PageContent from './pages/PageContent';

const navigation = [
  ['Home', 'index.html'],
  ['Teams', 'teams.html'],
  ['Staff', 'staff.html'],
  ['Partners', 'partnerships.html'],
  ['Store', 'store.html'],
  ['Socials', 'socials.html'],
  ['Account & Stars', 'account.html'],
];
const commerceFiles = new Set(['store.html', 'account.html']);

export default function SitePage({ page }: { page: Page }) {
  const commerce = commerceFiles.has(page.file);
  const currentHref = pageHref(page.file);
  function renderLink(
    href: string,
    children: ReactNode,
    props: AnchorHTMLAttributes<HTMLAnchorElement> = {},
  ) {
    if (commerce || href === '/store/' || href === '/account/' || /^(?:[a-z]+:|\/\/)/i.test(href)) {
      return (
        <a href={href.startsWith('/') ? basePath + href : href} {...props}>
          {children}
        </a>
      );
    }
    return (
      <Link href={href} {...props}>
        {children}
      </Link>
    );
  }
  return (
    <PageMotion pageKey={page.file} className={page.bodyClass}>
      <a className="skip-link" href={`${basePath}${currentHref}#main-content`}>
        Skip to content
      </a>
      <header className="site-header">
        <div className="container">
          {renderLink(
            '/',
            <>
              <img
                src={asset('assets/uploads/zodiac-logo.png')}
                alt="Zodiac Esports logo"
                width="42"
                height="42"
              />
              <span className="logo">Zodiac Esports</span>
            </>,
            { className: 'brand' },
          )}
          <nav aria-label="Main navigation">
            {navigation.map(([label, file]) => (
              <span key={file}>
                {renderLink(pageHref(file), label, {
                  'aria-current':
                    page.file === file || page.file.startsWith(file.replace('.html', '') + '/')
                      ? 'page'
                      : undefined,
                })}
              </span>
            ))}
          </nav>
        </div>
      </header>
      <main className="container" id="main-content" tabIndex={-1}>
        <PageContent page={page} />
      </main>
      <footer className="site-footer">
        <div className="container">
          <p className="footer-legal">
            <span>© 2024–{new Date().getFullYear()} Zodiac Esports. All rights reserved.</span>{' '}
            <span className="footer-legal-separator" aria-hidden="true">
              ·
            </span>{' '}
            Overwatch and its hero icons belong to Blizzard Entertainment; VALORANT and its agent
            icons belong to Riot Games. Used for non-commercial purposes only.
          </p>
        </div>
      </footer>
      {commerce && <CommerceScripts kind={page.file === 'store.html' ? 'store' : 'account'} />}
    </PageMotion>
  );
}
