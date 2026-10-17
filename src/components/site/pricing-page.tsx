import type { Metadata } from 'next';
import { CalendarCheck, Check, Download, Gift, Globe, Plus, ReceiptText, Wrench } from 'lucide-react';
import { getCopy, type Locale } from '@/i18n';
import {
  EXTRAS,
  PACKAGES,
  PRICING,
  extraNote,
  extraPrice,
  formatIdr,
  packageAddons,
  packagePrice,
  packageRenewal,
  packagesIn,
  pricingHref,
  pricingPdfHref,
  startingPrice,
  type CategoryKey,
  type PackageData,
} from '@/i18n/pricing';
import { shareMetadata } from '@/lib/seo';
import { whatsappUrl } from './content';
import { SiteFooter } from './footer';
import { SiteNav } from './nav';

// Halaman Paket & harga (ID /harga/, EN /en/pricing/). Statis, tanpa JS sendiri:
// rincian paket memakai <details>, lompat bagian lewat anchor di sub-nav.
// Gaya sama dengan beranda (DESIGN.md): kartu putih bergaris tipis tanpa bayangan,
// satu warna aksi. Paket rekomendasi ditandai garis ink + label, bukan warna baru.
// Ukuran sengaja lebih ringkas dari beranda (permintaan pemilik): halaman ini
// untuk membandingkan banyak kartu sekaligus.

const sectionTitle = 'text-[30px] font-semibold leading-[1.1] tracking-[-0.025em] sm:text-[40px]';
const sectionLead = 'mt-3 max-w-[640px] text-[17px] leading-[1.47] tracking-[-0.02em] text-muted sm:text-[19px]';
const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-focus';
const cardPrimary = `inline-flex w-full items-center justify-center rounded-full bg-accent px-5 py-2.5 text-[15px] text-white transition-[background-color,transform] hover:bg-accent-hover active:scale-95 ${focusRing}`;
const cardSecondary = `inline-flex w-full items-center justify-center rounded-full border border-accent px-5 py-2.5 text-[15px] text-accent transition-[background-color,transform] hover:bg-accent/5 active:scale-95 ${focusRing}`;
const primaryButton = `inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 text-[17px] text-white transition-[background-color,transform] hover:bg-accent-hover active:scale-95 ${focusRing}`;

const PROMISE_ICONS = [Globe, CalendarCheck, ReceiptText, Wrench];

function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ');
}

function fill(template: string, values: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => values[k] ?? `{${k}}`);
}

export function pricingDescription(locale: Locale): string {
  return fill(PRICING[locale].meta.description, {
    website: formatIdr(locale, startingPrice('website')),
    app: formatIdr(locale, startingPrice('app')),
  });
}

export function pricingMetadata(locale: Locale): Metadata {
  const p = PRICING[locale];
  const url = pricingHref(locale);
  const description = pricingDescription(locale);
  return {
    title: p.meta.title,
    description,
    alternates: {
      canonical: url,
      languages: { 'id-ID': pricingHref('id'), en: pricingHref('en'), 'x-default': pricingHref('id') },
    },
    ...shareMetadata({ locale, title: `${p.meta.title} · Dazytech Solutions`, description, url }),
  };
}

