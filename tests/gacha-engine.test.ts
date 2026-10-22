import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { SLICES, TOTAL_SPINS, sliceIndex, type PrizeKind, type SliceId, type SpinReveal } from '@/lib/gacha/config';
import { FINAL } from '@/app/jason-jonathan-shella-wedding-gacha-gift/_ui/copy';
import { emblemSvg } from '@/app/jason-jonathan-shella-wedding-gacha-gift/_ui/emblem';
import {
  CUE_ORDER,
  PARAMS,
  abortStop,
  advancePointer,
  angleAt,
  buildLaunch,
  choreoFor,
  cuesBetween,
  directionFor,
  hopPlan,
  hopSchedule,
  initPointer,
  initialRest,
  mod,
  pegDistance,
  phaseAt,
  planAbort,
  planLanding,
  restMod,
  sliceAt,
  sliceFromPoint,
  type Choreo,
  type Cue,
  type Timeline,
} from '@/app/jason-jonathan-shella-wedding-gacha-gift/_ui/engine';
import {
  codeGroups,
  formatMmSs,
  formatRp,
  spellCode,
  splitTease,
  terbilang,
  typingSchedule,
} from '@/app/jason-jonathan-shella-wedding-gacha-gift/_ui/format';
import {
  achievementsFor,
  chipsFor,
  copyAllText,
  creepLine,
  dockSlots,
  idleLine,
  landLine,
  overlineFor,
  refusalAchievement,
  revealContext,
  summarize,
  type RevealContext,
} from '@/app/jason-jonathan-shella-wedding-gacha-gift/_ui/reactions';

// Mesin roda dan reaksi UI halaman hadiah (DESIGN 6, 15, 16.7). Skenario
// ditulis ulang di sini (jangan impor scenario.ts: server-only).

const UI_DIR = 'src/app/jason-jonathan-shella-wedding-gacha-gift/_ui';

type Step = { spinNo: number; kind: PrizeKind; land: SliceId; tease: SliceId | null; teaseLine: string | null };
const SCEN: Step[] = [
  { spinNo: 1, kind: 'steam_100k', land: 's100a', tease: null, teaseLine: null },
  { spinNo: 2, kind: 'zonk', land: 'zonka', tease: 'emas', teaseLine: 'DIKIT LAGI EMAS 200 GRAM...' },
  { spinNo: 3, kind: 'steam_100k', land: 's100b', tease: null, teaseLine: null },
  { spinNo: 4, kind: 'steam_600k', land: 's600b', tease: 'zonkb', teaseLine: 'Yah, ZONK lagi...' },
  { spinNo: 5, kind: 'zonk', land: 'zonka', tease: 'kingkoil', teaseLine: 'Kasur King Koil udah di depan mata...' },
  { spinNo: 6, kind: 'steam_100k', land: 's100a', tease: null, teaseLine: null },
  { spinNo: 7, kind: 'steam_600k', land: 's600a', tease: 'amerika', teaseLine: 'Tiket Amerika... eh' },
];

const VALUE: Record<PrizeKind, number> = { steam_600k: 600_000, steam_100k: 100_000, zonk: 0 };

function reveal(s: Step): SpinReveal {
  return {
    spinNo: s.spinNo,
    kind: s.kind,
    title: s.kind === 'zonk' ? `Bonus ${s.spinNo}` : `Steam Wallet ${formatRp(VALUE[s.kind])}`,
    note: `Catatan ${s.spinNo}.`,
    code: s.kind === 'zonk' ? null : `CODE${s.spinNo}-AAAAA-BBBBB`,
    valueIdr: VALUE[s.kind],
    landSliceId: s.land,
    teaseSliceId: s.tease,
    teaseLine: s.teaseLine,
  };
}
const REVEALS = SCEN.map(reveal);

/** RNG deterministik (mulberry32). */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FRAME = 1000 / 60;

type SpinRun = {
  tl: Timeline;
  choreo: Choreo;
  finalR: number;
  gap: number;
  holdGaps: number[];
  backwards: number;
  maxStep: number;
  cues: Cue[];
};

