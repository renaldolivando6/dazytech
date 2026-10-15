'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { cx } from '@/components/admin/ui';
import { selectCompanyAction } from './company/actions';

// Pemilih company di nav global (seperti team switcher). Memilih company lain
// langsung mengganti cookie lalu kembali ke halaman awal Import & Data.
export function CompanySwitcher({ current, companies }: { current: { id: number; name: string }; companies: { id: number; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-7 items-center gap-1.5 rounded-full bg-white/10 pl-3 pr-2.5 text-[12px] text-white transition-colors hover:bg-white/15"
      >
        <span className="max-w-32 truncate font-semibold">{current.name}</span>
        <svg aria-hidden width="10" height="10" viewBox="0 0 10 10" className={cx('transition-transform', open && 'rotate-180')}>
          <path d="M2 3.5 5 6.5 8 3.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-9 z-40 w-60 overflow-hidden rounded-xl border border-black/[0.08] bg-white/95 py-1 text-[13px] text-ink shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-xl"
        >
          <p className="px-3 pb-1 pt-2 text-[11px] text-muted">Ganti company</p>
          {companies.map((c) => (
            <form key={c.id} action={selectCompanyAction}>
              <input type="hidden" name="id" value={c.id} />
              <button
                type="submit"
                role="menuitem"
                className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-black/[0.04]"
              >
                <span className={cx('truncate', c.id === current.id && 'font-semibold')}>{c.name}</span>
                {c.id === current.id && (
                  <svg aria-hidden width="12" height="12" viewBox="0 0 12 12" className="text-accent">
                    <path d="M2.5 6.5 5 9l4.5-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            </form>
          ))}
          <div className="my-1 border-t border-divider" />
          <Link href="/admin/company/" role="menuitem" onClick={() => setOpen(false)} className="block px-3 py-2 text-accent hover:bg-black/[0.04]">
            Kelola company…
          </Link>
        </div>
      )}
    </div>
  );
}
