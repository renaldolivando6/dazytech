import ExcelJS from 'exceljs';
import { normalizeCode, normalizeText } from './normalize';

// Parser untuk export "Rincian Faktur Penjualan" dari Accurate.
//
// Bentuk file (lihat tests/excel.test.ts untuk contoh lengkap):
//   baris header  : TGL | NO INV | KONSUMEN | NAMA BARANG | KATEGORI | QTY | SATUAN | ... | blm.lunas
//   baris mata uang ("Indonesian Rupiah")
//   baris detail faktur, diselingi baris SUBTOTAL per faktur (NO INV kosong)
//   baris GRAND TOTAL di paling bawah (NO INV kosong)
//
// Kolom dicari berdasarkan NAMA header, bukan posisi: header Accurate berupa
// sel merged sehingga nilainya tidak selalu di kolom yang terlihat di Excel.

export type ParsedLine = {
  rowNumber: number;
  invoiceNo: string;
  invoiceDate: string; // YYYY-MM-DD
  customer: string | null;
  itemName: string;
  category: string; // dinormalisasi
  qty: number;
  unit: string; // dinormalisasi
  price: number | null;
  total: number | null;
  salesperson: string | null;
  isUnpaid: boolean;
  // `NO INV|NAMA BARANG|n` — n = kemunculan ke-n item yang sama di faktur yang sama.
  lineKey: string;
};

export type RowError = {
  rowNumber: number;
  invoiceNo: string | null;
  itemName: string | null;
  message: string;
};

export type ParseResult = {
  sheetName: string;
  lines: ParsedLine[];
  errors: RowError[];
};

export class ExcelFormatError extends Error {}

const MAX_ROWS = 50_000;
const HEADER_SEARCH_ROWS = 20;

const COLUMNS = {
  date: 'TGL',
  invoiceNo: 'NO INV',
  customer: 'KONSUMEN',
  itemName: 'NAMA BARANG',
  category: 'KATEGORI',
  qty: 'QTY',
  unit: 'SATUAN',
  price: 'HARGA',
  total: 'TOTAL HARGA',
  salesperson: 'SALES (NOTA)',
  unpaid: 'BLM.LUNAS',
} as const;

type ColumnKey = keyof typeof COLUMNS;
const REQUIRED: ColumnKey[] = ['date', 'invoiceNo', 'itemName', 'category', 'qty', 'unit', 'unpaid'];

export async function parseAccurateExcel(data: ArrayBuffer | Buffer): Promise<ParseResult> {
  const workbook = new ExcelJS.Workbook();
  try {
    // exceljs menerima Buffer; ArrayBuffer dari File di-wrap tanpa copy.
    await workbook.xlsx.load((Buffer.isBuffer(data) ? data : Buffer.from(data)) as never);
  } catch {
    throw new ExcelFormatError('File tidak bisa dibaca sebagai .xlsx. Pastikan file hasil export Accurate (format Excel .xlsx).');
  }

  for (const sheet of workbook.worksheets) {
    const found = findHeader(sheet);
    if (found) return parseSheet(sheet, found.headerRow, found.columns);
  }

  throw new ExcelFormatError(
    `Header tidak ditemukan. File harus punya kolom: ${REQUIRED.map((k) => COLUMNS[k]).join(', ')}.`,
  );
}

function findHeader(sheet: ExcelJS.Worksheet) {
  const last = Math.min(sheet.rowCount, HEADER_SEARCH_ROWS);
  for (let r = 1; r <= last; r++) {
    const columns: Partial<Record<ColumnKey, number>> = {};
    sheet.getRow(r).eachCell((cell, col) => {
      const name = normalizeCode(cellText(cell.value));
      for (const [key, header] of Object.entries(COLUMNS) as [ColumnKey, string][]) {
        // Pakai kemunculan pertama: KONSUMEN muncul dua kali (sel merged).
        if (name === header && columns[key] === undefined) columns[key] = col;
      }
    });
    if (REQUIRED.every((k) => columns[k] !== undefined)) {
      return { headerRow: r, columns };
    }
  }
  return null;
}

