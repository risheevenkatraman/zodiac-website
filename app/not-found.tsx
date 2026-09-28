import Link from 'next/link';
export default function NotFound() {
  return (
    <main className="container cosmic-not-found">
      <p className="eyebrow">Beyond our orbit / 404</p>
      <h1>This star is off the map.</h1>
      <p>
        <Link href="/">Return to Zodiac</Link>
      </p>
    </main>
  );
}
