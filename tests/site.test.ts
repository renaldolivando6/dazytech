import { describe, expect, it } from 'vitest';
import { HIGHLIGHTS } from '@/components/site/cards';
import { MOCKUPS } from '@/components/site/mockups';
import { en } from '@/i18n/en';
import { id } from '@/i18n/id';
import { LEGAL, legalHref } from '@/i18n/legal';
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
    const offenders = [...strings(id, 'id'), ...strings(en, 'en'), ...strings(LEGAL, 'legal')].filter(([, v]) => v.includes('—'));
    expect(offenders).toEqual([]);
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
