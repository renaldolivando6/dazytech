import Link from 'next/link';
import type { ReactNode } from 'react';

// Primitif tampilan area /admin. Bahasa visual: design system Apple
// (lihat token di globals.css) — satu warna aksi, hairline tanpa bayangan,
// pill untuk aksi utama, bobot huruf 400/600 saja.

export function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

// ---------------------------------------------------------------- tombol & input

type ButtonVariant = 'primary' | 'destructive' | 'secondary' | 'utility' | 'ghost' | 'danger';

export function buttonClass(variant: ButtonVariant = 'primary', size: 'sm' | 'md' = 'md') {
  return cx(
    'inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap transition-[background-color,color,transform] duration-150',
    'active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-focus',
    'disabled:pointer-events-none disabled:opacity-40',
    size === 'sm' ? 'h-7 px-3 text-[12px]' : 'h-9 px-[18px] text-[14px]',
    // Aksi utama: pill Action Blue.
    variant === 'primary' && 'rounded-full bg-accent text-white hover:bg-accent-hover',
    // Pill merah, hanya untuk konfirmasi aksi merusak (hapus/batalkan).
    variant === 'destructive' && 'rounded-full bg-danger text-white hover:bg-[#bf0013]',
    // Aksi kedua: pill garis biru.
    variant === 'secondary' && 'rounded-full border border-accent text-accent hover:bg-accent/5',
    // Aksi utilitas di toolbar: kotak ink 8px.
    variant === 'utility' && 'rounded-lg bg-ink text-white hover:bg-ink-80',
    // Tautan-tombol.
    variant === 'ghost' && cx('rounded-lg text-accent hover:bg-black/[0.04]', size === 'sm' ? 'px-2' : 'px-3'),
    variant === 'danger' && cx('rounded-lg text-danger hover:bg-danger/[0.06]', size === 'sm' ? 'px-2' : 'px-3'),
  );
}

// Varian input dipisah (bukan ditimpa dengan kelas tambahan): dua kelas
// Tailwind untuk properti yang sama (h-9 vs h-8) tidak bisa diandalkan
// urutan menangnya.
const inputBase =
  'block border border-black/[0.12] bg-white text-ink outline-none transition-shadow ' +
  'placeholder:text-faint focus:border-accent focus:ring-4 focus:ring-accent/15 disabled:bg-parchment';

export const inputClass = `${inputBase} h-9 w-full rounded-lg px-3 text-[14px]`;
// Kecil, untuk toolbar & baris tabel. Lebarnya ditentukan pemakai (w-*).
export const inputSmClass = `${inputBase} h-8 rounded-lg px-2.5 text-[13px]`;
// Search berbentuk pill (search-input di DESIGN.md).
export const searchInputClass = `${inputBase} h-8 rounded-full px-4 text-[13px]`;
export const textareaClass = `${inputBase} w-full rounded-lg px-3 py-2 text-[14px]`;

export const labelClass = 'mb-1 block text-[12px] text-muted';

// ---------------------------------------------------------------- halaman

