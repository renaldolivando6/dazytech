import 'server-only';
import { randomBytes } from 'node:crypto';
import { and, asc, eq } from 'drizzle-orm';
import type { DB } from '@/lib/db/open';
import { gachaCampaigns, gachaSpins } from '@/lib/db/schema';
import { GACHA_SLUG, PIN_LENGTH, PRIZES, type GachaState, type PrizeKind, type SpinReveal } from './config';
import { SCENARIO, stepOf, type ScenarioStep } from './scenario';

// Logika halaman hadiah. Semua fungsi menerima `db` supaya bisa dites dengan
// database memori. better-sqlite3 sinkron dan app jalan sebagai satu proses,
// jadi transaksi di sini cukup untuk mencegah tap ganda / dua tab melompati
// atau menggandakan hadiah.

export class GachaError extends Error {
  constructor(
    message: string,
    readonly fields?: Record<string, string>,
  ) {
    super(message);
  }
}

// `db` atau `tx` di dalam db.transaction().
type Conn = Pick<DB, 'select' | 'insert' | 'update' | 'delete'>;
type SpinRow = typeof gachaSpins.$inferSelect;

// Kode dummy untuk dev (NODE_ENV bukan production). PIN asli tidak pernah ditulis di kode.
export const DEV_PIN = '123456';
const DEV_CODES = {
  codes600: ['DUMMY-600K1-JAJOE', 'DUMMY-600K2-JAJOE'],
  codes100: ['DUMMY-100K1-JAJOE', 'DUMMY-100K2-JAJOE', 'DUMMY-100K3-JAJOE'],
};

// Jumlah kode yang dibutuhkan per nominal, dari skenario (2 x 600K, 3 x 100K).
export const CODE_COUNT = {
  steam_600k: SCENARIO.filter((s) => s.prize === 'steam_600k').length,
  steam_100k: SCENARIO.filter((s) => s.prize === 'steam_100k').length,
};

// Nama field form admin, dipakai juga sebagai kunci pesan error per field.
export const codeField = (prize: 'steam_600k' | 'steam_100k', i: number) => `${prize === 'steam_600k' ? 'code600' : 'code100'}_${i + 1}`;

// ---------------------------------------------------------------- normalisasi

// 'x032k wer44 432re' / 'X032KWER44432RE' -> 'X032K-WER44-432RE'. Format kode
// Steam Wallet: 15 huruf/angka dalam 3 kelompok. Tanda hubung apa pun (termasuk
// yang ikut tersalin dari email) dan spasi diabaikan.
export function normalizeVoucherCode(input: string): string | null {
  const raw = input.replace(/[\s\-\u2010-\u2015]/g, '').toUpperCase();
  if (!/^[A-Z0-9]{15}$/.test(raw)) return null;
  return `${raw.slice(0, 5)}-${raw.slice(5, 10)}-${raw.slice(10)}`;
}

export function normalizePin(input: string): string | null {
  const pin = input.replace(/\s/g, '');
  return new RegExp(`^\\d{${PIN_LENGTH}}$`).test(pin) ? pin : null;
}

// ---------------------------------------------------------------- baca

export function getCampaign(db: Conn) {
  return db.select().from(gachaCampaigns).where(eq(gachaCampaigns.slug, GACHA_SLUG)).get();
}

function spinRows(db: Conn): SpinRow[] {
  return db.select().from(gachaSpins).where(eq(gachaSpins.campaign, GACHA_SLUG)).orderBy(asc(gachaSpins.spinNo)).all();
}

// Siap = kampanye ada, ketujuh baris sesuai skenario, dan setiap voucher punya kode.
function readyRows(db: Conn): SpinRow[] | null {
  if (!getCampaign(db)) return null;
  const rows = spinRows(db);
  if (rows.length !== SCENARIO.length) return null;
  const ok = SCENARIO.every((step, i) => rows[i].spinNo === step.spinNo && rows[i].prize === step.prize && (step.prize === 'zonk' || !!rows[i].code));
  return ok ? rows : null;
}

export function isReady(db: DB): boolean {
  return readyRows(db) !== null;
}

