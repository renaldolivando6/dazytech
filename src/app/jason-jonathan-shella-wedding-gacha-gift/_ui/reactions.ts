import {
  PRIZES,
  SLICES,
  TOTAL_SPINS,
  sliceIndex,
  type PrizeKind,
  type SliceKind,
  type SpinReveal,
} from '@/lib/gacha/config';
import {
  ACHIEVEMENTS,
  CREEP_LINES,
  FINAL,
  IDLE_LINES,
  LAND_LINES,
  REVEAL,
  STAGE,
  type AchievementId,
} from './copy';
import { directionFor, type Choreo, type LitTone } from './engine';
import { formatRp, prizeShort } from './format';

// Reaksi teks dan nada yang diturunkan dari hasil server (DESIGN 4.7, 15).
// Pure. Semua keputusan berasal dari `kind`, jenis potong tease, arah rayapan,
// `replay`, `remaining`, dan cek `spinNo === TOTAL_SPINS`. TIDAK PERNAH dari
// nomor putaran tertentu.

export const isVoucher = (kind: PrizeKind): boolean => kind !== 'zonk';
export const isLastSpin = (r: Pick<SpinReveal, 'spinNo'>): boolean => r.spinNo === TOTAL_SPINS;

/** Ringkasan hasil yang dipakai untuk memilih kalimat. Bisa juga dibuat manual (tes). */
export type RevealContext = {
  kind: PrizeKind;
  /** Jenis potong tease, hanya kalau bersebelahan dengan land (arah != 0). */
  teaseKind: SliceKind | null;
  teaseLabel: string | null;
  dir: 1 | -1 | 0;
  /** "600K" / "100K" / "ZONK" */
  land: string;
  isLast: boolean;
  replay: boolean;
};

export function revealContext(r: SpinReveal, replay = false): RevealContext {
  const L = sliceIndex(r.landSliceId);
  const T = r.teaseSliceId ? sliceIndex(r.teaseSliceId) : -1;
  const dir = T >= 0 ? directionFor(L, T) : 0;
  const tease = dir !== 0 ? SLICES[T] : null;
  return {
    kind: r.kind,
    teaseKind: tease ? tease.kind : null,
    teaseLabel: tease ? tease.label : null,
    dir,
    land: prizeShort(r.kind),
    isLast: isLastSpin(r),
    replay,
  };
}

const ctx = (x: SpinReveal | RevealContext): RevealContext => ('spinNo' in x ? revealContext(x) : x);

// ---------------------------------------------------------------- chip reveal (DESIGN 4.7)

export type ChipId = 'replay' | 'nearMiss' | 'upgrade' | 'hardPity';
export type ChipTone = 'glass' | 'pearl' | 'gold';
export type RevealChip = { id: ChipId; text: string; tone: ChipTone };

/** Chip di bawah overline dialog hasil. `replay` dari balikan spinAction. */
export function chipsFor(r: SpinReveal | RevealContext, replay?: boolean): RevealChip[] {
  const c = ctx(r);
  const out: RevealChip[] = [];
  if (replay ?? c.replay) out.push({ id: 'replay', text: REVEAL.chipReplay, tone: 'glass' });
  if (c.teaseKind === 'lebay' && c.kind === 'zonk' && c.teaseLabel) {
    out.push({ id: 'nearMiss', text: REVEAL.chipNearMiss(c.teaseLabel), tone: 'pearl' });
  }
  if (c.teaseKind === 'zonk' && isVoucher(c.kind)) out.push({ id: 'upgrade', text: REVEAL.chipUpgrade(c.land), tone: 'gold' });
  if (c.isLast && isVoucher(c.kind)) out.push({ id: 'hardPity', text: REVEAL.chipHardPity, tone: 'gold' });
  return out;
}

// ---------------------------------------------------------------- kalimat status

/** Kalimat status saat roda merayap dari tease ke land. Kosong untuk finale dan putaran biasa. */
export function creepLine(r: SpinReveal | RevealContext, choreo: Choreo): string {
  const c = ctx(r);
  if (choreo === 'finale' || choreo === 'normal' || c.dir === 0) return CREEP_LINES.finale;
  if (c.teaseKind === 'zonk') return CREEP_LINES.zonkTease;
  return c.dir === -1 ? CREEP_LINES.lebayBack : CREEP_LINES.lebayForward;
}