/** Satu putaran utuh: tekan, jawaban server, rAF 60Hz dengan substep jarum. */
function runSpin(R0: number, s: Step, rnd: () => number, waitMs: number, answerAt = 120): SpinRun {
  const r = reveal(s);
  const isLast = r.spinNo === TOTAL_SPINS;
  const choreo = choreoFor(r, isLast);
  let tl = buildLaunch(R0, isLast);
  tl = planLanding(tl, waitMs > 0 ? tl.launchEnd + waitMs : answerAt, r, choreo, rnd);

  // Monoton di launch | cruise | spindown, dicek per 1ms.
  let backwards = 0;
  let prev = angleAt(tl, 0);
  for (let t = 1; t <= tl.end; t += 1) {
    const R = angleAt(tl, t);
    const ph = phaseAt(tl, t);
    if ((ph === 'launch' || ph === 'cruise' || ph === 'spindown') && phaseAt(tl, t - 1) !== 'windup' && R < prev - 1e-9) backwards++;
    prev = R;
  }

  // Frame 60Hz: langkah sudut, jarum, cue.
  const ptr = initPointer(R0);
  const holdGaps: number[] = [];
  const cues: Cue[] = [];
  let maxStep = 0;
  let tPrev = 0;
  let RPrev = angleAt(tl, 0);
  for (let t = FRAME; ; t += FRAME) {
    const tt = Math.min(t, tl.end);
    advancePointer(ptr, (x) => angleAt(tl, x), tPrev, tt);
    cues.push(...cuesBetween(tl, tPrev, tt));
    const R = angleAt(tl, tt);
    maxStep = Math.max(maxStep, Math.abs(R - RPrev));
    if (phaseAt(tl, tt) === 'hold' && tt < tl.end) holdGaps.push(ptr.gap);
    tPrev = tt;
    RPrev = R;
    if (tt >= tl.end) break;
  }
  return { tl, choreo, finalR: angleAt(tl, tl.end), gap: ptr.gap, holdGaps, backwards, maxStep, cues };
}

// Rentang durasi spin-down (detik) per koreografi, tabel DESIGN 6.2 (diukur
// dengan rantai 7 putaran dari Lambo tanpa tunggu jaringan), toleransi 0,15s.
const TD_RANGE: Record<Choreo, [number, number]> = {
  normal: [3.5 - 0.15, 5.5 + 0.15],
  heartbreak: [4.1 - 0.15, 5.8 + 0.15],
  rescue: [4.0 - 0.15, 5.6 + 0.15],
  finale: [6.0 - 0.15, 6.0 + 0.15],
};

