import { asset } from '../lib/paths';
import './motion.css';

export const metadata = {
  title: { default: 'Zodiac Esports', template: '%s' },
  description:
    'Written in the Stars. Destined for Victory. Meet the Zodiac Esports community, established in 2024.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href={asset('assets/uploads/zodiac-logo.png')} />
        <link rel="stylesheet" href={asset('css/styles.css')} />
        <link rel="stylesheet" href={asset('css/store.css')} />
        <link rel="stylesheet" href={asset('css/typography.css')} />
      </head>
      <body>{children}</body>
    </html>
  );
}
