import { and, asc, desc, eq, inArray, isNull } from 'drizzle-orm';
import type { DB } from '@/lib/db/open';
import { komisiLines, komisiRunItems, komisiRuns, users, type KomisiLine } from '@/lib/db/schema';
import { loadRateTable, resolveCommission, type RateTable } from './rates';

export class RunError extends Error {}

export type EligibleLine = KomisiLine & { rate: number; factor: number; baseUnit: string; amount: number };

export type RunGroup = {
  category: string;
  label: string;
  unit: string;
  baseUnit: string;
  factor: number;
  rate: number;
  lines: number;
  qty: number;
  amount: number;
};

export type NoRateGroup = { category: string; unit: string; lines: number; qty: number; message: string };

export type RunPreview = {
  cutoffDate: string;
  eligible: EligibleLine[];
  groups: RunGroup[];
  totalLines: number;
  totalAmount: number;
  excluded: {
    unpaid: { lines: number; amount: number };
    noRate: NoRateGroup[];
    afterCutoff: number;
  };
};

// Aturan masuk perhitungan:
//   1. belum pernah dikomisikan,
//   2. blm.lunas = "Tidak" (sudah lunas),
//   3. TGL faktur <= tanggal cutoff,
//   4. kategori + satuannya punya tarif.
// Baris yang belum lunas tetap menunggu dan otomatis ikut periode berikutnya
// begitu import terbaru menandainya lunas.
export function previewRun(
  db: DB,
  companyId: number,
  cutoffDate: string,
  rates: RateTable = loadRateTable(db, companyId),
): RunPreview {
  const pending = db
    .select()
    .from(komisiLines)
    .where(and(eq(komisiLines.companyId, companyId), isNull(komisiLines.commissionRunId)))
    .orderBy(asc(komisiLines.invoiceDate), asc(komisiLines.invoiceNo), asc(komisiLines.id))
    .all();

  const eligible: EligibleLine[] = [];
  const groups = new Map<string, RunGroup>();
  const noRate = new Map<string, NoRateGroup>();
  const unpaid = { lines: 0, amount: 0 };
  let afterCutoff = 0;

  for (const line of pending) {
    if (line.invoiceDate > cutoffDate) {
      afterCutoff++;
      continue;
    }
    const r = resolveCommission(rates, line);
    if (line.isUnpaid) {
      unpaid.lines++;
      if (r.ok) unpaid.amount += r.amount;
      continue;
    }
    if (!r.ok) {
      const key = `${line.category}|${line.unit}`;
      const g = noRate.get(key) ?? { category: line.category, unit: line.unit, lines: 0, qty: 0, message: r.message };
      g.lines++;
      g.qty += line.qty;
      noRate.set(key, g);
      continue;
    }

    eligible.push({ ...line, rate: r.rate, factor: r.factor, baseUnit: r.baseUnit, amount: r.amount });
    const key = `${line.category}|${line.unit}`;
    const g = groups.get(key) ?? {
      category: line.category,
      label: rates.get(line.category)?.label ?? line.category,
      unit: line.unit,
      baseUnit: r.baseUnit,
      factor: r.factor,
      rate: r.rate,
      lines: 0,
      qty: 0,
      amount: 0,
    };
    g.lines++;
    g.qty += line.qty;
    g.amount += r.amount;
    groups.set(key, g);
  }

  const sortedGroups = [...groups.values()].sort((a, b) => b.amount - a.amount);
  return {
    cutoffDate,
    eligible,
    groups: sortedGroups,
    totalLines: eligible.length,
    totalAmount: sortedGroups.reduce((s, g) => s + g.amount, 0),
    excluded: { unpaid, noRate: [...noRate.values()], afterCutoff },
  };
}

export function createRun(
  db: DB,
  input: {
    companyId: number;
    cutoffDate: string;
    label: string;
    note: string | null;
    userId: number | null;
    // Total yang sedang dilihat user. Kalau hasil hitung ulang di dalam
    // transaksi berbeda (ada import/perubahan tarif sejak preview), simpan
    // ditolak supaya angka yang dikunci = angka yang dilihat.
    expectedAmount?: number;
  },
): { runId: number; totalLines: number; totalAmount: number } {
  return db.transaction((tx) => {
    const preview = previewRun(tx as unknown as DB, input.companyId, input.cutoffDate);
    if (preview.totalLines === 0) {
      throw new RunError('Tidak ada baris yang siap dihitung untuk cutoff ini.');
    }
    if (input.expectedAmount !== undefined && input.expectedAmount !== preview.totalAmount) {
      throw new RunError(
        'Data berubah sejak preview ditampilkan (ada import baru atau tarif berubah). Muat ulang halaman, cek lagi, lalu simpan.',
      );
    }

    const run = tx
      .insert(komisiRuns)
      .values({
        companyId: input.companyId,
        label: input.label,
        cutoffDate: input.cutoffDate,
        totalLines: preview.totalLines,
        totalAmount: preview.totalAmount,
        note: input.note,
        createdBy: input.userId,
      })
      .returning({ id: komisiRuns.id })
      .get();

    for (const line of preview.eligible) {
      tx.insert(komisiRunItems)
        .values({
          runId: run.id,
          lineId: line.id,
          category: line.category,
          unit: line.unit,
          baseUnit: line.baseUnit,
          qty: line.qty,
          factor: line.factor,
          rate: line.rate,
          amount: line.amount,
        })
        .run();
    }

    // Kunci baris. Syarat `commission_run_id IS NULL` + cek jumlah = pengaman
    // terakhir supaya satu baris tidak pernah masuk dua perhitungan.
    const ids = preview.eligible.map((l) => l.id);
    let locked = 0;
    for (let i = 0; i < ids.length; i += 500) {
      locked += tx
        .update(komisiLines)
        .set({ commissionRunId: run.id })
        .where(and(inArray(komisiLines.id, ids.slice(i, i + 500)), isNull(komisiLines.commissionRunId)))
        .run().changes;
    }
    if (locked !== ids.length) {
      throw new RunError('Sebagian baris sudah dikunci proses lain. Muat ulang halaman lalu coba lagi.');
    }

    return { runId: run.id, totalLines: preview.totalLines, totalAmount: preview.totalAmount };
  });
}

