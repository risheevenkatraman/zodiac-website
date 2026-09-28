import SitePage from '../components/SitePage';
import { readPage } from '../lib/content';

export function generateMetadata() {
  const { title, description } = readPage('index.html');
  return { title, description };
}

export default function HomePage() {
  return <SitePage page={readPage('index.html')} />;
}