describe('mesin roda: pendaratan tepat', () => {
  it('koreografi dan arah rayapan sesuai skenario', () => {
    expect(SCEN.map((s) => choreoFor(reveal(s), s.spinNo === TOTAL_SPINS))).toEqual([
      'normal',
      'heartbreak',
      'normal',
      'rescue',
      'heartbreak',
      'normal',
      'finale',
    ]);
    expect(SCEN.map((s) => directionFor(sliceIndex(s.land), s.tease ? sliceIndex(s.tease) : null))).toEqual([0, -1, 0, -1, 1, 0, 1]);
  });

  for (const waitMs of [0, 900]) {
    it(`50 seed x 7 putaran, tunggu jaringan ${waitMs}ms`, () => {
      const td: Record<Choreo, number[]> = { normal: [], heartbreak: [], rescue: [], finale: [] };
      for (let seed = 1; seed <= 50; seed++) {
        const rnd = rng(seed * 7919 + waitMs);
        let R = restMod(sliceIndex('lambo'), 0);
        for (const s of SCEN) {
          const run = runSpin(R, s, rnd, waitMs);
          const L = sliceIndex(s.land);
          const label = `seed ${seed} putaran ${s.spinNo}`;
          // Berhenti tepat di potong server, jarum juga di sana.
          expect(sliceAt(run.finalR), label).toBe(L);
          expect(run.gap, label).toBe(L);
          expect(run.finalR, label).toBeCloseTo(run.tl.plan!.finalR, 9);
          // Jauh dari pasak: >= 7 derajat.
          expect(pegDistance(run.finalR), label).toBeGreaterThanOrEqual(7 - 1e-9);
          // Saat hold, jarum diam di potong tease.
          if (s.tease) {
            expect(run.holdGaps.length, label).toBeGreaterThan(0);
            expect(new Set(run.holdGaps), label).toEqual(new Set([sliceIndex(s.tease)]));
          } else {
            expect(run.holdGaps, label).toEqual([]);
          }
          // Tidak pernah mundur saat launch/cruise/spindown; langkah per frame < 15 derajat.
          expect(run.backwards, label).toBe(0);
          expect(run.maxStep, label).toBeLessThan(15);
          // Cue berurutan, masing-masing sekali.
          const expected = CUE_ORDER.filter((c) => c in run.tl.markers);
          expect(run.cues, label).toEqual(expected);
          td[run.choreo].push(run.tl.plan!.spindownMs / 1000);
          R = run.finalR;
        }
      }
      if (waitMs === 0) {
        for (const ch of Object.keys(td) as Choreo[]) {
          const [lo, hi] = TD_RANGE[ch];
          expect(Math.min(...td[ch]), ch).toBeGreaterThanOrEqual(lo);
          expect(Math.max(...td[ch]), ch).toBeLessThanOrEqual(hi);
        }
      }
      // Batas teoretis apa pun posisi awalnya: (k+1) * [minTravel, minTravel + 360) / w0.
      for (const ch of Object.keys(td) as Choreo[]) {
        const p = PARAMS[ch];
        const w0 = ch === 'finale' ? PARAMS.finale.w0 : PARAMS.normal.w0;
        const base = (p.tdTarget * w0) / (p.k + 1) - 180;
        for (const v of td[ch]) {
          expect(v).toBeGreaterThanOrEqual(((p.k + 1) * (base - 120)) / w0 - 1e-9);
          expect(v).toBeLessThan(((p.k + 1) * (base + 120 + 360)) / w0);
        }
      }
    });
  }

  it('jawaban yang datang saat wind-up tetap mulai spin-down di akhir ramp', () => {
    const tl0 = buildLaunch(123, false);
    const tl = planLanding(tl0, 10, reveal(SCEN[0]), 'normal', rng(3));
    expect(tl.plan!.tStart).toBe(tl0.launchEnd);
    expect(tl.segs.some((s) => s.phase === 'cruise')).toBe(false);
    // Rencana kedua diabaikan (idempoten).
    expect(planLanding(tl, 5000, reveal(SCEN[1]), 'heartbreak', rng(4))).toBe(tl);
  });

  it('selama menunggu server, roda cruise di w0 tanpa batas', () => {
    const tl = buildLaunch(0, false);
    expect(tl.end).toBe(Infinity);
    const a = angleAt(tl, tl.launchEnd + 1000);
    const b = angleAt(tl, tl.launchEnd + 2000);
    expect(b - a).toBeCloseTo(PARAMS.normal.w0, 6);
  });
});