// Membatalkan perhitungan: baris-barisnya dilepas lagi (bisa dihitung ulang),
// tapi catatan perhitungan + snapshot itemnya tetap disimpan sebagai riwayat.
export function voidRun(db: DB, input: { companyId: number; runId: number; reason: string; userId: number | null }): void {
  db.transaction((tx) => {
    const run = tx
      .select()
      .from(komisiRuns)
      .where(and(eq(komisiRuns.id, input.runId), eq(komisiRuns.companyId, input.companyId)))
      .get();
    if (!run) throw new RunError('Perhitungan tidak ditemukan.');
    if (run.status === 'void') throw new RunError('Perhitungan ini sudah dibatalkan.');

    tx.update(komisiRuns)
      .set({ status: 'void', voidedAt: new Date(), voidedBy: input.userId, voidReason: input.reason })
      .where(eq(komisiRuns.id, input.runId))
      .run();
    tx.update(komisiLines).set({ commissionRunId: null }).where(eq(komisiLines.commissionRunId, input.runId)).run();
  });
}

export function listRuns(db: DB, companyId: number) {
  return db
    .select({
      id: komisiRuns.id,
      label: komisiRuns.label,
      cutoffDate: komisiRuns.cutoffDate,
      status: komisiRuns.status,
      totalLines: komisiRuns.totalLines,
      totalAmount: komisiRuns.totalAmount,
      createdAt: komisiRuns.createdAt,
      createdBy: users.username,
    })
    .from(komisiRuns)
    .leftJoin(users, eq(users.id, komisiRuns.createdBy))
    .where(eq(komisiRuns.companyId, companyId))
    .orderBy(desc(komisiRuns.id))
    .all();
}

// Selalu lewat companyId: perhitungan company lain dianggap tidak ada.
export function getRun(db: DB, companyId: number, runId: number) {
  const run = db
    .select()
    .from(komisiRuns)
    .where(and(eq(komisiRuns.id, runId), eq(komisiRuns.companyId, companyId)))
    .get();
  if (!run) return null;

  const [createdBy, voidedBy] = [run.createdBy, run.voidedBy].map((id) =>
    id ? (db.select({ username: users.username }).from(users).where(eq(users.id, id)).get()?.username ?? null) : null,
  );

  const items = db
    .select({
      lineId: komisiLines.id,
      invoiceNo: komisiLines.invoiceNo,
      invoiceDate: komisiLines.invoiceDate,
      customer: komisiLines.customer,
      itemName: komisiLines.itemName,
      salesperson: komisiLines.salesperson,
      category: komisiRunItems.category,
      unit: komisiRunItems.unit,
      baseUnit: komisiRunItems.baseUnit,
      qty: komisiRunItems.qty,
      factor: komisiRunItems.factor,
      rate: komisiRunItems.rate,
      amount: komisiRunItems.amount,
    })
    .from(komisiRunItems)
    .innerJoin(komisiLines, eq(komisiLines.id, komisiRunItems.lineId))
    .where(eq(komisiRunItems.runId, runId))
    .orderBy(asc(komisiLines.invoiceDate), asc(komisiLines.invoiceNo), asc(komisiLines.id))
    .all();

  const groupMap = new Map<string, Omit<RunGroup, 'label'>>();
  for (const it of items) {
    const key = `${it.category}|${it.unit}|${it.rate}|${it.factor}`;
    const g = groupMap.get(key) ?? {
      category: it.category,
      unit: it.unit,
      baseUnit: it.baseUnit,
      factor: it.factor,
      rate: it.rate,
      lines: 0,
      qty: 0,
      amount: 0,
    };
    g.lines++;
    g.qty += it.qty;
    g.amount += it.amount;
    groupMap.set(key, g);
  }
  const groups = [...groupMap.values()].sort((a, b) => b.amount - a.amount);

  return { run: { ...run, createdByName: createdBy, voidedByName: voidedBy }, items, groups };
}
