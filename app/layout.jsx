import { asset } from '../lib/paths';
import { siteOrigin, defaultDescription } from '../lib/seo';
import './motion.css';

export const metadata = {
  metadataBase: new URL(siteOrigin),
  title: { default: 'Zodiac Esports', template: '%s' },
  description: defaultDescription,
  icons: {
    icon: [{ url: asset('assets/uploads/zodiac-logo.png'), type: 'image/png', sizes: '1000x1000' }],
    apple: [{ url: asset('assets/uploads/zodiac-logo.png'), sizes: '1000x1000' }],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href={asset('css/styles.css')} />
        <link rel="stylesheet" href={asset('css/store.css')} />
        <link rel="stylesheet" href={asset('css/typography.css')} />
      </head>
      <body>{children}</body>
    </html>
  );
}
