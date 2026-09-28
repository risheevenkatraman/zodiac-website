import SitePage from '../components/SitePage';
import { readPage, readData } from '../lib/content';
import { pageMetadata, siteOrigin, siteName, logoUrl, defaultDescription } from '../lib/seo';

export function generateMetadata() {
  return pageMetadata(readPage('index.html'));
}

export default function HomePage() {
  const homePage = readPage('index.html');
  if (!homePage) throw new Error('Homepage metadata is missing');
  const organizationId = `${siteOrigin}/#organization`;
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': organizationId,
        name: siteName,
        url: `${siteOrigin}/`,
        logo: logoUrl(),
        foundingDate: '2024',
        description: defaultDescription,
        sameAs: readData('site')
          .socials.map((social) => social.url)
          .filter((url) => url.startsWith('https://')),
      },
      {
        '@type': 'WebSite',
        '@id': `${siteOrigin}/#website`,
        name: siteName,
        url: `${siteOrigin}/`,
        publisher: { '@id': organizationId },
      },
    ],
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, '\\u003c'),
        }}
      />
      <SitePage page={homePage} />
    </>
  );
}
