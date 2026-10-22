'use client';

import { useCallback, useEffect, useRef, type RefObject } from 'react';
import { TOTAL_SPINS, sliceIndex, type GachaState, type SpinResult, type SpinReveal } from '@/lib/gacha/config';
import { spinAction } from '../actions';
import { STAGE } from './copy';
import { PARAMS, SLOW_NETWORK_MS, SPIN_TIMEOUT_MS, choreoFor, type Choreo, type Cue } from './engine';
import { splitTease } from './format';
import { haptics } from './haptics';
import type { PlacardHandle } from './placard';
import { creepLine, landLine, landTone } from './reactions';
import { sfx, type CreakVoice, type HeartbeatVoice, type HopeVoice, type PadVoice, type TromboneVoice, type WhirVoice } from './sfx';
import { REVEAL_OPEN_DELAY_MS } from './slots';
import type { JewelTone, WheelHandle } from './wheel';
import type { ParticleSystem } from './confetti';

// Orkestrasi satu putaran (DESIGN 7, 16.5). Tekan -> spinAction ditembak di
// handler yang sama (juga gesture audio) -> roda wind-up dan cruise -> jawaban
// dilipat ke timeline -> cue menggerakkan status, placard, cahaya, suara, getar
// -> settle -> efek t=0 hasil -> dialog hasil dibuka. busyRef dilepas host
// setelah dialog hasil ditutup (DESIGN 4.7.5).

export type SpinAction =
  | { type: 'spinStart'; replay: boolean; status: string }
  | { type: 'launched' }
  | { type: 'status'; text: string | null }
  | { type: 'statusIf'; from: string; text: string | null }
  | { type: 'result'; reveal: SpinReveal; replay: boolean; choreo: Choreo }
  | { type: 'spinFailed'; state?: GachaState; status: string | null }
  | { type: 'finaleDim'; on: boolean }
  | { type: 'openReveal' };

export type SpinSnapshot = {
  phase: 'idle' | 'spinning' | 'revealing';
  /** Sisa putaran versi UI (termasuk putaran tertunda). */
  remaining: number;
  pending: boolean;
};

type Voices = {
  whir?: WhirVoice;
  hope?: HopeVoice;
  trombone?: TromboneVoice;
  pad?: PadVoice;
  heartbeat?: HeartbeatVoice;
  creak?: CreakVoice;
};

const REPLAY_STATUS_MS = 1200;

const jewelFor = (kind: SpinReveal['kind']): JewelTone => (kind === 'steam_600k' ? 'gold' : kind === 'steam_100k' ? 'blue' : 'coral');

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

