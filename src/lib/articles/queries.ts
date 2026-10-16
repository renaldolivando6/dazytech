import { and, desc, eq, ne } from 'drizzle-orm';
import type { DB } from '@/lib/db/open';
import { articles, type Article } from '@/lib/db/schema';

export class ArticleError extends Error {
  constructor(
    message: string,
    readonly field?: string,
  ) {
    super(message);
  }
}

export type ArticleSummary = Pick<Article, 'id' | 'slug' | 'title' | 'excerpt' | 'publishedAt' | 'updatedAt'>;

const summaryColumns = {
  id: articles.id,
  slug: articles.slug,
  title: articles.title,
  excerpt: articles.excerpt,
  publishedAt: articles.publishedAt,
  updatedAt: articles.updatedAt,
};

// ---------------------------------------------------------------- publik

export function listPublishedArticles(db: DB, limit = 50): ArticleSummary[] {
  return db
    .select(summaryColumns)
    .from(articles)
    .where(eq(articles.status, 'published'))
    .orderBy(desc(articles.publishedAt), desc(articles.id))
    .limit(limit)
    .all();
}

export function findPublishedArticle(db: DB, slug: string): Article | null {
  return (
    db
      .select()
      .from(articles)
      .where(and(eq(articles.slug, slug), eq(articles.status, 'published')))
      .get() ?? null
  );
}

// ---------------------------------------------------------------- admin

export function listAllArticles(db: DB) {
  return db
    .select({ ...summaryColumns, status: articles.status })
    .from(articles)
    .orderBy(desc(articles.updatedAt), desc(articles.id))
    .all();
}

export function findArticle(db: DB, id: number): Article | null {
  return db.select().from(articles).where(eq(articles.id, id)).get() ?? null;
}

export type ArticleInput = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: 'draft' | 'published';
};

// id null = artikel baru. Mengembalikan id artikel.
export function saveArticle(db: DB, id: number | null, input: ArticleInput, authorId: number): number {
  return db.transaction((tx) => {
    const clash = tx
      .select({ id: articles.id })
      .from(articles)
      .where(id === null ? eq(articles.slug, input.slug) : and(eq(articles.slug, input.slug), ne(articles.id, id)))
      .get();
    if (clash) throw new ArticleError('Slug ini sudah dipakai artikel lain.', 'slug');

    if (id === null) {
      return tx
        .insert(articles)
        .values({ ...input, authorId, publishedAt: input.status === 'published' ? new Date() : null })
        .returning({ id: articles.id })
        .get().id;
    }

    const existing = tx.select({ publishedAt: articles.publishedAt }).from(articles).where(eq(articles.id, id)).get();
    if (!existing) throw new ArticleError('Artikel tidak ditemukan.');
    // Tanggal terbit hanya diisi sekali, saat pertama kali terbit.
    const publishedAt = existing.publishedAt ?? (input.status === 'published' ? new Date() : null);
    tx.update(articles).set({ ...input, publishedAt }).where(eq(articles.id, id)).run();
    return id;
  });
}

export function deleteArticle(db: DB, id: number): void {
  db.delete(articles).where(eq(articles.id, id)).run();
}
