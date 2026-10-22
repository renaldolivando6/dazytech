import { SLICES, sliceIndex, type SpinReveal } from '@/lib/gacha/config';

// Mesin roda (DESIGN 6): matematika murni tanpa DOM, dites di
// tests/gacha-engine.test.ts. Port dari design/final-engine-check.mjs.
//
// Koordinat: R = rotasi rotor dalam derajat, searah jarum jam positif, tidak
// pernah dinormalisasi selama roda hidup. Potong i berpusat di sudut 30*i pada
// frame roda; potong di bawah jarum = sliceAt(R). Pasak lewat jarum saat
// R = 15 (mod 30). Semua waktu timeline dalam ms sejak tombol ditekan.

export const SLICE_COUNT = SLICES.length; // 12
export const SLICE_DEG = 360 / SLICE_COUNT; // 30
const HALF = SLICE_DEG / 2; // 15: pasak ada di tepi potong

// ---------------------------------------------------------------- matematika dasar

export const mod = (a: number, n: number): number => ((a % n) + n) % n;
export const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

/** Smoothstep standar; tetap benar kalau e0 > e1 (kurva menurun). */
export function smooth(e0: number, e1: number, v: number): number {
  if (e0 === e1) return v < e0 ? 0 : 1;
  const t = clamp01((v - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
}

export const easeOutCubic = (u: number): number => 1 - (1 - u) ** 3;
export const easeInQuad = (u: number): number => u * u;
export const easeInOutCubic = (u: number): number => (u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2);
export const easeOutExpo = (u: number): number => (u >= 1 ? 1 : 1 - 2 ** (-10 * u));

/** Indeks potong di bawah jarum untuk rotasi R. */
export const sliceAt = (R: number): number => mod(Math.round(mod(-R, 360) / SLICE_DEG), SLICE_COUNT);

/** Sudut istirahat (mod 360) yang menaruh potong i di bawah jarum dengan offset o (positif ke arah potong i+1). */
export const restMod = (i: number, o = 0): number => mod(-(SLICE_DEG * i + o), 360);

/** R terkecil >= from + minTravel dengan R = targetMod (mod 360). */
export function nextAngle(from: number, targetMod: number, minTravel: number): number {
  const b = from + minTravel;
  return b + mod(targetMod - b, 360);
}

/** Jarak (derajat) dari R ke pasak terdekat. Istirahat yang sah selalu >= 7. */
export const pegDistance = (R: number): number => Math.min(mod(R - HALF, SLICE_DEG), mod(HALF - R, SLICE_DEG));

/**
 * Arah rayapan dari potong tease T ke potong land L.
 * +1 = merayap maju (land = tease - 1), -1 = mundur (land = tease + 1),
 * 0 = tidak bersebelahan, perlakukan sebagai putaran biasa.
 */
export function directionFor(L: number, T: number | null): 1 | -1 | 0 {
  if (T === null || T < 0 || L < 0) return 0;
  if (mod(T - 1, SLICE_COUNT) === L) return 1;
  if (mod(T + 1, SLICE_COUNT) === L) return -1;
  return 0;
}

export type Choreo = 'normal' | 'heartbreak' | 'rescue' | 'finale';

type LandInput = Pick<SpinReveal, 'landSliceId' | 'teaseSliceId' | 'kind'>;

/** Koreografi dari hasil server. isLast = r.spinNo === TOTAL_SPINS (info publik). */
export function choreoFor(r: LandInput, isLast: boolean): Choreo {
  const L = sliceIndex(r.landSliceId);
  const T = r.teaseSliceId ? sliceIndex(r.teaseSliceId) : null;
  if (T === null || directionFor(L, T) === 0) return 'normal';
  if (isLast) return 'finale';
  return SLICES[T].kind === 'zonk' && r.kind !== 'zonk' ? 'rescue' : 'heartbreak';
}

// ---------------------------------------------------------------- parameter (DESIGN 6.2)

export type ChoreoParams = {
  windDeg: number;
  windMs: number;
  rampMs: number;
  w0: number; // derajat/detik
  tdTarget: number; // detik
  k: number;
  holdMs: number;
  struggleMs: number;
};

export const PARAMS: Readonly<Record<Choreo, Readonly<ChoreoParams>>> = {
  normal: { windDeg: 6, windMs: 260, rampMs: 300, w0: 810, tdTarget: 4.6, k: 2.2, holdMs: 0, struggleMs: 0 },
  heartbreak: { windDeg: 6, windMs: 260, rampMs: 300, w0: 810, tdTarget: 5.0, k: 2.6, holdMs: 1200, struggleMs: 700 },
  rescue: { windDeg: 6, windMs: 260, rampMs: 300, w0: 810, tdTarget: 5.0, k: 2.6, holdMs: 1500, struggleMs: 800 },
  finale: { windDeg: 10, windMs: 420, rampMs: 360, w0: 840, tdTarget: 6.2, k: 2.8, holdMs: 1800, struggleMs: 1000 },
};

/** k untuk berhenti netral saat putaran gagal. */
export const ABORT_K = 2.2;
/** Batas tunggu jawaban server sebelum abort (DESIGN 6.6). */
export const SPIN_TIMEOUT_MS = 20_000;
/** Status "sinyal lagi seret" muncul kalau jawaban belum datang setelah ini. */
export const SLOW_NETWORK_MS = 2500;

// Ambang kecepatan (derajat/detik).
export const SLOW_CUE_SPEED = 200; // cue `slow`
export const PLACARD_SPEED = 90; // placard mode slice di bawah ini
export const TICK_MAX_SPEED = 700; // suara tick dilewati di atas ini
export const HAPTIC_TICK_MAX_SPEED = 360; // getar tick hanya di bawah ini

/** Opasitas veil (blur gerak) untuk kecepatan w. */
export const veilOpacity = (w: number): number => 0.75 * smooth(250, 700, Math.abs(w));
/** Opasitas kolam cahaya hangat selama putaran (DESIGN 3.4). */
export const warmPoolOpacity = (w: number): number => 0.55 + 0.45 * smooth(0, 810, Math.abs(w));

// ---------------------------------------------------------------- timeline

export type Phase = 'windup' | 'launch' | 'cruise' | 'spindown' | 'hold' | 'creep' | 'struggle' | 'snap' | 'settle';

/** Cue yang dipancarkan timeline. `launch` = akhir wind-up (whoosh, hub turun 1). */
export type Cue = 'launch' | 'slow' | 'nearEnd' | 'hold' | 'creep' | 'struggle' | 'snap' | 'settle';

export const CUE_ORDER: readonly Cue[] = ['launch', 'slow', 'nearEnd', 'hold', 'creep', 'struggle', 'snap', 'settle'];

/** Nada sorotan potong (atribut data-lit di rotor, DESIGN 5.4). */
export type LitTone = 'tease-lebay' | 'tease-zonk' | 'land-100' | 'land-600' | 'land-zonk' | 'tap' | 'hop';

export type Segment = {
  t0: number;
  dur: number; // Infinity untuk cruise yang masih terbuka
  phase: Phase;
  /** Sudut R pada tau ms sejak awal segmen (0..dur). */
  at: (tau: number) => number;
  /** Kecepatan analitik (derajat/detik); kalau tidak ada, dihitung numerik. */
  speed?: (tau: number) => number;
};

export type LandingPlan = {
  kind: 'land' | 'abort';
  choreo: Choreo | null; // null untuk abort
  landIdx: number;
  teaseIdx: number | null;
  dir: 1 | -1 | 0;
  tStart: number; // awal spin-down
  Rp: number; // R di awal spin-down
  Rstop: number; // R di akhir spin-down (posisi hold untuk tease)
  theta: number; // jarak tempuh spin-down
  spindownMs: number;
  B: number | null; // pasak yang dilewati saat rayapan (R)
  d: number | null; // land d derajat lewat pasak
  finalR: number;
};

export type Timeline = {
  R0: number;
  isLast: boolean;
  launch: Readonly<Pick<ChoreoParams, 'windDeg' | 'windMs' | 'rampMs' | 'w0'>>;
  segs: readonly Segment[];
  /** Waktu cruise dimulai (akhir ramp). */
  launchEnd: number;
  /** Akhir timeline; Infinity selama menunggu jawaban server. */
  end: number;
  markers: Partial<Record<Cue, number>>;
  plan: LandingPlan | null;
};

function segment(t0: number, dur: number, phase: Phase, at: (u: number) => number, speed?: (u: number) => number): Segment {
  // at/speed di sini menerima u (0..1); bungkus jadi fungsi tau.
  return {
    t0,
    dur,
    phase,
    at: (tau) => at(clamp01(tau / dur)),
    speed: speed && ((tau) => speed(clamp01(tau / dur))),
  };
}

/**
 * Tekan tombol: wind-up, ramp 0 ke w0, lalu cruise terbuka sampai jawaban
 * server datang. Parameter finale dipakai kalau isLast (remaining === 1).
 */
export function buildLaunch(R0: number, isLast: boolean): Timeline {
  const p = isLast ? PARAMS.finale : PARAMS.normal;
  const start = Number.isFinite(R0) ? R0 : 0;
  const Rw = start - p.windDeg;
  const rampDeg = (p.w0 * p.rampMs) / 2000;
  const Rc = Rw + rampDeg;
  const launchEnd = p.windMs + p.rampMs;
  const segs: Segment[] = [
    segment(
      0,
      p.windMs,
      'windup',
      (u) => start - p.windDeg * easeOutCubic(u),
      (u) => (-p.windDeg * 3 * (1 - u) ** 2) / (p.windMs / 1000),
    ),
    segment(p.windMs, p.rampMs, 'launch', (u) => Rw + rampDeg * easeInQuad(u), (u) => p.w0 * u),
    { t0: launchEnd, dur: Infinity, phase: 'cruise', at: (tau) => Rc + (p.w0 * tau) / 1000, speed: () => p.w0 },
  ];
  return {
    R0: start,
    isLast,
    launch: { windDeg: p.windDeg, windMs: p.windMs, rampMs: p.rampMs, w0: p.w0 },
    segs,
    launchEnd,
    end: Infinity,
    markers: { launch: p.windMs },
    plan: null,
  };
}

/** Tutup cruise di max(tNow, akhir ramp). Spin-down selalu mulai dari kecepatan w0. */
function closeCruise(tl: Timeline, tNow: number): { segs: Segment[]; tStart: number; Rp: number } {
  const cruise = tl.segs[tl.segs.length - 1];
  const tStart = Math.max(tl.launchEnd, Number.isFinite(tNow) ? tNow : tl.launchEnd);
  const wait = tStart - tl.launchEnd;
  const Rp = cruise.at(wait);
  const segs = tl.segs.slice(0, -1);
  if (wait > 0) segs.push({ ...cruise, dur: wait });
  return { segs, tStart, Rp };
}

/** Spin-down dengan cogging pasak (DESIGN 6.3 dan 6.4). */
function spindown(t0: number, Rp: number, theta: number, w0: number, k: number): Segment {
  const dur = (((k + 1) * theta) / w0) * 1000;
  return {
    t0,
    dur,
    phase: 'spindown',
    at: (tau) => {
      const u = clamp01(tau / dur);
      let R = Rp + theta * (1 - (1 - u) ** (k + 1));
      // Ragu-ragu di pasak saat pelan. Monoton, kontinu, nol di setiap titik
      // istirahat (istirahat selalu >= 7 derajat dari pasak).
      const w = w0 * (1 - u) ** k;
      const A = 1.2 * (1 - smooth(60, 220, w));
      if (A > 0) {
        const x = mod(HALF - R, SLICE_DEG);
        const y = mod(R - HALF, SLICE_DEG);
        R -= A * Math.max(smooth(6, 0.5, x), 1 - smooth(0, 2.5, y));
      }
      return R;
    },
    speed: (tau) => w0 * (1 - clamp01(tau / dur)) ** k,
  };
}

/** Waktu pertama kecepatan spin-down turun di bawah `speed`. */
function timeBelow(seg: Segment, w0: number, k: number, speed: number): number {
  if (w0 <= speed) return seg.t0;
  return seg.t0 + seg.dur * (1 - (speed / w0) ** (1 / k));
}

/**
 * Rencanakan pendaratan saat jawaban server datang (tNow = ms sejak tekan).
 * Hasil akhir: potong land tepat di bawah jarum, minimal 7 derajat dari tepi.
 * Untuk tease: berhenti 8 derajat di dalam potong tease, diam, merayap
 * melewati pasak, berjuang, lalu jatuh 7..10 derajat ke dalam potong land.
 */
export function planLanding(
  tl: Timeline,
  tNow: number,
  r: Pick<SpinReveal, 'landSliceId' | 'teaseSliceId'>,
  choreo: Choreo,
  rnd: () => number = Math.random,
): Timeline {
  if (tl.plan) return tl;
  const L = sliceIndex(r.landSliceId);
  if (L < 0) throw new RangeError(`Potong tidak dikenal: ${r.landSliceId}`);
  const Traw = r.teaseSliceId ? sliceIndex(r.teaseSliceId) : -1;
  const T = Traw >= 0 ? Traw : null;
  // Tease yang tidak bersebelahan diperlakukan sebagai putaran biasa, begitu
  // juga kalau pemanggil memang minta 'normal'.
  const dirRaw = directionFor(L, T);
  const ch: Choreo = dirRaw === 0 ? 'normal' : choreo;
  const dir = ch === 'normal' ? 0 : dirRaw;
  const p = PARAMS[ch];
  const w0 = tl.launch.w0;
  const { segs, tStart, Rp } = closeCruise(tl, tNow);

  const minTravel = (p.tdTarget * w0) / (p.k + 1) - 180 + (rnd() - 0.5) * 240;
  let Rstop: number;
  let B: number | null = null;
  let d: number | null = null;
  if (dir === 0 || T === null) {
    const o = -8 + 16 * rnd(); // offset acak di dalam potong, >= 7 derajat dari kedua tepi
    Rstop = nextAngle(Rp, restMod(L, o), minTravel);
  } else {
    const Bmod = dir === 1 ? mod(HALF - SLICE_DEG * T, 360) : mod(-(SLICE_DEG * T + HALF), 360);
    Rstop = nextAngle(Rp, mod(Bmod - 8 * dir, 360), minTravel); // hold 8 derajat di dalam T
    B = Rstop + 8 * dir;
    d = 7 + 3 * rnd();
  }
  const theta = Rstop - Rp;
  const down = spindown(tStart, Rp, theta, w0, p.k);
  segs.push(down);
  let t = tStart + down.dur;
  const markers: Partial<Record<Cue, number>> = {
    ...tl.markers,
    slow: timeBelow(down, w0, p.k, SLOW_CUE_SPEED),
  };
  if (ch === 'finale') markers.nearEnd = Math.max(tStart, t - 2500);

  let finalR = Rstop;
  if (B !== null && d !== null && dir !== 0) {
    const peg = B;
    const dd = d;
    const A = (a: number) => peg + dir * a;
    const add = (dur: number, phase: Phase, f: (u: number) => number) => {
      if (dur > 0) segs.push(segment(t, dur, phase, f));
      t += Math.max(0, dur);
    };
    markers.hold = t;
    add(p.holdMs, 'hold', (u) => A(-8 + 0.25 * easeInOutCubic(u)));
    markers.creep = t;
    add(650, 'creep', (u) => A(-7.75 + 6.25 * easeInQuad(u)));
    markers.struggle = t;
    const keys = [-1.5, 0.6, 0.2, 2.2, 1.8, 3.2];
    const base = [150, 110, 170, 110, 160];
    const s = p.struggleMs / 700;
    for (let i = 0; i < base.length; i++) {
      const a0 = keys[i];
      const a1 = keys[i + 1];
      add(base[i] * s, 'struggle', (u) => A(a0 + (a1 - a0) * easeInOutCubic(u)));
    }
    markers.snap = t;
    add(200, 'snap', (u) => A(3.2 + (dd + 1.4 - 3.2) * easeOutExpo(u)));
    add(220, 'settle', (u) => A(dd + 1.4 - 1.75 * easeInOutCubic(u)));
    add(230, 'settle', (u) => A(dd - 0.35 + 0.35 * easeOutCubic(u)));
    finalR = A(dd);
  }
  markers.settle = t;

  return {
    ...tl,
    segs,
    end: t,
    markers,
    plan: {
      kind: 'land',
      choreo: ch,
      landIdx: L,
      teaseIdx: dir === 0 ? null : T,
      dir,
      tStart,
      Rp,
      Rstop,
      theta,
      spindownMs: down.dur,
      B,
      d,
      finalR,
    },
  };
}

/** Titik istirahat terdekat minimal 360 derajat di depan R, offset acak +-8. */
export function abortStop(R: number, rnd: () => number = Math.random): number {
  const o = -8 + 16 * rnd();
  let best = Infinity;
  for (let i = 0; i < SLICE_COUNT; i++) best = Math.min(best, nextAngle(R, restMod(i, o), 360));
  return best;
}

/**
 * Putaran gagal (ok:false, error, atau 20 detik tanpa jawaban): berhenti
 * netral di titik istirahat terdekat >= 360 derajat ke depan. Tanpa sorotan.
 */
export function planAbort(tl: Timeline, tNow: number, rnd: () => number = Math.random): Timeline {
  if (tl.plan) return tl;
  const w0 = tl.launch.w0;
  const { segs, tStart, Rp } = closeCruise(tl, tNow);
  const Rstop = abortStop(Rp, rnd);
  const theta = Rstop - Rp;
  const down = spindown(tStart, Rp, theta, w0, ABORT_K);
  segs.push(down);
  const end = tStart + down.dur;
  return {
    ...tl,
    segs,
    end,
    markers: { ...tl.markers, slow: timeBelow(down, w0, ABORT_K, SLOW_CUE_SPEED), settle: end },
    plan: {
      kind: 'abort',
      choreo: null,
      landIdx: sliceAt(Rstop),
      teaseIdx: null,
      dir: 0,
      tStart,
      Rp,
      Rstop,
      theta,
      spindownMs: down.dur,
      B: null,
      d: null,
      finalR: Rstop,
    },
  };
}

function segmentAt(tl: Timeline, t: number): { seg: Segment; tau: number } {
  const segs = tl.segs;
  if (!(t > 0)) return { seg: segs[0], tau: 0 };
  for (const seg of segs) {
    if (t < seg.t0 + seg.dur) return { seg, tau: t - seg.t0 };
  }
  const last = segs[segs.length - 1];
  return { seg: last, tau: last.dur };
}

/** Sudut rotor pada waktu t (ms sejak tekan). Setelah selesai = finalR. */
export function angleAt(tl: Timeline, t: number): number {
  if (tl.plan && t >= tl.end) return tl.plan.finalR;
  const { seg, tau } = segmentAt(tl, t);
  return seg.at(tau);
}

export function phaseAt(tl: Timeline, t: number): Phase {
  return segmentAt(tl, t).seg.phase;
}

/** Kecepatan rotor (derajat/detik, bertanda) pada waktu t. */
export function speedAt(tl: Timeline, t: number): number {
  if (tl.plan && t >= tl.end) return 0;
  const { seg, tau } = segmentAt(tl, t);
  if (seg.speed) return seg.speed(tau);
  return (angleAt(tl, t + 1) - angleAt(tl, t - 1)) * 500;
}

export const isDone = (tl: Timeline, t: number): boolean => tl.plan !== null && t >= tl.end;

/** Cue yang dilewati di (tPrev, t], berurutan waktu. Dipanggil sekali per frame. */
export function cuesBetween(tl: Timeline, tPrev: number, t: number): Cue[] {
  const out: { cue: Cue; at: number }[] = [];
  for (const cue of CUE_ORDER) {
    const at = tl.markers[cue];
    if (at !== undefined && at > tPrev && at <= t) out.push({ cue, at });
  }
  return out.sort((a, b) => a.at - b.at).map((c) => c.cue);
}

// ---------------------------------------------------------------- jarum (DESIGN 6.5)

const K = (2 * Math.PI * 14) ** 2; // flapper 14Hz
const C = 2 * 0.3 * 2 * Math.PI * 14; // rasio redaman 0.3
const G = 1.5;
const TMAX = 5;
export const POINTER_DT = 1 / 600;
const POINTER_DT_MS = POINTER_DT * 1000;
/** Substep maksimum per frame (setara 50ms). */
const MAX_SUBSTEPS = 30;

export type PointerState = { gap: number; tau: number; v: number };

export const initPointer = (R: number): PointerState => ({ gap: sliceAt(R), tau: 0, v: 0 });

/** Paksa jarum tegak di potong R (setelah crossfade reduced motion atau pemulihan). */
export function syncPointer(s: PointerState, R: number): void {
  s.gap = sliceAt(R);
  s.tau = 0;
  s.v = 0;
}

/**
 * Satu langkah simulasi jarum. Balikan: 1 kalau jarum lompat satu pasak ke
 * depan (roda maju), -1 kalau mundur, 0 kalau tidak. Setiap slip = satu "tik".
 */
export function stepPointer(s: PointerState, R: number, dt: number = POINTER_DT): 0 | 1 | -1 {
  s.v += (-K * s.tau - C * s.v) * dt;
  s.tau += s.v * dt;
  let slip: 0 | 1 | -1 = 0;
  for (let pass = 0; pass < 2; pass++) {
    const c = mod(SLICE_DEG * s.gap + R + 180, 360) - 180;
    const aL = c - HALF;
    const aR = c + HALF;
    if (s.tau < aL + G) {
      s.tau = aL + G;
      if (s.v < 0) s.v = 0;
    }
    if (s.tau > aR - G) {
      s.tau = aR - G;
      if (s.v > 0) s.v = 0;
    }
    if (s.tau > TMAX) {
      s.gap = mod(s.gap - 1, SLICE_COUNT);
      s.v = 0;
      slip = 1;
      continue;
    }
    if (s.tau < -TMAX) {
      s.gap = mod(s.gap + 1, SLICE_COUNT);
      s.v = 0;
      slip = -1;
      continue;
    }
    break;
  }
  if (!Number.isFinite(s.tau) || !Number.isFinite(s.v)) syncPointer(s, R);
  return slip;
}

/** Sudut jarum dalam derajat (CSS: rotate(-pointerDeg)). */
export const pointerDeg = (s: PointerState): number => Math.max(-22, Math.min(22, 4 * s.tau));

/**
 * Majukan jarum dari tFrom ke tTo dengan substep ~1/600 detik, mengambil sudut
 * dari `sample(t)`. Frame panjang (jank) tetap disampel merata sepanjang
 * rentangnya, maksimal 30 substep, supaya pasak tidak terlewat diam-diam.
 */
export function advancePointer(
  s: PointerState,
  sample: (t: number) => number,
  tFrom: number,
  tTo: number,
  onSlip?: (dir: 1 | -1, t: number) => void,
): number {
  const span = tTo - tFrom;
  if (!(span > 0)) return 0;
  const n = Math.min(MAX_SUBSTEPS, Math.max(1, Math.ceil(span / POINTER_DT_MS - 1e-9)));
  const dt = Math.min(span / n, (MAX_SUBSTEPS * POINTER_DT_MS) / n) / 1000;
  let slips = 0;
  for (let i = 1; i <= n; i++) {
    const t = tFrom + (span * i) / n;
    const slip = stepPointer(s, sample(t), dt);
    if (slip !== 0) {
      slips++;
      onSlip?.(slip, t);
    }
  }
  return slips;
}

// ---------------------------------------------------------------- reduced motion (DESIGN 6.7)

export type Hop = { t: number; idx: number };

/** Sorotan melompat dari potong start ke target dalam urutan baca jarum, 18..29 lompatan, total `totalMs`. */
export function hopPlan(startIdx: number, targetIdx: number, totalMs = 2200): { n: number; hops: Hop[] } {
  const n = 18 + mod(startIdx - targetIdx - 18, SLICE_COUNT);
  const hops: Hop[] = [];
  for (let h = 1; h <= n; h++) hops.push({ t: totalMs * (1 - (1 - h / n) ** (1 / 3)), idx: mod(startIdx - h, SLICE_COUNT) });
  return { n, hops };
}

export type HopEvent =
  | { t: number; type: 'hop'; idx: number }
  | { t: number; type: 'cue'; cue: Cue }
  /** Crossfade rotor: opasitas 1 ke 0 (120ms), set R = landR, 0 ke 1 (120ms). */
  | { t: number; type: 'fade' };

export const HOP_TOTAL_MS = 2200;
/** Jeda dari akhir hold ke lompatan terakhir (tease), dan dari lompatan terakhir ke crossfade. */
export const HOP_SNAP_DELAY_MS = 400;
export const HOP_FADE_DELAY_MS = 300;
export const HOP_FADE_MS = 240;

/**
 * Jadwal lengkap reduced motion: lompatan ke potong tease (atau land), hold
 * dengan durasi yang sama dengan koreografi biasa, cue creep (ekor kalimat
 * tease muncul), satu lompatan ke land dengan cue snap, lalu crossfade rotor
 * ke sudut land dan cue settle. Rotor tidak pernah berputar.
 */
export function hopSchedule(
  restR: number,
  r: Pick<SpinReveal, 'landSliceId' | 'teaseSliceId'>,
  choreo: Choreo,
): { events: HopEvent[]; landR: number; end: number } {
  const L = sliceIndex(r.landSliceId);
  if (L < 0) throw new RangeError(`Potong tidak dikenal: ${r.landSliceId}`);
  const Traw = r.teaseSliceId ? sliceIndex(r.teaseSliceId) : -1;
  const T = Traw >= 0 && directionFor(L, Traw) !== 0 && choreo !== 'normal' ? Traw : null;
  const start = sliceAt(restR);
  const target = T ?? L;
  const { hops } = hopPlan(start, target, HOP_TOTAL_MS);
  const events: HopEvent[] = [];
  // Cue `slow` di lompatan pertama yang jaraknya ke lompatan berikutnya >= 120ms.
  let slowAt = HOP_TOTAL_MS;
  for (let i = 0; i < hops.length - 1; i++) {
    if (hops[i + 1].t - hops[i].t >= 120) {
      slowAt = hops[i].t;
      break;
    }
  }
  if (T !== null && choreo === 'finale') events.push({ t: 0, type: 'cue', cue: 'nearEnd' });
  let slowSent = false;
  for (const h of hops) {
    if (!slowSent && h.t >= slowAt) {
      events.push({ t: slowAt, type: 'cue', cue: 'slow' });
      slowSent = true;
    }
    events.push({ t: h.t, type: 'hop', idx: h.idx });
  }
  let t = HOP_TOTAL_MS;
  if (T !== null) {
    const p = PARAMS[choreo];
    events.push({ t, type: 'cue', cue: 'hold' });
    t += p.holdMs;
    events.push({ t, type: 'cue', cue: 'creep' });
    t += HOP_SNAP_DELAY_MS;
    events.push({ t, type: 'hop', idx: L });
    events.push({ t, type: 'cue', cue: 'snap' });
  }
  t += HOP_FADE_DELAY_MS;
  events.push({ t, type: 'fade' });
  t += HOP_FADE_MS;
  events.push({ t, type: 'cue', cue: 'settle' });
  return { events, landR: restMod(L, 0), end: t };
}

// ---------------------------------------------------------------- lain-lain

/**
 * Potong yang di-tap. dx, dy dalam unit viewBox rotor (0..1000) relatif ke
 * pusat. Hanya cincin 140..440 unit yang dihitung (bukan hub, bukan bingkai).
 */
export function sliceFromPoint(dx: number, dy: number, R: number): number | null {
  const dist = Math.hypot(dx, dy);
  if (!(dist >= 140 && dist <= 440)) return null;
  const theta = (Math.atan2(dx, -dy) * 180) / Math.PI;
  return mod(Math.round(mod(theta - R, 360) / SLICE_DEG), SLICE_COUNT);
}

/** Sudut istirahat saat halaman dibuka: tengah potong land terakhir yang sudah dibuka, kalau belum ada: Lamborghini. */
export function initialRest(revealed: readonly Pick<SpinReveal, 'spinNo' | 'landSliceId'>[]): number {
  let last: Pick<SpinReveal, 'spinNo' | 'landSliceId'> | null = null;
  for (const r of revealed) if (!last || r.spinNo > last.spinNo) last = r;
  const idx = last ? sliceIndex(last.landSliceId) : -1;
  return restMod(idx >= 0 ? idx : sliceIndex('lambo'), 0);
}
