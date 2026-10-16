import { and, count, eq, gte } from 'drizzle-orm';
import type { CtaKey } from '@/components/site/content';
import type { DB } from '@/lib/db/open';
import { ctaClicks, leads } from '@/lib/db/schema';

export const CTA_KEYS: CtaKey[] = ['wa_erp', 'wa_website', 'wa_general'];

export function isCtaKey(value: unknown): value is CtaKey {
  return typeof value === 'string' && (CTA_KEYS as string[]).includes(value);
}

export function recordClick(db: DB, input: { cta: CtaKey; locale: 'id' | 'en'; path: string }): void {
  db.insert(ctaClicks)
    .values({ cta: input.cta, locale: input.locale, path: input.path.slice(0, 200) })
    .run();
}

// Ringkasan minat sejak `since`: klik WhatsApp per jalur + form kontak yang masuk.
// Klik belum tentu jadi percakapan; form & chat yang benar-benar masuk dihitung terpisah.
export function interestSince(db: DB, since: Date) {
  const clicks: Record<CtaKey, number> = { wa_erp: 0, wa_website: 0, wa_general: 0 };
  for (const r of db.select({ cta: ctaClicks.cta, n: count() }).from(ctaClicks).where(gte(ctaClicks.createdAt, since)).groupBy(ctaClicks.cta).all()) {
    clicks[r.cta] = r.n;
  }
  // Form kontak: "Website company profile" vs semua kebutuhan lain (ERP, integrasi, dll).
  const website = 'Website company profile';
  const total = db.select({ n: count() }).from(leads).where(gte(leads.createdAt, since)).get()?.n ?? 0;
  const forWebsite = db.select({ n: count() }).from(leads).where(and(gte(leads.createdAt, since), eq(leads.service, website))).get()?.n ?? 0;
  return { clicks, forms: { website: forWebsite, other: total - forWebsite } };
}

// Pembatas per IP di memori proses (sama seperti form kontak): cegah satu
// sumber membanjiri tabel. IP tidak disimpan ke database.
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 60;
const buckets = new Map<string, { n: number; resetAt: number }>();

export function trackAllowed(ip: string, now = Date.now()): boolean {
  let b = buckets.get(ip);
  if (!b || b.resetAt <= now) {
    b = { n: 0, resetAt: now + WINDOW_MS };
    buckets.set(ip, b);
  }
  if (b.n >= MAX_PER_WINDOW) return false;
  b.n++;
  if (buckets.size > 10_000) {
    for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
  }
  return true;
}
