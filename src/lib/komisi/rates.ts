import { eq, inArray } from 'drizzle-orm';
import { komisiCategories, komisiUnitConversions } from '@/lib/db/schema';
import type { DB } from '@/lib/db/open';

// Tarif aktif dalam bentuk yang siap dipakai menghitung:
//   rates.get('SUPLEMEN') -> { rate: 40, baseUnit: 'PCS', factors: { PCS: 1, KTK: 5 } }
export type RateEntry = {
  categoryId: number;
  code: string;
  label: string;
  baseUnit: string;
  rate: number;
  factors: Map<string, number>;
};
export type RateTable = Map<string, RateEntry>;

export function loadRateTable(db: DB, companyId: number): RateTable {
  const categories = db.select().from(komisiCategories).where(eq(komisiCategories.companyId, companyId)).all();
  const ids = categories.map((c) => c.id);
  const conversions = ids.length
    ? db.select().from(komisiUnitConversions).where(inArray(komisiUnitConversions.categoryId, ids)).all()
    : [];

  const table: RateTable = new Map();
  for (const c of categories) {
    if (!c.isActive) continue;
    const factors = new Map<string, number>([[c.baseUnit, 1]]);
    for (const conv of conversions) {
      if (conv.categoryId === c.id) factors.set(conv.unit, conv.factor);
    }
    table.set(c.code, { categoryId: c.id, code: c.code, label: c.label, baseUnit: c.baseUnit, rate: c.rate, factors });
  }
  return table;
}

export type Resolution =
  | { ok: true; rate: number; factor: number; baseUnit: string; amount: number }
  | { ok: false; reason: 'no_category' | 'no_unit'; message: string };

// Komisi satu baris = qty x faktor konversi x tarif per satuan dasar.
// Dibulatkan ke rupiah per baris (qty dari Accurate praktis selalu bulat).
export function resolveCommission(
  rates: RateTable,
  line: { category: string; unit: string; qty: number },
): Resolution {
  const entry = rates.get(line.category);
  if (!entry) {
    return { ok: false, reason: 'no_category', message: `Kategori "${line.category}" belum ada tarifnya` };
  }
  const factor = entry.factors.get(line.unit);
  if (factor === undefined) {
    return {
      ok: false,
      reason: 'no_unit',
      message: `Satuan "${line.unit}" belum punya konversi ke ${entry.baseUnit} (kategori ${line.category})`,
    };
  }
  return {
    ok: true,
    rate: entry.rate,
    factor,
    baseUnit: entry.baseUnit,
    amount: Math.round(line.qty * factor * entry.rate),
  };
}