describe('mesin roda: abort dan reduced motion', () => {
  it('titik abort 360..390 derajat ke depan, >= 7 derajat dari pasak', () => {
    const rnd = rng(99);
    for (let i = 0; i < 2000; i++) {
      const R = 10000 * rnd();
      const S = abortStop(R, rnd);
      expect(S - R).toBeGreaterThanOrEqual(360);
      expect(S - R).toBeLessThan(390);
      expect(pegDistance(S)).toBeGreaterThanOrEqual(7 - 1e-9);
    }
  });

  it('planAbort berhenti netral, monoton, jarum ikut', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const rnd = rng(seed);
      const R0 = 1000 * rnd();
      const tl0 = buildLaunch(R0, seed % 2 === 0);
      const tl = planAbort(tl0, tl0.launchEnd + 3000 * rnd(), rnd);
      const plan = tl.plan!;
      expect(plan.kind).toBe('abort');
      expect(plan.Rstop - plan.Rp).toBeGreaterThanOrEqual(360);
      expect(plan.Rstop - plan.Rp).toBeLessThan(390);
      const ptr = initPointer(R0);
      let prev = angleAt(tl, tl.launchEnd);
      for (let t = tl.launchEnd + 1; t <= tl.end; t += 1) {
        const R = angleAt(tl, t);
        expect(R).toBeGreaterThanOrEqual(prev - 1e-9);
        prev = R;
      }
      let tPrev = 0;
      for (let t = FRAME; tPrev < tl.end; t += FRAME) {
        const tt = Math.min(t, tl.end);
        advancePointer(ptr, (x) => angleAt(tl, x), tPrev, tt);
        tPrev = tt;
      }
      expect(ptr.gap).toBe(sliceAt(plan.finalR));
      expect(pegDistance(plan.finalR)).toBeGreaterThanOrEqual(7 - 1e-9);
    }
  });

  it('hopPlan berakhir di target untuk 144 pasangan, 18..29 lompatan, terakhir di 2200ms', () => {
    for (let s = 0; s < 12; s++) {
      for (let target = 0; target < 12; target++) {
        const { n, hops } = hopPlan(s, target);
        expect(n).toBeGreaterThanOrEqual(18);
        expect(n).toBeLessThanOrEqual(29);
        expect(hops).toHaveLength(n);
        expect(hops.at(-1)!.idx).toBe(target);
        expect(hops.at(-1)!.t).toBeCloseTo(2200, 6);
        hops.forEach((h, i) => {
          expect(h.idx).toBe(mod(s - (i + 1), 12));
          if (i > 0) expect(h.t).toBeGreaterThan(hops[i - 1].t);
        });
      }
    }
  });

  it('hopSchedule: tease dulu, hold, lalu satu lompatan ke land', () => {
    let R = restMod(sliceIndex('lambo'), 0);
    for (const s of SCEN) {
      const r = reveal(s);
      const choreo = choreoFor(r, s.spinNo === TOTAL_SPINS);
      const { events, landR, end } = hopSchedule(R, r, choreo);
      const hops = events.filter((e) => e.type === 'hop');
      const cues = events.filter((e) => e.type === 'cue').map((e) => (e.type === 'cue' ? e.cue : null));
      expect(hops.at(-1)!.type === 'hop' && hops.at(-1)!.idx).toBe(sliceIndex(s.land));
      expect(sliceAt(landR)).toBe(sliceIndex(s.land));
      expect(events.at(-1)).toEqual({ t: end, type: 'cue', cue: 'settle' });
      for (let i = 1; i < events.length; i++) expect(events[i].t).toBeGreaterThanOrEqual(events[i - 1].t);
      if (s.tease) {
        const holdAt = events.findIndex((e) => e.type === 'cue' && e.cue === 'hold');
        const before = events.slice(0, holdAt).filter((e) => e.type === 'hop');
        expect(before.at(-1)!.type === 'hop' && before.at(-1)!.idx).toBe(sliceIndex(s.tease));
        expect(cues).toEqual(expect.arrayContaining(['hold', 'creep', 'snap', 'settle']));
        const creep = events.find((e) => e.type === 'cue' && e.cue === 'creep')!;
        expect(creep.t - events[holdAt].t).toBe(PARAMS[choreo].holdMs);
      } else {
        expect(cues).not.toContain('hold');
      }
      R = landR;
    }
  });
});

describe('geometri', () => {
  it('sliceAt dan restMod saling balik', () => {
    for (let i = 0; i < 12; i++) {
      for (const o of [-8, -3, 0, 5, 7.9]) expect(sliceAt(restMod(i, o) + 360 * 5)).toBe(i);
    }
  });

  it('tap pada roda memilih potong yang benar, abaikan hub dan bingkai', () => {
    const rnd = rng(5);
    for (let k = 0; k < 200; k++) {
      const R = 3600 * rnd() - 1800;
      const i = Math.floor(12 * rnd());
      const a = ((30 * i + R + (rnd() - 0.5) * 20) * Math.PI) / 180;
      const r = 150 + 280 * rnd();
      expect(sliceFromPoint(r * Math.sin(a), -r * Math.cos(a), R)).toBe(i);
    }
    expect(sliceFromPoint(0, -100, 0)).toBeNull();
    expect(sliceFromPoint(0, -470, 0)).toBeNull();
  });

  it('sudut awal: land terakhir yang dibuka, kalau belum ada Lamborghini', () => {
    expect(initialRest([])).toBe(restMod(sliceIndex('lambo'), 0));
    expect(sliceAt(initialRest([REVEALS[1], REVEALS[0]]))).toBe(sliceIndex('zonka'));
  });
});

