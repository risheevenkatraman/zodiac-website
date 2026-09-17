import parse, { domToReact } from 'html-react-parser';
import path from 'node:path';
import Link from './SiteLink';
import { readData } from '../lib/content';
import { asset, basePath, pageHref } from '../lib/paths';
import PageMotion from './PageMotion';
import Constellation from './Constellation';
import HeroLogo from './HeroLogo';
import CommerceConstellation from './CommerceConstellation';
import AccountTiers from './AccountTiers';
import Roster from './Roster';
import Events from './Events';
import CommerceScripts from './CommerceScripts';
import ProfileSocialLink from './ProfileSocialLink';

const navigation = [
  ['Home', 'index.html'],
  ['Teams', 'teams.html'],
  ['Staff', 'staff.html'],
  ['Store', 'store.html'],
  ['Socials', 'socials.html'],
  ['Account & Stars', 'account.html'],
];
const commerceFiles = new Set(['store.html', 'account.html']);

export default function SitePage({ page }) {
  const commerce = commerceFiles.has(page.file);
  const team = readData('players').find((team) => team.page === page.file);
  const site = readData('site');
  const currentHref = pageHref(page.file);
  function resolve(value) {
    if (!value || /^(?:[a-z]+:|\/\/)/i.test(value)) return value;
    if (value.startsWith('#')) return `${basePath}${currentHref}${value}`;
    const [pathname, suffix = ''] = value.split(/(?=[?#])/);
    const file = path.posix.normalize(path.posix.join(path.posix.dirname(page.file), pathname));
    return file.endsWith('.html') ? `${basePath}${pageHref(file)}${suffix}` : asset(file) + suffix;
  }
  function renderLink(href, children, props = {}) {
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
  const options = {
    replace(node) {
      if (!node.attribs) return;
      const attrs = node.attribs;
      if (node.name === 'script') return <></>;
      if (attrs.class === 'hero-art') return <HeroLogo />;
      if (commerce && /\b(?:shop|account)-hero\b/.test(attrs.class || ''))
        return (
          <section className={`${attrs.class} commerce-hero`}>
            <div className="commerce-hero-copy">{domToReact(node.children, options)}</div>
            <CommerceConstellation />
          </section>
        );
      if (attrs.id === 'membership-tiers') return <AccountTiers />;
      if (attrs.class === 'roster-tools') return <></>;
      if (attrs.class === 'roster-grid' && team)
        return <Roster players={team.players} game={team.game} />;
      if (attrs.class === 'staff-grid') return <Roster players={readData('staff')} staff />;
      if (attrs.class === 'team-constellation')
        return (
          <Constellation house={attrs['data-house']}>
            {domToReact(node.children, options)}
          </Constellation>
        );
      if (attrs.id === 'event-timeline') return <Events initialEvents={readData('events')} />;
      if (attrs.id === 'pinned-announcement') {
        const announcement = readData('announcement');
        return (
          <article id="pinned-announcement" className="announcement-card">
            <img src={asset(announcement.image)} alt="" loading="lazy" />
            <div>
              <p className="eyebrow">Pinned update</p>
              <h4>{announcement.title}</h4>
              <p>{announcement.message}</p>
            </div>
          </article>
        );
      }
      if (attrs.id === 'home-title') return <h1 id="home-title">{site.homeTitle}</h1>;
      if (attrs.class === 'hero-intro')
        return <p className="hero-intro">{site.homeIntroduction}</p>;
      if (attrs.class === 'social-grid')
        return (
          <div className="social-grid">
            {site.socials
              .filter((social) => social.url.startsWith('https://'))
              .map((social) => (
                <a className="social-card" href={social.url} key={social.url}>
                  {social.image && (
                    <span className="social-icon">
                      <img src={asset(social.image)} alt="" />
                    </span>
                  )}
                  <span>
                    <strong>{social.label}</strong>
                    <small>{social.description}</small>
                  </span>
                </a>
              ))}
          </div>
        );
      if (node.name === 'a' && attrs.href) {
        const href = resolve(attrs.href);
        if (/^(players|staff)\//.test(page.file) && attrs.class === 'social-card')
          return (
            <ProfileSocialLink
              url={href}
              label={node.children.find((child) => child.type === 'text')?.data?.trim()}
            />
          );
        const props = {
          className: attrs.class,
          id: attrs.id,
          'aria-label': attrs['aria-label'],
          'aria-current': attrs['aria-current'],
          'data-player': attrs['data-player'],
          target: attrs.target,
          rel: attrs.rel,
        };
        // Preserve generated label positions without injecting HTML.
        if (attrs.style) props.style = { top: attrs.style.match(/top:\s*([^;]+)/)?.[1] };
        const internal = href.startsWith(basePath + '/') && !href.includes('/data/');
        if (
          internal &&
          !commerce &&
          !href.startsWith(asset('account/')) &&
          !href.startsWith(asset('store/'))
        )
          return (
            <Link href={href.slice(basePath.length)} {...props}>
              {domToReact(node.children, options)}
            </Link>
          );
        return (
          <a href={href} {...props}>
            {domToReact(node.children, options)}
          </a>
        );
      }
      if (attrs.src) attrs.src = resolve(attrs.src);
      if (attrs.href) attrs.href = resolve(attrs.href);
    },
  };
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
                src={asset('assets/zodiac-logo.png')}
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
      <main className="container" id="main-content" tabIndex="-1">
        {parse(page.content, options)}
      </main>
      <footer className="site-footer">
        <div className="container">
          © 2024–{new Date().getFullYear()} Zodiac Esports — All rights reserved
          <p className="disclaimer">
            Overwatch and its hero icons are property of Blizzard Entertainment. They are used here
            for non-commercial purposes only.
          </p>
          <p className="disclaimer">
            VALORANT and its agent icons are property of Riot Games. They are used here for
            non-commercial purposes only.
          </p>
        </div>
      </footer>
      {commerce && <CommerceScripts kind={page.file.replace('.html', '')} />}
    </PageMotion>
  );
}
