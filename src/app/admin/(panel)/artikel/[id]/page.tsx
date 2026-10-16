import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { findArticle } from '@/lib/articles/queries';
import { requireApp } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';
import { ArticleEditor } from '../editor';

export const metadata: Metadata = { title: 'Edit artikel' };

export default async function EditArticlePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ baru?: string }>;
}) {
  await requireApp('website');
  const { id } = await params;
  const { baru } = await searchParams;
  const numericId = Number.parseInt(id, 10);
  const article = Number.isSafeInteger(numericId) ? findArticle(getDb(), numericId) : null;
  if (!article) notFound();

  return (
    <ArticleEditor
      justCreated={!!baru}
      article={{
        id: article.id,
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        content: article.content,
        status: article.status,
      }}
    />
  );
}
