import fs from 'node:fs';
import path from 'node:path';
import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { gachaSpins } from '@/lib/db/schema';
import {
  ACCESS_COOKIE,
  clearPinFailures,
  hasAccess,
  pinBlockedFor,
  recordPinFailure,
  safeEqual,
  signAccess,
  unlock,
  verifyAccess,
  viewerState,
} from '@/lib/gacha/access';
import { CLOSING_LETTER, COUPLE, GACHA_PATH, GACHA_SLUG, GACHA_URL, PRIZES, SLICES, TOTAL_SPINS, sliceIndex, type SpinReveal } from '@/lib/gacha/config';
import { qrSvgPath } from '@/lib/gacha/qr';
import { SCENARIO } from '@/lib/gacha/scenario';
import {
  DEV_PIN,
  GachaError,
  adminSummary,
  ensureDevCampaign,
  getCampaign,
  getState,
  isReady,
  markRevealed,
  normalizeVoucherCode,
  resetCampaign,
  setupCampaign,
  spin,
} from '@/lib/gacha/service';
import { memoryDb } from './helpers';

// Modul gacha memakai `server-only`, cookies() Next, dan clientIp(). Di test
// diganti: cookie jar di memori dan IP yang bisa diatur.
const h = vi.hoisted(() => ({ ip: '10.0.0.1', jar: new Map<string, { value: string; options?: Record<string, unknown> }>() }));
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => (h.jar.has(name) ? { name, value: h.jar.get(name)!.value } : undefined),
    set: (name: string, value: string, options?: Record<string, unknown>) => void h.jar.set(name, { value, options }),
  }),
}));
vi.mock('@/lib/auth/session', () => ({ clientIp: async () => h.ip }));

const INPUT = {
  pin: '654321',
  codes600: ['AAAAA-AAAAA-60001', 'AAAAA-AAAAA-60002'],
  codes100: ['BBBBB-BBBBB-10001', 'BBBBB-BBBBB-10002', 'BBBBB-BBBBB-10003'],
};
const ALL_CODES = [...INPUT.codes600, ...INPUT.codes100];

function readyDb() {
  const db = memoryDb();
  setupCampaign(db, INPUT);
  return db;
}

// Rate limit disimpan di memori modul. Setiap test memakai jendela waktu baru
// (maju 1 jam) supaya hitungan test lain tidak terbawa.
let clock = 1_000_000_000_000;
const freshWindow = () => (clock += 60 * 60 * 1000);

beforeEach(() => {
  h.jar.clear();
  h.ip = '10.0.0.1';
});

describe('kode voucher', () => {
  it('dinormalisasi ke XXXXX-XXXXX-XXXXX huruf kapital', () => {
    expect(normalizeVoucherCode('X032K-WER44-432RE')).toBe('X032K-WER44-432RE');
    expect(normalizeVoucherCode(' x032k wer44 432re ')).toBe('X032K-WER44-432RE');
    expect(normalizeVoucherCode('x032kwer44432re')).toBe('X032K-WER44-432RE');
    expect(normalizeVoucherCode('X032K\u2013WER44\u2013432RE')).toBe('X032K-WER44-432RE');
    expect(normalizeVoucherCode('X032K-WER44-432R')).toBeNull();
    expect(normalizeVoucherCode('X032K-WER44-432REE')).toBeNull();
    expect(normalizeVoucherCode('X032K-WER44-432R!')).toBeNull();
    expect(normalizeVoucherCode('')).toBeNull();
  });
});

