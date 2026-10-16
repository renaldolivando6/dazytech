import type { Metadata } from 'next';
import type { Locale } from '@/i18n';

// Gambar pratinjau saat link dibagikan (WhatsApp, LinkedIn, X), 1200×630.
// Dibuat dari tampilan hero; buat ulang kalau headline atau logo berubah.
const OG_IMAGE: Record<Locale, string> = { id: '/og/dazytech-id.png', en: '/og/dazytech-en.png' };

// Next.js tidak menggabungkan `openGraph`/`twitter` milik halaman dengan milik
// layout: begitu halaman mengisi openGraph, gambar & siteName dari layout hilang.
// Karena itu setiap halaman publik mengambil keduanya dari helper ini.
export function shareMetadata({
  locale,
  title,
  description,
  url,
  article,
}: {
  locale: Locale;
  title: string;
  description?: string;
  url: string;
  article?: { publishedTime?: string; modifiedTime?: string };
}): Pick<Metadata, 'openGraph' | 'twitter'> {
  const image = OG_IMAGE[locale];
  const common = {
    siteName: 'Dazytech Solutions',
    locale: locale === 'en' ? 'en_US' : 'id_ID',
    title,
    description,
    url,
    images: [{ url: image, width: 1200, height: 630, alt: 'Dazytech Solutions' }],
  };
  return {
    openGraph: article ? { ...common, type: 'article', ...article } : { ...common, type: 'website' },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  };
}