// Sub-nav frosted (judul + aksi) yang menempel di bawah nav global, lalu isi.
export function Page({
  title,
  description,
  actions,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  // Dibungkus <div> biasa: Next.js men-scroll elemen pertama halaman ke atas saat
  // navigasi, dan melewatinya (dengan warning di console dev) kalau elemen itu sticky.
  return (
    <div>
      <div className="sticky top-11 z-20 border-b border-black/[0.06] bg-parchment/80 backdrop-blur-xl backdrop-saturate-[1.8]">
        <div className="mx-auto flex min-h-[52px] max-w-[1440px] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-2 sm:px-8">
          <h1 className="text-[21px] font-semibold leading-[1.19] tracking-[-0.012em]">{title}</h1>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      </div>
      <main className="mx-auto max-w-[1440px] px-4 pb-16 pt-6 sm:px-8">
        {description && <p className="-mt-1 mb-6 max-w-3xl text-[13px] text-muted">{description}</p>}
        <div className="space-y-6">{children}</div>
      </main>
    </div>
  );
}

export function Panel({
  title,
  description,
  actions,
  children,
  flush,
  className,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  // true = isi menempel ke tepi panel (untuk tabel).
  flush?: boolean;
  className?: string;
}) {
  return (
    <section className={cx('overflow-hidden rounded-[18px] border border-black/[0.08] bg-white', className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-3 px-5 pb-3 pt-4">
          <div className="min-w-0">
            {title && <h2 className="text-[14px] font-semibold leading-[1.29]">{title}</h2>}
            {description && <p className="mt-0.5 text-[12px] text-muted">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={flush ? '' : cx('px-5 pb-5', !(title || actions) && 'pt-5')}>{children}</div>
    </section>
  );
}

// ---------------------------------------------------------------- angka ringkas

// Garis antar sel = celah 1px di atas latar hairline (tanpa border per sel).
export function StatStrip({ children, cols = 4 }: { children: ReactNode; cols?: 3 | 4 }) {
  return (
    <div
      className={cx(
        'grid gap-px overflow-hidden rounded-[18px] border border-black/[0.08] bg-black/[0.06]',
        cols === 4 ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3',
      )}
    >
      {children}
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone,
  href,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: Tone;
  href?: string;
}) {
  const body = (
    <>
      <p className="flex items-center gap-1.5 text-[12px] text-muted">
        {tone && <Dot tone={tone} />}
        {label}
      </p>
      <p className="mt-1 whitespace-nowrap text-[21px] font-semibold leading-[1.14] tracking-[-0.02em] tabular-nums sm:text-[28px]">{value}</p>
      {hint && <p className="mt-1 text-[12px] leading-[1.35] text-muted">{hint}</p>}
    </>
  );
  return href ? (
    <Link href={href} className="block bg-white px-5 py-4 transition-colors hover:bg-pearl">
      {body}
    </Link>
  ) : (
    <div className="bg-white px-5 py-4">{body}</div>
  );
}

// ---------------------------------------------------------------- status

export type Tone = 'gray' | 'green' | 'amber' | 'red' | 'blue' | 'indigo';

const dotClass: Record<Tone, string> = {
  gray: 'bg-status-gray',
  green: 'bg-status-green',
  amber: 'bg-status-orange',
  red: 'bg-status-red',
  blue: 'bg-accent',
  indigo: 'bg-accent',
};

export function Dot({ tone }: { tone: Tone }) {
  return <span aria-hidden className={cx('inline-block size-[7px] shrink-0 rounded-full', dotClass[tone])} />;
}

// Status = titik warna + teks ink (warna hanya sebagai penanda kecil).
export function Badge({ tone = 'gray', children, title }: { tone?: Tone; children: ReactNode; title?: string }) {
  return (
    <span title={title} className="inline-flex items-center gap-1.5 whitespace-nowrap text-[12px] text-ink-80">
      <Dot tone={tone} />
      {children}
    </span>
  );
}

// Kode pendek (kategori, satuan) dalam kapsul abu.
export function Code({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center whitespace-nowrap rounded-[5px] bg-black/[0.05] px-1.5 py-px text-[11px] font-semibold tracking-normal text-ink-80">
      {children}
    </span>
  );
}

export function Alert({ tone = 'gray', title, children }: { tone?: Tone; title?: ReactNode; children?: ReactNode }) {
  const cls: Record<Tone, string> = {
    gray: 'bg-white border-black/[0.08] text-ink-80',
    blue: 'bg-white border-black/[0.08] text-ink-80',
    indigo: 'bg-white border-black/[0.08] text-ink-80',
    green: 'bg-[#f0faf2] border-[#cdebd4] text-[#1c6e33]',
    amber: 'bg-[#fff8eb] border-[#f5e2b8] text-[#7a4f00]',
    red: 'bg-[#fff2f2] border-[#f6cfd2] text-[#b0001a]',
  };
  return (
    <div role="status" className={cx('flex gap-2.5 rounded-xl border px-4 py-3 text-[13px] leading-[1.45]', cls[tone])}>
      <span className="mt-[5px]">
        <Dot tone={tone} />
      </span>
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cx(!!title && 'mt-0.5')}>{children}</div>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- tabel

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx('overflow-x-auto', className)}>
      <table className="min-w-full text-[13px]">{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <th
      scope="col"
      className={cx(
        'whitespace-nowrap border-y border-black/[0.06] bg-pearl px-4 py-2 text-left text-[12px] font-normal text-muted first:pl-5 last:pr-5',
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({ children, className, colSpan }: { children?: ReactNode; className?: string; colSpan?: number }) {
  return (
    <td colSpan={colSpan} className={cx('border-b border-divider px-4 py-2 align-middle first:pl-5 last:pr-5', className)}>
      {children}
    </td>
  );
}

export function EmptyRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-5 py-12 text-center text-[13px] text-muted">
        {children}
      </td>
    </tr>
  );
}

// Segmented control ala macOS.
export function Tabs({ items }: { items: { href: string; label: ReactNode; active: boolean; count?: number }[] }) {
  return (
    <nav className="inline-flex max-w-full flex-wrap gap-0.5 rounded-lg bg-black/[0.05] p-0.5">
      {items.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          scroll={false}
          aria-current={it.active ? 'page' : undefined}
          className={cx(
            'rounded-md px-3 py-1 text-[12px] transition-colors',
            it.active ? 'bg-white font-semibold text-ink ring-1 ring-black/[0.06]' : 'text-ink-80 hover:text-ink',
          )}
        >
          {it.label}
          {it.count !== undefined && <span className="ml-1.5 tabular-nums text-muted">{it.count}</span>}
        </Link>
      ))}
    </nav>
  );
}

export function Pagination({ page, pageSize, total, hrefFor }: { page: number; pageSize: number; total: number; hrefFor: (p: number) => string }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <div className="flex items-center justify-between px-5 py-3 text-[12px] text-muted">
      <span className="tabular-nums">
        {from}–{to} dari {total}
      </span>
      <div className="flex gap-1">
        {page > 1 && (
          <Link href={hrefFor(page - 1)} scroll={false} className={buttonClass('ghost', 'sm')}>
            ‹ Sebelumnya
          </Link>
        )}
        {page < pages && (
          <Link href={hrefFor(page + 1)} scroll={false} className={buttonClass('ghost', 'sm')}>
            Berikutnya ›
          </Link>
        )}
      </div>
    </div>
  );
}