export function useSpin(deps: {
  wheel: RefObject<WheelHandle | null>;
  placard: RefObject<PlacardHandle | null>;
  sparks: RefObject<ParticleSystem | null>;
  reduced: boolean;
  snapshot(): SpinSnapshot;
  dispatch(a: SpinAction): void;
  announce(msg: string): void;
}) {
  const d = useRef(deps);
  d.current = deps;
  const busyRef = useRef(false);
  const voices = useRef<Voices>({});
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());

  const later = useCallback((fn: () => void, ms: number) => {
    const t = setTimeout(() => {
      timers.current.delete(t);
      fn();
    }, ms);
    timers.current.add(t);
  }, []);

  /** Hentikan semua suara berkelanjutan putaran ini (caption ikut ditutup). */
  const stopVoices = useCallback(() => {
    const v = voices.current;
    v.whir?.stop();
    v.hope?.stop();
    v.pad?.stop();
    v.heartbeat?.stop();
    v.creak?.stop();
    voices.current = { trombone: v.trombone };
    sfx.caption('ticks', 'end');
  }, []);

  useEffect(() => {
    const set = timers.current;
    return () => {
      for (const t of set) clearTimeout(t);
      set.clear();
      const v = voices.current;
      v.whir?.stop();
      v.hope?.stop();
      v.pad?.stop();
      v.heartbeat?.stop();
      v.creak?.stop();
      v.trombone?.stop();
    };
  }, []);

  // ------------------------------------------------------------ callback roda

  const onSlip = useCallback((_dir: 1 | -1, w: number) => {
    sfx.tick(w);
    haptics.tick(w);
  }, []);
  const onSlice = useCallback((idx: number) => d.current.placard.current?.slice(idx), []);
  const onSpeed = useCallback((w: number) => voices.current.whir?.set(w), []);

  // ------------------------------------------------------------ putar

  const spin = useCallback(async () => {
    const { snapshot, dispatch, reduced } = d.current;
    const snap = snapshot();
    if (busyRef.current || snap.phase !== 'idle') return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      dispatch({ type: 'status', text: STAGE.offline });
      return;
    }
    busyRef.current = true;
    sfx.unlock();
    const req = spinAction(); // ditembak sebelum await apa pun
    sfx.press();
    haptics.play('tap');

    const isLast = snap.remaining === 1;
    let r: SpinReveal | null = null;
    let choreo: Choreo = 'normal';
    let answered = false;
    const wheel = d.current.wheel.current;
    const placard = d.current.placard.current;

    const onCue = (c: Cue) => {
      const w = d.current.wheel.current;
      const pl = d.current.placard.current;
      const red = d.current.reduced;
      const v = voices.current;
      switch (c) {
        case 'launch':
          sfx.whoosh();
          if (!red) v.whir = sfx.whir();
          haptics.play('launch');
          dispatch({ type: 'launched' });
          return;
        case 'slow':
          if (!r) return; // berhenti netral (abort): tanpa narasi
          dispatch({ type: 'status', text: STAGE.slow });
          sfx.caption('ticks');
          return;
        case 'nearEnd':
          dispatch({ type: 'finaleDim', on: true });
          w?.vignette(0.5, 800);
          w?.light({ warm: 0, spot: 1 }, 800);
          v.heartbeat = sfx.heartbeat(72);
          return;
        case 'hold': {
          if (!r) return;
          sfx.caption('ticks', 'end');
          v.whir?.stop();
          v.whir = undefined;
          dispatch({ type: 'status', text: '' });
          d.current.announce(r.teaseLine ?? '');
          haptics.play('land');
          const T = r.teaseSliceId ? sliceIndex(r.teaseSliceId) : -1;
          const [head] = splitTease(r.teaseLine ?? '');
          if (choreo === 'rescue') {
            pl?.tease(head, 'zonk');
            w?.lit(T, 'tease-zonk');
            w?.light({ warm: 0, grey: 1 }, 300);
            sfx.land(true);
            v.trombone = sfx.wahwah(150);
          } else if (choreo === 'finale') {
            w?.lit(T, 'tease-lebay');
            pl?.tease(head, 'lebay', { typed: true });
            v.pad = sfx.pad(PARAMS.finale.holdMs);
            v.heartbeat?.setBpm(96, 1000);
          } else {
            pl?.tease(head, 'lebay');
            w?.lit(T, 'tease-lebay');
            sfx.land();
            sfx.sparkle();
            v.hope = sfx.hope();
          }
          return;
        }
        case 'creep': {
          if (!r) return;
          const [, tail] = splitTease(r.teaseLine ?? '');
          if (tail) pl?.tail(tail);
          dispatch({ type: 'status', text: creepLine(r, choreo) });
          const rampMs = 650 + PARAMS[choreo].struggleMs;
          if (choreo === 'heartbreak') {
            v.hope?.droop();
            v.creak = sfx.creak({ peak: 0.1, rampMs });
          } else if (choreo === 'rescue') {
            v.trombone?.tapeStop();
            sfx.scratch();
            v.creak = sfx.creak({ peak: 0.1, rampMs });
          } else if (choreo === 'finale') {
            sfx.scratch();
            v.pad?.cut();
            v.heartbeat?.stop(10);
            // Black beat: lampu padam. Reduced motion: dilewati (vignette .5 tetap).
            if (!red) {
              w?.light({ spot: 0 }, 80);
              w?.vignette(0.75, 80);
            }
            v.creak = sfx.creak({ peak: 0.06, rampMs });
          }
          return;
        }
        case 'struggle': {
          // Derit melemah di dua backslip (segmen struggle 2 dan 4).
          const s = PARAMS[choreo].struggleMs / 700;
          later(() => voices.current.creak?.dip(), 150 * s);
          later(() => voices.current.creak?.dip(), (150 + 110 + 170) * s);
          return;
        }
        case 'snap': {
          if (!r) return;
          v.creak?.stop();
          v.creak = undefined;
          const L = sliceIndex(r.landSliceId);
          w?.lit(L, landTone(r.kind));
          w?.jewel(jewelFor(r.kind));
          pl?.land(L);
          dispatch({ type: 'status', text: landLine(r) });
          if (choreo === 'rescue') {
            sfx.upgrade();
            haptics.play('win600');
            if (!red) w?.fx('shockwave');
            w?.light({ grey: 0, gold: 1 }, 300);
          } else if (choreo === 'finale') {
            if (!red) {
              w?.fx('flash');
              w?.fx('thump');
            }
            w?.light({ spot: 0, gold: 1 }, 300);
            w?.vignette(0.35, 300);
            sfx.impact();
            haptics.play('finale');
          } else {
            sfx.snap();
            haptics.play('snap');
          }
          return;
        }
        case 'settle': {
          sfx.caption('ticks', 'end');
          v.whir?.stop();
          v.whir = undefined;
          if (!r || choreo !== 'normal') return;
          const L = sliceIndex(r.landSliceId);
          w?.lit(L, landTone(r.kind));
          w?.jewel(jewelFor(r.kind));
          pl?.land(L);
          if (r.kind === 'steam_600k') w?.light({ gold: 1 }, 300);
          dispatch({ type: 'status', text: landLine(r) });
          haptics.play('land');
          return;
        }
      }
    };

    // Tekan (DESIGN 7.1).
    wheel?.lit(null);
    wheel?.jewel(null);
    placard?.hide();
    sfx.windup();
    const replayAtPress = snap.pending;
    dispatch({ type: 'spinStart', replay: replayAtPress, status: replayAtPress ? STAGE.replayPrefix : STAGE.launch });
    d.current.announce(STAGE.announceSpin);
    if (replayAtPress) later(() => dispatch({ type: 'statusIf', from: STAGE.replayPrefix, text: STAGE.launch }), REPLAY_STATUS_MS);
    if (reduced) onCue('launch');
    else wheel?.launch({ isLast, onCue });
    later(() => {
      if (!answered) dispatch({ type: 'statusIf', from: STAGE.launch, text: STAGE.waiting });
    }, SLOW_NETWORK_MS);

    let res: SpinResult | null = null;
    try {
      res = await withTimeout(req, SPIN_TIMEOUT_MS);
    } catch {
      res = null;
    }
    answered = true;

    if (!res || !res.ok) {
      await d.current.wheel.current?.abort();
      stopVoices();
      busyRef.current = false;
      const state = res && !res.ok ? res.state : undefined;
      dispatch({ type: 'spinFailed', state, status: state ? null : STAGE.spinError });
      return;
    }

    const result = res.result;
    r = result;
    choreo = choreoFor(result, result.spinNo === TOTAL_SPINS);
    dispatch({ type: 'result', reveal: result, replay: res.replay, choreo });
    if (res.replay && !replayAtPress) {
      dispatch({ type: 'status', text: STAGE.replayPrefix });
      later(() => dispatch({ type: 'statusIf', from: STAGE.replayPrefix, text: STAGE.launch }), REPLAY_STATUS_MS);
    }

    const w = d.current.wheel.current;
    if (!w) return;
    await (d.current.reduced ? w.hop(result, choreo, onCue) : w.land(result, choreo, onCue));

    // Efek t=0 hasil (DESIGN 8), lalu dialog dibuka setelah jedanya.
    if (result.kind === 'steam_100k') {
      sfx.chime100();
      haptics.play('win100');
      const tip = w.tip();
      if (tip && !d.current.reduced) d.current.sparks.current?.sparks(tip.x, tip.y, 24);
    } else if (result.kind === 'steam_600k') {
      if (choreo === 'normal') {
        sfx.impact();
        haptics.play('win600');
      }
    } else {
      voices.current.trombone = sfx.wahwah();
      haptics.play('zonk');
    }
    later(() => dispatch({ type: 'openReveal' }), REVEAL_OPEN_DELAY_MS[result.kind]);
  }, [later, stopVoices]);

  /** Dipanggil host setelah hadiah mendarat di dok (atau ke Final). */
  const release = useCallback(() => {
    busyRef.current = false;
  }, []);

  return { spin, release, busyRef, stopVoices, onSlip, onSlice, onSpeed };
}
