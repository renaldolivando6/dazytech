import { asc, count, eq, sql } from 'drizzle-orm';
import type { DB } from '@/lib/db/open';
import { companies, komisiCategories, komisiLines, komisiRuns, komisiUnitConversions } from '@/lib/db/schema';

export class CompanyError extends Error {}

export function listCompanies(db: DB) {
  const rows = db.select().from(companies).orderBy(asc(companies.name)).all();
  const lines = new Map(
    db
      .select({ companyId: komisiLines.companyId, n: count() })
      .from(komisiLines)
      .groupBy(komisiLines.companyId)
      .all()
      .map((r) => [r.companyId, r.n]),
  );
  const runs = new Map(
    db
      .select({ companyId: komisiRuns.companyId, n: count() })
      .from(komisiRuns)
      .where(eq(komisiRuns.status, 'final'))
      .groupBy(komisiRuns.companyId)
      .all()
      .map((r) => [r.companyId, r.n]),
  );
  return rows.map((c) => ({ ...c, lines: lines.get(c.id) ?? 0, runs: runs.get(c.id) ?? 0 }));
}

export function findCompany(db: DB, id: number) {
  return db.select().from(companies).where(eq(companies.id, id)).get() ?? null;
}

// Company baru bisa langsung memakai salinan master tarif company lain.
export function createCompany(db: DB, input: { name: string; copyRatesFrom: number | null }): number {
  return db.transaction((tx) => {
    const name = input.name.replace(/\s+/g, ' ').trim();
    const clash = tx
      .select({ id: companies.id })
      .from(companies)
      .where(sql`lower(${companies.name}) = lower(${name})`)
      .get();
    if (clash) throw new CompanyError(`Company "${name}" sudah ada.`);

    const created = tx.insert(companies).values({ name }).returning({ id: companies.id }).get();

    if (input.copyRatesFrom !== null) {
      const source = tx.select().from(komisiCategories).where(eq(komisiCategories.companyId, input.copyRatesFrom)).all();
      for (const c of source) {
        const copy = tx
          .insert(komisiCategories)
          .values({ companyId: created.id, code: c.code, label: c.label, baseUnit: c.baseUnit, rate: c.rate, isActive: c.isActive })
          .returning({ id: komisiCategories.id })
          .get();
        const conversions = tx.select().from(komisiUnitConversions).where(eq(komisiUnitConversions.categoryId, c.id)).all();
        for (const u of conversions) {
          tx.insert(komisiUnitConversions).values({ categoryId: copy.id, unit: u.unit, factor: u.factor }).run();
        }
      }
    }
    return created.id;
  });
}
