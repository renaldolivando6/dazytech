import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { whatsappUrl } from '@/components/site/content';
import { SiteFooter } from '@/components/site/footer';
import { SiteNav } from '@/components/site/nav';
import { getCopy } from '@/i18n';
import { readingMinutes, renderMarkdown } from '@/lib/articles/markdown';
import { findPublishedArticle } from '@/lib/articles/queries';
import { getDb } from '@/lib/db/client';
import { shareMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

// Artikel hanya bahasa Indonesia.
const t = getCopy('id');

const BASE_URL = 'https://dazytech.web.id';
const dateFmt = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' });

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = findPublishedArticle(getDb(), slug);
  if (!article) return { title: 'Artikel tidak ditemukan', robots: { index: false } };

  const url = `/artikel/${article.slug}/`;
  return {
    title: article.title,
    description: article.excerpt || undefined,
    alternates: { canonical: url },
    ...shareMetadata({
      locale: 'id',
      title: article.title,
      description: article.excerpt || undefined,
      url,
      article: { publishedTime: article.publishedAt?.toISOString(), modifiedTime: article.updatedAt.toISOString() },
    }),
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = findPublishedArticle(getDb(), slug);
  if (!article) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    description: article.excerpt || undefined,
    datePublished: article.publishedAt?.toISOString(),
    dateModified: article.updatedAt.toISOString(),
    mainEntityOfPage: `${BASE_URL}/artikel/${article.slug}/`,
    inLanguage: 'id-ID',
    author: { '@type': 'Organization', name: 'Dazytech Solutions', url: BASE_URL },
    publisher: {
      '@type': 'Organization',
      name: 'Dazytech Solutions',
      logo: { '@type': 'ImageObject', url: `${BASE_URL}/dazytech-logo-circle.png` },
    },
  };

  return (
    <div className="bg-white text-ink">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <SiteNav locale="id" copy={t.nav} waText={t.wa.general} />
      <main className="px-4 pb-24 pt-12 sm:px-6 sm:pt-16">
        <article className="mx-auto max-w-[720px]">
          <Link href="/artikel/" className="text-[14px] text-accent hover:underline">
            ‹ Artikel
          </Link>
          <header className="mt-8 border-b border-hairline pb-8">
            <p className="text-[14px] text-muted">
              {article.publishedAt && <time dateTime={article.publishedAt.toISOString()}>{dateFmt.format(article.publishedAt)}</time>}
              {' · '}
              {readingMinutes(article.content)} menit baca
            </p>
            <h1 className="mt-3 text-balance text-[34px] font-semibold leading-[1.08] tracking-[-0.03em] sm:text-[48px]">{article.title}</h1>
            {article.excerpt && <p className="mt-4 text-[19px] leading-[1.42] tracking-[-0.02em] text-muted sm:text-[21px]">{article.excerpt}</p>}
          </header>

          {/* Aman: Markdown dirender dengan html:false (tag HTML mentah tidak dieksekusi). */}
          <div className="article-body mt-10" dangerouslySetInnerHTML={{ __html: renderMarkdown(article.content) }} />

          <aside className="mt-16 rounded-[18px] bg-parchment p-8 text-center">
            <p className="text-[21px] font-semibold tracking-[-0.01em]">Butuh sistem atau website untuk bisnis Anda?</p>
            <p className="mt-2 text-[15px] text-muted">Konsultasi gratis. ERP & aplikasi bisnis sesuai cakupan, website company profile mulai Rp500 ribu.</p>
            <a
              href={whatsappUrl(`Halo Dazytech, saya baru membaca artikel "${article.title}" dan mau konsultasi.`)}
              data-cta="wa_general"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-block rounded-full bg-accent px-6 py-2.5 text-[15px] text-white transition-[background-color,transform] hover:bg-accent-hover active:scale-95"
            >
              Chat WhatsApp
            </a>
          </aside>
        </article>
      </main>
      <SiteFooter locale="id" copy={t.footer} nav={t.nav} waText={t.wa.general} />
    </div>
  );
}
