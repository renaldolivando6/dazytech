import { and, desc, eq, inArray } from 'drizzle-orm';
import type { DB } from '@/lib/db/open';
import { komisiImportRows, komisiImports, komisiLines, type KomisiLine } from '@/lib/db/schema';
import type { ParsedLine, ParseResult } from './excel';
import { loadRateTable, resolveCommission, type RateTable } from './rates';

// Status tiap baris Excel terhadap isi database:
//   new       baris belum pernah ada -> dimasukkan
//   updated   sudah ada, belum dikomisikan, datanya berubah (mis. jadi lunas) -> diperbarui
//   duplicate sudah ada, tidak berubah -> dilewati
//   locked    sudah ada DAN sudah dikomisikan -> dilewati
//   conflict  sudah dikomisikan, tapi data di file berbeda -> dilewati, perlu dicek manual
//   error     baris tidak valid -> dilewati
export type RowStatus = 'new' | 'updated' | 'duplicate' | 'locked' | 'conflict' | 'error';

export type ClassifiedRow = {
  rowNumber: number;
  status: RowStatus;
  lineKey: string | null;
  invoiceNo: string | null;
  invoiceDate: string | null;
  itemName: string | null;
  category: string | null;
  qty: number | null;
  unit: string | null;
  isUnpaid: boolean | null;
  message: string | null;
  // Diisi kalau baris akan masuk tapi kategori/satuannya belum punya tarif.
  warning: string | null;
};

export type ImportSummary = Record<RowStatus, number> & { total: number };

export type ImportPreview = {
  fileName: string;
  fileHash: string;
  sheetName: string;
  summary: ImportSummary;
  rows: ClassifiedRow[];
  previousImport: { id: number; createdAt: Date } | null;
};

type Plan = {
  rows: ClassifiedRow[];
  inserts: ParsedLine[];
  updates: { id: number; line: ParsedLine; becamePaid: boolean; becameUnpaid: boolean }[];
};

const IN_CHUNK = 500;

function findExisting(db: DB, companyId: number, keys: string[]): Map<string, KomisiLine> {
  const existing = new Map<string, KomisiLine>();
  for (let i = 0; i < keys.length; i += IN_CHUNK) {
    const chunk = keys.slice(i, i + IN_CHUNK);
    const rows = db
      .select()
      .from(komisiLines)
      .where(and(eq(komisiLines.companyId, companyId), inArray(komisiLines.lineKey, chunk)))
      .all();
    for (const line of rows) {
      existing.set(line.lineKey, line);
    }
  }
  return existing;
}

const fmtQty = (n: number) => n.toLocaleString('id-ID');
const fmtPaid = (unpaid: boolean) => (unpaid ? 'belum lunas' : 'lunas');

// Perbedaan yang memengaruhi komisi. Kolom lain (konsumen, harga, sales) hanya
// informasi dan ikut diperbarui diam-diam selama baris belum dikomisikan.
function commissionDiffs(old: KomisiLine, line: ParsedLine): string[] {
  const diffs: string[] = [];
  if (old.isUnpaid !== line.isUnpaid) diffs.push(`status ${fmtPaid(old.isUnpaid)} → ${fmtPaid(line.isUnpaid)}`);
  if (old.qty !== line.qty) diffs.push(`QTY ${fmtQty(old.qty)} → ${fmtQty(line.qty)}`);
  if (old.unit !== line.unit) diffs.push(`SATUAN ${old.unit} → ${line.unit}`);
  if (old.category !== line.category) diffs.push(`KATEGORI ${old.category} → ${line.category}`);
  if (old.invoiceDate !== line.invoiceDate) diffs.push(`TGL ${old.invoiceDate} → ${line.invoiceDate}`);
  return diffs;
}

function infoChanged(old: KomisiLine, line: ParsedLine): boolean {
  return (
    old.customer !== line.customer ||
    old.price !== line.price ||
    old.total !== line.total ||
    old.salesperson !== line.salesperson ||
    old.invoiceNo !== line.invoiceNo ||
    old.itemName !== line.itemName
  );
}

function rateWarning(rates: RateTable, line: ParsedLine): string | null {
  const r = resolveCommission(rates, line);
  return r.ok ? null : `${r.message} — baris tetap disimpan, tapi tidak ikut dihitung sampai tarifnya ditambahkan.`;
}

