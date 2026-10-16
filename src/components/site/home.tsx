import { Check, Plus } from 'lucide-react';
import { getCopy, type Locale } from '@/i18n';
import { legalHref } from '@/i18n/legal';
import { ErpFlowCard, HIGHLIGHTS } from './cards';
import { CONTACT, whatsappUrl } from './content';
import { SiteFooter } from './footer';
import { ErpDemo } from './erp-demo';
import { LeadForm } from './lead-form';
import { MOCKUPS } from './mockups';
import { ModelStage } from './model-stage';
import { SiteNav } from './nav';
import { Showcase, type ShowcaseTab } from './showcase';
import { WebsiteConcept } from './websites';

// Halaman utama untuk kedua bahasa (statis, di-prerender saat build).
// Urutan: hero (maskot) → contoh alur ERP (bukti) → layanan & biaya →
// contoh website → pengalaman → cara kerja → FAQ → kontak. Setiap bagian
// menjawab satu pertanyaan baru calon klien; jangan menambah bagian yang hanya
// mengulang klaim. Biru hanya untuk tombol & tautan; ceklis dan detail netral.

// Visual kanan di hero: 'model' = maskot 3D (public/models/doggy.glb, sudah
// dioptimasi), 'flow' = kartu "satu pesanan terhubung" (ErpFlowCard).
const HERO_VISUAL: 'model' | 'flow' = 'model';

const sectionTitle = 'text-[34px] font-semibold leading-[1.08] tracking-[-0.025em] sm:text-[48px]';
const sectionLead = 'mt-4 text-[19px] leading-[1.42] tracking-[-0.02em] text-muted sm:text-[21px]';
const primaryButton =
  'inline-block rounded-full bg-accent px-6 py-3 text-[17px] text-white transition-[background-color,transform] hover:bg-accent-hover active:scale-95';
const secondaryButton =
  'inline-block rounded-full border border-accent px-6 py-3 text-[17px] text-accent transition-[background-color,transform] hover:bg-accent/5 active:scale-95';

