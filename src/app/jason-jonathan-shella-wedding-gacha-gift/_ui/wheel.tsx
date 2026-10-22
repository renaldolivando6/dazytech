'use client';

import { useEffect, useId, useImperativeHandle, useLayoutEffect, useRef, useState, type PointerEvent, type Ref } from 'react';
import type { SpinReveal } from '@/lib/gacha/config';
import styles from '../gacha.module.css';
import { STAGE } from './copy';
import {
  PLACARD_SPEED,
  advancePointer,
  angleAt,
  buildLaunch,
  cuesBetween,
  hopSchedule,
  initPointer,
  isDone,
  planAbort,
  planLanding,
  pointerDeg,
  sliceAt,
  sliceFromPoint,
  speedAt,
  syncPointer,
  veilOpacity,
  warmPoolOpacity,
  type Choreo,
  type Cue,
  type HopEvent,
  type LitTone,
  type PointerState,
  type Timeline,
} from './engine';
import { Odometer } from './odometer';
import { Pointer } from './pointer';
import { WheelArt } from './wheel-art';

// Roda (DESIGN 5, 16.4): lapisan statis + rotor SVG yang diputar rAF. Per frame
// hanya menulis transform rotor, transform jarum, opacity veil, opacity kolam
// cahaya hangat; textContent placard dan data-lit lewat callback. Tidak ada
// render React selama putaran. Jam timeline berhenti saat tab disembunyikan.

export type PoolTone = 'warm' | 'grey' | 'gold' | 'spot';
export type JewelTone = 'gold' | 'blue' | 'coral';
export type WheelFx = 'flash' | 'shockwave' | 'thump' | 'glint';

export type WheelHandle = {
  /** Wind-up + ramp + cruise terbuka. onCue menerima cue `launch` (akhir wind-up) dan seterusnya. */
  launch(opts: { isLast: boolean; onCue?: (c: Cue) => void }): void;
  /** Rencanakan pendaratan dari jawaban server; resolve di akhir settle. */
  land(r: SpinReveal, choreo: Choreo, onCue: (c: Cue) => void): Promise<void>;
  /** Reduced motion: sorotan melompat, rotor tidak berputar; resolve di akhir. */
  hop(r: SpinReveal, choreo: Choreo, onCue: (c: Cue) => void): Promise<void>;
  /** Berhenti netral (putaran gagal); resolve di akhir. */
  abort(): Promise<void>;
  /** Satu tulisan data-lit (null = matikan). */
  lit(idx: number | null, tone?: LitTone): void;
  /** Rotasi rotor sekarang. */
  rest(): number;
  /** Pindahkan rotor ke R (diam), opsional dengan crossfade 120+120ms. */
  setRest(R: number, opts?: { fade?: boolean }): void;
  jewel(tone: JewelTone | null): void;
  fx(kind: WheelFx): void;
  /** Opacity kolam cahaya (hanya opacity, DESIGN 3.4). Menyentuh `warm` mengambil alih dari rAF. */
  light(levels: Partial<Record<PoolTone, number>>, ms?: number): void;
  vignette(opacity: number, ms?: number): void;
  /** Ujung jarum dalam koordinat viewport (asal percikan). */
  tip(): { x: number; y: number } | null;
  busy(): boolean;
  /** FLIP: catat posisi frame sebelum isi di sekitar roda berganti (lihat prop layoutKey). */
  snapshot(): void;
};

type Callbacks = {
  onSlip?: (dir: 1 | -1, w: number) => void;
  onSlice?: (idx: number, w: number) => void;
  onSpeed?: (w: number) => void;
  onTap?: (idx: number) => void;
};

