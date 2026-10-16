import { count, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import type { DB } from '@/lib/db/open';
import { getCopy, type Locale } from '@/i18n';
import { leads, type Lead } from '@/lib/db/schema';

export const LEAD_STATUSES = ['new', 'contacted', 'closed'] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];
export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = { new: 'Baru', contacted: 'Dihubungi', closed: 'Selesai' };

// Pesan validasi mengikuti bahasa halaman tempat form diisi.
export function leadSchemaFor(locale: Locale) {
  const e = getCopy(locale).contact.form.errors;
  return z.object({
    name: z.string().trim().min(2, e.name).max(80, e.tooLong),
    contact: z
      .string()
      .trim()
      .min(5, e.contact)
      .max(120, e.tooLong)
      .refine((v) => /@/.test(v) || v.replace(/\D/g, '').length >= 8, e.contactInvalid),
    service: z.string().trim().max(60).optional().default(''),
    message: z.string().trim().max(2000, e.tooLong).optional().default(''),
  });
}

export const leadSchema = leadSchemaFor('id');

export type LeadInput = z.infer<typeof leadSchema>;

export function createLead(db: DB, input: LeadInput, meta: { ipAddress: string | null; userAgent: string | null }): number {
  return db
    .insert(leads)
    .values({
      name: input.name,
      contact: input.contact,
      service: input.service || null,
      message: input.message,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent?.slice(0, 300) ?? null,
    })
    .returning({ id: leads.id })
    .get().id;
}

export function listLeads(db: DB, status: LeadStatus | null): Lead[] {
  const q = db.select().from(leads);
  return (status ? q.where(eq(leads.status, status)) : q).orderBy(desc(leads.createdAt), desc(leads.id)).limit(500).all();
}

export function countLeadsByStatus(db: DB): Record<LeadStatus, number> {
  const out: Record<LeadStatus, number> = { new: 0, contacted: 0, closed: 0 };
  for (const r of db.select({ status: leads.status, n: count() }).from(leads).groupBy(leads.status).all()) out[r.status] = r.n;
  return out;
}

export function setLeadStatus(db: DB, id: number, status: LeadStatus): void {
  db.update(leads).set({ status }).where(eq(leads.id, id)).run();
}

// Pembatas kiriman form per IP, di memori proses (app jalan sebagai satu
// container, sama seperti lib/auth/rate-limit.ts).
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const buckets = new Map<string, { n: number; resetAt: number }>();

export function leadAllowed(ip: string, now = Date.now()): boolean {
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
