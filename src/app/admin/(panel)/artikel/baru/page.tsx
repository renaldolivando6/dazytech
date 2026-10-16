import type { Metadata } from 'next';
import { requireApp } from '@/lib/auth/session';
import { ArticleEditor } from '../editor';

export const metadata: Metadata = { title: 'Artikel baru' };

export default async function NewArticlePage() {
  await requireApp('website');
  return <ArticleEditor article={null} />;
}