export type WheelProps = Callbacks & {
  ref?: Ref<WheelHandle>;
  /** Rotasi awal (dirender server, tanpa kedip). Hanya dibaca sekali. */
  initialR: number;
  /** Angka di hub (sisa putaran). */
  hub: number;
  /** Layar PIN: roda diredupkan ke .35. */
  dim?: boolean;
  /** Tap potong untuk S&K (hanya saat diam di stage). */
  tapEnabled?: boolean;
  reduced?: boolean;
  /**
   * Berubah saat isi di sekitar roda berganti (cover <-> stage). Kalau ada
   * snapshot(), frame dianimasikan dari posisi/ukuran lama ke yang baru
   * (pengganti framer `layout`, yang tidak ada di domAnimation).
   */
  layoutKey?: string;
};

type MotionRun = {
  mode: 'motion';
  tl: Timeline;
  origin: number;
  paused: number;
  tPrev: number;
  onCue: ((c: Cue) => void) | null;
  resolve: (() => void) | null;
  resolved: boolean;
  lastSlice: number;
  lastSpeedAt: number;
};

type HopRun = {
  mode: 'hop';
  events: HopEvent[];
  next: number;
  end: number;
  landR: number;
  origin: number;
  paused: number;
  onCue: (c: Cue) => void;
  resolve: () => void;
};

const RELAX_MS = 400; // jarum dibiarkan tenang setelah settle sebelum loop berhenti
const WILL_CHANGE_OFF_MS = 300;

