// Konfigurasi halaman hadiah nikahan Jajo & Eng yang aman dibaca browser.
// JANGAN taruh kode voucher, PIN, atau urutan hadiah di sini: file ini ikut
// ter-bundle ke client. Urutan hadiah ada di scenario.ts (server-only).

export const GACHA_SLUG = 'jajo-eng';
export const GACHA_PATH = '/jason-jonathan-shella-wedding-gacha-gift/';

export const COUPLE = {
  groom: { name: 'Jason Jonathan', nick: 'Jajo' },
  bride: { name: 'Shella', nick: 'Eng' },
} as const;

export const TOTAL_SPINS = 7;

export type PrizeKind = 'steam_600k' | 'steam_100k' | 'zonk';
// `lebay` = hadiah palsu yang cuma pajangan di roda (tidak pernah keluar).
export type SliceKind = PrizeKind | 'lebay';

// Roda: 12 potong searah jarum jam, indeks 0 tepat di bawah jarum (jam 12).
// id, urutan, dan jenisnya jangan diubah: skenario bergantung pada potong yang
// bersebelahan (mis. Emas 200 gram tepat di sebelah ZONK).
export const SLICES = [
  { id: 's600a', label: 'Steam 600K', kind: 'steam_600k' },
  { id: 'amerika', label: 'Tiket ke Amerika', kind: 'lebay' },
  { id: 's100a', label: 'Steam 100K', kind: 'steam_100k' },
  { id: 'emas', label: 'Emas 200 gram', kind: 'lebay' },
  { id: 'zonka', label: 'ZONK', kind: 'zonk' },
  { id: 'kingkoil', label: 'Kasur King Koil', kind: 'lebay' },
  { id: 's100b', label: 'Steam 100K', kind: 'steam_100k' },
  { id: 'maldives', label: 'Honeymoon Maldives', kind: 'lebay' },
  { id: 'zonkb', label: 'ZONK', kind: 'zonk' },
  { id: 's600b', label: 'Steam 600K', kind: 'steam_600k' },
  { id: 'pik', label: 'Rumah di PIK', kind: 'lebay' },
  { id: 'lambo', label: 'Lamborghini', kind: 'lebay' },
] as const satisfies readonly { id: string; label: string; kind: SliceKind }[];

export type Slice = (typeof SLICES)[number];
export type SliceId = Slice['id'];

export function sliceIndex(id: string): number {
  return SLICES.findIndex((s) => s.id === id);
}

export type Rarity = 'zonk' | 'rare' | 'legendary';

export const PRIZES: Record<PrizeKind, { label: string; valueIdr: number; rarity: Rarity }> = {
  steam_600k: { label: 'Steam Wallet Rp600.000', valueIdr: 600_000, rarity: 'legendary' },
  steam_100k: { label: 'Steam Wallet Rp100.000', valueIdr: 100_000, rarity: 'rare' },
  zonk: { label: 'ZONK', valueIdr: 0, rarity: 'zonk' },
};

export const STEAM_REDEEM_URL = 'https://store.steampowered.com/account/redeemwalletcode';

// Nama pengirim di surat penutup.
export const FROM_NAME = 'Renaldo';

// Surat penutup, tampil setelah putaran ke-7 dibuka. Satu item = satu paragraf.
export const CLOSING_LETTER = [
  'Jo, selamat ya. Akhirnya ada yang resmi ngurusin lu, dan Eng resmi dapet tanggung jawab seumur hidup.',
  'Emas, kasur, sama tiket Amerika emang nggak pernah ada, sorry. Tapi voucher Steam-nya beneran.',
  'Pakai buat main bareng Eng, atau main sendiri pas Eng udah tidur.',
  'Eng, titip Jajo ya. Kalau mabarnya kebablasan, cabut aja wifi-nya.',
  'Langgeng terus, rukun terus, dan jangan lupa ajak gw mabar.',
] as const;

// ---------------------------------------------------------------- kontrak server <-> UI

export type SpinReveal = {
  spinNo: number; // 1..TOTAL_SPINS
  kind: PrizeKind;
  title: string;
  note: string;
  code: string | null; // null untuk ZONK
  valueIdr: number; // 0 untuk ZONK
  landSliceId: SliceId;
  // Potong tempat roda sempat berhenti dulu sebelum merayap ke landSliceId.
  teaseSliceId: SliceId | null;
  teaseLine: string | null;
};

export type GachaState =
  | { status: 'not_ready' } // kampanye belum diatur (production sebelum admin mengisi kode)
  | { status: 'locked' } // belum ada cookie akses yang valid
  | { status: 'open'; total: number; revealed: SpinReveal[]; pending: boolean; remaining: number };
// remaining = total - revealed.length. pending = ada putaran yang sudah tercatat tapi
// animasinya belum selesai (browser ditutup saat roda berputar); permintaan putar
// berikutnya memutar ulang putaran itu, bukan memakai jatah baru.

// Balikan server action di app/jason-jonathan-shella-wedding-gacha-gift/actions.ts.
export type UnlockResult =
  | { ok: true; state: GachaState }
  | { ok: false; error: string; retryAfterSec?: number; state?: GachaState };
export type SpinResult =
  | { ok: true; result: SpinReveal; replay: boolean }
  | { ok: false; error: string; state?: GachaState };
export type RevealResult = { ok: true; state: GachaState } | { ok: false; error: string; state?: GachaState };

export const PIN_LENGTH = 6;
