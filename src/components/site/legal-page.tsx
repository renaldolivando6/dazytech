import type { Metadata } from 'next';
import Link from 'next/link';
import { getCopy, type Locale } from '@/i18n';
import { LEGAL, LEGAL_UPDATED, legalHref, type LegalKind } from '@/i18n/legal';
import { shareMetadata } from '@/lib/seo';
import { CONTACT, whatsappUrl } from './content';
import { SiteFooter } from './footer';
import { SiteNav } from './nav';

export function legalMetadata(locale: Locale, kind: LegalKind): Metadata {
  const doc = LEGAL[locale][kind];
  const url = legalHref(locale, kind);
  return {
    title: doc.title,
    description: doc.description,
    alternates: {
      canonical: url,
      languages: { 'id-ID': legalHref('id', kind), en: legalHref('en', kind), 'x-default': legalHref('id', kind) },
    },
    ...shareMetadata({ locale, title: `${doc.title} · Dazytech Solutions`, description: doc.description, url }),
  };
}

// Kebijakan Privasi & Syarat Layanan (ID di /privacy-policy/, EN di /en/privacy-policy/).
// Nav, footer, dan tipografi sama dengan beranda. Desktop: daftar isi menempel di
// kiri; HP: daftar isi bisa dibuka-tutup di atas isi.
export function LegalPage({ locale, kind }: { locale: Locale; kind: LegalKind }) {
  const t = getCopy(locale);
  const { labels, ...docs } = LEGAL[locale];
  const doc = docs[kind];
  const other: LegalKind = kind === 'privacy' ? 'terms' : 'privacy';
  // Tombol ganti bahasa menuju halaman yang sama di bahasa lain, bukan beranda.
  const nav = { ...t.nav, switchTo: { ...t.nav.switchTo, href: legalHref(locale === 'en' ? 'id' : 'en', kind) } };
  const updated = new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' }).format(
    new Date(`${LEGAL_UPDATED}T00:00:00+07:00`),
  );
  const toc = [...doc.sections.map((s) => ({ id: s.id, title: s.title })), { id: 'kontak', title: labels.contactTitle }];

  return (
    <div lang={locale} className="bg-white text-ink">
      <SiteNav locale={locale} copy={nav} waText={t.wa.general} />

      <main className="mx-auto max-w-[1080px] px-4 pb-24 sm:px-6">
        <header className="max-w-[720px] pb-10 pt-16 sm:pb-14 sm:pt-24 lg:ml-[calc(220px+4rem)]">
          <h1 className="text-[40px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[56px]">{doc.title}</h1>
          <p className="mt-4 text-[19px] leading-[1.42] tracking-[-0.02em] text-muted sm:text-[21px]">{doc.lead}</p>
          <p className="mt-5 text-[14px] text-muted">
            {labels.updated} <time dateTime={LEGAL_UPDATED}>{updated}</time>
          </p>
        </header>

        <div className="grid grid-cols-1 gap-x-16 border-t border-hairline pt-10 lg:grid-cols-[220px_minmax(0,720px)]">
          <nav aria-label={labels.contents} className="hidden lg:block">
            <div className="sticky top-20">
              <p className="text-[12px] font-semibold text-muted">{labels.contents}</p>
              <ol className="mt-3 space-y-2.5 text-[14px] leading-[1.35]">
                {toc.map((s) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="text-ink-80 transition-colors hover:text-accent">
                      {s.title}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </nav>

          <div className="min-w-0">
            <details className="group mb-10 rounded-[14px] bg-parchment px-5 py-4 lg:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between text-[15px] font-semibold [&::-webkit-details-marker]:hidden">
                {labels.contents}
                <span aria-hidden className="text-muted transition-transform group-open:rotate-90">
                  ›
                </span>
              </summary>
              <ol className="mt-3 space-y-2 text-[15px]">
                {toc.map((s) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="text-ink-80 hover:text-accent">
                      {s.title}
                    </a>
                  </li>
                ))}
              </ol>
            </details>

            {doc.sections.map((s) => (
              <section key={s.id} id={s.id} aria-labelledby={`${s.id}-title`} className="mb-10 scroll-mt-20">
                <h2 id={`${s.id}-title`} className="text-[22px] font-semibold leading-[1.2] tracking-[-0.015em] sm:text-[24px]">
                  {s.title}
                </h2>
                {s.body.map((b, i) =>
                  typeof b === 'string' ? (
                    <p key={i} className="mt-3 text-[17px] leading-[1.6] tracking-[-0.022em] text-ink-80">
                      {b}
                    </p>
                  ) : (
                    <ul key={i} className="mt-3 list-disc space-y-2 pl-[1.3em] text-[17px] leading-[1.55] tracking-[-0.022em] text-ink-80 marker:text-faint">
                      {b.map((li) => (
                        <li key={li}>{li}</li>
                      ))}
                    </ul>
                  ),
                )}
              </section>
            ))}

            <section id="kontak" aria-labelledby="kontak-title" className="scroll-mt-20 rounded-[18px] bg-parchment p-6 sm:p-8">
              <h2 id="kontak-title" className="text-[22px] font-semibold leading-[1.2] tracking-[-0.015em] sm:text-[24px]">
                {labels.contactTitle}
              </h2>
              <p className="mt-2 text-[15px] leading-[1.45] text-muted">{labels.contactLead[kind]}</p>
              <dl className="mt-6 grid grid-cols-1 gap-5 text-[15px] leading-[1.45] sm:grid-cols-[1fr_1.5fr_1fr]">
                <div>
                  <dt className="text-[12px] text-muted">WhatsApp</dt>
                  <dd className="mt-1">
                    <a href={whatsappUrl(t.wa.general)} data-cta="wa_general" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                      {CONTACT.whatsappDisplay}
                    </a>
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-[12px] text-muted">Email</dt>
                  <dd className="mt-1">
                    <a href={`mailto:${CONTACT.email}`} className="text-accent [overflow-wrap:anywhere] hover:underline">
                      {CONTACT.email}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-[12px] text-muted">{labels.address}</dt>
                  <dd className="mt-1 text-ink-80">
                    {CONTACT.address[0]}
                    <br />
                    {CONTACT.address[1]}
                  </dd>
                </div>
              </dl>
            </section>

            <p className="mt-10 text-[15px] text-muted">
              {labels.seeAlso}:{' '}
              <Link href={legalHref(locale, other)} className="text-accent hover:underline">
                {docs[other].title} ›
              </Link>
            </p>
          </div>
        </div>
      </main>

      <SiteFooter locale={locale} copy={t.footer} nav={nav} waText={t.wa.general} />
    </div>
  );
}