export function Wheel({ ref, initialR, hub, dim, tapEnabled, reduced, layoutKey, ...callbacks }: WheelProps) {
  const [R0] = useState(initialR);
  const descId = useId();

  const frameRef = useRef<HTMLDivElement>(null);
  const rotorRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<HTMLDivElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const shockRef = useRef<HTMLDivElement>(null);
  const glintRef = useRef<HTMLDivElement>(null);
  const vignetteRef = useRef<HTMLDivElement>(null);
  const poolRefs = {
    warm: useRef<HTMLDivElement>(null),
    grey: useRef<HTMLDivElement>(null),
    gold: useRef<HTMLDivElement>(null),
    spot: useRef<HTMLDivElement>(null),
  };

  const cbRef = useRef<Callbacks>(callbacks);
  cbRef.current = callbacks;
  const tapRef = useRef(!!tapEnabled);
  tapRef.current = !!tapEnabled;
  const reducedRef = useRef(!!reduced);
  reducedRef.current = !!reduced;

  // Mesin (tidak memicu render).
  const eng = useRef({
    R: R0,
    ptr: initPointer(R0) as PointerState,
    run: null as MotionRun | HopRun | null,
    raf: 0,
    hiddenAt: null as number | null,
    warmLive: false,
    litEl: null as Element | null,
    willChangeTimer: null as ReturnType<typeof setTimeout> | null,
    fadeTimer: null as ReturnType<typeof setTimeout> | null,
    snap: null as DOMRect | null,
  });

  useImperativeHandle(ref, (): WheelHandle => {
    const e = eng.current;
    const now = () => performance.now();
    const clock = (run: { origin: number; paused: number }) => {
      const hidden = e.hiddenAt !== null ? now() - e.hiddenAt : 0;
      return now() - run.origin - run.paused - hidden;
    };

    const writeRotor = (R: number) => {
      const el = rotorRef.current;
      if (el) el.style.transform = `rotate(${R}deg)`;
    };
    const writePointer = () => {
      const el = pointerRef.current;
      if (el) el.style.transform = `rotate(${-pointerDeg(e.ptr)}deg)`;
    };

    const setWillChange = (on: boolean) => {
      if (e.willChangeTimer) clearTimeout(e.willChangeTimer);
      e.willChangeTimer = null;
      const el = rotorRef.current;
      if (!el) return;
      if (on) el.style.willChange = 'transform';
      else e.willChangeTimer = setTimeout(() => (el.style.willChange = ''), WILL_CHANGE_OFF_MS);
    };

    const stopLoop = () => {
      if (e.raf) cancelAnimationFrame(e.raf);
      e.raf = 0;
    };

    const motionFrame = (run: MotionRun) => {
      const t = clock(run);
      const tl = run.tl;
      const R = angleAt(tl, t);
      const w = speedAt(tl, t);
      advancePointer(e.ptr, (x) => angleAt(tl, x), run.tPrev, t, (dir) => cbRef.current.onSlip?.(dir, w));
      writeRotor(R);
      writePointer();
      e.R = R;
      if (!reducedRef.current && veilRef.current) veilRef.current.style.opacity = veilOpacity(w).toFixed(3);
      if (e.warmLive && poolRefs.warm.current) poolRefs.warm.current.style.opacity = warmPoolOpacity(w).toFixed(3);
      const ts = now();
      if (ts - run.lastSpeedAt >= 33) {
        run.lastSpeedAt = ts;
        cbRef.current.onSpeed?.(w);
      }
      if (Math.abs(w) < PLACARD_SPEED) {
        const s = sliceAt(R);
        if (s !== run.lastSlice) {
          run.lastSlice = s;
          cbRef.current.onSlice?.(s, w);
        }
      }
      const cues = cuesBetween(tl, run.tPrev, t);
      run.tPrev = t;
      for (const c of cues) run.onCue?.(c);
      if (isDone(tl, t) && !run.resolved) {
        run.resolved = true;
        if (veilRef.current) veilRef.current.style.opacity = '0';
        if (e.warmLive && poolRefs.warm.current) poolRefs.warm.current.style.opacity = warmPoolOpacity(0).toFixed(3);
        cbRef.current.onSpeed?.(0);
        setWillChange(false);
        const done = run.resolve;
        run.resolve = null;
        done?.();
      }
      // Setelah settle, jarum dibiarkan meredam sebentar lalu loop berhenti.
      if (run.resolved && t >= tl.end + RELAX_MS) {
        if (e.run === run) e.run = null;
        stopLoop();
        return false;
      }
      return true;
    };

    const hopFrame = (run: HopRun) => {
      const t = clock(run);
      while (run.next < run.events.length && run.events[run.next].t <= t) {
        const ev = run.events[run.next++];
        if (ev.type === 'hop') {
          api.lit(ev.idx, 'hop');
          cbRef.current.onSlip?.(1, 0);
        } else if (ev.type === 'cue') {
          run.onCue(ev.cue);
        } else {
          api.setRest(run.landR, { fade: true });
        }
      }
      if (run.next >= run.events.length) {
        if (e.run === run) e.run = null;
        stopLoop();
        run.resolve();
        return false;
      }
      return true;
    };

    const tick = () => {
      e.raf = 0;
      const run = e.run;
      if (!run) return;
      if (e.hiddenAt !== null) {
        e.raf = requestAnimationFrame(tick);
        return;
      }
      const go = run.mode === 'motion' ? motionFrame(run) : hopFrame(run);
      if (go && e.run === run) e.raf = requestAnimationFrame(tick);
    };

    const startLoop = () => {
      if (!e.raf) e.raf = requestAnimationFrame(tick);
    };

    const api: WheelHandle = {
      launch({ isLast, onCue }) {
        stopLoop();
        const R = e.R;
        e.run = {
          mode: 'motion',
          tl: buildLaunch(R, isLast),
          origin: now(),
          paused: 0,
          tPrev: 0,
          onCue: onCue ?? null,
          resolve: null,
          resolved: false,
          lastSlice: sliceAt(R),
          lastSpeedAt: 0,
        };
        syncPointer(e.ptr, R);
        e.warmLive = true;
        const warm = poolRefs.warm.current;
        if (warm) warm.style.transition = 'none';
        setWillChange(true);
        startLoop();
      },

      land(r, choreo, onCue) {
        if (!e.run || e.run.mode !== 'motion') api.launch({ isLast: false });
        const run = e.run as MotionRun;
        return new Promise<void>((resolve) => {
          run.tl = planLanding(run.tl, clock(run), r, choreo);
          run.onCue = onCue;
          run.resolve = resolve;
          run.resolved = false;
          startLoop();
        });
      },

      hop(r, choreo, onCue) {
        stopLoop();
        return new Promise<void>((resolve) => {
          const sched = hopSchedule(e.R, r, choreo);
          e.run = {
            mode: 'hop',
            events: sched.events,
            next: 0,
            end: sched.end,
            landR: sched.landR,
            origin: now(),
            paused: 0,
            onCue,
            resolve,
          };
          startLoop();
        });
      },

      abort() {
        const run = e.run;
        if (!run || run.mode !== 'motion' || run.resolved) {
          if (run && run.mode === 'hop') {
            e.run = null;
            stopLoop();
          }
          return Promise.resolve();
        }
        return new Promise<void>((resolve) => {
          run.tl = planAbort(run.tl, clock(run));
          run.onCue = null;
          run.resolve = resolve;
          startLoop();
        });
      },

      lit(idx, tone = 'tap') {
        const rotor = rotorRef.current;
        if (!rotor) return;
        e.litEl?.removeAttribute('data-tone');
        e.litEl = null;
        if (idx === null) {
          rotor.removeAttribute('data-lit');
          return;
        }
        const el = rotor.querySelector(`[data-hl="${idx}"]`);
        if (!el) return;
        el.setAttribute('data-tone', tone);
        e.litEl = el;
        rotor.setAttribute('data-lit', `${idx}:${tone}`);
      },

      rest: () => e.R,

      setRest(R, opts) {
        const rotor = rotorRef.current;
        e.R = R;
        syncPointer(e.ptr, R);
        if (e.fadeTimer) clearTimeout(e.fadeTimer);
        if (!rotor) return;
        if (!opts?.fade) {
          writeRotor(R);
          writePointer();
          return;
        }
        rotor.style.transition = 'opacity 120ms ease';
        rotor.style.opacity = '0';
        e.fadeTimer = setTimeout(() => {
          writeRotor(R);
          writePointer();
          rotor.style.opacity = '1';
          e.fadeTimer = setTimeout(() => {
            rotor.style.transition = '';
            rotor.style.opacity = '';
          }, 130);
        }, 120);
      },

      jewel(tone) {
        const f = frameRef.current;
        if (!f) return;
        if (tone) f.setAttribute('data-jewel', tone);
        else f.removeAttribute('data-jewel');
      },

      fx(kind) {
        const el = kind === 'flash' ? flashRef.current : kind === 'shockwave' ? shockRef.current : kind === 'thump' ? wrapRef.current : glintRef.current;
        const cls = kind === 'flash' ? styles.fxFlash : kind === 'shockwave' ? styles.fxShockwave : kind === 'thump' ? styles.fxThump : styles.fxGlint;
        if (!el) return;
        el.classList.remove(cls);
        void (el as HTMLElement).offsetWidth; // restart animasi sekali-jalan
        el.classList.add(cls);
      },

      light(levels, ms = 300) {
        for (const key of Object.keys(levels) as PoolTone[]) {
          const el = poolRefs[key].current;
          const v = levels[key];
          if (!el || v === undefined) continue;
          if (key === 'warm') e.warmLive = false;
          el.style.transition = `opacity ${Math.max(0, ms)}ms ease`;
          el.style.opacity = String(v);
        }
      },

      vignette(opacity, ms = 800) {
        const el = vignetteRef.current;
        if (!el) return;
        el.style.transition = `opacity ${Math.max(0, ms)}ms ease`;
        el.style.opacity = String(opacity);
      },

      tip() {
        const f = frameRef.current;
        if (!f) return null;
        const r = f.getBoundingClientRect();
        if (!r.width) return null;
        return { x: r.left + r.width / 2, y: r.top + r.height * 0.048 };
      },

      busy: () => e.run !== null && !(e.run.mode === 'motion' && e.run.resolved),

      snapshot() {
        e.snap = frameRef.current?.getBoundingClientRect() ?? null;
      },
    };
    return api;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // FLIP ukuran/posisi roda saat panel bawah berganti (spring kira-kira 300/32).
  useLayoutEffect(() => {
    const e = eng.current;
    const before = e.snap;
    e.snap = null;
    const f = frameRef.current;
    if (!before || !f || reducedRef.current || typeof f.animate !== 'function') return;
    const after = f.getBoundingClientRect();
    if (!after.width || !before.width) return;
    const s = before.width / after.width;
    const dx = before.left + before.width / 2 - (after.left + after.width / 2);
    const dy = before.top + before.height / 2 - (after.top + after.height / 2);
    if (Math.abs(s - 1) < 0.005 && Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
    f.animate([{ transform: `translate(${dx}px, ${dy}px) scale(${s})` }, { transform: 'none' }], {
      duration: 460,
      easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
    });
  }, [layoutKey]);

  // Tab disembunyikan: jam timeline berhenti, lanjut dari titik yang sama.
  useEffect(() => {
    const e = eng.current;
    const onVis = () => {
      const t = performance.now();
      if (document.visibilityState === 'hidden') {
        if (e.hiddenAt === null) e.hiddenAt = t;
      } else if (e.hiddenAt !== null) {
        if (e.run) e.run.paused += t - e.hiddenAt;
        e.hiddenAt = null;
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      if (e.raf) cancelAnimationFrame(e.raf);
      e.raf = 0;
      if (e.willChangeTimer) clearTimeout(e.willChangeTimer);
      if (e.fadeTimer) clearTimeout(e.fadeTimer);
    };
  }, []);

  const onPointerUp = (ev: PointerEvent<HTMLDivElement>) => {
    if (!tapRef.current || eng.current.run) return;
    const r = ev.currentTarget.getBoundingClientRect();
    if (!r.width) return;
    const k = 1000 / r.width;
    const idx = sliceFromPoint((ev.clientX - r.left - r.width / 2) * k, (ev.clientY - r.top - r.height / 2) * k, eng.current.R);
    if (idx !== null) cbRef.current.onTap?.(idx);
  };

  return (
    <>
      <div className={styles.lightPool} aria-hidden="true">
        <div ref={poolRefs.warm} className={`${styles.pool} ${styles.poolWarm}`} />
        <div ref={poolRefs.grey} className={`${styles.pool} ${styles.poolGrey}`} />
        <div ref={poolRefs.gold} className={`${styles.pool} ${styles.poolGold}`} />
        <div ref={poolRefs.spot} className={`${styles.pool} ${styles.poolSpot}`} />
      </div>
      <div ref={vignetteRef} className={styles.vignette} aria-hidden="true" />
      <span id={descId} className={styles.srOnly}>
        {STAGE.legendAll}
      </span>
      <div
        ref={frameRef}
        className={styles.wheelFrame}
        role="img"
        aria-label={STAGE.wheelLabel}
        aria-describedby={descId}
        data-dim={dim ? '' : undefined}
        data-tappable={tapEnabled ? '' : undefined}
        onPointerUp={onPointerUp}
      >
        <div className={styles.wheelShadow} />
        <div className={`${styles.wheelRim} ${styles.matChampagne}`} />
        <div ref={glintRef} className={styles.rimGlint} />
        <div ref={wrapRef} className={styles.rotorWrap}>
          <div ref={rotorRef} className={styles.rotor} style={{ transform: `rotate(${R0}deg)` }}>
            <WheelArt />
          </div>
        </div>
        <div ref={veilRef} className={styles.veil} />
        <div className={styles.faceGlare} />
        <div className={styles.hub} aria-hidden="true">
          <Odometer value={hub} className={styles.hubNum} />
          <span className={styles.hubLabel}>{STAGE.hubLabel}</span>
        </div>
        <Pointer rotRef={pointerRef} />
        <div ref={flashRef} className={styles.tipFlash} aria-hidden="true" />
        <div ref={shockRef} className={styles.shockwave} aria-hidden="true" />
      </div>
    </>
  );
}
