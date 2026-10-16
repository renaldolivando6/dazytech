import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteFooter } from '@/components/site/footer';
import { SiteNav } from '@/components/site/nav';
import { getCopy } from '@/i18n';
import { listPublishedArticles } from '@/lib/articles/queries';
import { getDb } from '@/lib/db/client';
import { shareMetadata } from '@/lib/seo';

// Dibaca dari SQLite setiap request: artikel baru langsung muncul tanpa build ulang.
export const dynamic = 'force-dynamic';

// Artikel hanya bahasa Indonesia.
const t = getCopy('id');

const description = 'Catatan seputar website, aplikasi bisnis, dan teknologi untuk usaha di Indonesia dari tim Dazytech Solutions.';

export const metadata: Metadata = {
  title: 'Artikel',
  description,
  alternates: { canonical: '/artikel/' },
  ...shareMetadata({ locale: 'id', title: 'Artikel · Dazytech Solutions', description, url: '/artikel/' }),
};

const dateFmt = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' });

export default function ArticlesPage() {
  const articles = listPublishedArticles(getDb());

  return (
    <div className="bg-white text-ink">
      <SiteNav locale="id" copy={t.nav} waText={t.wa.general} />
      <main className="mx-auto min-h-[60vh] max-w-[820px] px-4 pb-24 pt-16 sm:px-6 sm:pt-24">
        <h1 className="text-[40px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[56px]">Artikel</h1>
        <p className="mt-4 max-w-[560px] text-[19px] leading-[1.42] tracking-[-0.02em] text-muted sm:text-[21px]">
          Catatan seputar website, aplikasi bisnis, dan teknologi untuk usaha di Indonesia.
        </p>

        {articles.length === 0 ? (
          <p className="mt-16 border-t border-hairline pt-8 text-[17px] text-muted">Artikel pertama segera terbit.</p>
        ) : (
          <ul className="mt-14 border-t border-hairline">
            {articles.map((a) => (
              <li key={a.id} className="border-b border-hairline">
                <Link href={`/artikel/${a.slug}/`} className="group block py-8">
                  {a.publishedAt && (
                    <time dateTime={a.publishedAt.toISOString()} className="text-[14px] text-muted">
                      {dateFmt.format(a.publishedAt)}
                    </time>
                  )}
                  <h2 className="mt-1 text-[24px] font-semibold leading-[1.2] tracking-[-0.02em] group-hover:text-accent sm:text-[28px]">{a.title}</h2>
                  {a.excerpt && <p className="mt-2 text-[17px] leading-[1.47] tracking-[-0.022em] text-muted">{a.excerpt}</p>}
                  <span className="mt-3 inline-block text-[15px] text-accent">Baca ›</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
      <SiteFooter locale="id" copy={t.footer} nav={t.nav} waText={t.wa.general} />
    </div>
  );
}
