'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cx } from '@/components/admin/ui';

const LINKS = [
  { href: '/admin/komisi/', label: 'Import & Data', match: (p: string) => p === '/admin/komisi/' || p.startsWith('/admin/komisi/import') },
  { href: '/admin/komisi/perhitungan/', label: 'Perhitungan', match: (p: string) => p.startsWith('/admin/komisi/perhitungan') },
  { href: '/admin/komisi/master/', label: 'Master Tarif', match: (p: string) => p.startsWith('/admin/komisi/master') },
];

export function AdminNav() {
  const raw = usePathname();
  const pathname = raw.endsWith('/') ? raw : `${raw}/`;

  return (
    <nav className="flex min-w-0 gap-4 overflow-x-auto sm:gap-5">
      {LINKS.map((l) => {
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
  );
}
