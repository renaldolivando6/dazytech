import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';
import { ExcelFormatError, parseAccurateExcel } from '@/lib/komisi/excel';
import { buildAccurateWorkbook } from './helpers';

describe('parseAccurateExcel', () => {
  it('membaca baris faktur dan melewati baris mata uang, subtotal, grand total', async () => {
    const file = await buildAccurateWorkbook([
      { date: '2026-07-01', inv: 'FJ00014', item: 'DURON 1KTK (ISI 5PCS)', category: 'SUPLEMEN', qty: 5, unit: 'KTK', unpaid: 'Ya', sales: 'ANDRE' },
      { date: '2026-07-01', inv: 'FJ00014', item: 'DURON 1 PCS', category: 'SUPLEMEN', qty: 50, unit: 'PCS', unpaid: 'Ya' },
      { date: '2026-07-01', inv: 'FJ00014', item: 'DURON 1 PCS', category: 'SUPLEMEN', qty: 215, unit: 'PCS', unpaid: 'Ya' },
      { date: '2026-07-02', inv: 'FJ00016', item: 'Alpha9 20btg', category: 'ROKOK FILTER', qty: 250, unit: 'BKS', unpaid: 'Tidak' },
    ]);

    const result = await parseAccurateExcel(file);

    expect(result.errors).toEqual([]);
    expect(result.lines).toHaveLength(4);
    expect(result.lines[0]).toMatchObject({
      rowNumber: 3,
      invoiceNo: 'FJ00014',
      invoiceDate: '2026-07-01',
      customer: 'TOKO A',
      category: 'SUPLEMEN',
      unit: 'KTK',
      qty: 5,
      isUnpaid: true,
      salesperson: 'ANDRE',
    });
    expect(result.lines[3]).toMatchObject({ invoiceNo: 'FJ00016', isUnpaid: false, rowNumber: 7 });
  });

  it('memberi nomor kemunculan untuk item yang sama di satu faktur', async () => {
    const file = await buildAccurateWorkbook([
      { date: '2026-07-01', inv: 'FJ00014', item: 'DURON 1 PCS', category: 'SUPLEMEN', qty: 50, unit: 'PCS', unpaid: 'Ya' },
      { date: '2026-07-01', inv: 'FJ00014', item: 'Duron 1  pcs', category: 'SUPLEMEN', qty: 215, unit: 'PCS', unpaid: 'Ya' },
    ]);
    const { lines } = await parseAccurateExcel(file);
    expect(lines.map((l) => l.lineKey)).toEqual(['FJ00014|DURON 1 PCS|1', 'FJ00014|DURON 1 PCS|2']);
  });

  it('melaporkan baris tidak valid sebagai error tanpa menggagalkan seluruh file', async () => {
    const file = await buildAccurateWorkbook([
      { date: '2026-07-01', inv: 'FJ1', item: 'A', category: 'MOTI', qty: 1, unit: 'PCS', unpaid: 'Mungkin' },
      { date: '2026-07-01', inv: 'FJ2', item: 'B', category: 'MOTI', qty: 0, unit: 'PCS', unpaid: 'Tidak' },
      { date: '2026-07-01', inv: 'FJ3', item: 'C', category: 'MOTI', qty: 3, unit: 'PCS', unpaid: 'Tidak' },
    ]);
    const { lines, errors } = await parseAccurateExcel(file);
    expect(lines.map((l) => l.invoiceNo)).toEqual(['FJ3']);
    expect(errors.map((e) => e.invoiceNo)).toEqual(['FJ1', 'FJ2']);
    expect(errors[0].message).toContain('blm.lunas');
    expect(errors[1].message).toContain('QTY');
  });

  it('menolak file yang bukan export Accurate', async () => {
    const wb = new ExcelJS.Workbook();
    wb.addWorksheet('Sheet1').addRow(['Nama', 'Alamat']);
    const file = Buffer.from(await wb.xlsx.writeBuffer());
    await expect(parseAccurateExcel(file)).rejects.toBeInstanceOf(ExcelFormatError);
  });

  it('menolak file yang bukan xlsx sama sekali', async () => {
    await expect(parseAccurateExcel(Buffer.from('bukan excel'))).rejects.toBeInstanceOf(ExcelFormatError);
  });
});