/** Kalimat status saat roda berhenti di land (DESIGN 15.4, tabel land lines). */
export function landLine(r: SpinReveal | RevealContext): string {
  const c = ctx(r);
  const voucher = isVoucher(c.kind);
  const tk = c.dir === 0 ? null : c.teaseKind;
  if (tk === 'lebay') {
    if (voucher) return LAND_LINES.lebayVoucher(c.land);
    return c.dir === -1 ? LAND_LINES.lebayZonkBack(c.teaseLabel ?? '') : LAND_LINES.lebayZonkForward(c.teaseLabel ?? '');
  }
  if (tk === 'zonk' && voucher) {
    return c.dir === -1 ? LAND_LINES.zonkVoucherBack(c.land) : LAND_LINES.zonkVoucherForward(c.land);
  }
  if (tk === 'steam_100k' || tk === 'steam_600k') {
    return voucher ? LAND_LINES.voucherVoucher(c.land) : LAND_LINES.voucherZonk;
  }
  // Tanpa tease (atau ZONK ke ZONK, yang tidak mungkin di roda ini).
  if (c.kind === 'steam_600k') return LAND_LINES.plain600;
  if (c.kind === 'steam_100k') return LAND_LINES.plain100;
  return LAND_LINES.plainZonk;
}

/** Kalimat status saat diam, berdasarkan sisa putaran dan hasil terakhir. */
export function idleLine(revealed: readonly Pick<SpinReveal, 'spinNo' | 'kind'>[], remaining: number): string {
  if (remaining <= 0) return '';
  if (remaining === 1) return IDLE_LINES.lastOne;
  if (remaining === 2) return IDLE_LINES.twoLeft;
  const last = latest(revealed);
  if (!last) return IDLE_LINES.first;
  if (last.kind === 'steam_600k') return IDLE_LINES.after600(remaining);
  if (last.kind === 'steam_100k') return IDLE_LINES.after100(remaining);
  return IDLE_LINES.afterZonk(remaining);
}

function latest<T extends Pick<SpinReveal, 'spinNo'>>(list: readonly T[]): T | null {
  let last: T | null = null;
  for (const r of list) if (!last || r.spinNo > last.spinNo) last = r;
  return last;
}

// ---------------------------------------------------------------- dialog hasil

/** Overline dialog hasil: "BENERAN · PUTARAN 1/7", "LEGENDARIS ...", "ZONK ...". */
export function overlineFor(r: Pick<SpinReveal, 'spinNo' | 'kind'>): string {
  if (r.kind === 'zonk') return REVEAL.overlineZonk(r.spinNo);
  if (r.kind === 'steam_600k') return isLastSpin(r) ? REVEAL.overlineLastLegendary : REVEAL.overlineLegendary(r.spinNo);
  return REVEAL.overlineRare(r.spinNo);
}

/** Label tombol utama dialog hasil. */
export function revealCta(r: Pick<SpinReveal, 'spinNo' | 'kind'>): string {
  if (isLastSpin(r)) return REVEAL.ctaLast;
  return r.kind === 'zonk' ? REVEAL.ctaZonk : REVEAL.ctaVoucher;
}

/** Pengumuman pembaca layar saat hasil tampil. */
export function announceFor(r: Pick<SpinReveal, 'spinNo' | 'kind' | 'title' | 'note'>): string {
  return r.kind === 'zonk' ? REVEAL.announceZonk(r.spinNo, r.title, r.note) : REVEAL.announceVoucher(r.spinNo, r.title);
}

/** Label aria tombol salin: "Salin kode Rp600.000". */
export const copyAriaFor = (r: Pick<SpinReveal, 'valueIdr'>): string => REVEAL.copyAria(formatRp(r.valueIdr));

// ---------------------------------------------------------------- nada potong dan placard

export type SliceTone = 'gold' | 'blue' | 'pearl' | 'zonk';

export function sliceTone(idx: number): SliceTone {
  const kind = SLICES[idx]?.kind;
  return kind === 'steam_600k' ? 'gold' : kind === 'steam_100k' ? 'blue' : kind === 'zonk' ? 'zonk' : 'pearl';
}

/** Teks placard mode slice: label kapital, mutiara diberi bintang ("EMAS 200 GRAM*"). */
export function placardText(idx: number): string {
  const s = SLICES[idx];
  if (!s) return '';
  return `${s.label.toUpperCase()}${s.kind === 'lebay' ? '*' : ''}`;
}

/** Nada sorotan untuk potong tease. */
export function teaseTone(teaseIdx: number): LitTone {
  return SLICES[teaseIdx]?.kind === 'zonk' ? 'tease-zonk' : 'tease-lebay';
}

/** Nada sorotan untuk potong land. */
export function landTone(kind: PrizeKind): LitTone {
  return kind === 'steam_600k' ? 'land-600' : kind === 'steam_100k' ? 'land-100' : 'land-zonk';
}