describe('setupCampaign', () => {
  it('membagikan kode berurutan per nominal mengikuti skenario', () => {
    const db = readyDb();
    const rows = db.select().from(gachaSpins).orderBy(gachaSpins.spinNo).all();
    expect(rows.map((r) => [r.spinNo, r.prize, r.code])).toEqual([
      [1, 'steam_100k', INPUT.codes100[0]],
      [2, 'zonk', null],
      [3, 'steam_100k', INPUT.codes100[1]],
      [4, 'steam_600k', INPUT.codes600[0]],
      [5, 'zonk', null],
      [6, 'steam_100k', INPUT.codes100[2]],
      [7, 'steam_600k', INPUT.codes600[1]],
    ]);
    expect(getCampaign(db)?.pin).toBe('654321');
    expect(isReady(db)).toBe(true);
  });

  it('menolak PIN bukan 6 angka, kode salah format, dan kode kembar', () => {
    const db = memoryDb();
    try {
      setupCampaign(db, { pin: '12345', codes600: ['salah', INPUT.codes600[1]], codes100: [INPUT.codes100[0], 'bbbbb bbbbb 10001', INPUT.codes100[2]] });
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(GachaError);
      expect(Object.keys((err as GachaError).fields ?? {}).sort()).toEqual(['code100_2', 'code600_1', 'pin']);
    }
    expect(() => setupCampaign(db, { ...INPUT, codes600: [INPUT.codes600[0]] })).toThrow(GachaError);
    expect(getCampaign(db)).toBeUndefined();
  });

  it('memperbarui kode dan PIN tanpa menyentuh status putaran', () => {
    const db = readyDb();
    spin(db);
    markRevealed(db, 1);
    const secret = getCampaign(db)!.secret;
    setupCampaign(db, { ...INPUT, pin: '111111', codes100: ['CCCCC-CCCCC-10001', ...INPUT.codes100.slice(1)] });
    const first = db.select().from(gachaSpins).where(eq(gachaSpins.spinNo, 1)).get()!;
    expect(first.code).toBe('CCCCC-CCCCC-10001');
    expect(first.spunAt).not.toBeNull();
    expect(first.revealedAt).not.toBeNull();
    expect(getCampaign(db)).toMatchObject({ pin: '111111', secret });
  });
});

