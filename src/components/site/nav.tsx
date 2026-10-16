'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { Locale, SiteCopy } from '@/i18n';
import { whatsappUrl } from './content';

type LatestArticle = { slug: string; title: string; publishedAt: string | null };

// Nav global (bar hitam tipis, DESIGN.md). Desktop: tautan langsung, tanpa
// hamburger. HP: menu samping. Artikel baru tampil (link desktop & bagian di
// menu samping) kalau sudah ada artikel terbit; daftar diambil saat halaman dibuka.
//
// Juga mencatat klik tombol WhatsApp: setiap <a data-cta="..."> di halaman
// dikirim ke /api/track/ (tanpa data pribadi) supaya minat ERP vs website terukur.
export function SiteNav({ locale, copy, waText }: { locale: Locale; copy: SiteCopy['nav']; waText: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [articles, setArticles] = useState<LatestArticle[] | null>(null);
  const base = locale === 'en' ? '/en/' : '/';
  const dateFmt = new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' });

  useEffect(() => {
    function onClick(e: MouseEvent) {
      const el = (e.target as Element | null)?.closest?.('a[data-cta]');
      if (!el) return;
      const body = JSON.stringify({ cta: el.getAttribute('data-cta'), locale, path: window.location.pathname });
      try {
        const sent = navigator.sendBeacon?.('/api/track/', new Blob([body], { type: 'application/json' }));
        if (!sent) void fetch('/api/track/', { method: 'POST', body, keepalive: true });
      } catch {
        // Pencatatan tidak boleh mengganggu klik.
      }
    }
    document.addEventListener('click', onClick, { capture: true });
    return () => document.removeEventListener('click', onClick, { capture: true });
  }, [locale]);

  // Halaman utama tetap statis; artikel terbaru diambil di browser.
  useEffect(() => {
    let alive = true;
    fetch('/api/articles/')
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d: { items: LatestArticle[] }) => alive && setArticles(d.items))
      .catch(() => alive && setArticles([]));
    return () => {
      alive = false;
    };
  }, []);
  const hasArticles = !!articles && articles.length > 0;

  function openMenu() {
    dialogRef.current?.showModal();
  }

  function closeMenu() {
    dialogRef.current?.close();
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-black/80 text-white backdrop-blur-xl backdrop-saturate-150">
        <nav aria-label="Utama" className="mx-auto flex h-12 max-w-[1180px] items-center gap-6 px-4 sm:px-6">
          <Link href={base} className="flex shrink-0 items-center gap-2" aria-label={copy.home}>
            <Image src="/brand/mark-white-64.png" alt="" width={24} height={24} priority className="size-6 rounded-full" />
            <span className="text-[15px] font-semibold tracking-[-0.01em]">Dazytech</span>
          </Link>
          <div className="ml-auto hidden items-center gap-6 text-[12px] text-white/75 lg:flex">
            {copy.links.map((l) => (
              <Link key={l.href} href={`${base}${l.href}`} className="transition-colors hover:text-white">
                {l.label}
              </Link>
            ))}
            {hasArticles && (
              <Link href="/artikel/" className="transition-colors hover:text-white">
                {copy.articles}
              </Link>
            )}
          </div>
          {/* prefetch mati: jarang diklik, dan prefetch-nya memuat payload halaman
              bahasa lain (±26 KB) di setiap kunjungan. */}
          <Link
            href={copy.switchTo.href}
            prefetch={false}
            hrefLang={copy.switchTo.short.toLowerCase()}
            title={copy.switchTo.label}
            className="ml-auto rounded-md px-1.5 py-1 text-[12px] font-semibold text-white/75 transition-colors hover:text-white lg:ml-0"
          >
            {copy.switchTo.short}
          </Link>
          <Link
            href={`${base}#kontak`}
            className="hidden rounded-full bg-accent px-3.5 py-1 text-[12px] font-medium transition-colors hover:bg-accent-hover active:scale-95 sm:inline-block"
          >
            {copy.cta}
          </Link>
          <button
            type="button"
            onClick={openMenu}
            aria-label={copy.openMenu}
            aria-haspopup="dialog"
            className="-ml-3 -mr-3 grid size-11 place-items-center text-white/85 transition-colors hover:text-white lg:hidden"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
              <path d="M2 6.5h14M2 11.5h14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
        </nav>
      </header>

      <dialog
        ref={dialogRef}
        data-site-drawer
        aria-label="Menu"
        onClick={(e) => {
          if (e.target === dialogRef.current) closeMenu();
        }}
        className="fixed inset-y-0 right-0 m-0 ml-auto h-dvh max-h-none w-full max-w-[400px] border-0 bg-white p-0 text-ink"
      >
        <div className="flex min-h-full flex-col px-8 pb-10 pt-1">
          <div className="flex h-12 items-center justify-between">
            <Link href={copy.switchTo.href} prefetch={false} hrefLang={copy.switchTo.short.toLowerCase()} onClick={closeMenu} className="text-[13px] text-accent hover:underline">
              {copy.switchTo.label}
            </Link>
            <button type="button" onClick={closeMenu} aria-label={copy.closeMenu} className="-mr-3 grid size-11 place-items-center text-muted hover:text-ink">
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
                <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <nav aria-label="Menu" className="mt-2 flex flex-col">
            {copy.links.map((l) => (
              <Link
                key={l.href}
                href={`${base}${l.href}`}
                onClick={closeMenu}
                className="py-1.5 text-[28px] font-semibold leading-[1.14] tracking-[-0.015em] transition-colors hover:text-accent"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {hasArticles && (
            <section className="mt-10 border-t border-hairline pt-6" aria-labelledby="drawer-articles">
              <h2 id="drawer-articles" className="text-[12px] text-muted">
                {copy.latestArticles}
              </h2>
              <ul className="mt-3 divide-y divide-divider">
                {articles.map((a) => (
                  <li key={a.slug}>
                    <Link href={`/artikel/${a.slug}/`} onClick={closeMenu} className="group block py-3">
                      {a.publishedAt && <span className="block text-[12px] text-muted">{dateFmt.format(new Date(a.publishedAt))}</span>}
                      <span className="mt-0.5 block text-[15px] font-semibold leading-[1.3] group-hover:text-accent">{a.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link href="/artikel/" onClick={closeMenu} className="mt-4 inline-block text-[14px] text-accent hover:underline">
                {copy.allArticles}
              </Link>
            </section>
          )}

          <a
            href={whatsappUrl(waText)}
            data-cta="wa_general"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-auto block rounded-full bg-accent py-3 text-center text-[17px] text-white transition-colors hover:bg-accent-hover active:scale-[0.98]"
          >
            {copy.whatsapp}
          </a>
        </div>
      </dialog>
    </>
  );
}