function toReveal(row: SpinRow): SpinReveal {
  const step = stepOf(row.spinNo) as ScenarioStep;
  return {
    spinNo: step.spinNo,
    kind: step.prize,
    title: step.title,
    note: step.note,
    code: step.prize === 'zonk' ? null : row.code,
    valueIdr: PRIZES[step.prize].valueIdr,
    landSliceId: step.land,
    teaseSliceId: step.tease,
    teaseLine: step.teaseLine,
  };
}

const isPending = (r: SpinRow) => r.spunAt !== null && r.revealedAt === null;

// State untuk penonton yang SUDAH lolos PIN (cek akses ada di access.ts). Hanya
// putaran yang sudah dibuka yang ikut; putaran yang tertunda cuma jadi flag
// `pending`, hasilnya baru dikirim lagi lewat spin().
export function getState(db: DB): GachaState {
  const rows = readyRows(db);
  if (!rows) return { status: 'not_ready' };
  const revealed = rows.filter((r) => r.revealedAt !== null).map(toReveal);
  return {
    status: 'open',
    total: SCENARIO.length,
    revealed,
    pending: rows.some(isPending),
    remaining: SCENARIO.length - revealed.length,
  };
}

// ---------------------------------------------------------------- putar & buka

export type SpinOutcome = { status: 'spun'; reveal: SpinReveal; replay: boolean } | { status: 'done' } | { status: 'not_ready' };

// 1. belum siap -> not_ready. 2. ada putaran tertunda -> diputar ulang (tidak
// memakai jatah). 3. ambil putaran terkecil yang belum diputar. 4. habis -> done.
export function spin(db: DB, now = new Date()): SpinOutcome {
  return db.transaction((tx): SpinOutcome => {
    const rows = readyRows(tx);
    if (!rows) return { status: 'not_ready' };
    const pending = rows.find(isPending);
    if (pending) return { status: 'spun', reveal: toReveal(pending), replay: true };
    const next = rows.find((r) => r.spunAt === null);
    if (!next) return { status: 'done' };
    tx.update(gachaSpins).set({ spunAt: now }).where(eq(gachaSpins.id, next.id)).run();
    return { status: 'spun', reveal: toReveal(next), replay: false };
  });
}

// Dipanggil setelah animasi selesai. Idempoten; false kalau putaran itu belum diputar.
export function markRevealed(db: DB, spinNo: number, now = new Date()): boolean {
  return db.transaction((tx) => {
    const row = tx
      .select()
      .from(gachaSpins)
      .where(and(eq(gachaSpins.campaign, GACHA_SLUG), eq(gachaSpins.spinNo, spinNo)))
      .get();
    if (!row?.spunAt) return false;
    if (!row.revealedAt) tx.update(gachaSpins).set({ revealedAt: now }).where(eq(gachaSpins.id, row.id)).run();
    return true;
  });
}

// ---------------------------------------------------------------- admin

export type CampaignInput = { pin: string; codes600: readonly string[]; codes100: readonly string[] };

function newSecret(): string {
  return randomBytes(32).toString('base64url');
}

// Buat atau perbarui kampanye + 7 baris putaran. Kode dibagikan berurutan per
// nominal mengikuti skenario. Status putaran (sudah diputar/dibuka) tidak
// disentuh, jadi kode yang salah ketik bisa dibetulkan kapan saja.
export function setupCampaign(db: DB, input: CampaignInput): void {
  const fields: Record<string, string> = {};
  const pin = normalizePin(input.pin);
  if (!pin) fields.pin = `PIN harus ${PIN_LENGTH} angka.`;

  const pools: Record<'steam_600k' | 'steam_100k', string[]> = { steam_600k: [], steam_100k: [] };
  const seen = new Set<string>();
  for (const [prize, list] of [
    ['steam_600k', input.codes600],
    ['steam_100k', input.codes100],
  ] as const) {
    if (list.length !== CODE_COUNT[prize]) throw new GachaError(`Butuh ${CODE_COUNT[prize]} kode ${PRIZES[prize].label}.`);
    list.forEach((value, i) => {
      const code = normalizeVoucherCode(value);
      if (!code) fields[codeField(prize, i)] = 'Format kode: 15 huruf/angka, mis. X032K-WER44-432RE.';
      else if (seen.has(code)) fields[codeField(prize, i)] = 'Kode ini sama dengan kode lain.';
      if (code) seen.add(code);
      pools[prize].push(code ?? '');
    });
  }
  if (!pin || Object.keys(fields).length > 0) throw new GachaError('Periksa kembali isian.', fields);

  db.transaction((tx) => {
    if (getCampaign(tx)) tx.update(gachaCampaigns).set({ pin }).where(eq(gachaCampaigns.slug, GACHA_SLUG)).run();
    else tx.insert(gachaCampaigns).values({ slug: GACHA_SLUG, pin, secret: newSecret() }).run();

    const used = { steam_600k: 0, steam_100k: 0 };
    for (const step of SCENARIO) {
      const code = step.prize === 'zonk' ? null : pools[step.prize][used[step.prize]++];
      tx.insert(gachaSpins)
        .values({ campaign: GACHA_SLUG, spinNo: step.spinNo, prize: step.prize, code })
        .onConflictDoUpdate({ target: [gachaSpins.campaign, gachaSpins.spinNo], set: { prize: step.prize, code } })
        .run();
    }
  });
}