function PackageCard({ locale, pkg, erpWa }: { locale: Locale; pkg: PackageData; erpWa: string }) {
  const p = PRICING[locale];
  const c = p.packages[pkg.key];
  const category = p.categories[pkg.category];
  const price = packagePrice(locale, pkg);
  const addons = packageAddons(locale, pkg);
  const wa = pkg.price === null ? erpWa : fill(p.labels.waPackage, { name: c.name, price });

  return (
    <article
      className={cx(
        'reveal relative flex flex-col rounded-[18px] bg-white p-6',
        pkg.featured ? 'border-2 border-ink' : 'border border-black/[0.08]',
      )}
    >
      {pkg.featured && (
        <span className="absolute -top-2.5 left-6 rounded-full bg-ink px-2.5 py-1 text-[11px] font-semibold leading-none text-white">{p.labels.recommended}</span>
      )}
      <h3 className="text-[19px] font-semibold leading-[1.21] tracking-[-0.012em]">{c.name}</h3>
      {/* Tinggi minimum 2 baris di layar ber-kolom supaya harga antar kartu sejajar. */}
      <p className="mt-1 text-[14px] leading-[1.43] text-muted md:min-h-[2.86em]">{c.audience}</p>

      <p className="mt-4 flex items-baseline gap-0.5 text-ink">
        {pkg.price === null ? (
          // leading-8 = tinggi angka harga (32px), supaya tombol tetap sejajar antar kartu.
          <span className="text-[24px] font-semibold leading-8 tracking-[-0.02em]">{price}</span>
        ) : (
          <>
            <span className="text-[15px] font-semibold">Rp</span>
            <span className="text-[32px] font-semibold leading-none tracking-[-0.025em] tabular-nums">{price.replace(/^Rp/, '')}</span>
          </>
        )}
      </p>

      {/* Daya tarik utama: gratis domain + hosting tahun pertama (ERP: konsultasi awal). */}
      <p className="mt-3 flex items-center gap-2 rounded-[10px] bg-parchment px-3 py-2 text-[13px] font-semibold leading-[1.3] text-ink">
        <Gift className="size-4 shrink-0" strokeWidth={1.8} aria-hidden />
        {c.bonus}
      </p>
      <p className={cx('mt-2 text-[13px] leading-[1.45] text-muted', pkg.category === 'app' && 'md:min-h-[2.9em]')}>{packageRenewal(locale, pkg)}</p>

      <a
        href={whatsappUrl(wa)}
        data-cta={pkg.category === 'app' ? 'wa_erp' : 'wa_website'}
        target="_blank"
        rel="noopener noreferrer"
        className={cx('mt-4', pkg.featured ? cardPrimary : cardSecondary)}
      >
        {pkg.price === null ? p.labels.discuss : p.labels.choose}
      </a>

      <ul className="mt-5 space-y-2 border-t border-divider pt-5">
        {c.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-[14px] leading-[1.43] text-ink-80">
            <Check className="mt-[3px] size-3.5 shrink-0 text-muted" strokeWidth={2.5} aria-hidden />
            {f}
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-5">
        <details className="dz-details group border-t border-divider">
          <summary
            className={`flex cursor-pointer list-none items-center justify-between gap-4 pt-3.5 text-[14px] font-semibold text-ink transition-colors hover:text-accent [&::-webkit-details-marker]:hidden ${focusRing}`}
          >
            {p.labels.details}
            <Plus className="size-4 shrink-0 text-muted transition-transform duration-300 group-open:rotate-45 motion-reduce:transition-none" strokeWidth={2} aria-hidden />
          </summary>
          <dl className="mt-2">
            {category.specLabels.map((label, i) => (
              <div key={label} className="border-b border-divider py-2 last:border-b-0">
                <dt className="text-[12px] text-muted">{label}</dt>
                <dd className="mt-0.5 text-[13px] leading-[1.4] text-ink-80">{c.specs[i]}</dd>
              </div>
            ))}
            {addons && (
              <div className="border-t border-divider py-2">
                <dt className="text-[12px] text-muted">{p.labels.addons}</dt>
                <dd className="mt-0.5 text-[13px] leading-[1.4] text-ink-80">{addons}</dd>
              </div>
            )}
          </dl>
        </details>
      </div>
    </article>
  );
}

function CategorySection({ locale, category, erpWa, className }: { locale: Locale; category: CategoryKey; erpWa: string; className?: string }) {
  const p = PRICING[locale];
  const cat = p.categories[category];
  return (
    <section id={cat.id} aria-labelledby={`${cat.id}-title`} className={cx('scroll-mt-28 px-4 py-14 sm:px-6 sm:py-20', className)}>
      <div className="mx-auto max-w-[1180px]">
        <div className="reveal">
          <h2 id={`${cat.id}-title`} className={sectionTitle}>
            {cat.title}
          </h2>
          <p className={sectionLead}>{cat.lead}</p>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {packagesIn(category).map((pkg) => (
            <PackageCard key={pkg.key} locale={locale} pkg={pkg} erpWa={erpWa} />
          ))}
          {category === 'website' && (
            <article className="reveal flex flex-col rounded-[18px] border border-black/[0.08] p-6">
              <h3 className="text-[19px] font-semibold leading-[1.21] tracking-[-0.012em]">{p.custom.title}</h3>
              <p className="mt-2 text-[14px] leading-[1.47] text-muted">{p.custom.body}</p>
              <a
                href={whatsappUrl(p.labels.waCustom)}
                data-cta="wa_website"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto pt-5 text-[14px] text-accent hover:underline"
              >
                {p.custom.cta}
              </a>
            </article>
          )}
        </div>
      </div>
    </section>
  );
}

function PriceList({ title, rows }: { title: string; rows: { key: string; name: string; note?: string; price: string }[] }) {
  return (
    <div className="reveal rounded-[18px] bg-white p-6">
      <h3 className="text-[19px] font-semibold leading-[1.21] tracking-[-0.012em]">{title}</h3>
      <ul className="mt-2 divide-y divide-divider">
        {rows.map((r) => (
          <li key={r.key} className="flex items-start justify-between gap-6 py-3">
            <div className="min-w-0">
              <p className="text-[15px] font-semibold leading-[1.33] tracking-[-0.012em]">{r.name}</p>
              {r.note && <p className="mt-0.5 text-[13px] leading-[1.45] text-muted">{r.note}</p>}
            </div>
            <p className="shrink-0 text-right text-[15px] leading-[1.33] tabular-nums text-ink">{r.price}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PricingPage({ locale }: { locale: Locale }) {
  const t = getCopy(locale);
  const p = PRICING[locale];
  const other: Locale = locale === 'en' ? 'id' : 'en';
  // Tombol ganti bahasa menuju halaman harga di bahasa lain, bukan beranda.
  const nav = { ...t.nav, switchTo: { ...t.nav.switchTo, href: pricingHref(other) } };
  const pdf = pricingPdfHref(locale);
  const extras = (group: 'addon' | 'change') =>
    EXTRAS.filter((e) => e.group === group).map((e) => ({ key: e.key, name: p.extras[e.key].name, note: extraNote(locale, e), price: extraPrice(locale, e) }));

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'OfferCatalog',
      name: p.meta.title,
      url: `https://dazytech.web.id${pricingHref(locale)}`,
      itemListElement: PACKAGES.filter((pkg) => pkg.price !== null).map((pkg) => ({
        '@type': 'Offer',
        name: p.packages[pkg.key].name,
        description: p.packages[pkg.key].audience,
        price: pkg.price,
        priceCurrency: 'IDR',
        seller: { '@type': 'Organization', name: 'Dazytech Solutions', url: 'https://dazytech.web.id' },
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      inLanguage: locale === 'en' ? 'en' : 'id-ID',
      mainEntity: p.faq.items.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
  ];

  return (
    <div lang={locale} className="bg-white text-ink">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <SiteNav locale={locale} copy={nav} waText={t.wa.general} />

      {/* Sub-nav ala DESIGN.md (sub-nav-frosted): nama halaman, tautan bagian, tombol PDF. */}
      <div className="sticky top-12 z-30 border-b border-black/[0.06] bg-parchment/80 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex h-[52px] max-w-[1180px] items-center gap-6 px-4 sm:px-6">
          <p className="text-[17px] font-semibold tracking-[-0.015em] sm:text-[21px]">{p.localNav.title}</p>
          <nav aria-label={p.localNav.title} className="ml-auto hidden items-center gap-6 text-[12px] text-ink-80 md:flex">
            {p.localNav.links.map((l) => (
              <a key={l.href} href={l.href} className="transition-colors hover:text-accent">
                {l.label}
              </a>
            ))}
          </nav>
          <a
            href={pdf}
            download
            className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-accent px-3.5 py-1 text-[12px] text-white transition-[background-color,transform] hover:bg-accent-hover active:scale-95 md:ml-0"
          >
            <Download className="size-3.5" strokeWidth={2} aria-hidden />
            {p.localNav.pdf}
          </a>
        </div>
      </div>

      <main>
        {/* Judul halaman terlihat di sub-nav; h1 tetap ada untuk mesin pencari & pembaca layar. */}
        <h1 className="sr-only">{p.localNav.title}</h1>

        {/* ------------------------------------------------ janji di semua paket */}
        <section className="px-4 py-10 sm:px-6 sm:py-12">
          <div className="mx-auto max-w-[1180px]">
            <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
              {p.promises.map((item, i) => {
                const Icon = PROMISE_ICONS[i];
                return (
                  <li key={item.title} className="reveal flex items-start gap-3">
                    <Icon className="mt-0.5 size-5 shrink-0 text-ink" strokeWidth={1.5} aria-hidden />
                    <div>
                      <p className="text-[15px] font-semibold tracking-[-0.012em]">{item.title}</p>
                      <p className="mt-0.5 text-[14px] leading-[1.45] tracking-[-0.01em] text-muted">{item.body}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <CategorySection locale={locale} category="website" erpWa={t.wa.erp} className="bg-parchment" />
        <CategorySection locale={locale} category="app" erpWa={t.wa.erp} />

        {/* ------------------------------------------------ tambahan */}
        <section id={p.extrasSection.id} aria-labelledby="tambahan-title" className="scroll-mt-28 bg-parchment px-4 py-14 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-[1180px]">
            <div className="reveal">
              <h2 id="tambahan-title" className={sectionTitle}>
                {p.extrasSection.title}
              </h2>
              <p className={sectionLead}>{p.extrasSection.lead}</p>
            </div>
            <div className="mt-10 grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
              <PriceList title={p.extrasSection.addonTitle} rows={extras('addon')} />
              <PriceList title={p.extrasSection.changeTitle} rows={extras('change')} />
            </div>
          </div>
        </section>

        {/* ------------------------------------------------ perpanjangan */}
        <section id={p.renewalSection.id} aria-labelledby="perpanjangan-title" className="scroll-mt-28 px-4 py-14 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-[1180px]">
            <div className="reveal">
              <h2 id="perpanjangan-title" className={sectionTitle}>
                {p.renewalSection.title}
              </h2>
              <p className={sectionLead}>{p.renewalSection.lead}</p>
            </div>
            <div className="mt-10 grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
              <div className="reveal rounded-[18px] border border-black/[0.08] p-6">
                <h3 className="text-[19px] font-semibold leading-[1.21] tracking-[-0.012em]">{p.renewalSection.tableTitle}</h3>
                {(['website', 'app'] as const).map((category) => (
                  <div key={category} className="mt-5">
                    <p className="text-[12px] font-semibold text-muted">{p.categories[category].title}</p>
                    <ul className="mt-1 divide-y divide-divider">
                      {packagesIn(category).map((pkg) => (
                        <li key={pkg.key} className="flex items-start justify-between gap-6 py-2.5">
                          <span className="text-[14px] leading-[1.43] text-ink-80">{p.packages[pkg.key].name}</span>
                          <span className="shrink-0 text-right text-[14px] leading-[1.43] tabular-nums text-ink">
                            {pkg.renewal ? fill(p.labels.yearly, { price: formatIdr(locale, pkg.renewal.year) }) : p.labels.byServer}
                            {pkg.renewal?.month && (
                              <span className="block text-[12px] text-muted">{fill(p.labels.monthlyAlt, { price: formatIdr(locale, pkg.renewal.month) })}</span>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="grid gap-4">
                {(['website', 'app'] as const).map((category) => (
                  <div key={category} className="reveal rounded-[18px] bg-parchment p-6">
                    <h3 className="text-[17px] font-semibold leading-[1.24] tracking-[-0.012em]">{p.renewalSection.includes[category].title}</h3>
                    <ul className="mt-3 space-y-2">
                      {p.renewalSection.includes[category].items.map((it) => (
                        <li key={it} className="flex items-start gap-2 text-[14px] leading-[1.43] text-ink-80">
                          <Check className="mt-[3px] size-3.5 shrink-0 text-muted" strokeWidth={2.5} aria-hidden />
                          {it}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <ul className="mt-8 space-y-1 border-t border-hairline pt-5 text-[13px] leading-[1.45] text-muted">
              {p.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* ------------------------------------------------ FAQ */}
        <section id={p.faq.id} className="scroll-mt-28 bg-parchment px-4 py-14 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-[820px]">
            <h2 className={`reveal ${sectionTitle}`}>{p.faq.title}</h2>
            <div className="mt-8 border-t border-hairline">
              {p.faq.items.map((f) => (
                <details key={f.q} className="dz-details group border-b border-hairline">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-[17px] font-semibold leading-[1.3] tracking-[-0.015em] sm:text-[19px] [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <Plus className="size-5 shrink-0 text-muted transition-transform duration-300 group-open:rotate-45 motion-reduce:transition-none" strokeWidth={1.8} aria-hidden />
                  </summary>
                  <p className="-mt-1 pb-5 pr-10 text-[15px] leading-[1.5] tracking-[-0.016em] text-muted sm:text-[16px]">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------ ajakan */}
        <section className="bg-black px-4 py-16 text-white sm:px-6 sm:py-20">
          <div className="reveal mx-auto max-w-[680px] text-center">
            <h2 className={sectionTitle}>{p.cta.title}</h2>
            <p className="mx-auto mt-3 max-w-[520px] text-[17px] leading-[1.47] tracking-[-0.02em] text-white/70 sm:text-[19px]">{p.cta.body}</p>
            <div className="mt-7">
              <a href={whatsappUrl(t.wa.general)} data-cta="wa_general" target="_blank" rel="noopener noreferrer" className={primaryButton}>
                {p.cta.primary}
              </a>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter locale={locale} copy={t.footer} nav={nav} waText={t.wa.general} />
    </div>
  );
}
