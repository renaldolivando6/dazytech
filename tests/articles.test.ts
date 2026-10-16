import { describe, expect, it } from 'vitest';
import { readingMinutes, renderMarkdown } from '@/lib/articles/markdown';
import {
  ArticleError,
  deleteArticle,
  findArticle,
  findPublishedArticle,
  listAllArticles,
  listPublishedArticles,
  saveArticle,
} from '@/lib/articles/queries';
import { SLUG_PATTERN, slugify } from '@/lib/articles/slug';
import { users } from '@/lib/db/schema';
import { memoryDb } from './helpers';

describe('slugify', () => {
  it('membuat slug huruf kecil dengan tanda hubung', () => {
    expect(slugify('Cara Memilih ERP untuk UKM (2026)')).toBe('cara-memilih-erp-untuk-ukm-2026');
    expect(slugify('  Kasir & Stok: Panduan Café  ')).toBe('kasir-dan-stok-panduan-cafe');
    expect(slugify('---')).toBe('');
  });

  it('dibatasi 80 karakter tanpa tanda hubung di ujung', () => {
    const slug = slugify('kata '.repeat(40));
    expect(slug.length).toBeLessThanOrEqual(80);
    expect(slug).toMatch(SLUG_PATTERN);
  });
});

describe('renderMarkdown', () => {
  it('merender Markdown biasa', () => {
    const html = renderMarkdown('## Judul\n\nTeks **tebal** dan [link](/artikel/).');
    expect(html).toContain('<h2>Judul</h2>');
    expect(html).toContain('<strong>tebal</strong>');
    expect(html).toContain('<a href="/artikel/">link</a>');
  });

  it('tidak mengeksekusi HTML mentah maupun link javascript:', () => {
    const html = renderMarkdown('<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>\n\n[klik](javascript:alert(1))');
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img src=x');
    expect(html).not.toContain('href="javascript:');
    expect(html).toContain('&lt;script&gt;');
  });

  it('link keluar dibuka di tab baru, link internal tidak', () => {
    expect(renderMarkdown('[a](https://contoh.com)')).toContain('target="_blank" rel="noopener noreferrer"');
    expect(renderMarkdown('[a](https://dazytech.web.id/artikel/)')).not.toContain('target=');
  });

  it('waktu baca minimal 1 menit', () => {
    expect(readingMinutes('')).toBe(1);
    expect(readingMinutes('kata '.repeat(1000))).toBe(5);
  });
});

describe('artikel', () => {
  function setup() {
    const db = memoryDb();
    const user = db.insert(users).values({ username: 'admin', passwordHash: 'x' }).returning({ id: users.id }).get();
    return { db, userId: user.id };
  }
  const base = { title: 'Judul artikel', slug: 'judul-artikel', excerpt: 'Ringkasan.', content: 'Isi artikel yang cukup panjang.' };

  it('draft tidak tampil di publik; terbit mengisi tanggal terbit sekali saja', () => {
    const { db, userId } = setup();
    const id = saveArticle(db, null, { ...base, status: 'draft' }, userId);
    expect(findArticle(db, id)?.publishedAt).toBeNull();
    expect(listPublishedArticles(db)).toHaveLength(0);
    expect(findPublishedArticle(db, 'judul-artikel')).toBeNull();

    saveArticle(db, id, { ...base, status: 'published' }, userId);
    const firstPublished = findArticle(db, id)?.publishedAt;
    expect(firstPublished).toBeInstanceOf(Date);
    expect(findPublishedArticle(db, 'judul-artikel')?.id).toBe(id);
    expect(listPublishedArticles(db).map((a) => a.id)).toEqual([id]);

    // Diedit / ditarik ke draft lalu terbit lagi: tanggal terbit tetap yang pertama.
    saveArticle(db, id, { ...base, title: 'Judul baru', status: 'draft' }, userId);
    expect(listPublishedArticles(db)).toHaveLength(0);
    saveArticle(db, id, { ...base, status: 'published' }, userId);
    expect(findArticle(db, id)?.publishedAt?.getTime()).toBe(firstPublished?.getTime());
  });

  it('slug harus unik', () => {
    const { db, userId } = setup();
    saveArticle(db, null, { ...base, status: 'published' }, userId);
    const other = saveArticle(db, null, { ...base, slug: 'lain', status: 'draft' }, userId);
    expect(() => saveArticle(db, null, { ...base, status: 'draft' }, userId)).toThrow(ArticleError);
    expect(() => saveArticle(db, other, { ...base, status: 'draft' }, userId)).toThrow(/sudah dipakai/);
    // Menyimpan artikel dengan slug miliknya sendiri tetap boleh.
    expect(() => saveArticle(db, other, { ...base, slug: 'lain', status: 'published' }, userId)).not.toThrow();
  });

  it('hapus artikel', () => {
    const { db, userId } = setup();
    const id = saveArticle(db, null, { ...base, status: 'published' }, userId);
    deleteArticle(db, id);
    expect(listAllArticles(db)).toHaveLength(0);
  });
});
