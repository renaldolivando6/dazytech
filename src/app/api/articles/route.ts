import { NextResponse } from 'next/server';
import { listPublishedArticles } from '@/lib/articles/queries';
import { getDb } from '@/lib/db/client';

export const dynamic = 'force-dynamic';

// Artikel terbaru untuk menu samping di halaman publik.
export function GET() {
  const items = listPublishedArticles(getDb(), 3).map((a) => ({
    slug: a.slug,
    title: a.title,
    publishedAt: a.publishedAt?.toISOString() ?? null,
  }));
  return NextResponse.json({ items }, { headers: { 'Cache-Control': 'public, max-age=60' } });
}
