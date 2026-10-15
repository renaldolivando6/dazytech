import ExcelJS from 'exceljs';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';
import { formatDate } from '@/lib/format';
import { getRun } from '@/lib/komisi/runs';

// Download hasil perhitungan sebagai .xlsx (sheet Ringkasan + Rincian).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.mustChangePassword) return new NextResponse('Unauthorized', { status: 401 });

  const runId = Number.parseInt((await params).id, 10);
  const data = Number.isSafeInteger(runId) ? getRun(getDb(), runId) : null;
  if (!data) return new NextResponse('Not found', { status: 404 });
  const { run, items, groups } = data;

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Dazytech Admin';
  wb.created = new Date();
  const rupiah = '"Rp" #,##0';
  const qtyFmt = '#,##0.##';

  const summary = wb.addWorksheet('Ringkasan');
  summary.addRow([run.label]).font = { bold: true, size: 14 };
  summary.addRow([`Perhitungan #${run.id} · cutoff ${formatDate(run.cutoffDate)} · status ${run.status === 'void' ? 'DIBATALKAN' : 'final'}`]);
  summary.addRow([]);
  summary.columns = [{ width: 22 }, { width: 10 }, { width: 14 }, { width: 10 }, { width: 10 }, { width: 14 }, { width: 16 }];
  const head = summary.addRow(['Kategori', 'Baris', 'Qty', 'Satuan', 'Konversi', 'Tarif', 'Komisi']);
  head.font = { bold: true };
  for (const g of groups) {
    summary.addRow([g.category, g.lines, g.qty, g.unit, g.factor === 1 ? '' : `1 ${g.unit} = ${g.factor} ${g.baseUnit}`, g.rate, g.amount]);
  }
  const total = summary.addRow(['Total', run.totalLines, null, null, null, null, run.totalAmount]);
  total.font = { bold: true };
  summary.getColumn(3).numFmt = qtyFmt;
  summary.getColumn(6).numFmt = rupiah;
  summary.getColumn(7).numFmt = rupiah;

  const detail = wb.addWorksheet('Rincian');
  detail.columns = [
    { header: 'Tgl', key: 'date', width: 12 },
    { header: 'No Inv', key: 'inv', width: 16 },
    { header: 'Konsumen', key: 'customer', width: 32 },
    { header: 'Nama Barang', key: 'item', width: 36 },
    { header: 'Kategori', key: 'category', width: 16 },
    { header: 'Qty', key: 'qty', width: 10, style: { numFmt: qtyFmt } },
    { header: 'Satuan', key: 'unit', width: 8 },
    { header: 'Konversi', key: 'factor', width: 9 },
    { header: 'Tarif', key: 'rate', width: 10, style: { numFmt: rupiah } },
    { header: 'Komisi', key: 'amount', width: 14, style: { numFmt: rupiah } },
    { header: 'Sales', key: 'sales', width: 16 },
  ];
  detail.getRow(1).font = { bold: true };
  detail.views = [{ state: 'frozen', ySplit: 1 }];
  for (const it of items) {
    detail.addRow({
      date: new Date(`${it.invoiceDate}T00:00:00Z`),
      inv: it.invoiceNo,
      customer: it.customer,
      item: it.itemName,
      category: it.category,
      qty: it.qty,
      unit: it.unit,
      factor: it.factor,
      rate: it.rate,
      amount: it.amount,
      sales: it.salesperson,
    });
  }
  detail.getColumn('date').numFmt = 'dd/mm/yyyy';

  const buffer = await wb.xlsx.writeBuffer();
  const fileName = `komisi-${run.id}-cutoff-${run.cutoffDate}.xlsx`;
  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
