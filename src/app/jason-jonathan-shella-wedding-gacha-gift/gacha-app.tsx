'use client';

import { AnimatePresence, LazyMotion, MotionConfig, domAnimation, m, useReducedMotion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { SLICES, TOTAL_SPINS, type GachaState, type SpinReveal } from '@/lib/gacha/config';
import { revealAction } from './actions';
import styles from './gacha.module.css';
import { clearCaptions } from './_ui/caption-chip';
import { createParticles, type ParticleSystem } from './_ui/confetti';
import { FINE_PRINT, PIN, STAGE } from './_ui/copy';
import { initialRest, type Choreo } from './_ui/engine';
import { prizeShort } from './_ui/format';
import { canVibrate, haptics } from './_ui/haptics';
import type { PlacardHandle } from './_ui/placard';
import { useKeyboardOpen } from './_ui/pin-card';
import { readPrefs, writePrefs } from './_ui/prefs';
import { achievementsFor, dockSlots, idleLine, isLastSpin, summarize } from './_ui/reactions';
import { sfx } from './_ui/sfx';
import { Shell } from './_ui/shell';
import { SLOTS, type RevealSlotProps } from './_ui/slots';
import type { StagePhase } from './_ui/stage-panel';
import { Toasts, type ToastInput, type ToastsHandle } from './_ui/toasts';
import { useSpin, type SpinAction } from './_ui/use-spin';
import type { WheelHandle } from './_ui/wheel';

// Halaman hadiah Jajo & Eng (DESIGN 4.0, 16.1): mesin layar (reducer), host
// dialog, pengumum aria-live, preferensi, dan efek latar <html>. Cover, PIN,
// dan Stage berbagi satu Shell (roda tetap ter-mount); Final dan NotReady
// layar terpisah. Dialog dan layar tahap 3 dirender lewat SLOTS (_ui/slots.tsx).

type OpenState = Extract<GachaState, { status: 'open' }>;
type Screen = 'cover' | 'pin' | 'stage' | 'final' | 'not_ready';
type DialogId = 'reveal' | 'pocket' | 'info';
type BootKind = 'first' | 'short';

type AppState = {
  server: GachaState;
  /** State `open` terakhir (tetap dipakai untuk tampilan saat sesi habis di tengah jalan). */
  open: OpenState | null;
  screen: Screen;
  /** Yang ada di belakang kartu PIN. */
  behind: 'cover' | 'stage';
  pinNotice: string | null;
  dialog: DialogId | null;
  phase: StagePhase;
  current: SpinReveal | null;
  replay: boolean;
  choreo: Choreo | null;
  /** Cue launch sudah lewat: hub sudah turun satu. */
  launched: boolean;
  /** Hadiah sedang terbang ke dok (toast ditahan). */
  flying: boolean;
  /** Hasil yang sudah ditonton tapi belum dikonfirmasi server (revealAction gagal). */
  local: SpinReveal[];
  /** null = kalimat idle. */
  status: string | null;
  hubBoot: number | null;
  boot: { kind: BootKind; id: number } | null;
  finaleDim: boolean;
  popN: number | null;
  finalFrom: 'load' | 'reveal';
};

type Action =
  | SpinAction
  | { type: 'server'; state: GachaState }
  | { type: 'reinit'; state: GachaState }
  | { type: 'screen'; screen: Screen; boot?: BootKind }
  | { type: 'unlocked'; state: GachaState }
  | { type: 'pinClose' }
  | { type: 'dialog'; dialog: 'pocket' | 'info' | null }
  | { type: 'revealClosed' }
  | { type: 'revealLanded'; toFinal: boolean }
  | { type: 'hubBoot'; value: number | null }
  | { type: 'popDone' };

const isOpen = (s: GachaState): s is OpenState => s.status === 'open';
const isDone = (s: OpenState) => s.remaining <= 0 && !s.pending;

function init(server: GachaState): AppState {
  const base: AppState = {
    server,
    open: isOpen(server) ? server : null,
    screen: 'cover',
    behind: 'cover',
    pinNotice: null,
    dialog: null,
    phase: 'idle',
    current: null,
    replay: false,
    choreo: null,
    launched: false,
    flying: false,
    local: [],
    status: null,
    hubBoot: null,
    boot: null,
    finaleDim: false,
    popN: null,
    finalFrom: 'load',
  };
  if (server.status === 'not_ready') return { ...base, screen: 'not_ready' };
  if (server.status === 'locked') return base;
  if (isDone(server)) return { ...base, screen: 'final' };
  if (server.revealed.length === 0 && !server.pending) return base;
  return { ...base, screen: 'stage', boot: { kind: 'short', id: 1 } };
}

const idle = (s: AppState): AppState => ({
  ...s,
  phase: 'idle',
  current: null,
  replay: false,
  choreo: null,
  launched: false,
  flying: false,
  finaleDim: false,
});

function applyServer(s: AppState, state: GachaState): AppState {
  if (state.status === 'not_ready') return { ...idle(s), server: state, screen: 'not_ready', dialog: null };
  if (state.status === 'locked') {
    if (s.screen === 'stage') return { ...s, server: state, screen: 'pin', behind: 'stage', pinNotice: PIN.sessionExpired };
    return { ...s, server: state, screen: s.screen === 'pin' ? 'pin' : 'cover' };
  }
  return { ...s, server: state, open: state };
}

function mergeRevealed(a: readonly SpinReveal[], b: readonly SpinReveal[]): SpinReveal[] {
  const map = new Map<number, SpinReveal>();
  for (const r of [...a, ...b]) map.set(r.spinNo, r);
  return [...map.values()].sort((x, y) => x.spinNo - y.spinNo);
}

function reducer(s: AppState, a: Action): AppState {
  switch (a.type) {
    case 'server':
      return applyServer(s, a.state);
    case 'reinit':
      return init(a.state);
    case 'screen':
      return { ...s, screen: a.screen, boot: a.boot ? { kind: a.boot, id: (s.boot?.id ?? 0) + 1 } : s.boot };
    case 'unlocked': {
      const st = a.state;
      if (st.status === 'not_ready') return applyServer(s, st);
      if (!isOpen(st)) return s;
      const boot: BootKind = s.behind === 'stage' ? 'short' : 'first';
      const n: AppState = { ...s, server: st, open: st, pinNotice: null, behind: 'cover', status: null };
      if (isDone(st)) return { ...n, screen: 'final', finalFrom: 'load' };
      return { ...n, screen: 'stage', boot: { kind: boot, id: (s.boot?.id ?? 0) + 1 } };
    }
    case 'pinClose':
      return { ...s, screen: 'cover', behind: 'cover' };
    case 'spinStart':
      return { ...s, phase: 'spinning', current: null, replay: a.replay, choreo: null, launched: false, status: a.status, popN: null };
    case 'launched':
      return { ...s, launched: true };
    case 'status':
      return { ...s, status: a.text };
    case 'statusIf':
      return s.status === a.from ? { ...s, status: a.text } : s;
    case 'result':
      return { ...s, current: a.reveal, replay: s.replay || a.replay, choreo: a.choreo };
    case 'spinFailed': {
      let n: AppState = { ...idle(s), status: a.status };
      if (a.state) {
        n = applyServer(n, a.state);
        if (isOpen(a.state) && isDone(a.state)) n = { ...n, screen: 'final', finalFrom: 'load' };
      }
      return n;
    }
    case 'finaleDim':
      return { ...s, finaleDim: a.on };
    case 'openReveal':
      return { ...s, dialog: 'reveal', phase: 'revealing' };
    case 'revealClosed':
      return { ...s, dialog: null, flying: true };
    case 'revealLanded': {
      const r = s.current;
      const n: AppState = { ...idle(s), dialog: null, status: null, local: r ? mergeRevealed(s.local, [r]) : s.local, popN: r ? r.spinNo : null };
      return a.toFinal ? { ...n, screen: 'final', finalFrom: 'reveal' } : n;
    }
    case 'dialog':
      return s.phase === 'idle' || a.dialog === null ? { ...s, dialog: a.dialog } : s;
    case 'hubBoot':
      return { ...s, hubBoot: a.value };
    case 'popDone':
      return { ...s, popN: null };
  }
}

// ---------------------------------------------------------------- terbang ke dok (DESIGN 4.7.5)

function flightTarget(root: ParentNode, n: number): HTMLElement | null {
  const els = root.querySelectorAll<HTMLElement>(`[data-dock-slot="${n}"], [data-pocket-row="${n}"]`);
  for (const el of els) {
    if (el.offsetParent === null) continue;
    if (el.hasAttribute('data-pocket-row')) el.scrollIntoView({ block: 'nearest' });
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return el;
  }
  return null;
}

function flyChip(host: HTMLElement, from: DOMRect, to: HTMLElement, r: SpinReveal): Promise<void> {
  const tr = to.getBoundingClientRect();
  const chip = document.createElement('div');
  const mat = r.kind === 'steam_600k' ? styles.matGold : r.kind === 'steam_100k' ? styles.matIce : styles.matZonk;
  chip.className = `${styles.flyChip} ${mat}`;
  chip.setAttribute('aria-hidden', 'true');
  chip.setAttribute('data-kind', r.kind);
  chip.textContent = prizeShort(r.kind);
  Object.assign(chip.style, { left: `${tr.left}px`, top: `${tr.top}px`, width: `${tr.width}px`, height: `${tr.height}px` });
  host.appendChild(chip);
  const dx = from.left + from.width / 2 - (tr.left + tr.width / 2);
  const dy = from.top + from.height / 2 - (tr.top + tr.height / 2);
  const sx = Math.max(0.5, from.width / tr.width);
  const sy = Math.max(0.5, from.height / tr.height);
  const anim = chip.animate(
    [
      { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`, opacity: 0.6 },
      { transform: 'none', opacity: 1 },
    ],
    { duration: 380, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
  );
  return anim.finished.then(
    () => chip.remove(),
    () => chip.remove(),
  );
}

const REVEAL_RETRY_MS = [500, 1500, 4000];
const TAP_MS = 3500;
const IDLE_LIGHT = { warm: 0.55, grey: 0, gold: 0, spot: 0 };

// ---------------------------------------------------------------- komponen

export function GachaApp({ initialState }: { initialState: GachaState }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <GachaInner initialState={initialState} />
      </MotionConfig>
    </LazyMotion>
  );
}

function GachaInner({ initialState }: { initialState: GachaState }) {
  const router = useRouter();
  const reduced = !!useReducedMotion();
  const [state, dispatch] = useReducer(reducer, initialState, init);
  const [sound, setSound] = useState(true);
  const [hapticsOn, setHapticsOn] = useState(true);
  const [vibrate, setVibrate] = useState(false);
  // Rotasi awal dirender server: tengah potong land terakhir, kalau belum ada: Lamborghini.
  const [initialR] = useState(() => initialRest(isOpen(initialState) ? initialState.revealed : []));

  const appRef = useRef<HTMLDivElement>(null);
  const wheelRef = useRef<WheelHandle>(null);
  const placardRef = useRef<PlacardHandle>(null);
  const pinInputRef = useRef<HTMLInputElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);
  const coverCtaRef = useRef<HTMLButtonElement>(null);
  const dockRef = useRef<HTMLButtonElement>(null);
  const dockMiniRef = useRef<HTMLButtonElement>(null);
  const infoRef = useRef<HTMLButtonElement>(null);
  const toastsRef = useRef<ToastsHandle>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sparksRef = useRef<ParticleSystem | null>(null);
  const politeRef = useRef<HTMLDivElement>(null);
  const assertiveRef = useRef<HTMLDivElement>(null);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipCount = useRef(0);
  const prevDialog = useRef<DialogId | null>(null);
  const deferredServer = useRef<GachaState | null>(null);

  const later = useCallback((fn: () => void, ms: number) => {
    const t = setTimeout(() => {
      timers.current.delete(t);
      fn();
    }, ms);
    timers.current.add(t);
  }, []);

  // ------------------------------------------------------------ turunan

  const derived = useMemo(() => {
    const openS = isOpen(state.server) ? state.server : state.open;
    const total = openS?.total ?? TOTAL_SPINS;
    // Selama putaran/dialog, hasil yang sedang tampil belum masuk dok (baru masuk saat mendarat).
    const held = state.phase !== 'idle' ? state.current : null;
    const revealed = mergeRevealed(openS?.revealed ?? [], state.local).filter((r) => !(held && r.spinNo === held.spinNo));
    const remaining = Math.max(0, total - revealed.length);
    const next = { spinNo: (openS?.revealed.length ?? 0) + 1 };
    const pending = !!openS?.pending && state.phase === 'idle' && !revealed.some((r) => r.spinNo === next.spinNo);
    const hub = state.hubBoot ?? (openS ? Math.max(0, remaining - (state.launched ? 1 : 0)) : TOTAL_SPINS);
    const slots = dockSlots(revealed, { pending, inFlight: state.phase !== 'idle', total });
    const totalIdr = summarize(revealed).totalIdr;
    const status = state.status ?? idleLine(revealed, remaining);
    return { openS, revealed, remaining, pending, hub, slots, totalIdr, status };
  }, [state]);

  const live = useRef({ state, derived, reduced });
  live.current = { state, derived, reduced };

  // ------------------------------------------------------------ pengumum

  const speak = useCallback((el: HTMLDivElement | null, msg: string) => {
    if (!el || !msg) return;
    el.textContent = '';
    setTimeout(() => {
      el.textContent = msg;
    }, 60);
  }, []);
  const announce = useCallback((msg: string) => speak(politeRef.current, msg), [speak]);
  const alertMsg = useCallback((msg: string) => speak(assertiveRef.current, msg), [speak]);
  const toast = useCallback((t: ToastInput) => toastsRef.current?.push(t), []);

  // ------------------------------------------------------------ putaran

  const spinner = useSpin({
    wheel: wheelRef,
    placard: placardRef,
    sparks: sparksRef,
    reduced,
    snapshot: () => ({
      phase: live.current.state.phase,
      remaining: live.current.derived.remaining,
      pending: live.current.derived.pending,
    }),
    dispatch: (a) => dispatch(a),
    announce,
  });

  // ------------------------------------------------------------ efek global

  // Latar <html> gelap tanpa menyentuh globals.css; tanpa pull-to-refresh di tengah putaran.
  useEffect(() => {
    const html = document.documentElement.style;
    const prev = { bg: html.backgroundColor, over: html.overscrollBehavior, scroll: html.scrollBehavior };
    html.backgroundColor = '#0F0C0B';
    html.overscrollBehavior = 'none';
    html.scrollBehavior = 'auto';
    return () => {
      html.backgroundColor = prev.bg;
      html.overscrollBehavior = prev.over;
      html.scrollBehavior = prev.scroll;
    };
  }, []);

  // Preferensi dan dukungan getar dibaca setelah mount (HTML server = client).
  useEffect(() => {
    const p = readPrefs();
    setSound(p.sound);
    setHapticsOn(p.haptics);
    sfx.setMuted(!p.sound);
    haptics.setEnabled(p.haptics);
    // Toggle getar hanya di perangkat sentuh (Chrome desktop punya vibrate tapi tidak bergetar).
    let coarse = false;
    try {
      coarse = window.matchMedia('(pointer: coarse)').matches;
    } catch {
      coarse = false;
    }
    setVibrate(canVibrate() && coarse);
  }, []);

  // Tab disembunyikan: audio ikut dijeda (jam roda dijeda di wheel.tsx).
  useEffect(() => {
    const onVis = () => (document.visibilityState === 'hidden' ? sfx.suspend() : sfx.resume());
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    sparksRef.current = createParticles(c);
    return () => {
      sparksRef.current?.destroy();
      sparksRef.current = null;
    };
  }, []);

  useEffect(() => {
    const set = timers.current;
    return () => {
      for (const t of set) clearTimeout(t);
      set.clear();
      if (tapTimer.current) clearTimeout(tapTimer.current);
    };
  }, []);

  // Atribut di .root (div dari page.tsx): chrome padat saat berputar, redup saat finale.
  useEffect(() => {
    const root = appRef.current?.parentElement;
    if (!root) return;
    root.toggleAttribute('data-spinning', state.phase === 'spinning');
    root.toggleAttribute('data-finale-dim', state.finaleDim);
  }, [state.phase, state.finaleDim]);

  // Halaman di-refresh (router.refresh dari NotReady): mulai ulang dari state baru.
  const firstProps = useRef(initialState);
  useEffect(() => {
    if (firstProps.current === initialState) return;
    firstProps.current = initialState;
    dispatch({ type: 'reinit', state: initialState });
  }, [initialState]);

  // Cahaya cover saat cat pertama: kolam hangat 0 ke .3 (900ms).
  useEffect(() => {
    if (state.screen === 'cover' || (state.screen === 'pin' && state.behind === 'cover')) {
      const id = requestAnimationFrame(() => wheelRef.current?.light({ warm: 0.3 }, 900));
      return () => cancelAnimationFrame(id);
    }
  }, [state.screen, state.behind]);

  // Boot stage (DESIGN 4.13).
  useEffect(() => {
    const boot = state.boot;
    if (!boot) return;
    const w = wheelRef.current;
    const target = live.current.derived.remaining;
    if (boot.kind === 'short') {
      requestAnimationFrame(() => wheelRef.current?.light(IDLE_LIGHT, 500));
      return;
    }
    requestAnimationFrame(() => wheelRef.current?.light(IDLE_LIGHT, 600));
    if (!live.current.reduced) w?.fx('glint');
    const step = 70;
    for (let i = 0; i <= target; i++) {
      later(() => {
        dispatch({ type: 'hubBoot', value: i });
        sfx.boot(i);
      }, 800 + i * step);
    }
    later(() => dispatch({ type: 'hubBoot', value: null }), 800 + (target + 1) * step);
  }, [state.boot?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Dialog hasil ter-mount: revealAction (retry 0,5 / 1,5 / 4 detik); placard pudar 600ms kemudian.
  useEffect(() => {
    const was = prevDialog.current;
    prevDialog.current = state.dialog;
    const r = state.current;
    if (state.dialog !== 'reveal' || was === 'reveal' || !r) return;
    later(() => placardRef.current?.hide(), 600);
    void (async () => {
      for (let attempt = 0; attempt <= REVEAL_RETRY_MS.length; attempt++) {
        if (attempt > 0) await new Promise((res) => setTimeout(res, REVEAL_RETRY_MS[attempt - 1]));
        try {
          const res = await revealAction(r.spinNo);
          if (res.ok) {
            dispatch({ type: 'server', state: res.state });
            return;
          }
          if (res.state) {
            if (isOpen(res.state)) dispatch({ type: 'server', state: res.state });
            else deferredServer.current = res.state;
          }
          return;
        } catch {
          // jaringan: coba lagi
        }
      }
      // Gagal terus: hasil lokal tetap dipakai; muat berikutnya menampilkan putaran tertunda.
    })();
  }, [state.dialog]); // eslint-disable-line react-hooks/exhaustive-deps

  // Final: hentikan semua suara panggung dan caption.
  useEffect(() => {
    if (state.screen === 'final' || state.screen === 'not_ready') {
      spinner.stopVoices();
      clearCaptions();
    }
  }, [state.screen]); // eslint-disable-line react-hooks/exhaustive-deps

  const kbOpen = useKeyboardOpen(state.screen === 'pin');

  // ------------------------------------------------------------ handler

  const onCoverStart = () => {
    sfx.unlock();
    sfx.press();
    if (state.server.status === 'locked') {
      // Fokus sinkron di dalam handler: ini yang membuka keyboard iOS.
      pinInputRef.current?.focus({ preventScroll: true });
      dispatch({ type: 'screen', screen: 'pin' });
      return;
    }
    wheelRef.current?.snapshot();
    dispatch({ type: 'screen', screen: 'stage', boot: 'first' });
    later(() => ctaRef.current?.focus({ preventScroll: true }), 50);
  };

  const onPinClose = () => {
    pinInputRef.current?.blur();
    dispatch({ type: 'pinClose' });
    later(() => coverCtaRef.current?.focus({ preventScroll: true }), 50);
  };

  const onUnlocked = (st: GachaState) => {
    if (isOpen(st) && st.revealed.length > 0 && live.current.state.behind === 'cover') {
      wheelRef.current?.setRest(initialRest(st.revealed), { fade: true });
    }
    wheelRef.current?.snapshot();
    dispatch({ type: 'unlocked', state: st });
    later(() => ctaRef.current?.focus({ preventScroll: true }), 300);
  };

  const onTap = (idx: number) => {
    const { state: s } = live.current;
    if (s.phase !== 'idle' || s.screen !== 'stage' || s.dialog) return;
    const text = FINE_PRINT[SLICES[idx].id];
    wheelRef.current?.lit(idx, 'tap');
    dispatch({ type: 'status', text });
    if (tapTimer.current) clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => {
      tapTimer.current = null;
      if (live.current.state.phase !== 'idle') return;
      wheelRef.current?.lit(null);
      dispatch({ type: 'statusIf', from: text, text: null });
    }, TAP_MS);
  };

  const onSpin = () => {
    if (tapTimer.current) clearTimeout(tapTimer.current);
    tapTimer.current = null;
    void spinner.spin();
  };

  const onSkip = () => {
    sfx.nope(true);
    haptics.play('tap');
    const line = STAGE.skipToasts[skipCount.current % STAGE.skipToasts.length];
    skipCount.current += 1;
    toast({ kind: 'text', text: line });
  };

  const onToggleSound = () => {
    sfx.unlock();
    const next = !sound;
    sfx.setMuted(!next);
    setSound(next);
    writePrefs({ sound: next });
  };

  const onToggleHaptics = () => {
    const next = !hapticsOn;
    haptics.setEnabled(next);
    setHapticsOn(next);
    writePrefs({ haptics: next });
    if (next) haptics.play('tap');
  };

  const focusVisible = (...els: (HTMLElement | null)[]) => {
    for (const el of els) {
      if (el && el.offsetParent !== null) {
        el.focus({ preventScroll: true });
        return;
      }
    }
  };

  const closeDialog = (back: 'dock' | 'info') => {
    dispatch({ type: 'dialog', dialog: null });
    requestAnimationFrame(() => (back === 'dock' ? focusVisible(dockRef.current, dockMiniRef.current, ctaRef.current) : focusVisible(infoRef.current, ctaRef.current)));
  };

  const resetStageLight = () => {
    const w = wheelRef.current;
    w?.lit(null);
    w?.jewel(null);
    w?.light(IDLE_LIGHT, 300);
    w?.vignette(0, 300);
  };

  const applyDeferred = () => {
    const st = deferredServer.current;
    deferredServer.current = null;
    if (st) dispatch({ type: 'server', state: st });
  };

  const onRevealClose: RevealSlotProps['onClose'] = ({ fromRect }) => {
    const { state: s, derived: dv, reduced: red } = live.current;
    const r = s.current;
    if (!r || s.dialog !== 'reveal') return;
    const earlier = dv.revealed;
    const pushAchievements = () => {
      for (const a of achievementsFor(r, earlier)) toast({ kind: 'achievement', name: a.name, desc: a.desc });
    };

    if (isLastSpin(r)) {
      dispatch({ type: 'revealLanded', toFinal: true });
      resetStageLight();
      spinner.release();
      later(pushAchievements, 600);
      return;
    }

    dispatch({ type: 'revealClosed' });
    const host = appRef.current?.parentElement ?? document.body;
    const target = flightTarget(host, r.spinNo);
    const flight = !red && fromRect && target ? flyChip(host, fromRect, target, r) : Promise.resolve();
    void flight.then(() => {
      dispatch({ type: 'revealLanded', toFinal: false });
      sfx.pop();
      resetStageLight();
      spinner.release();
      applyDeferred();
      ctaRef.current?.focus({ preventScroll: true });
      later(pushAchievements, 200);
      later(() => dispatch({ type: 'popDone' }), 450);
    });
  };

  // ------------------------------------------------------------ render

  const shellScreen = state.screen === 'cover' || state.screen === 'pin' || state.screen === 'stage' ? state.screen : null;
  const screenKey = shellScreen ? 'shell' : state.screen;
  const revealProps: RevealSlotProps | null =
    state.dialog === 'reveal' && state.current
      ? {
          reveal: state.current,
          replay: state.replay,
          choreo: state.choreo ?? 'normal',
          reduced,
          announce,
          onClose: onRevealClose,
        }
      : null;

  return (
    <div ref={appRef} className={styles.app}>
      <AnimatePresence mode="wait" initial={false}>
        {shellScreen ? (
          <m.div
            key="shell"
            className={styles.screen}
            exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.36, ease: 'easeIn' } }}
          >
            <Shell
              screen={shellScreen}
              behind={state.behind}
              kbOpen={kbOpen}
              reduced={reduced}
              topBar={{
                spinning: state.phase === 'spinning',
                sound,
                haptics: hapticsOn,
                canVibrate: vibrate,
                infoRef,
                onInfo: () => state.phase === 'idle' && dispatch({ type: 'dialog', dialog: 'info' }),
                onSkip,
                onToggleSound,
                onToggleHaptics,
              }}
              wheel={{
                ref: wheelRef,
                initialR,
                hub: derived.hub,
                tapEnabled: state.screen === 'stage' && state.phase === 'idle' && !state.dialog,
                onSlip: spinner.onSlip,
                onSlice: spinner.onSlice,
                onSpeed: spinner.onSpeed,
                onTap,
              }}
              placardRef={placardRef}
              cover={{ open: state.server.status === 'open', ctaRef: coverCtaRef, onStart: onCoverStart }}
              pin={
                state.server.status === 'locked'
                  ? {
                      inputRef: pinInputRef,
                      notice: state.pinNotice,
                      onClose: onPinClose,
                      onUnlocked,
                      onNotReady: () => dispatch({ type: 'server', state: { status: 'not_ready' } }),
                      alert: alertMsg,
                    }
                  : null
              }
              stage={
                derived.openS
                  ? {
                      phase: state.phase,
                      status: derived.status,
                      pending: derived.pending,
                      remaining: derived.remaining,
                      hub: derived.hub,
                      slots: derived.slots,
                      totalIdr: derived.totalIdr,
                      popN: state.popN,
                      boot: state.boot?.kind ?? null,
                      ctaRef,
                      dockRef,
                      dockMiniRef,
                      onSpin,
                      onOpenPocket: () => dispatch({ type: 'dialog', dialog: 'pocket' }),
                      announce,
                    }
                  : null
              }
            />
          </m.div>
        ) : (
          <m.div
            key={screenKey}
            className={styles.screen}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.24 } }}
            exit={{ opacity: 0, transition: { duration: 0.24 } }}
          >
            {state.screen === 'final' ? (
              <SLOTS.Final
                revealed={derived.revealed}
                from={state.finalFrom}
                reduced={reduced}
                sound={sound}
                onToggleSound={onToggleSound}
                announce={announce}
                toast={toast}
              />
            ) : (
              <SLOTS.NotReady onRetry={() => router.refresh()} />
            )}
          </m.div>
        )}
      </AnimatePresence>

      {revealProps &&
        (revealProps.reveal.kind === 'steam_600k' ? (
          <SLOTS.Takeover key={`t${revealProps.reveal.spinNo}`} {...revealProps} />
        ) : (
          <SLOTS.RevealSheet key={`r${revealProps.reveal.spinNo}`} {...revealProps} />
        ))}
      {state.dialog === 'pocket' && (
        <SLOTS.Pocket slots={derived.slots} totalIdr={derived.totalIdr} announce={announce} onClose={() => closeDialog('dock')} />
      )}
      {state.dialog === 'info' && <SLOTS.Info onClose={() => closeDialog('info')} />}

      <canvas ref={canvasRef} className={styles.fxCanvas} aria-hidden="true" />
      {/* Toast tidak pernah menimpa dialog, kartu PIN, atau hadiah yang sedang terbang. */}
      <Toasts ref={toastsRef} blocked={state.dialog !== null || state.flying || state.screen === 'pin'} />
      <div ref={politeRef} className={styles.srOnly} role="status" aria-live="polite" aria-atomic="true" />
      <div ref={assertiveRef} className={styles.srOnly} aria-live="assertive" aria-atomic="true" />
    </div>
  );
}
