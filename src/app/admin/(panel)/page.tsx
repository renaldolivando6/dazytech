import { count, eq } from 'drizzle-orm';
import { ChevronRight, Gift, Lock, Newspaper, Percent, Users, type LucideIcon } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Alert, buttonClass, cx } from '@/components/admin/ui';
import { APPS, appName, isAppKey, type AppKey } from '@/lib/auth/apps';
import { requireUser } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';
import { articles, companies, leads, users } from '@/lib/db/schema';
import { COUPLE } from '@/lib/gacha/config';
import { adminSummary } from '@/lib/gacha/service';

export const metadata: Metadata = { title: 'Portal' };

const ICONS: Record<AppKey, LucideIcon> = { website: Newspaper, komisi: Percent };

// Ringkasan kecil di kartu aplikasi (hanya untuk aplikasi yang boleh dibuka).
function summaryOf(app: AppKey): string {
  const db = getDb();
  if (app === 'website') {
    const published = db.select({ n: count() }).from(articles).where(eq(articles.status, 'published')).get()?.n ?? 0;
    const fresh = db.select({ n: count() }).from(leads).where(eq(leads.status, 'new')).get()?.n ?? 0;
    return `${published} artikel terbit · ${fresh} lead baru`;
  }
  const n = db.select({ n: count() }).from(companies).get()?.n ?? 0;
  return `${n} company`;
}

// Halaman pertama setelah login: satu kolom di tengah. Aplikasi tanpa akses
// tetap tampil, terkunci.
export default async function PortalPage({ searchParams }: { searchParams: Promise<{ terkunci?: string }> }) {
  const user = await requireUser();
  const { terkunci } = await searchParams;
  const userCount = user.role === 'admin' ? (getDb().select({ n: count() }).from(users).get()?.n ?? 0) : 0;

  return (
    <main className="mx-auto max-w-[920px] px-4 pb-16 pt-12 sm:px-8 sm:pt-16">
      <h1 className="text-[34px] font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[40px]">Halo, {user.username}.</h1>
      <p className="mt-2 text-[17px] leading-[1.47] text-muted">Pilih aplikasi yang mau dibuka.</p>

      {isAppKey(terkunci) && !user.apps.includes(terkunci) && (
        <div className="mt-6">
          <Alert tone="amber" title={`Akun ini belum punya akses ke ${appName(terkunci)}`}>
            Minta admin Dazytech untuk membukakan akses.
          </Alert>
        </div>
      )}

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {APPS.map((app) => {
          const Icon = ICONS[app.key];
          const allowed = user.apps.includes(app.key);
          const body = (
            <>
              <div className="flex items-start justify-between">
                <span className={cx('grid size-12 place-items-center rounded-[14px]', allowed ? 'bg-accent text-white' : 'bg-black/[0.06] text-faint')}>
                  <Icon className="size-6" strokeWidth={1.8} aria-hidden />
                </span>
                {!allowed && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-black/[0.05] px-2.5 py-1 text-[12px] text-muted">
                    <Lock className="size-3" strokeWidth={2.2} aria-hidden />
                    Terkunci
                  </span>
                )}
              </div>
              <p className={cx('mt-6 text-[21px] font-semibold leading-[1.19] tracking-[-0.01em]', !allowed && 'text-ink-80')}>{app.name}</p>
              <p className="mt-2 text-[14px] leading-[1.43] text-muted">{app.description}</p>
              <p className="mt-6 flex items-center justify-between border-t border-divider pt-4 text-[13px]">
                {allowed ? (
                  <>
                    <span className="text-muted">{summaryOf(app.key)}</span>
                    <span className="inline-flex items-center gap-0.5 text-accent">
                      Buka
                      <ChevronRight className="size-4" strokeWidth={2} aria-hidden />
                    </span>
                  </>
                ) : (
                  <span className="text-muted">Tidak ada akses. Hubungi admin Dazytech.</span>
                )}
              </p>
            </>
          );

          return allowed ? (
            <Link
              key={app.key}
              href={app.href}
              className="block rounded-[18px] border border-black/[0.08] bg-white p-6 transition-[border-color,transform] hover:border-accent/40 active:scale-[0.99]"
            >
              {body}
            </Link>
          ) : (
            <div
              key={app.key}
              aria-disabled="true"
              title={`Tidak ada akses ke ${app.name}`}
              className="cursor-not-allowed select-none rounded-[18px] border border-dashed border-black/[0.12] bg-pearl p-6 opacity-75"
            >
              {body}
            </div>
          );
        })}
      </div>

      {user.role === 'admin' && (
        <>
          <AdminLink icon={Users} title="Pengguna & akses" hint={`${userCount} akun · atur siapa boleh membuka aplikasi apa.`} href="/admin/pengguna/" />
          <AdminLink icon={Gift} title={`Hadiah ${COUPLE.groom.nick} & ${COUPLE.bride.nick}`} hint={giftHint()} href="/admin/hadiah/" />
        </>
      )}
    </main>
  );
}

// Progres hadiah nikahan (lib/gacha), hanya untuk admin.
function giftHint(): string {
  const s = adminSummary(getDb());
  if (!s.configured) return 'Belum diatur · isi kode voucher dan PIN.';
  const progress = `${COUPLE.groom.nick} sudah putar ${s.spun}/${s.total}`;
  return s.pending ? `${progress} · satu putaran belum selesai dibuka` : progress;
}

// Baris menu khusus admin di bawah kartu aplikasi.
function AdminLink({ icon: Icon, title, hint, href }: { icon: LucideIcon; title: string; hint: string; href: string }) {
  return (
    <div className="mt-5 flex flex-wrap items-center gap-4 rounded-[18px] border border-black/[0.08] bg-white px-6 py-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-black/[0.05] text-ink-80">
        <Icon className="size-5" strokeWidth={1.8} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold">{title}</p>
        <p className="text-[13px] text-muted">{hint}</p>
      </div>
      <Link href={href} className={buttonClass('secondary', 'sm')}>
        Kelola
      </Link>
    </div>
  );
}
