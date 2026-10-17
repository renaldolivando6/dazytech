import { describe, expect, it } from 'vitest';
import { HIGHLIGHTS } from '@/components/site/cards';
import { MOCKUPS } from '@/components/site/mockups';
import { en } from '@/i18n/en';
import { id } from '@/i18n/id';
import { LEGAL, legalHref } from '@/i18n/legal';
import { EXTRAS, PACKAGES, PRICING, extraPrice, formatIdr, getExtra, getPackage, packageRenewal, pricingHref, startingPrice } from '@/i18n/pricing';
import { leads } from '@/lib/db/schema';
import { leadSchemaFor } from '@/lib/leads';
import { interestSince, isCtaKey, recordClick, trackAllowed } from '@/lib/tracking';
import { memoryDb } from './helpers';

function strings(value: unknown, path = ''): [string, string][] {
  if (typeof value === 'string') return [[path, value]];
  if (Array.isArray(value)) return value.flatMap((v, i) => strings(v, `${path}[${i}]`));
  if (value && typeof value === 'object') return Object.entries(value).flatMap(([k, v]) => strings(v, path ? `${path}.${k}` : k));
  return [];
}

describe('terjemahan situs', () => {
  it('id dan en punya jumlah isi yang sama', () => {
    expect(en.nav.links.map((l) => l.href)).toEqual(id.nav.links.map((l) => l.href));
    expect(en.nav.products.items.map((p) => [p.name, p.href])).toEqual(id.nav.products.items.map((p) => [p.name, p.href]));
    expect(en.showcase.items.map((i) => i.key)).toEqual(id.showcase.items.map((i) => i.key));
    expect(en.websites.concepts.map((c) => c.key)).toEqual(id.websites.concepts.map((c) => c.key));
    expect(en.faq.items).toHaveLength(id.faq.items.length);
    expect(en.process.steps).toHaveLength(id.process.steps.length);
    expect(en.experience.items).toHaveLength(id.experience.items.length);
    expect(en.flow.steps.map((s) => s.state)).toEqual(id.flow.steps.map((s) => s.state));
    // Nilai yang disimpan ke tabel leads harus sama di kedua bahasa.
    expect(en.contact.form.services.map((s) => s.value)).toEqual(id.contact.form.services.map((s) => s.value));
  });

  it('tanpa em dash (aturan tulisan di CLAUDE.md)', () => {
    const offenders = [...strings(id, 'id'), ...strings(en, 'en'), ...strings(LEGAL, 'legal'), ...strings(PRICING, 'pricing')].filter(([, v]) => v.includes('—'));
    expect(offenders).toEqual([]);
  });

  it('paket & harga: setiap paket dan tambahan punya teks dengan bentuk yang sama di kedua bahasa', () => {
    for (const locale of ['id', 'en'] as const) {
      const p = PRICING[locale];
      for (const pkg of PACKAGES) {
        const c = p.packages[pkg.key];
        expect(c.specs, `${locale}.${pkg.key}.specs`).toHaveLength(p.categories[pkg.category].specLabels.length);
        expect(c.features.length, `${locale}.${pkg.key}.features`).toBe(PRICING.id.packages[pkg.key].features.length);
        for (const addon of pkg.addons) expect(EXTRAS.map((e) => e.key)).toContain(addon);
      }
      expect(Object.keys(p.extras).sort()).toEqual(EXTRAS.map((e) => e.key).sort());
    }
    const shape = (locale: 'id' | 'en') => {
      const p = PRICING[locale];
      return [p.promises.length, p.faq.items.length, p.notes.length, p.localNav.links.map((l) => l.href), Object.values(p.categories).map((c) => c.id)];
    };
    expect(shape('en')).toEqual(shape('id'));
    // Tautan sub-nav menunjuk ke bagian yang benar-benar ada di halaman.
    const ids = [...Object.values(PRICING.id.categories).map((c) => c.id), PRICING.id.extrasSection.id, PRICING.id.renewalSection.id, PRICING.id.faq.id];
    expect(PRICING.id.localNav.links.map((l) => l.href.slice(1)).sort()).toEqual(ids.sort());
  });

  it('paket & harga: tautan, format rupiah, dan harga mulai', () => {
    expect(id.nav.pricing.href).toBe(pricingHref('id'));
    expect(en.nav.pricing.href).toBe(pricingHref('en'));
    expect(formatIdr('id', 1_799_000)).toBe('Rp1.799.000');
    expect(formatIdr('en', 1_799_000)).toBe('Rp1,799,000');
    expect(startingPrice('website')).toBe(Math.min(...PACKAGES.filter((p) => p.category === 'website').map((p) => p.price!)));
    // ERP tanpa harga tetap tidak ikut dihitung sebagai "mulai".
    expect(Number.isFinite(startingPrice('app'))).toBe(true);
    expect(packageRenewal('id', getPackage('appBasic'))).toBe('Perpanjangan Rp1.500.000/tahun atau Rp150.000/bulan');
    expect(extraPrice('en', getExtra('androidNative'))).toBe('From Rp999,000');
    expect(extraPrice('id', getExtra('bugfix'))).toBe('Gratis');
  });

  it('kebijakan privasi & syarat layanan: bagian dan bentuk isi sama di kedua bahasa', () => {
    for (const kind of ['privacy', 'terms'] as const) {
      const shape = (locale: 'id' | 'en') => LEGAL[locale][kind].sections.map((s) => [s.id, s.body.map((b) => (typeof b === 'string' ? 'p' : b.length))]);
      expect(shape('en')).toEqual(shape('id'));
    }
    expect(legalHref('id', 'privacy')).toBe('/privacy-policy/');
    expect(legalHref('en', 'terms')).toBe('/en/terms-of-service/');
  });

  it('setiap tab contoh punya ilustrasi desktop dan kartu HP (ERP memakai demo interaktif)', () => {
    for (const item of id.showcase.items) {
      if (item.key === 'erp') continue;
      expect(MOCKUPS[item.key]).toBeTypeOf('function');
      expect(HIGHLIGHTS[item.key]).toBeTypeOf('function');
    }
    expect(en.showcase.demo.steps).toHaveLength(id.showcase.demo.steps.length);
  });

  it('pesan validasi form mengikuti bahasa', () => {
    const r = leadSchemaFor('en').safeParse({ name: 'B', contact: 'hello' });
    expect(r.success).toBe(false);
    expect(r.error?.issues.map((i) => i.message)).toContain(en.contact.form.errors.name);
  });
});