function plan(db: DB, companyId: number, parsed: ParseResult): Plan {
  const rates = loadRateTable(db, companyId);
  const existing = findExisting(
    db,
    companyId,
    parsed.lines.map((l) => l.lineKey),
  );

  const rows: ClassifiedRow[] = [];
  const inserts: Plan['inserts'] = [];
  const updates: Plan['updates'] = [];

  for (const line of parsed.lines) {
    const base = {
      rowNumber: line.rowNumber,
      lineKey: line.lineKey,
      invoiceNo: line.invoiceNo,
      invoiceDate: line.invoiceDate,
      itemName: line.itemName,
      category: line.category,
      qty: line.qty,
      unit: line.unit,
      isUnpaid: line.isUnpaid,
    };
    const old = existing.get(line.lineKey);

    if (!old) {
      inserts.push(line);
      rows.push({ ...base, status: 'new', message: null, warning: rateWarning(rates, line) });
      continue;
    }

    const diffs = commissionDiffs(old, line);

    if (old.commissionRunId !== null) {
      rows.push(
        diffs.length > 0
          ? {
              ...base,
              status: 'conflict',
              message: `Sudah dikomisikan di perhitungan #${old.commissionRunId}, tapi data di file berbeda (${diffs.join(', ')}). Tidak diubah — cek manual.`,
              warning: null,
            }
          : {
              ...base,
              status: 'locked',
              message: `Duplikat — sudah dikomisikan di perhitungan #${old.commissionRunId}.`,
              warning: null,
            },
      );
      continue;
    }

    if (diffs.length > 0 || infoChanged(old, line)) {
      const becamePaid = old.isUnpaid && !line.isUnpaid;
      updates.push({ id: old.id, line, becamePaid, becameUnpaid: !old.isUnpaid && line.isUnpaid });
      rows.push({
        ...base,
        status: 'updated',
        message:
          diffs.length > 0
            ? `${becamePaid ? 'Sekarang LUNAS, siap dihitung. ' : ''}Berubah: ${diffs.join(', ')}.`
            : 'Data pelengkap (konsumen/harga/sales) diperbarui.',
        warning: rateWarning(rates, line),
      });
      continue;
    }

    rows.push({ ...base, status: 'duplicate', message: 'Duplikat — sudah ada dari import sebelumnya.', warning: null });
  }

  for (const e of parsed.errors) {
    rows.push({
      rowNumber: e.rowNumber,
      status: 'error',
      lineKey: null,
      invoiceNo: e.invoiceNo,
      invoiceDate: null,
      itemName: e.itemName,
      category: null,
      qty: null,
      unit: null,
      isUnpaid: null,
      message: e.message,
      warning: null,
    });
  }

  rows.sort((a, b) => a.rowNumber - b.rowNumber);
  return { rows, inserts, updates };
}

function summarize(rows: ClassifiedRow[]): ImportSummary {
  const summary: ImportSummary = { total: rows.length, new: 0, updated: 0, duplicate: 0, locked: 0, conflict: 0, error: 0 };
  for (const r of rows) summary[r.status]++;
  return summary;
}

function previousImportOf(db: DB, companyId: number, fileHash: string) {
  return (
    db
      .select({ id: komisiImports.id, createdAt: komisiImports.createdAt })
      .from(komisiImports)
      .where(and(eq(komisiImports.companyId, companyId), eq(komisiImports.fileHash, fileHash)))
      .orderBy(desc(komisiImports.id))
      .get() ?? null
  );
}

export function previewImport(
  db: DB,
  input: { companyId: number; fileName: string; fileHash: string; parsed: ParseResult },
): ImportPreview {
  const { rows } = plan(db, input.companyId, input.parsed);
  return {
    fileName: input.fileName,
    fileHash: input.fileHash,
    sheetName: input.parsed.sheetName,
    summary: summarize(rows),
    rows,
    previousImport: previousImportOf(db, input.companyId, input.fileHash),
  };
}

// Klasifikasi diulang di dalam transaksi (bukan memakai hasil preview), jadi
// kalau ada import/perhitungan lain di antara preview dan simpan, hasilnya
// tetap benar. better-sqlite3 sinkron: transaksi ini tidak bisa diselang.
export function commitImport(
  db: DB,
  input: { companyId: number; fileName: string; fileHash: string; parsed: ParseResult; userId: number | null },
): { importId: number; summary: ImportSummary } {
  return db.transaction((tx) => {
    const { rows, inserts, updates } = plan(tx as unknown as DB, input.companyId, input.parsed);
    const summary = summarize(rows);
    const now = new Date();

    const imp = tx
      .insert(komisiImports)
      .values({
        companyId: input.companyId,
        fileName: input.fileName,
        fileHash: input.fileHash,
        importedBy: input.userId,
        rowsTotal: summary.total,
        rowsNew: summary.new,
        rowsUpdated: summary.updated,
        rowsDuplicate: summary.duplicate,
        rowsLocked: summary.locked,
        rowsConflict: summary.conflict,
        rowsError: summary.error,
      })
      .returning({ id: komisiImports.id })
      .get();

    for (const line of inserts) {
      tx.insert(komisiLines)
        .values({
          companyId: input.companyId,
          lineKey: line.lineKey,
          invoiceNo: line.invoiceNo,
          invoiceDate: line.invoiceDate,
          customer: line.customer,
          itemName: line.itemName,
          category: line.category,
          qty: line.qty,
          unit: line.unit,
          price: line.price,
          total: line.total,
          salesperson: line.salesperson,
          isUnpaid: line.isUnpaid,
          paidSeenAt: line.isUnpaid ? null : now,
          firstImportId: imp.id,
          lastImportId: imp.id,
        })
        .run();
    }

    for (const u of updates) {
      tx.update(komisiLines)
        .set({
          invoiceNo: u.line.invoiceNo,
          invoiceDate: u.line.invoiceDate,
          customer: u.line.customer,
          itemName: u.line.itemName,
          category: u.line.category,
          qty: u.line.qty,
          unit: u.line.unit,
          price: u.line.price,
          total: u.line.total,
          salesperson: u.line.salesperson,
          isUnpaid: u.line.isUnpaid,
          lastImportId: imp.id,
          ...(u.becamePaid ? { paidSeenAt: now } : {}),
          ...(u.becameUnpaid ? { paidSeenAt: null } : {}),
        })
        .where(eq(komisiLines.id, u.id))
        .run();
    }

    for (const r of rows) {
      tx.insert(komisiImportRows)
        .values({
          importId: imp.id,
          rowNumber: r.rowNumber,
          lineKey: r.lineKey,
          invoiceNo: r.invoiceNo,
          itemName: r.itemName,
          status: r.status,
          message: [r.message, r.warning].filter(Boolean).join(' ') || null,
        })
        .run();
    }

    return { importId: imp.id, summary };
  });
}