describe('format', () => {
  it('rupiah dan terbilang', () => {
    expect(formatRp(1_500_000)).toBe('Rp1.500.000');
    expect(formatRp(600_000)).toBe('Rp600.000');
    expect(formatRp(0)).toBe('Rp0');
    expect(terbilang(100_000)).toBe('seratus ribu');
    expect(terbilang(600_000)).toBe('enam ratus ribu');
    expect(terbilang(700_000)).toBe('tujuh ratus ribu');
    expect(terbilang(1_500_000)).toBe('satu juta lima ratus ribu');
    expect(terbilang(0)).toBe('nol');
    expect(terbilang(1000)).toBe('seribu');
    expect(terbilang(11)).toBe('sebelas');
    expect(terbilang(115)).toBe('seratus lima belas');
    expect(terbilang(2_021_000)).toBe('dua juta dua puluh satu ribu');
  });

  it('kode voucher dieja per karakter', () => {
    expect(codeGroups('X032K-WER44-432RE')).toEqual(['X032K', 'WER44', '432RE']);
    expect(spellCode('X032K-WER44-432RE')).toBe('X 0 3 2 K, W E R 4 4, 4 3 2 R E');
  });

  it('splitTease (DESIGN 6.8)', () => {
    expect(splitTease('Tiket Amerika... eh')).toEqual(['Tiket Amerika...', 'eh']);
    expect(splitTease('Yah, ZONK lagi...')).toEqual(['Yah, ZONK lagi...', null]);
    expect(splitTease('DIKIT LAGI EMAS 200 GRAM...')).toEqual(['DIKIT LAGI EMAS 200 GRAM...', null]);
    expect(splitTease('Kasur King Koil udah di depan mata...')).toEqual(['Kasur King Koil udah di depan mata...', null]);
  });

  it('jadwal ketik dan hitung mundur', () => {
    const steps = typingSchedule('Tiket Amerika...');
    expect(steps[0]).toEqual({ t: 100, upTo: 1 });
    expect(steps.at(-1)!.upTo).toBe(16);
    expect(steps.at(-1)!.t - steps.at(-2)!.t).toBe(220);
    expect(formatMmSs(905)).toBe('15:05');
    expect(formatMmSs(0)).toBe('00:00');
  });
});

