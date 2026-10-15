import ExcelJS from 'exceljs';
import { openDatabase, runMigrations, type DB } from '@/lib/db/open';

export function memoryDb(): DB {
  const db = openDatabase(':memory:');
  runMigrations(db);
  return db;
}

export type FixtureRow = {
  date: string; // YYYY-MM-DD
  inv: string;
  customer?: string;
  item: string;
  category: string;
  qty: number;
  unit: string;
  price?: number;
  sales?: string;
  unpaid: 'Ya' | 'Tidak' | string;
};

// Meniru export "Rincian Faktur Penjualan" Accurate: header di baris 1 dengan
// kolom berselang (C, E, G:H merged, J, L, ...), baris mata uang di baris 2,
// baris subtotal setelah tiap faktur, dan grand total di akhir.
export async function buildAccurateWorkbook(rows: FixtureRow[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Rincian Faktur Penjualan OTOMOT');
  const rich = (text: string) => ({ richText: [{ text }] });

  const header: Record<number, string> = {
    3: 'TGL', 5: 'NO INV', 7: 'KONSUMEN', 8: 'KONSUMEN', 10: 'NAMA BARANG', 12: 'KATEGORI', 14: 'QTY',
    16: 'SATUAN', 18: 'HARGA', 20: 'dis%', 22: 'disc (item)', 24: 'TOTAL HARGA', 26: 'dis%',
    28: 'disc (faktur)', 30: 'SALES (NOTA)', 32: 'FJdimuka', 34: 'Terima Barang', 36: 'blm.lunas',
  };
  for (const [col, text] of Object.entries(header)) ws.getRow(1).getCell(Number(col)).value = rich(text);
  ws.mergeCells('G1:H1');
  // Persis seperti file asli: B2:G2 merged, menutupi kolom TGL dan NO INV.
  ws.getRow(2).getCell(2).value = rich('Indonesian Rupiah');
  ws.mergeCells('B2:G2');

  let r = 3;
  let grand = 0;
  let qtySum = 0;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const total = (row.price ?? 1000) * row.qty;
    const cells = ws.getRow(r);
    cells.getCell(3).value = new Date(`${row.date}T00:00:00Z`);
    cells.getCell(5).value = rich(row.inv);
    cells.getCell(7).value = rich(row.customer ?? 'TOKO A');
    cells.getCell(8).value = rich(row.customer ?? 'TOKO A');
    cells.getCell(10).value = rich(row.item);
    cells.getCell(12).value = rich(row.category);
    cells.getCell(14).value = row.qty;
    cells.getCell(16).value = rich(row.unit);
    cells.getCell(18).value = row.price ?? 1000;
    cells.getCell(22).value = 0;
    cells.getCell(24).value = total;
    cells.getCell(28).value = 0;
    if (row.sales) cells.getCell(30).value = rich(row.sales);
    cells.getCell(32).value = rich('Tidak');
    cells.getCell(36).value = rich(row.unpaid);
    grand += total;
    qtySum += row.qty;
    r++;
    // Baris subtotal setelah faktur terakhir dari NO INV yang sama.
    if (rows[i + 1]?.inv !== row.inv) {
      ws.getRow(r).getCell(24).value = total;
      r++;
    }
  }
  ws.getRow(r).getCell(14).value = qtySum;
  ws.getRow(r).getCell(24).value = grand;

  return Buffer.from(await wb.xlsx.writeBuffer());
}
