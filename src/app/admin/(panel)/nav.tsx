'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { cx } from '@/components/admin/ui';
import { APPS, appForPath, type AppKey } from '@/lib/auth/apps';

type NavLink = { href: string; label: string; match: (p: string) => boolean };

// Menu per aplikasi. Nav hanya menampilkan menu aplikasi yang sedang dibuka;
// pindah aplikasi lewat portal (logo Dazytech).
const APP_LINKS: Record<AppKey, NavLink[]> = {
  komisi: [
    { href: '/admin/komisi/', label: 'Import & Data', match: (p) => p === '/admin/komisi/' || p.startsWith('/admin/komisi/import') },
    { href: '/admin/komisi/perhitungan/', label: 'Perhitungan', match: (p) => p.startsWith('/admin/komisi/perhitungan') },
    { href: '/admin/komisi/master/', label: 'Master Tarif', match: (p) => p.startsWith('/admin/komisi/master') },
  ],
  website: [
    { href: '/admin/artikel/', label: 'Artikel', match: (p) => p.startsWith('/admin/artikel') },
    { href: '/admin/leads/', label: 'Leads', match: (p) => p.startsWith('/admin/leads') },
  ],
};

// `companySwitcher` hanya tampil di aplikasi Komisi (company = konsep Komisi).
export function AdminNav({ companySwitcher }: { companySwitcher?: ReactNode }) {
  const raw = usePathname();
  const pathname = raw.endsWith('/') ? raw : `${raw}/`;
  const app = appForPath(pathname);
  if (!app) return null;
  const meta = APPS.find((a) => a.key === app)!;

  return (
    <>
      <Link href={meta.href} className="flex shrink-0 items-center gap-4 font-semibold text-white sm:gap-6">
        <span aria-hidden className="text-white/30">
          /
        </span>
        {meta.name}
      </Link>
      {app === 'komisi' && companySwitcher}
      <nav className="flex min-w-0 gap-4 overflow-x-auto sm:gap-5">
        {APP_LINKS[app].map((l) => {
          const active = l.match(pathname);
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active ? 'page' : undefined}
              className={cx('whitespace-nowrap transition-colors', active ? 'text-white' : 'text-white/60 hover:text-white')}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