describe('putaran', () => {
  it('7 putaran selalu keluar persis sesuai skenario', () => {
    const db = readyDb();
    const results: SpinReveal[] = [];
    for (let i = 0; i < TOTAL_SPINS; i++) {
      const out = spin(db);
      if (out.status !== 'spun') throw new Error(out.status);
      expect(out.replay).toBe(false);
      expect(markRevealed(db, out.reveal.spinNo)).toBe(true);
      results.push(out.reveal);
    }
    expect(results.map((r) => r.kind)).toEqual(['steam_100k', 'zonk', 'steam_100k', 'steam_600k', 'zonk', 'steam_100k', 'steam_600k']);
    expect(results.map((r) => r.landSliceId)).toEqual(['s100a', 'zonka', 's100b', 's600b', 'zonka', 's100a', 's600a']);
    expect(results.map((r) => r.teaseSliceId)).toEqual([null, 'emas', null, 'zonkb', 'kingkoil', null, 'amerika']);
    expect(results.map((r) => r.code)).toEqual([INPUT.codes100[0], null, INPUT.codes100[1], INPUT.codes600[0], null, INPUT.codes100[2], INPUT.codes600[1]]);
    expect(results.map((r) => r.title).filter((_, i) => results[i].kind === 'zonk')).toEqual(['Kupon cuci piring 1 tahun', 'Doa restu sekampung']);
    expect(results.reduce((sum, r) => sum + r.valueIdr, 0)).toBe(1_500_000);
  });

  it('putaran yang animasinya belum selesai diputar ulang, bukan memakai jatah baru', () => {
    const db = readyDb();
    const first = spin(db);
    expect(first).toMatchObject({ status: 'spun', replay: false, reveal: { spinNo: 1 } });
    expect(getState(db)).toMatchObject({ status: 'open', pending: true, remaining: 7, revealed: [] });

    // Tap ganda / tab kedua / buka ulang browser: hasil yang sama.
    expect(spin(db)).toMatchObject({ status: 'spun', replay: true, reveal: { spinNo: 1, code: INPUT.codes100[0] } });
    expect(spin(db)).toMatchObject({ status: 'spun', replay: true, reveal: { spinNo: 1 } });

    markRevealed(db, 1);
    expect(getState(db)).toMatchObject({ pending: false, remaining: 6 });
    expect(spin(db)).toMatchObject({ status: 'spun', replay: false, reveal: { spinNo: 2, kind: 'zonk' } });
  });

  it('menandai dibuka idempoten dan hanya untuk putaran yang sudah diputar', () => {
    const db = readyDb();
    expect(markRevealed(db, 1)).toBe(false);
    spin(db, new Date(1000));
    expect(markRevealed(db, 1, new Date(2000))).toBe(true);
    expect(markRevealed(db, 1, new Date(3000))).toBe(true);
    const row = db.select().from(gachaSpins).where(eq(gachaSpins.spinNo, 1)).get()!;
    expect(row.revealedAt?.getTime()).toBe(2000);
    expect(markRevealed(db, 2)).toBe(false);
    expect(markRevealed(db, 99)).toBe(false);
  });

  it('setelah 7 putaran: done, sisa 0', () => {
    const db = readyDb();
    for (let i = 1; i <= TOTAL_SPINS; i++) {
      spin(db);
      markRevealed(db, i);
    }
    expect(spin(db)).toEqual({ status: 'done' });
    const state = getState(db);
    expect(state).toMatchObject({ status: 'open', remaining: 0, pending: false });
    if (state.status === 'open') expect(state.revealed.map((r) => r.spinNo)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(adminSummary(db)).toMatchObject({ spun: 7, revealed: 7, revealedValueIdr: 1_500_000, totalValueIdr: 1_500_000 });
  });

  it('reset mengembalikan 7 putaran dan mengganti kunci cookie', () => {
    const db = readyDb();
    spin(db);
    markRevealed(db, 1);
    spin(db);
    const before = getCampaign(db)!.secret;
    resetCampaign(db);
    expect(getCampaign(db)!.secret).not.toBe(before);
    expect(getState(db)).toMatchObject({ status: 'open', remaining: 7, pending: false, revealed: [] });
    expect(spin(db)).toMatchObject({ reveal: { spinNo: 1 }, replay: false });
    expect(() => resetCampaign(memoryDb())).toThrow(GachaError);
  });

  it('belum siap: tanpa kampanye, atau ada kode voucher yang kosong', () => {
    const empty = memoryDb();
    expect(getState(empty)).toEqual({ status: 'not_ready' });
    expect(spin(empty)).toEqual({ status: 'not_ready' });
    expect(adminSummary(empty)).toMatchObject({ configured: false, ready: false, pin: null, spun: 0 });

    const db = readyDb();
    db.update(gachaSpins).set({ code: null }).where(eq(gachaSpins.spinNo, 4)).run();
    expect(isReady(db)).toBe(false);
    expect(getState(db)).toEqual({ status: 'not_ready' });
    expect(spin(db)).toEqual({ status: 'not_ready' });
  });

  it('getState tidak pernah membawa kode atau hasil putaran yang belum dibuka', () => {
    const db = readyDb();
    spin(db);
    markRevealed(db, 1);
    spin(db); // putaran 2 (ZONK) tertunda
    const json = JSON.stringify(getState(db));
    expect(json).toContain(INPUT.codes100[0]);
    for (const code of ALL_CODES.filter((c) => c !== INPUT.codes100[0])) expect(json).not.toContain(code);
    expect(json).not.toContain('Kupon cuci piring');
    expect(json).not.toContain('"emas"');
    expect(json).not.toContain('steam_600k');
  });
});

describe('akses (PIN & cookie)', () => {
  it('tanda tangan cookie: hanya cocok untuk secret, slug, dan PIN yang sama', () => {
    const token = signAccess('rahasia', GACHA_SLUG, '654321');
    expect(verifyAccess(token, 'rahasia', GACHA_SLUG, '654321')).toBe(true);
    expect(verifyAccess(token, 'rahasia', GACHA_SLUG, '654320')).toBe(false);
    expect(verifyAccess(token, 'lain', GACHA_SLUG, '654321')).toBe(false);
    expect(verifyAccess(token, 'rahasia', 'slug-lain', '654321')).toBe(false);
    expect(verifyAccess(`${token}x`, 'rahasia', GACHA_SLUG, '654321')).toBe(false);
    expect(verifyAccess(undefined, 'rahasia', GACHA_SLUG, '654321')).toBe(false);
    expect(verifyAccess('', 'rahasia', GACHA_SLUG, '654321')).toBe(false);
    expect(safeEqual('123456', '123456')).toBe(true);
    expect(safeEqual('123456', '1234567')).toBe(false);
  });

  it('rate limit: 5 salah per IP, 30 salah total, habis setelah 15 menit', () => {
    const now = freshWindow();
    for (let i = 0; i < 4; i++) recordPinFailure('1.1.1.1', now);
    expect(pinBlockedFor('1.1.1.1', now)).toBe(0);
    recordPinFailure('1.1.1.1', now);
    expect(pinBlockedFor('1.1.1.1', now)).toBe(15 * 60 * 1000);
    expect(pinBlockedFor('2.2.2.2', now)).toBe(0);
    expect(pinBlockedFor('1.1.1.1', now + 15 * 60 * 1000)).toBe(0);

    clearPinFailures('1.1.1.1');
    const later = freshWindow();
    // 30 salah dari banyak IP (masing-masing di bawah 5): semua IP ikut tertahan.
    for (let i = 0; i < 30; i++) recordPinFailure(`3.3.3.${i}`, later);
    expect(pinBlockedFor('9.9.9.9', later)).toBeGreaterThan(0);
    expect(pinBlockedFor('9.9.9.9', later + 15 * 60 * 1000)).toBe(0);
  });

  it('PIN benar memasang cookie; reset dan ganti PIN menggugurkannya', async () => {
    const db = readyDb();
    const now = freshWindow();
    expect(await viewerState(db)).toEqual({ status: 'locked' });

    expect(await unlock(db, '12', now)).toMatchObject({ ok: false });
    expect(await unlock(db, '000000', now)).toMatchObject({ ok: false, error: expect.stringContaining('salah') });
    expect(h.jar.has(ACCESS_COOKIE)).toBe(false);

    expect(await unlock(db, ' 654321 ', now)).toEqual({ ok: true });
    expect(h.jar.get(ACCESS_COOKIE)?.options).toMatchObject({
      httpOnly: true,
      sameSite: 'lax',
      path: GACHA_PATH.replace(/\/$/, ''),
      maxAge: 90 * 24 * 60 * 60,
    });
    expect(await hasAccess(db)).toBe(true);
    expect((await viewerState(db)).status).toBe('open');

    resetCampaign(db);
    expect(await hasAccess(db)).toBe(false);
    expect(await unlock(db, '654321', now)).toEqual({ ok: true });
    expect(await hasAccess(db)).toBe(true);

    setupCampaign(db, { ...INPUT, pin: '111111' });
    expect(await hasAccess(db)).toBe(false);
    expect(await viewerState(db)).toEqual({ status: 'locked' });
  });

  it('setelah 5 kali salah, PIN benar pun ditolak sampai jeda habis', async () => {
    const db = readyDb();
    const now = freshWindow();
    h.ip = '4.4.4.4';
    for (let i = 0; i < 4; i++) {
      const res = await unlock(db, '000000', now);
      expect(res.ok).toBe(false);
      expect(!res.ok && res.retryAfterSec).toBeUndefined();
    }
    expect(await unlock(db, '000000', now)).toMatchObject({ ok: false, retryAfterSec: 900 });
    expect(await unlock(db, '654321', now + 60_000)).toMatchObject({ ok: false, retryAfterSec: 840 });
    expect(h.jar.has(ACCESS_COOKIE)).toBe(false);
    expect(await unlock(db, '654321', now + 15 * 60 * 1000)).toEqual({ ok: true });
  });

  it('kampanye belum siap: tidak bisa membuka dengan PIN', async () => {
    const db = memoryDb();
    expect(await viewerState(db)).toEqual({ status: 'not_ready' });
    expect(await unlock(db, '654321', freshWindow())).toMatchObject({ ok: false, notReady: true });
  });
});

describe('konfigurasi & teks', () => {
  it('skenario cocok dengan roda: hasil mendarat di potong sejenis, potong tease bersebelahan', () => {
    expect(SCENARIO).toHaveLength(TOTAL_SPINS);
    expect(SLICES).toHaveLength(12);
    expect(SCENARIO.map((s) => s.spinNo)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    for (const step of SCENARIO) {
      const land = sliceIndex(step.land);
      expect(SLICES[land].kind).toBe(step.prize);
      expect(!!step.tease).toBe(!!step.teaseLine);
      if (step.tease) expect([1, SLICES.length - 1]).toContain((sliceIndex(step.tease) - land + SLICES.length) % SLICES.length);
    }
  });

  it('seed dev hanya di luar production, dengan kode dummy berformat benar', () => {
    const prod = memoryDb();
    expect(ensureDevCampaign(prod, 'production')).toBe(false);
    expect(getCampaign(prod)).toBeUndefined();

    const dev = memoryDb();
    expect(ensureDevCampaign(dev, 'development')).toBe(true);
    expect(ensureDevCampaign(dev, 'development')).toBe(false);
    expect(getCampaign(dev)?.pin).toBe(DEV_PIN);
    const summary = adminSummary(dev);
    expect(summary.ready).toBe(true);
    for (const code of [...summary.codes600, ...summary.codes100]) expect(normalizeVoucherCode(code)).toBe(code);
  });

  it('tanpa em dash (aturan tulisan di CLAUDE.md)', () => {
    const EM_DASH = String.fromCharCode(0x2014);
    const strings = (value: unknown): string[] =>
      typeof value === 'string'
        ? [value]
        : Array.isArray(value)
          ? value.flatMap(strings)
          : value && typeof value === 'object'
            ? Object.values(value).flatMap(strings)
            : [];
    const all = strings({ SCENARIO, SLICES, PRIZES, CLOSING_LETTER, COUPLE });
    expect(all.length).toBeGreaterThan(30);
    expect(all.filter((s) => s.includes(EM_DASH))).toEqual([]);

    // Sumber fitur ini juga (komentar, pesan error, metadata).
    const dirs = ['src/lib/gacha', 'src/app/jason-jonathan-shella-wedding-gacha-gift', 'src/app/admin/(panel)/hadiah', 'src/app/admin/(standalone)/hadiah'];
    const files = dirs.flatMap((d) => fs.readdirSync(d, { recursive: true, withFileTypes: true }).filter((f) => f.isFile()).map((f) => path.join(f.parentPath, f.name)));
    expect(files.length).toBeGreaterThan(5);
    expect(files.filter((f) => fs.readFileSync(f, 'utf8').includes(EM_DASH))).toEqual([]);
  });
});

describe('QR kartu hadiah', () => {
  it('mengarah ke halaman hadiah production', () => {
    expect(GACHA_URL).toBe(`https://dazytech.web.id${GACHA_PATH}`);
  });

  it('path SVG memuat tiga finder pattern di sudut', () => {
    const { size, d } = qrSvgPath(GACHA_URL);
    // Versi 5 (37 modul): quiet zone di screen-card.module.css dihitung dari sini.
    expect(size).toBe(37);
    // Baris tepi finder 7 modul, dibatasi separator terang di sebelahnya.
    expect(d.startsWith('M0 0h7v1h-7z')).toBe(true);
    expect(d).toContain(`M${size - 7} 0h7v1h-7z`);
    expect(d).toContain(`M0 ${size - 1}h7v1h-7z`);
  });
});
