import { MetadataRoute } from 'next';
import { LEGAL_UPDATED, legalHref } from '@/i18n/legal';
import { listPublishedArticles } from '@/lib/articles/queries';
import { getDb } from '@/lib/db/client';

// Dinamis: artikel yang baru terbit langsung masuk sitemap tanpa build ulang.
export const dynamic = 'force-dynamic';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://dazytech.web.id';
    const articles = listPublishedArticles(getDb(), 1000);
    // Beranda dua bahasa saling menunjuk lewat hreflang. lastModified hanya diisi
    // kalau tanggal perubahannya benar-benar diketahui (panduan sitemap Google).
    const homeLanguages = { 'id-ID': `${baseUrl}/`, en: `${baseUrl}/en/` };

    return [
        {
            url: `${baseUrl}/`,
            changeFrequency: 'weekly',
            priority: 1,
            alternates: { languages: homeLanguages },
        },
        {
            url: `${baseUrl}/en/`,
            changeFrequency: 'weekly',
            priority: 0.9,
            alternates: { languages: homeLanguages },
        },
        ...(['privacy', 'terms'] as const).flatMap((kind) => {
            const languages = { 'id-ID': `${baseUrl}${legalHref('id', kind)}`, en: `${baseUrl}${legalHref('en', kind)}` };
            return [languages['id-ID'], languages.en].map((url) => ({
                url,
                lastModified: new Date(LEGAL_UPDATED),
                changeFrequency: 'yearly' as const,
                priority: 0.3,
                alternates: { languages },
            }));
        }),
        {
            url: `${baseUrl}/artikel/`,
            lastModified: articles[0]?.updatedAt,
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        ...articles.map((a) => ({
            url: `${baseUrl}/artikel/${a.slug}/`,
            lastModified: a.updatedAt,
            changeFrequency: 'monthly' as const,
            priority: 0.7,
        })),
    ];
}
