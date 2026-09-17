import SitePage from '../components/SitePage';
import { readPage } from '../lib/content';

export default function HomePage() {
  return <SitePage page={readPage('index.html')} />;
}
