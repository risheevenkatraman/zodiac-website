import { notFound } from 'next/navigation';
import SitePage from '../../components/SitePage';
import { pageFiles, readPage } from '../../lib/content';

export const dynamicParams = false;
export function generateStaticParams() {
  return pageFiles()
    .filter((file) => file !== 'index.html')
    .map((file) => ({ slug: file.replace(/\.html$/, '').split('/') }));
}
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const page = readPage(slug.join('/') + '.html');
  return {
    title: page?.title || 'Page not found',
    ...(page?.description ? { description: page.description } : {}),
  };
}
export default async function ContentPage({ params }) {
  const { slug } = await params;
  const page = readPage(slug.join('/') + '.html');
  if (!page) notFound();
  return <SitePage key={page.file} page={page} />;
}