// ---------------------------------------------------------------- achievement (DESIGN 4.10, 15.6)

export type Achievement = { id: AchievementId; name: string; desc: string };

/** Ketukan "Putar lagi" ke berapa yang membuka achievement denial. */
export const DENIAL_AT = 5;

/**
 * Achievement yang terbuka oleh satu hasil. `earlier` = hasil yang sudah ada
 * di kantong sebelum hasil ini (boleh berisi hasil ini sendiri, diabaikan).
 */
export function achievementsFor(r: SpinReveal, earlier: readonly Pick<SpinReveal, 'spinNo' | 'kind'>[]): Achievement[] {
  const out: Achievement[] = [];
  if (r.kind === 'zonk' && !earlier.some((x) => x.kind === 'zonk' && x.spinNo !== r.spinNo)) {
    out.push({ id: 'firstZonk', ...ACHIEVEMENTS.firstZonk });
  }
  const c = revealContext(r);
  if (c.teaseKind === 'zonk' && isVoucher(r.kind)) {
    out.push({ id: 'upgrade', name: ACHIEVEMENTS.upgrade.name, desc: ACHIEVEMENTS.upgrade.desc(c.land) });
  }
  return out;
}

/** Achievement dari tombol "Putar lagi" di Final; `count` = jumlah ketukan sejauh ini. */
export function refusalAchievement(count: number): Achievement | null {
  return count === DENIAL_AT ? { id: 'denial', ...ACHIEVEMENTS.denial } : null;
}

/** Kalimat penolakan ke-n (1-based); null kalau sudah habis. */
export function refusalLine(count: number): string | null {
  return count >= 1 && count <= FINAL.refusals.length ? FINAL.refusals[count - 1] : null;
}

export const REFUSAL_COUNT = FINAL.refusals.length;

// ---------------------------------------------------------------- dok dan kantong

export type DockStatus = PrizeKind | 'empty' | 'pending' | 'flight';
export type DockSlot = { n: number; status: DockStatus; reveal: SpinReveal | null };

/**
 * Tujuh slot dok berurutan putaran. `pending`: ada putaran tercatat yang belum
 * ditonton (slot berikutnya). `inFlight`: roda sedang berputar untuk slot itu.
 */
export function dockSlots(
  revealed: readonly SpinReveal[],
  opts: { pending?: boolean; inFlight?: boolean; total?: number } = {},
): DockSlot[] {
  const total = opts.total ?? TOTAL_SPINS;
  const byNo = new Map(revealed.map((r) => [r.spinNo, r]));
  const next = revealed.length + 1;
  const slots: DockSlot[] = [];
  for (let n = 1; n <= total; n++) {
    const r = byNo.get(n) ?? null;
    let status: DockStatus = r ? r.kind : 'empty';
    if (!r && n === next) {
      if (opts.inFlight) status = 'flight';
      else if (opts.pending) status = 'pending';
    }
    slots.push({ n, status, reveal: r });
  }
  return slots;
}

/** Teks sr-only satu slot dok: "Putaran 3: belum diputar". */
export const dockSlotLabel = (slot: DockSlot): string => STAGE.dockSlot(slot.n, STAGE.dockSlotStatus[slot.status]);

export type Summary = {
  totalIdr: number;
  vouchers: SpinReveal[]; // 600K dulu, lalu 100K, masing-masing urut putaran
  bonus: SpinReveal[]; // ZONK, urut putaran
};

/** Total, voucher, dan bonus dari hasil yang sudah dibuka (Final, Kantong). Tidak pernah hardcode. */
export function summarize(revealed: readonly SpinReveal[]): Summary {
  const bySpin = [...revealed].sort((a, b) => a.spinNo - b.spinNo);
  const vouchers = bySpin.filter((r) => isVoucher(r.kind)).sort((a, b) => b.valueIdr - a.valueIdr || a.spinNo - b.spinNo);
  return {
    totalIdr: bySpin.reduce((sum, r) => sum + (Number.isFinite(r.valueIdr) ? r.valueIdr : 0), 0),
    vouchers,
    bonus: bySpin.filter((r) => r.kind === 'zonk'),
  };
}

/** Teks "Salin semua kode" (DESIGN 4.11). */
export function copyAllText(revealed: readonly SpinReveal[]): string {
  const lines = summarize(revealed)
    .vouchers.filter((r) => r.code)
    .map((r) => `${formatRp(r.valueIdr || PRIZES[r.kind].valueIdr)}: ${r.code}`);
  return [FINAL.copyAllHeader, ...lines, FINAL.copyAllRedeem].join('\n');
}