describe('reaksi (DESIGN 15.4, 15.5)', () => {
  const C = (over: Partial<RevealContext>): RevealContext => ({
    kind: 'steam_100k',
    teaseKind: null,
    teaseLabel: null,
    dir: 0,
    land: '100K',
    isLast: false,
    replay: false,
    ...over,
  });

  it('kalimat land untuk setiap kombinasi', () => {
    expect(landLine(C({}))).toBe('Steam 100K. Beneran masuk.');
    expect(landLine(C({ kind: 'steam_600k', land: '600K' }))).toBe('600K!! Langsung, tanpa drama.');
    expect(landLine(C({ kind: 'zonk', land: 'ZONK' }))).toBe('ZONK. Ya udah.');
    expect(landLine(C({ kind: 'zonk', land: 'ZONK', teaseKind: 'lebay', teaseLabel: 'Emas 200 gram', dir: -1 }))).toBe(
      'Emas 200 gram ditarik lagi. ZONK.',
    );
    expect(landLine(C({ kind: 'zonk', land: 'ZONK', teaseKind: 'lebay', teaseLabel: 'Kasur King Koil', dir: 1 }))).toBe(
      'Kasur King Koil kabur. ZONK.',
    );
    expect(landLine(C({ kind: 'steam_600k', land: '600K', teaseKind: 'zonk', teaseLabel: 'ZONK', dir: -1 }))).toBe('EH, MUNDUR! MUNDUR KE 600K!');
    expect(landLine(C({ kind: 'steam_100k', teaseKind: 'zonk', teaseLabel: 'ZONK', dir: 1 }))).toBe('EH, GESER! GESER KE 100K!');
    expect(landLine(C({ kind: 'steam_600k', land: '600K', teaseKind: 'lebay', teaseLabel: 'Tiket ke Amerika', dir: 1 }))).toBe(
      'NYELONONG KE 600K!',
    );
    expect(landLine(C({ kind: 'steam_100k', teaseKind: 'lebay', teaseLabel: 'Lamborghini', dir: -1 }))).toBe('NYELONONG KE 100K!');
    expect(landLine(C({ kind: 'zonk', land: 'ZONK', teaseKind: 'steam_600k', teaseLabel: 'Steam 600K', dir: 1 }))).toBe('Dikit lagi... ZONK.');
    expect(landLine(C({ teaseKind: 'steam_600k', teaseLabel: 'Steam 600K', dir: 1 }))).toBe('Geser dikit, tetep 100K!');
    // Tease yang tidak bersebelahan = tanpa tease.
    expect(landLine(C({ kind: 'zonk', land: 'ZONK', teaseKind: 'lebay', teaseLabel: 'Lamborghini', dir: 0 }))).toBe('ZONK. Ya udah.');

    expect(REVEALS.map((r) => landLine(r))).toEqual([
      'Steam 100K. Beneran masuk.',
      'Emas 200 gram ditarik lagi. ZONK.',
      'Steam 100K. Beneran masuk.',
      'EH, MUNDUR! MUNDUR KE 600K!',
      'Kasur King Koil kabur. ZONK.',
      'Steam 100K. Beneran masuk.',
      'NYELONONG KE 600K!',
    ]);
  });

  it('chip reveal', () => {
    expect(REVEALS.map((r) => chipsFor(r).map((c) => c.text))).toEqual([
      [],
      ['Nyaris: Emas 200 gram'],
      [],
      ['UPGRADE! ZONK jadi 600K'],
      ['Nyaris: Kasur King Koil'],
      [],
      ['HARD PITY TERPENUHI'],
    ]);
    expect(chipsFor(REVEALS[0], true).map((c) => [c.id, c.tone])).toEqual([['replay', 'glass']]);
    expect(chipsFor(REVEALS[3], true).map((c) => c.id)).toEqual(['replay', 'upgrade']);
    expect(chipsFor(C({ teaseKind: 'zonk', teaseLabel: 'ZONK', dir: -1 })).map((c) => c.text)).toEqual(['UPGRADE! ZONK jadi 100K']);
    expect(chipsFor(C({ isLast: true })).map((c) => c.id)).toEqual(['hardPity']);
    expect(chipsFor(C({ kind: 'zonk', land: 'ZONK', isLast: true }))).toEqual([]);
    expect(chipsFor(C({ kind: 'steam_600k', land: '600K', teaseKind: 'zonk', teaseLabel: 'ZONK', dir: 1, isLast: true, replay: true })).map((c) => c.id)).toEqual([
      'replay',
      'upgrade',
      'hardPity',
    ]);
    expect(revealContext(REVEALS[6]).isLast).toBe(true);
  });

  it('kalimat rayapan', () => {
    expect(REVEALS.map((r) => creepLine(r, choreoFor(r, r.spinNo === TOTAL_SPINS)))).toEqual([
      '',
      'Lho... lho... kok mundur?',
      '',
      'EH? EH? EH?',
      'Eh... eh... geser...',
      '',
      '',
    ]);
  });

  it('kalimat diam berdasarkan sisa putaran dan hasil terakhir', () => {
    expect(idleLine([], 7)).toBe('');
    expect(idleLine(REVEALS.slice(0, 1), 6)).toBe('Masuk kantong. Sisa 6 putaran, gas.');
    expect(idleLine(REVEALS.slice(0, 2), 5)).toBe('Sabar. Hadiah hiburan juga hadiah. Sisa 5 putaran.');
    expect(idleLine(REVEALS.slice(0, 4), 3)).toBe('Eng langsung ngelirik dompet Steam lu. Sisa 3 putaran.');
    expect(idleLine(REVEALS.slice(0, 5), 2)).toBe('Dua lagi. Eng boleh gantian mencet.');
    expect(idleLine(REVEALS.slice(0, 6), 1)).toBe('Terakhir. Kalau mau berdoa, sekarang waktunya.');
    expect(idleLine(REVEALS, 0)).toBe('');
  });

  it('overline dialog hasil', () => {
    expect(REVEALS.map(overlineFor)).toEqual([
      'BENERAN · PUTARAN 1/7',
      'ZONK · PUTARAN 2/7',
      'BENERAN · PUTARAN 3/7',
      'LEGENDARIS · PUTARAN 4/7',
      'ZONK · PUTARAN 5/7',
      'BENERAN · PUTARAN 6/7',
      'PUTARAN TERAKHIR · LEGENDARIS',
    ]);
  });

  it('achievement', () => {
    expect(achievementsFor(REVEALS[1], REVEALS.slice(0, 1)).map((a) => a.id)).toEqual(['firstZonk']);
    expect(achievementsFor(REVEALS[1], REVEALS.slice(0, 2)).map((a) => a.id)).toEqual(['firstZonk']);
    expect(achievementsFor(REVEALS[4], REVEALS.slice(0, 4))).toEqual([]);
    expect(achievementsFor(REVEALS[3], REVEALS.slice(0, 3))).toEqual([
      { id: 'upgrade', name: 'Bintang Berubah Emas', desc: 'ZONK jadi 600K. Langka, kayak nemu Eng.' },
    ]);
    expect(achievementsFor(REVEALS[6], REVEALS.slice(0, 6))).toEqual([]);
    expect(refusalAchievement(4)).toBeNull();
    expect(refusalAchievement(5)?.id).toBe('denial');
    expect(refusalAchievement(6)).toBeNull();
  });

  it('dok, total, dan teks salin semua dihitung dari hasil', () => {
    const slots = dockSlots(REVEALS.slice(0, 3), { pending: true });
    expect(slots.map((s) => s.status)).toEqual(['steam_100k', 'zonk', 'steam_100k', 'pending', 'empty', 'empty', 'empty']);
    expect(dockSlots(REVEALS.slice(0, 3), { inFlight: true })[3].status).toBe('flight');

    const sum = summarize([...REVEALS].reverse());
    expect(sum.totalIdr).toBe(1_500_000);
    expect(terbilang(sum.totalIdr)).toBe('satu juta lima ratus ribu');
    expect(FINAL.totalWords(sum.totalIdr)).toBe('satu juta lima ratus ribu rupiah');
    expect(FINAL.totalSub(sum.vouchers.length, sum.bonus.length)).toBe('5 voucher + 2 bonus non-tunai');
    expect(sum.vouchers.map((r) => r.spinNo)).toEqual([4, 7, 1, 3, 6]);
    expect(sum.bonus.map((r) => r.spinNo)).toEqual([2, 5]);
    expect(copyAllText(REVEALS)).toBe(
      [
        'Hadiah nikahan Jajo & Eng (Steam Wallet)',
        'Rp600.000: CODE4-AAAAA-BBBBB',
        'Rp600.000: CODE7-AAAAA-BBBBB',
        'Rp100.000: CODE1-AAAAA-BBBBB',
        'Rp100.000: CODE3-AAAAA-BBBBB',
        'Rp100.000: CODE6-AAAAA-BBBBB',
        'Tukerin di: https://store.steampowered.com/account/redeemwalletcode',
      ].join('\n'),
    );
  });
});

