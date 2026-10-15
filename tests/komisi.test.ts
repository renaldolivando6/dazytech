import { and, eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import type { DB } from '@/lib/db/open';
import { komisiCategories, komisiLines } from '@/lib/db/schema';
import { parseAccurateExcel } from '@/lib/komisi/excel';
import { commitImport, previewImport } from '@/lib/komisi/import';
import { CompanyError, createCompany, listCompanies } from '@/lib/companies';
import { createRun, getRun, listRuns, previewRun, RunError, voidRun } from '@/lib/komisi/runs';
import { buildAccurateWorkbook, memoryDb, type FixtureRow } from './helpers';

const ROWS: FixtureRow[] = [
  // lunas
  { date: '2026-07-02', inv: 'FJ1', item: 'Alpha9 20btg', category: 'ROKOK FILTER', qty: 100, unit: 'BKS', unpaid: 'Tidak' },
  { date: '2026-07-03', inv: 'FJ2', item: 'NAURA 12btg', category: 'ROKOK KRETEK', qty: 200, unit: 'BKS', unpaid: 'Tidak' },
  { date: '2026-07-04', inv: 'FJ3', item: 'DURON 1 PCS', category: 'SUPLEMEN', qty: 10, unit: 'PCS', unpaid: 'Tidak' },
  { date: '2026-07-04', inv: 'FJ3', item: 'DURON 1KTK (ISI 5PCS)', category: 'SUPLEMEN', qty: 2, unit: 'KTK', unpaid: 'Tidak' },
  { date: '2026-07-05', inv: 'FJ4', item: 'MOTI R6000 Juicy Peach', category: 'MOTI', qty: 7, unit: 'PCS', unpaid: 'Tidak' },
  // lunas tapi kategori tanpa tarif
  { date: '2026-07-05', inv: 'FJ5', item: 'Kopi Albantani 100gr', category: 'KOPI', qty: 30, unit: 'PCS', unpaid: 'Tidak' },
  // belum lunas
  { date: '2026-07-06', inv: 'FJ6', item: 'Bignum Ice 20btg', category: 'ROKOK FILTER', qty: 50, unit: 'BKS', unpaid: 'Ya' },
  // lunas tapi setelah cutoff 15 Jul
  { date: '2026-07-20', inv: 'FJ7', item: 'Alpha9 20btg', category: 'ROKOK FILTER', qty: 1000, unit: 'BKS', unpaid: 'Tidak' },
];

// Setelah migrasi: company 1 = Pangan, 2 = Test.
const CO = 1;
const TEST = 2;

async function importRows(db: DB, rows: FixtureRow[], fileName = 'export.xlsx', companyId = CO) {
  const parsed = await parseAccurateExcel(await buildAccurateWorkbook(rows));
  return commitImport(db, { companyId, fileName, fileHash: fileName, parsed, userId: null });
}

describe('import + perhitungan komisi', () => {
  let db: DB;
  beforeEach(() => {
    db = memoryDb();
  });

  it('master tarif awal ikut ter-seed lewat migrasi', () => {
    const codes = db.select().from(komisiCategories).where(eq(komisiCategories.companyId, CO)).all().map((c) => [c.code, c.baseUnit, c.rate]);
    expect(codes).toEqual(
      expect.arrayContaining([
        ['ROKOK FILTER', 'BKS', 10],
        ['ROKOK KRETEK', 'BKS', 3],
        ['SUPLEMEN', 'PCS', 40],
        ['MOTI', 'PCS', 60],
      ]),
    );
  });

  it('import pertama: semua baris baru, kategori tanpa tarif diberi peringatan', async () => {
    const parsed = await parseAccurateExcel(await buildAccurateWorkbook(ROWS));
    const preview = previewImport(db, { companyId: CO, fileName: 'a.xlsx', fileHash: 'h1', parsed });
    expect(preview.summary).toMatchObject({ total: 8, new: 8, duplicate: 0 });
    expect(preview.rows.find((r) => r.category === 'KOPI')?.warning).toContain('KOPI');
    expect(preview.previousImport).toBeNull();

    const { summary } = commitImport(db, { companyId: CO, fileName: 'a.xlsx', fileHash: 'h1', parsed, userId: null });
    expect(summary.new).toBe(8);
    expect(db.select().from(komisiLines).all()).toHaveLength(8);
  });

  it('import ulang file yang sama: semua ditandai duplikat dan tidak masuk lagi', async () => {
    await importRows(db, ROWS);
    const { summary } = await importRows(db, ROWS);
    expect(summary).toMatchObject({ new: 0, duplicate: 8, updated: 0 });
    expect(db.select().from(komisiLines).all()).toHaveLength(8);
  });

  it('menghitung komisi per tarif, termasuk konversi KTK -> PCS, sampai tanggal cutoff', async () => {
    await importRows(db, ROWS);
    const p = previewRun(db, CO, '2026-07-15');

    // 100x10 + 200x3 + 10x40 + 2x5x40 + 7x60 = 1000 + 600 + 400 + 400 + 420
    expect(p.totalAmount).toBe(2820);
    expect(p.totalLines).toBe(5);
    expect(p.groups.find((g) => g.unit === 'KTK')).toMatchObject({ factor: 5, rate: 40, amount: 400 });
    expect(p.excluded.unpaid).toEqual({ lines: 1, amount: 500 });
    expect(p.excluded.noRate).toMatchObject([{ category: 'KOPI', unit: 'PCS', lines: 1, qty: 30 }]);
    expect(p.excluded.afterCutoff).toBe(1);
  });

  it('perhitungan mengunci baris; import ulang menandainya "sudah dikomisikan"', async () => {
    await importRows(db, ROWS);
    const run = createRun(db, { companyId: CO, cutoffDate: '2026-07-15', label: 'Jul', note: null, userId: null });
    expect(run).toMatchObject({ totalLines: 5, totalAmount: 2820 });

    // Hitung lagi dengan cutoff sama: tidak ada yang tersisa.
    expect(() => createRun(db, { companyId: CO, cutoffDate: '2026-07-15', label: 'Jul', note: null, userId: null })).toThrow(RunError);

    const { summary } = await importRows(db, ROWS);
    expect(summary).toMatchObject({ locked: 5, duplicate: 3, new: 0 });
  });

  it('baris yang belum lunas ikut periode berikutnya setelah import baru menandainya lunas', async () => {
    await importRows(db, ROWS);
    createRun(db, { companyId: CO, cutoffDate: '2026-07-15', label: 'Jul', note: null, userId: null });

    const paidNow = ROWS.map((r) => (r.inv === 'FJ6' ? { ...r, unpaid: 'Tidak' } : r));
    const { summary } = await importRows(db, paidNow, 'export-agustus.xlsx');
    expect(summary.updated).toBe(1);

    const line = db.select().from(komisiLines).where(eq(komisiLines.invoiceNo, 'FJ6')).get()!;
    expect(line.isUnpaid).toBe(false);
    expect(line.paidSeenAt).toBeInstanceOf(Date);

    const aug = previewRun(db, CO, '2026-08-15');
    // FJ6 (50 x 10) + FJ7 (1000 x 10)
    expect(aug.totalAmount).toBe(10_500);
    expect(aug.eligible.map((l) => l.invoiceNo).sort()).toEqual(['FJ6', 'FJ7']);
  });

  it('data baris yang sudah dikomisikan berubah di file -> konflik, tidak diubah', async () => {
    await importRows(db, ROWS);
    createRun(db, { companyId: CO, cutoffDate: '2026-07-15', label: 'Jul', note: null, userId: null });

    const edited = ROWS.map((r) => (r.inv === 'FJ1' ? { ...r, qty: 120 } : r));
    const { summary } = await importRows(db, edited);
    expect(summary.conflict).toBe(1);
    expect(db.select().from(komisiLines).where(eq(komisiLines.invoiceNo, 'FJ1')).get()!.qty).toBe(100);
  });

  it('simpan ditolak kalau total berbeda dengan yang dilihat di preview', async () => {
    await importRows(db, ROWS);
    const stale = { companyId: CO, cutoffDate: '2026-07-15', label: 'Jul', note: null, userId: null, expectedAmount: 999 };
    expect(() => createRun(db, stale)).toThrow(RunError);
    // Tidak ada yang terkunci.
    expect(previewRun(db, CO, '2026-07-15').totalAmount).toBe(2820);
    expect(createRun(db, { ...stale, expectedAmount: 2820 }).totalAmount).toBe(2820);
  });

  it('membatalkan perhitungan melepas baris supaya bisa dihitung ulang', async () => {
    await importRows(db, ROWS);
    const { runId } = createRun(db, { companyId: CO, cutoffDate: '2026-07-15', label: 'Jul', note: null, userId: null });
    voidRun(db, { companyId: CO, runId, reason: 'salah cutoff', userId: null });

    expect(previewRun(db, CO, '2026-07-15').totalAmount).toBe(2820);
    expect(() => voidRun(db, { companyId: CO, runId, reason: 'lagi', userId: null })).toThrow(RunError);
  });

  it('tarif kategori baru langsung berlaku untuk baris yang belum dikomisikan', async () => {
    await importRows(db, ROWS);
    db.insert(komisiCategories).values({ companyId: CO, code: 'KOPI', label: 'Kopi', baseUnit: 'PCS', rate: 5 }).run();
    expect(previewRun(db, CO, '2026-07-15').totalAmount).toBe(2820 + 30 * 5);
  });

  it('data tiap company terpisah: faktur sama di company lain bukan duplikat', async () => {
    await importRows(db, ROWS);
    createRun(db, { companyId: CO, cutoffDate: '2026-07-15', label: 'Jul', note: null, userId: null });

    const { summary } = await importRows(db, ROWS, 'export.xlsx', TEST);
    expect(summary).toMatchObject({ new: 8, duplicate: 0, locked: 0 });

    // Test punya salinan tarif sendiri -> total sama, dan belum terkunci oleh run Pangan.
    expect(previewRun(db, TEST, '2026-07-15').totalAmount).toBe(2820);
    expect(previewRun(db, CO, '2026-07-15').totalAmount).toBe(0);
    expect(listRuns(db, TEST)).toHaveLength(0);
    expect(listRuns(db, CO)).toHaveLength(1);
  });

  it('tarif company lain tidak dipakai, perhitungan company lain tidak bisa diakses', async () => {
    await importRows(db, ROWS);
    db.update(komisiCategories).set({ rate: 100 }).where(and(eq(komisiCategories.companyId, TEST), eq(komisiCategories.code, 'MOTI'))).run();
    expect(previewRun(db, CO, '2026-07-15').totalAmount).toBe(2820);

    const { runId } = createRun(db, { companyId: CO, cutoffDate: '2026-07-15', label: 'Jul', note: null, userId: null });
    expect(getRun(db, TEST, runId)).toBeNull();
    expect(getRun(db, CO, runId)).not.toBeNull();
    expect(() => voidRun(db, { companyId: TEST, runId, reason: 'salah company', userId: null })).toThrow(RunError);
  });

  it('company baru bisa mulai kosong atau menyalin master tarif', () => {
    const empty = createCompany(db, { name: 'Baru', copyRatesFrom: null });
    const copy = createCompany(db, { name: 'Salinan', copyRatesFrom: CO });
    expect(db.select().from(komisiCategories).where(eq(komisiCategories.companyId, empty)).all()).toHaveLength(0);
    expect(db.select().from(komisiCategories).where(eq(komisiCategories.companyId, copy)).all()).toHaveLength(4);
    expect(() => createCompany(db, { name: ' pangan ', copyRatesFrom: null })).toThrow(CompanyError);
    expect(listCompanies(db).map((c) => c.name)).toEqual(['Baru', 'Pangan', 'Salinan', 'Test']);
  });
});