function parseSheet(
  sheet: ExcelJS.Worksheet,
  headerRow: number,
  columns: Partial<Record<ColumnKey, number>>,
): ParseResult {
  if (sheet.rowCount - headerRow > MAX_ROWS) {
    throw new ExcelFormatError(`File terlalu besar (maksimal ${MAX_ROWS.toLocaleString('id-ID')} baris).`);
  }

  const lines: ParsedLine[] = [];
  const errors: RowError[] = [];
  const occurrences = new Map<string, number>();

  for (let r = headerRow + 1; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const get = (key: ColumnKey) => {
      if (!columns[key]) return null;
      const cell = row.getCell(columns[key]!);
      // Sel "anak" dari area merged ikut melaporkan nilai sel induknya. Baris
      // mata uang Accurate (B2:G2 "Indonesian Rupiah") menutupi kolom NO INV,
      // jadi nilai seperti itu harus diabaikan.
      if (cell.isMerged && cell.master.address !== cell.address) return null;
      return cell.value;
    };

    const invoiceNo = normalizeText(cellText(get('invoiceNo')));
    const itemName = normalizeText(cellText(get('itemName')));
    // Baris tanpa NO INV = baris mata uang, subtotal, grand total, atau kosong.
    // Baris tanpa tanggal, barang, DAN kategori juga bukan baris faktur.
    if (!invoiceNo) continue;
    if (!cellDate(get('date')) && !itemName && !normalizeText(cellText(get('category')))) continue;

    // Urutan kemunculan dihitung untuk SEMUA baris ber-NO INV (termasuk yang
    // error), supaya membetulkan satu baris tidak menggeser kunci baris lain.
    const occurrenceKey = `${normalizeCode(invoiceNo)}|${normalizeCode(itemName)}`;
    const occurrence = (occurrences.get(occurrenceKey) ?? 0) + 1;
    occurrences.set(occurrenceKey, occurrence);

    const problems: string[] = [];
    const invoiceDate = cellDate(get('date'));
    if (!invoiceDate) problems.push('TGL bukan tanggal yang valid');
    if (!itemName) problems.push('NAMA BARANG kosong');
    const category = normalizeCode(cellText(get('category')));
    if (!category) problems.push('KATEGORI kosong');
    const unit = normalizeCode(cellText(get('unit')));
    if (!unit) problems.push('SATUAN kosong');
    const qty = cellNumber(get('qty'));
    if (qty === null) problems.push('QTY bukan angka');
    else if (qty <= 0) problems.push('QTY harus lebih dari 0');
    const unpaidRaw = normalizeCode(cellText(get('unpaid')));
    if (unpaidRaw !== 'YA' && unpaidRaw !== 'TIDAK') {
      problems.push(`blm.lunas harus "Ya" atau "Tidak" (isi: "${unpaidRaw || 'kosong'}")`);
    }

    if (problems.length > 0) {
      errors.push({ rowNumber: r, invoiceNo, itemName: itemName || null, message: problems.join('; ') });
      continue;
    }

    lines.push({
      rowNumber: r,
      invoiceNo,
      invoiceDate: invoiceDate!,
      customer: normalizeText(cellText(get('customer'))) || null,
      itemName,
      category,
      qty: qty!,
      unit,
      price: cellNumber(get('price')),
      total: cellNumber(get('total')),
      salesperson: normalizeText(cellText(get('salesperson'))) || null,
      isUnpaid: unpaidRaw === 'YA',
      lineKey: `${occurrenceKey}|${occurrence}`,
    });
  }

  return { sheetName: sheet.name, lines, errors };
}

// ---------------------------------------------------------------- cell helpers

export function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'object') {
    if ('richText' in value && Array.isArray(value.richText)) return value.richText.map((r) => r.text).join('');
    if ('result' in value) return cellText(value.result as ExcelJS.CellValue);
    if ('text' in value) return cellText(value.text as ExcelJS.CellValue);
  }
  return '';
}

function cellNumber(value: ExcelJS.CellValue): number | null {
  if (value && typeof value === 'object' && !(value instanceof Date) && 'result' in value) {
    return cellNumber(value.result as ExcelJS.CellValue);
  }
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const text = cellText(value).trim();
  if (!text) return null;
  // Format angka Indonesia: titik = ribuan, koma = desimal ("1.250,5").
  const normalized = text.replace(/\./g, '').replace(',', '.');
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function cellDate(value: ExcelJS.CellValue): string | null {
  if (value && typeof value === 'object' && !(value instanceof Date) && 'result' in value) {
    return cellDate(value.result as ExcelJS.CellValue);
  }
  // exceljs mengembalikan tanggal Excel sebagai Date UTC tengah malam.
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString().slice(0, 10);
  // Serial number Excel (hari sejak 1899-12-30).
  if (typeof value === 'number' && value > 0 && value < 2958466) {
    return new Date(Math.round((value - 25569) * 86_400_000)).toISOString().slice(0, 10);
  }
  // Teks "dd/mm/yyyy" atau "yyyy-mm-dd".
  const text = cellText(value).trim();
  let m = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (m) return isoDate(Number(m[3]), Number(m[2]), Number(m[1]));
  m = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return isoDate(Number(m[1]), Number(m[2]), Number(m[3]));
  return null;
}

function isoDate(y: number, m: number, d: number): string | null {
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return date.toISOString().slice(0, 10);
}
