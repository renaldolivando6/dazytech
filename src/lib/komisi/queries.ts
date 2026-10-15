import { and, asc, count, desc, eq, isNotNull, isNull, or, sql, sum, type SQL } from 'drizzle-orm';
import type { DB } from '@/lib/db/open';
import {
  komisiCategories,
  komisiImportRows,
  komisiImports,
  komisiLines,
  komisiRunItems,
  komisiRuns,
  komisiUnitConversions,
  users,
} from '@/lib/db/schema';
import type { RowStatus } from './import';
import { loadRateTable, resolveCommission } from './rates';
import { previewRun } from './runs';

// ---------------------------------------------------------------- ringkasan

export function getOverview(db: DB, today: string) {
  // Tanpa batas cutoff: semua yang menunggu s/d hari ini.
  const pending = previewRun(db, today);
  const done = db
    .select({ lines: sum(komisiRuns.totalLines), amount: sum(komisiRuns.totalAmount), runs: count() })
    .from(komisiRuns)
    .where(eq(komisiRuns.status, 'final'))
    .get();
  const totalLines = db.select({ n: count() }).from(komisiLines).get()?.n ?? 0;

  return {
    totalLines,
    ready: { lines: pending.totalLines, amount: pending.totalAmount },
    unpaid: pending.excluded.unpaid,
    noRate: pending.excluded.noRate,
    done: { lines: Number(done?.lines ?? 0), amount: Number(done?.amount ?? 0), runs: done?.runs ?? 0 },
  };
}

// ---------------------------------------------------------------- daftar baris faktur

export const LINE_FILTERS = ['all', 'ready', 'unpaid', 'no_rate', 'done'] as const;
export type LineFilter = (typeof LINE_FILTERS)[number];

// Kategori aktif + satuannya punya tarif (satuan dasar atau ada konversinya).
const hasRate = sql`EXISTS (
  SELECT 1 FROM ${komisiCategories} c
  WHERE c.code = ${komisiLines.category} AND c.is_active = 1
    AND (c.base_unit = ${komisiLines.unit}
         OR EXISTS (SELECT 1 FROM ${komisiUnitConversions} u WHERE u.category_id = c.id AND u.unit = ${komisiLines.unit}))
)`;

function filterCondition(filter: LineFilter): SQL | undefined {
  switch (filter) {
    case 'ready':
      return and(isNull(komisiLines.commissionRunId), eq(komisiLines.isUnpaid, false), hasRate);
    case 'unpaid':
      return and(isNull(komisiLines.commissionRunId), eq(komisiLines.isUnpaid, true));
    case 'no_rate':
      return and(isNull(komisiLines.commissionRunId), sql`NOT ${hasRate}`);
    case 'done':
      return isNotNull(komisiLines.commissionRunId);
    default:
      return undefined;
  }
}

export function listLines(db: DB, opts: { filter: LineFilter; q: string; page: number; pageSize: number }) {
  const conditions: (SQL | undefined)[] = [filterCondition(opts.filter)];
  const q = opts.q.trim();
  if (q) {
    const pattern = `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    conditions.push(
      or(
        sql`${komisiLines.invoiceNo} LIKE ${pattern} ESCAPE '\\'`,
        sql`${komisiLines.customer} LIKE ${pattern} ESCAPE '\\'`,
        sql`${komisiLines.itemName} LIKE ${pattern} ESCAPE '\\'`,
      ),
    );
  }
  const where = and(...conditions);

  const total = db.select({ n: count() }).from(komisiLines).where(where).get()?.n ?? 0;
  const rows = db
    .select({
      line: komisiLines,
      runAmount: komisiRunItems.amount,
    })
    .from(komisiLines)
    .leftJoin(
      komisiRunItems,
      and(eq(komisiRunItems.lineId, komisiLines.id), eq(komisiRunItems.runId, komisiLines.commissionRunId)),
    )
    .where(where)
    .orderBy(desc(komisiLines.invoiceDate), desc(komisiLines.invoiceNo), asc(komisiLines.id))
    .limit(opts.pageSize)
    .offset((opts.page - 1) * opts.pageSize)
    .all();

  const rates = loadRateTable(db);
  return {
    total,
    rows: rows.map(({ line, runAmount }) => {
      const r = resolveCommission(rates, line);
      let state: Exclude<LineFilter, 'all'>;
      if (line.commissionRunId !== null) state = 'done';
      else if (line.isUnpaid) state = 'unpaid';
      else if (!r.ok) state = 'no_rate';
      else state = 'ready';
      return {
        ...line,
        state,
        // Sudah dikomisikan: angka snapshot. Belum: estimasi dengan tarif sekarang.
        amount: runAmount ?? (r.ok ? r.amount : null),
        rateNote: r.ok ? null : r.message,
      };
    }),
  };
}

// ---------------------------------------------------------------- riwayat import

export function listImports(db: DB, limit = 20) {
  return db
    .select({
      id: komisiImports.id,
      fileName: komisiImports.fileName,
      createdAt: komisiImports.createdAt,
      importedBy: users.username,
      rowsTotal: komisiImports.rowsTotal,
      rowsNew: komisiImports.rowsNew,
      rowsUpdated: komisiImports.rowsUpdated,
      rowsDuplicate: komisiImports.rowsDuplicate,
      rowsLocked: komisiImports.rowsLocked,
      rowsConflict: komisiImports.rowsConflict,
      rowsError: komisiImports.rowsError,
    })
    .from(komisiImports)
    .leftJoin(users, eq(users.id, komisiImports.importedBy))
    .orderBy(desc(komisiImports.id))
    .limit(limit)
    .all();
}

export function getImport(db: DB, importId: number, status: RowStatus | 'all') {
  const imp = db
    .select({ imp: komisiImports, importedBy: users.username })
    .from(komisiImports)
    .leftJoin(users, eq(users.id, komisiImports.importedBy))
    .where(eq(komisiImports.id, importId))
    .get();
  if (!imp) return null;

  const rows = db
    .select()
    .from(komisiImportRows)
    .where(
      and(
        eq(komisiImportRows.importId, importId),
        status === 'all' ? undefined : eq(komisiImportRows.status, status),
      ),
    )
    .orderBy(asc(komisiImportRows.rowNumber))
    .all();

  return { ...imp.imp, importedByName: imp.importedBy, rows };
}

// ---------------------------------------------------------------- master tarif

export function listCategoriesWithConversions(db: DB) {
  const categories = db.select().from(komisiCategories).orderBy(asc(komisiCategories.code)).all();
  const conversions = db.select().from(komisiUnitConversions).orderBy(asc(komisiUnitConversions.unit)).all();
  return categories.map((c) => ({ ...c, conversions: conversions.filter((u) => u.categoryId === c.id) }));
}

// Kombinasi kategori/satuan di data faktur yang belum dikomisikan dan belum
// punya tarif — ditampilkan di halaman master supaya mudah dilengkapi.
export function listUnmatchedCategoryUnits(db: DB) {
  return db
    .select({ category: komisiLines.category, unit: komisiLines.unit, lines: count() })
    .from(komisiLines)
    .where(and(isNull(komisiLines.commissionRunId), sql`NOT ${hasRate}`))
    .groupBy(komisiLines.category, komisiLines.unit)
    .orderBy(asc(komisiLines.category))
    .all();
}
