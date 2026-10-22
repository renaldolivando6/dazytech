import type { Metadata } from 'next';
import Link from 'next/link';
import { fontVars } from '@/app/jason-jonathan-shella-wedding-gacha-gift/_ui/fonts';
import { requireAdmin } from '@/lib/auth/session';
import { GACHA_URL } from '@/lib/gacha/config';
import { qrSvgPath } from '@/lib/gacha/qr';
import { ScreenCard } from './screen-card';
import styles from './screen-card.module.css';

export const metadata: Metadata = { title: 'Kartu QR hadiah' };

// Kartu QR hadiah Jajo & Eng untuk di-screenshot lalu dikirim sebagai gambar.
// Di luar route group (panel) supaya tidak ada nav admin di sekitar kartu.
export default async function HadiahQrPage() {
  await requireAdmin();

  return (
    <div className={fontVars}>
      <header className="border-b border-black/[0.06]">
        <div className="mx-auto max-w-[960px] px-4 py-5 sm:px-8">
          <Link href="/admin/hadiah/" className="text-[14px] text-accent hover:underline">
            Kembali ke Hadiah
          </Link>
          <h1 className="mt-1 text-[21px] font-semibold leading-tight">Kartu QR hadiah</h1>
          <p className="mt-3 max-w-2xl text-[13px] text-muted">
            Screenshot kartunya, lalu kirim lewat WA. Paling tajam kalau di-screenshot dari HP. Di laptop, zoom browser ke 200% dulu.
            Kamera iPhone dan Google Lens bisa membaca QR langsung dari gambar.
          </p>
          <p className="mt-2 text-[13px] text-muted">
            QR mengarah ke <span className="font-mono text-[12px] text-ink">{GACHA_URL}</span>. Penerima tetap perlu PIN.
          </p>
        </div>
      </header>
      <main className={styles.stage}>
        <ScreenCard qr={qrSvgPath(GACHA_URL)} />
      </main>
    </div>
  );
}
