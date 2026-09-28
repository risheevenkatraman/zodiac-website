import type { Metadata } from 'next';
import type { Page } from './types';
import { asset, pageHref } from './paths';

export const siteOrigin = 'https://www.zodiacgg.com';
export const siteName = 'Zodiac Esports';
export const defaultDescription =
  'Meet Zodiac Esports, an Overwatch and VALORANT organization established in 2024. Follow our teams, meet the community, and explore official merchandise.';
export const absoluteUrl = (pathname: string) => new URL(pathname, siteOrigin).href;
export const logoUrl = () => absoluteUrl(asset('assets/uploads/zodiac-logo.png'));

export function pageMetadata(page: Page | null): Metadata {
  if (!page) return { title: 'Page not found', robots: { index: false } };
  const title = page.title;
  const description =
    page.description ||
    (page.team
      ? `Meet ${page.team.name}, Zodiac Esports' ${page.team.game} team. Explore the roster, player profiles, and signature picks.`
      : defaultDescription);
  // Clean routes and their legacy .html copies share one canonical URL.
  const url = absoluteUrl(pageHref(page.file));
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      siteName,
      title,
      description,
      url,
      images: [{ url: logoUrl(), width: 1000, height: 1000, alt: `${siteName} logo` }],
    },
    twitter: { card: 'summary', title, description, images: [logoUrl()] },
  };
}
