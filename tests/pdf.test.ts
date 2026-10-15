import { describe, expect, it } from 'vitest';
import { parseAccurateExcel } from '@/lib/komisi/excel';
import { commitImport } from '@/lib/komisi/import';
import { renderCommissionPdf } from '@/lib/komisi/pdf';
import { createRun, getRun, voidRun } from '@/lib/komisi/runs';
import { buildAccurateWorkbook, memoryDb } from './helpers';

describe('laporan PDF perhitungan komisi', () => {
  it('menghasilkan PDF valid untuk perhitungan final dan yang dibatalkan', async () => {
    const db = memoryDb();
    const rows = Array.from({ length: 120 }, (_, i) => ({
      date: '2026-07-02',
      inv: `FJ${String(i).padStart(4, '0')}`,
      customer: 'PT Contoh Pelanggan Dengan Nama Panjang Sekali',
      item: i % 2 ? 'DURON 1KTK (ISI 5PCS)' : 'Alpha9 20btg',
      category: i % 2 ? 'SUPLEMEN' : 'ROKOK FILTER',
      qty: 10 + i,
      unit: i % 2 ? 'KTK' : 'BKS',
      unpaid: 'Tidak',
    }));
    const parsed = await parseAccurateExcel(await buildAccurateWorkbook(rows));
    commitImport(db, { companyId: 1, fileName: 'a.xlsx', fileHash: 'h', parsed, userId: null });
    const { runId } = createRun(db, { companyId: 1, cutoffDate: '2026-07-15', label: 'Komisi s/d 15 Jul 2026', note: 'uji', userId: null });

    const pdf = await renderCommissionPdf(getRun(db, 1, runId)!, 'Pangan');
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(pdf.length).toBeGreaterThan(5_000);

    voidRun(db, { companyId: 1, runId, reason: 'uji batal', userId: null });
    const voided = await renderCommissionPdf(getRun(db, 1, runId)!, 'Pangan');
    expect(voided.subarray(0, 5).toString()).toBe('%PDF-');
  }, 30_000);
});