export function HomePage({ locale }: { locale: Locale }) {
  const t = getCopy(locale);

  const tabs: ShowcaseTab[] = t.showcase.items.map((item) => {
    // ERP = demo interaktif (pengunjung memajukan pesanan langkah demi langkah).
    if (item.key === 'erp') {
      return { ...item, visual: <ErpDemo copy={t.showcase.demo} variant="desktop" />, highlight: <ErpDemo copy={t.showcase.demo} variant="mobile" /> };
    }
    const Visual = MOCKUPS[item.key];
    const Highlight = HIGHLIGHTS[item.key];
    return { ...item, visual: <Visual />, highlight: <Highlight /> };
  });

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'ProfessionalService',
      name: 'Dazytech Solutions',
      url: 'https://dazytech.web.id',
      logo: 'https://dazytech.web.id/dazytech-logo-circle.png',
      image: 'https://dazytech.web.id/dazytech-logo-circle.png',
      description: t.meta.description,
      telephone: `+${CONTACT.whatsapp}`,
      email: CONTACT.email,
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Jl. Permata, Kalideres',
        addressLocality: 'Jakarta Barat',
        postalCode: '11820',
        addressCountry: 'ID',
      },
      areaServed: 'ID',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      inLanguage: locale === 'en' ? 'en' : 'id-ID',
      mainEntity: t.faq.items.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
  ];

  return (
    // lang di pembungkus: <html lang> dari root layout selalu "id" (satu root
    // layout untuk seluruh situs), versi Inggris menimpanya di sini.
    <div lang={locale} className="bg-white text-ink">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <SiteNav locale={locale} copy={t.nav} waText={t.wa.general} />

      <main>
        {/* ------------------------------------------------ hero */}
        <section className="px-4 pb-20 pt-14 sm:px-6 sm:pt-20 lg:pb-28">
          <div className="mx-auto grid max-w-[1180px] grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16">
            <div>
              <p className="text-[17px] font-semibold tracking-[-0.01em] text-muted">{t.hero.eyebrow}</p>
              <h1 className="mt-3 text-[40px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[56px]">{t.hero.title}</h1>
              <p className="mt-5 max-w-[580px] text-[19px] leading-[1.42] tracking-[-0.02em] text-muted sm:text-[21px]">{t.hero.lead}</p>
              <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
                <a href={whatsappUrl(t.wa.erp)} data-cta="wa_erp" target="_blank" rel="noopener noreferrer" className={primaryButton}>
                  {t.hero.primary}
                </a>
                <a href="#contoh" className="text-[17px] text-accent hover:underline">
                  {t.hero.secondary} ›
                </a>
              </div>
              <p className="mt-3 text-[14px] leading-[1.45] text-muted">{t.hero.note}</p>
              <p className="mt-8 flex max-w-[560px] items-start gap-2 text-[14px] leading-[1.45] text-ink-80">
                <Check className="mt-0.5 size-4 shrink-0 text-muted" strokeWidth={2.4} aria-hidden />
                {t.hero.proof}
              </p>
              <p className="mt-2 pl-6 text-[14px] text-muted">
                {t.hero.websiteQuestion}{' '}
                <a href="#layanan" className="text-accent hover:underline">
                  {t.hero.websiteLink}
                </a>
              </p>
            </div>
            <div className="mx-auto w-full max-w-[480px] lg:max-w-none">
              {HERO_VISUAL === 'model' ? <ModelStage src="/models/doggy.glb" rotationY={Math.PI} label={t.hero.modelLabel} /> : <ErpFlowCard flow={t.flow} />}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------ contoh sistem */}
        <section id="contoh" className="scroll-mt-12 bg-parchment px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-[1180px]">
            <div className="reveal mx-auto max-w-[760px] text-center">
              <h2 className={sectionTitle}>{t.showcase.title}</h2>
            </div>
            <div className="mt-8">
              <Showcase tabs={tabs} label={t.showcase.tablistLabel} />
            </div>
          </div>
        </section>

        {/* ------------------------------------------------ layanan & biaya */}
        <section id="layanan" className="scroll-mt-12 px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-[1180px]">
            <div className="reveal max-w-[720px]">
              <h2 className={sectionTitle}>{t.services.title}</h2>
            </div>
            <div className="mt-12 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
              <article className="reveal flex flex-col rounded-[22px] border border-black/[0.08] bg-white p-7 sm:p-9">
                <span className="w-fit rounded-full bg-black/[0.06] px-3 py-1 text-[12px] font-semibold text-ink-80">{t.services.erp.tag}</span>
                <h3 className="mt-5 text-[28px] font-semibold leading-[1.14] tracking-[-0.02em]">{t.services.erp.name}</h3>
                <p className="mt-1 text-[17px] font-semibold text-ink-80">{t.services.erp.price}</p>
                <p className="mt-4 text-[17px] leading-[1.47] tracking-[-0.022em] text-muted">{t.services.erp.description}</p>
                <ul className="mt-6 grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
                  {t.services.erp.items.map((it) => (
                    <li key={it} className="flex items-start gap-2.5 text-[15px] leading-[1.4] text-ink-80">
                      <Check className="mt-0.5 size-4 shrink-0 text-muted" strokeWidth={2.4} aria-hidden />
                      {it}
                    </li>
                  ))}
                </ul>
                <p className="mt-6 border-t border-divider pt-5 text-[14px] leading-[1.45] text-muted">{t.services.erp.note}</p>
                <div className="mt-auto pt-7">
                  <a href={whatsappUrl(t.wa.erp)} data-cta="wa_erp" target="_blank" rel="noopener noreferrer" className={primaryButton}>
                    {t.services.erp.cta}
                  </a>
                </div>
              </article>

              <article className="reveal flex flex-col rounded-[22px] border border-black/[0.08] bg-white p-7 sm:p-9">
                <h3 className="text-[21px] font-semibold leading-[1.19] tracking-[-0.01em]">{t.services.website.name}</h3>
                <p className="mt-4">
                  <span className="block text-[14px] text-muted">{t.services.website.prefix}</span>
                  <span className="text-[28px] font-semibold leading-[1.14] tracking-[-0.02em]">{t.services.website.price}</span>
                </p>
                <p className="mt-4 text-[17px] leading-[1.47] tracking-[-0.022em] text-muted">{t.services.website.description}</p>
                <ul className="mt-6 space-y-2.5">
                  {[...t.services.website.items, ...t.services.website.scope].map((it) => (
                    <li key={it} className="flex items-start gap-2.5 text-[15px] leading-[1.4] text-ink-80">
                      <Check className="mt-0.5 size-4 shrink-0 text-muted" strokeWidth={2.4} aria-hidden />
                      {it}
                    </li>
                  ))}
                </ul>
                {t.services.website.scope.length === 0 && (
                  <p className="mt-6 border-t border-divider pt-5 text-[14px] leading-[1.45] text-muted">{t.services.website.scopeNote}</p>
                )}
                <div className="mt-auto flex flex-col items-start gap-4 pt-7 sm:flex-row sm:items-center sm:gap-6">
                  <a href={whatsappUrl(t.wa.website)} data-cta="wa_website" target="_blank" rel="noopener noreferrer" className={secondaryButton}>
                    {t.services.website.cta}
                  </a>
                  <a href="#website" className="text-[15px] text-accent hover:underline">
                    {t.services.website.secondary}
                  </a>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------ contoh website */}
        <section id="website" className="scroll-mt-12 bg-parchment px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-[1180px]">
            <div className="reveal max-w-[720px]">
              <h2 className={sectionTitle}>{t.websites.title}</h2>
              <p className={sectionLead}>{t.websites.lead}</p>
            </div>
            <div className="mt-12 space-y-14 sm:space-y-16">
              {t.websites.concepts.map((c, i) => (
                <div
                  key={c.key}
                  className={`reveal grid grid-cols-1 items-center gap-6 lg:gap-10 ${i % 2 === 1 ? 'lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)]' : 'lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]'}`}
                >
                  <div className={i % 2 === 1 ? 'lg:order-2' : undefined}>
                    <h3 className="text-[28px] font-semibold leading-[1.14] tracking-[-0.02em]">{c.name}</h3>
                    <p className="mt-3 text-[17px] leading-[1.47] tracking-[-0.022em] text-muted">{c.description}</p>
                  </div>
                  <WebsiteConcept concept={c.key} label={c.name} />
                </div>
              ))}
            </div>
            <div className="mt-16 text-center">
              <a href={whatsappUrl(t.wa.website)} data-cta="wa_website" target="_blank" rel="noopener noreferrer" className={primaryButton}>
                {t.websites.cta}
              </a>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------ pengalaman */}
        <section id="pengalaman" className="bg-tile px-4 py-20 text-white sm:px-6 sm:py-28">
          <div className="mx-auto max-w-[1180px]">
            <div className="reveal max-w-[760px]">
              <h2 className={sectionTitle}>{t.experience.title}</h2>
              <p className="mt-4 text-[19px] leading-[1.42] tracking-[-0.02em] text-white/70 sm:text-[21px]">{t.experience.body}</p>
            </div>
            <div className="mt-14 grid grid-cols-1 gap-10 border-t border-white/15 pt-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
              {t.experience.items.map((it) => (
                <div key={it.title} className="reveal">
                  <p className="text-[19px] font-semibold tracking-[-0.01em]">{it.title}</p>
                  <p className="mt-2 text-[15px] leading-[1.47] tracking-[-0.016em] text-white/65">{it.body}</p>
                </div>
              ))}
            </div>
            <div className="mt-14 text-[15px]">
              <p className="text-[12px] text-white/55">{t.experience.techTitle}</p>
              <p className="mt-2 leading-[1.6] text-white/85">{t.experience.tech.join(' · ')}</p>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------ cara kerja */}
        <section id="proses" className="scroll-mt-12 px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-[1180px]">
            <h2 className={`reveal ${sectionTitle}`}>{t.process.title}</h2>
            <ol className="mt-12 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
              {t.process.steps.map((step, i) => (
                <li key={step.title} className="reveal border-t border-ink/15 pt-5">
                  <span className="text-[14px] font-semibold tabular-nums text-muted">0{i + 1}</span>
                  <p className="mt-2 text-[21px] font-semibold tracking-[-0.01em]">{step.title}</p>
                  <p className="mt-2 text-[17px] leading-[1.47] tracking-[-0.022em] text-muted">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ------------------------------------------------ FAQ */}
        <section id="faq" className="scroll-mt-12 bg-parchment px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-[820px]">
            <h2 className={`reveal ${sectionTitle}`}>{t.faq.title}</h2>
            <div className="mt-10 border-t border-hairline">
              {t.faq.items.map((f) => (
                <details key={f.q} className="group border-b border-hairline">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-[19px] font-semibold leading-[1.3] tracking-[-0.015em] sm:text-[21px] [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <Plus className="size-5 shrink-0 text-muted transition-transform duration-300 group-open:rotate-45 motion-reduce:transition-none" strokeWidth={1.8} aria-hidden />
                  </summary>
                  <p className="-mt-1 pb-6 pr-10 text-[17px] leading-[1.47] tracking-[-0.022em] text-muted">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------ kontak */}
        <section id="kontak" className="scroll-mt-12 bg-black px-4 py-20 text-white sm:px-6 sm:py-28">
          <div className="mx-auto grid max-w-[1180px] grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-20">
            <div className="reveal">
              <h2 className={sectionTitle}>{t.contact.title}</h2>
              <p className="mt-4 max-w-[500px] text-[19px] leading-[1.42] tracking-[-0.02em] text-white/70 sm:text-[21px]">{t.contact.body}</p>
              <ul className="mt-10 space-y-5 text-[17px]">
                <li>
                  <p className="text-[12px] text-white/55">{t.contact.whatsappLabel}</p>
                  <a href={whatsappUrl(t.wa.general)} data-cta="wa_general" target="_blank" rel="noopener noreferrer" className="text-accent-on-dark hover:underline">
                    {CONTACT.whatsappDisplay}
                  </a>
                </li>
                <li>
                  <p className="text-[12px] text-white/55">{t.contact.emailLabel}</p>
                  <a href={`mailto:${CONTACT.email}`} className="break-all text-accent-on-dark hover:underline">
                    {CONTACT.email}
                  </a>
                </li>
                <li>
                  <p className="text-[12px] text-white/55">{t.contact.officeLabel}</p>
                  <p className="text-white/85">
                    {CONTACT.address[0]}, {CONTACT.address[1]}
                  </p>
                </li>
              </ul>
            </div>
            <div className="reveal relative rounded-[22px] bg-white p-6 text-ink sm:p-8">
              <LeadForm locale={locale} copy={t.contact.form} waText={t.wa.general} privacyHref={legalHref(locale, 'privacy')} />
            </div>
          </div>
        </section>
      </main>

      <SiteFooter locale={locale} copy={t.footer} nav={t.nav} waText={t.wa.general} />
    </div>
  );
}
