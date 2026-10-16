import Image from 'next/image';
import Link from 'next/link';
import type { Locale, SiteCopy } from '@/i18n';
import { legalHref } from '@/i18n/legal';
import { CONTACT, whatsappUrl } from './content';

// Footer ringkas di atas parchment: identitas, tautan utama, kontak, legal.
export function SiteFooter({ locale, copy, nav, waText }: { locale: Locale; copy: SiteCopy['footer']; nav: SiteCopy['nav']; waText: string }) {
  const base = locale === 'en' ? '/en/' : '/';
  return (
    <footer className="bg-parchment text-[12px] leading-[1.5] text-ink-80">
      <div className="mx-auto max-w-[1180px] px-4 pb-10 pt-12 sm:px-6">
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 pb-8 md:grid-cols-[2fr_1fr_1.4fr]">
          <div className="col-span-2 md:col-span-1">
            <Link href={base} className="flex items-center gap-2">
              <Image src="/brand/mark-64.png" alt="" width={24} height={24} className="size-6 rounded-full" />
              <span className="text-[14px] font-semibold text-ink">Dazytech Solutions</span>
            </Link>
            <p className="mt-3 max-w-[300px] text-muted">{copy.tagline}</p>
          </div>

          <div>
            <h2 className="mb-2 font-semibold text-ink">{copy.menuTitle}</h2>
            <ul className="leading-[2.2]">
              {nav.links.map((l) => (
                <li key={l.href}>
                  <Link href={`${base}${l.href}`} className="hover:text-ink hover:underline">
                    {l.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/artikel/" className="hover:text-ink hover:underline">
                  {copy.articles}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="mb-2 font-semibold text-ink">{copy.contactTitle}</h2>
            <ul className="space-y-1.5">
              <li>
                <a href={whatsappUrl(waText)} data-cta="wa_general" target="_blank" rel="noopener noreferrer" className="hover:text-ink hover:underline">
                  WhatsApp {CONTACT.whatsappDisplay}
                </a>
              </li>
              <li>
                <a href={`mailto:${CONTACT.email}`} className="break-all hover:text-ink hover:underline">
                  {CONTACT.email}
                </a>
              </li>
              <li className="text-muted">
                {CONTACT.address[0]}
                <br />
                {CONTACT.address[1]}
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-4 text-muted">
          <p>
            © {new Date().getFullYear()} Dazytech Solutions. {copy.rights}
          </p>
          <p className="flex gap-4">
            <Link href={legalHref(locale, 'privacy')} className="hover:text-ink hover:underline">
              {copy.privacy}
            </Link>
            <Link href={legalHref(locale, 'terms')} className="hover:text-ink hover:underline">
              {copy.terms}
            </Link>
            <Link href={nav.switchTo.href} prefetch={false} hrefLang={nav.switchTo.short.toLowerCase()} className="hover:text-ink hover:underline">
              {nav.switchTo.label}
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
