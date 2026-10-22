import type { Metadata, Viewport } from 'next';
import { getDb } from '@/lib/db/client';
import { viewerState } from '@/lib/gacha/access';
import { ensureDevCampaign } from '@/lib/gacha/service';
import { META } from './_ui/copy';
import { fontVars } from './_ui/fonts';
import { GachaApp } from './gacha-app';
import styles from './gacha.module.css';

// Hadiah nikahan pribadi untuk Jajo & Eng. Tampilannya sendiri (bukan design
// system Apple), tidak diindeks, tidak masuk sitemap maupun robots.txt.
// Dinamis: state dihitung dari cookie PIN di setiap request.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  // absolute: tidak ikut template "| Dazytech Solutions" dari root layout.
  title: { absolute: META.title },
  description: META.description,
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  // Gambar OG/Twitter dari konvensi file (opengraph-image.tsx), bukan dari sini.
  openGraph: {
    title: META.title,
    description: META.description,
    type: 'website',
    locale: 'id_ID',
  },
  twitter: { card: 'summary_large_image', title: META.title, description: META.description },
};

export const viewport: Viewport = {
  themeColor: '#0F0C0B',
  colorScheme: 'dark',
  viewportFit: 'cover',
  // Keyboard PIN mengecilkan layout (Android), jadi kartu PIN tetap terlihat.
  interactiveWidget: 'resizes-content',
};

export default async function WeddingGachaPage() {
  const db = getDb();
  if (process.env.NODE_ENV !== 'production') ensureDevCampaign(db);
  const initialState = await viewerState(db);

  return (
    <div className={`${fontVars} ${styles.root}`}>
      <GachaApp initialState={initialState} />
    </div>
  );
}