describe('pencatatan klik WhatsApp', () => {
  it('menghitung klik per jalur dan form yang masuk', () => {
    const db = memoryDb();
    recordClick(db, { cta: 'wa_erp', locale: 'id', path: '/' });
    recordClick(db, { cta: 'wa_erp', locale: 'en', path: '/en/' });
    recordClick(db, { cta: 'wa_website', locale: 'id', path: '/' });
    db.insert(leads).values({ name: 'A', contact: '0812345678', service: 'Website company profile' }).run();
    db.insert(leads).values({ name: 'B', contact: '0812345679', service: 'ERP & aplikasi bisnis' }).run();
    db.insert(leads).values({ name: 'C', contact: '0812345670', service: null }).run();

    const r = interestSince(db, new Date(Date.now() - 60_000));
    expect(r.clicks).toEqual({ wa_erp: 2, wa_website: 1, wa_general: 0 });
    expect(r.forms).toEqual({ website: 1, other: 2 });
    expect(interestSince(db, new Date(Date.now() + 60_000)).clicks.wa_erp).toBe(0);
  });

  it('hanya menerima jalur yang dikenal dan membatasi per IP', () => {
    expect(isCtaKey('wa_erp')).toBe(true);
    expect(isCtaKey('drop table')).toBe(false);
    const now = 9_000_000;
    for (let i = 0; i < 60; i++) expect(trackAllowed('7.7.7.7', now)).toBe(true);
    expect(trackAllowed('7.7.7.7', now)).toBe(false);
  });
});