describe('aturan sumber _ui', () => {
  const files = fs
    .readdirSync(UI_DIR)
    .filter((f) => /\.(ts|tsx)$/.test(f))
    .map((f) => path.join(UI_DIR, f));

  it('tanpa em dash di copy, reactions, format (dan semua file _ui)', () => {
    const EM_DASH = String.fromCharCode(0x2014);
    for (const name of ['copy.ts', 'reactions.ts', 'format.ts']) expect(files).toContain(path.join(UI_DIR, name));
    expect(files.filter((f) => fs.readFileSync(f, 'utf8').includes(EM_DASH))).toEqual([]);
  });

  it('tidak ada logika per nomor putaran (spinNo hanya dibandingkan dengan TOTAL_SPINS)', () => {
    const bad: string[] = [];
    const rules = [
      // spinNo === <apa pun selain TOTAL_SPINS atau spinNo lain>
      /spinNo\s*[!=]==?(?!=)(?!\s*TOTAL_SPINS\b)(?!\s*[\w.]*\bspinNo\b)/,
      // <angka> === spinNo
      /\b\d+\s*[!=]==?\s*[\w.]*\bspinNo\b/,
      // spinNo >= 4 dan sejenisnya
      /spinNo\s*[<>]=?\s*\d/,
      /\d\s*[<>]=?\s*[\w.]*\bspinNo\b/,
      /switch\s*\([^)]*spinNo/,
    ];
    for (const f of files) {
      fs.readFileSync(f, 'utf8')
        .split('\n')
        .forEach((line, i) => {
          if (rules.some((re) => re.test(line))) bad.push(`${f}:${i + 1}: ${line.trim()}`);
        });
    }
    expect(bad).toEqual([]);
  });

  it('lambang OG tanpa label hadiah', () => {
    const svg = emblemSvg(300, { pointer: true });
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg.match(/<path d="M500,545 /g)).toHaveLength(SLICES.length);
    expect(svg).not.toMatch(/<text|Steam|ZONK|Lambo/);
  });
});