// Semua putaran kembali belum diputar, dan kunci cookie diganti: perangkat yang
// sudah memasukkan PIN (mis. saat admin mencoba) harus memasukkan PIN lagi.
export function resetCampaign(db: DB): void {
  db.transaction((tx) => {
    if (!getCampaign(tx)) throw new GachaError('Kode voucher dan PIN belum diatur.');
    tx.update(gachaSpins).set({ spunAt: null, revealedAt: null }).where(eq(gachaSpins.campaign, GACHA_SLUG)).run();
    tx.update(gachaCampaigns).set({ secret: newSecret() }).where(eq(gachaCampaigns.slug, GACHA_SLUG)).run();
  });
}

// Di dev, halaman langsung bisa dicoba dengan PIN 123456 dan kode dummy.
// Production tetap `not_ready` sampai admin mengisi kode asli di /admin/hadiah.
export function ensureDevCampaign(db: DB, env = process.env.NODE_ENV): boolean {
  if (env === 'production' || getCampaign(db)) return false;
  setupCampaign(db, { pin: DEV_PIN, ...DEV_CODES });
  return true;
}

export type AdminSpin = {
  spinNo: number;
  prize: PrizeKind;
  title: string;
  code: string | null;
  spunAt: Date | null;
  revealedAt: Date | null;
};

export type AdminSummary = {
  configured: boolean;
  ready: boolean;
  pin: string | null;
  updatedAt: Date | null;
  total: number;
  spun: number;
  revealed: number;
  pending: boolean;
  totalValueIdr: number;
  revealedValueIdr: number;
  spins: AdminSpin[];
  // Kode per nominal sesuai urutan form admin (kosong kalau belum diatur).
  codes600: string[];
  codes100: string[];
};

export function adminSummary(db: DB): AdminSummary {
  const campaign = getCampaign(db);
  const rows = new Map(spinRows(db).map((r) => [r.spinNo, r]));
  const spins: AdminSpin[] = SCENARIO.map((step) => {
    const row = rows.get(step.spinNo);
    return {
      spinNo: step.spinNo,
      prize: step.prize,
      title: step.title,
      code: step.prize === 'zonk' ? null : (row?.code ?? null),
      spunAt: row?.spunAt ?? null,
      revealedAt: row?.revealedAt ?? null,
    };
  });
  const codesOf = (prize: PrizeKind) => spins.filter((s) => s.prize === prize).map((s) => s.code ?? '');
  return {
    configured: !!campaign,
    ready: isReady(db),
    pin: campaign?.pin ?? null,
    updatedAt: campaign?.updatedAt ?? null,
    total: SCENARIO.length,
    spun: spins.filter((s) => s.spunAt).length,
    revealed: spins.filter((s) => s.revealedAt).length,
    pending: spins.some((s) => s.spunAt && !s.revealedAt),
    totalValueIdr: SCENARIO.reduce((sum, s) => sum + PRIZES[s.prize].valueIdr, 0),
    revealedValueIdr: spins.filter((s) => s.revealedAt).reduce((sum, s) => sum + PRIZES[s.prize].valueIdr, 0),
    spins,
    codes600: campaign ? codesOf('steam_600k') : [],
    codes100: campaign ? codesOf('steam_100k') : [],
  };
}
