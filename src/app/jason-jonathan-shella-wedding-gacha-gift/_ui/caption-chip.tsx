'use client';

import { useSyncExternalStore } from 'react';
import styles from '../gacha.module.css';
import { CAPTION_HOLD_MS, type CaptionKey, type CaptionTone } from './copy';
import { sfx, type CaptionEvent } from './sfx';

// Caption suara (DESIGN 9.3). Satu store untuk semua chip: chip yang baru
// mount (mis. di dalam dialog yang muncul 350ms setelah bunyi) tetap melihat
// caption yang sedang tampil. Caption sekali-bunyi hilang setelah 1,4 detik,
// caption berkelanjutan bertahan sampai suaranya berhenti. Kalau caption yang
// tampil selesai, chip kembali ke caption berkelanjutan terakhir yang masih aktif.

export type CaptionView = { key: CaptionKey; text: string; tone: CaptionTone; id: number };

let display: CaptionView | null = null;
const active = new Map<CaptionKey, CaptionView>();
const listeners = new Set<() => void>();
let unsubscribeSfx: (() => void) | null = null;
let fadeTimer: ReturnType<typeof setTimeout> | null = null;
let seq = 0;

function emit() {
  for (const fn of listeners) fn();
}

function fallback(): CaptionView | null {
  let last: CaptionView | null = null;
  for (const c of active.values()) if (!last || c.id > last.id) last = c;
  return last;
}

function onEvent(e: CaptionEvent) {
  if (e.phase === 'end') {
    active.delete(e.key);
    if (display?.key === e.key) {
      display = fallback();
      emit();
    }
    return;
  }
  const view: CaptionView = { key: e.key, text: e.text, tone: e.tone, id: ++seq };
  if (fadeTimer) clearTimeout(fadeTimer);
  fadeTimer = null;
  if (e.continuous) active.set(e.key, view);
  else {
    fadeTimer = setTimeout(() => {
      fadeTimer = null;
      if (display?.id === view.id) {
        display = fallback();
        emit();
      }
    }, CAPTION_HOLD_MS);
  }
  display = view;
  emit();
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  if (!unsubscribeSfx) unsubscribeSfx = sfx.onCaption(onEvent);
  return () => {
    listeners.delete(fn);
  };
}

/** Bersihkan semua caption (mis. saat pindah ke Final). */
export function clearCaptions() {
  active.clear();
  if (fadeTimer) clearTimeout(fadeTimer);
  fadeTimer = null;
  display = null;
  emit();
}

export function useCaption(): CaptionView | null {
  return useSyncExternalStore(
    subscribe,
    () => display,
    () => null,
  );
}

/** Chip caption 24px. Tingginya selalu dipesan (CLS 0). aria-hidden: pengumum yang bicara. */
export function CaptionChip({ className = '' }: { className?: string }) {
  const cap = useCaption();
  return (
    <span className={`${styles.captionSlot} ${className}`} aria-hidden="true">
      {cap && (
        <span key={cap.id} className={`${styles.captionChip} ${styles.tCaption}`} data-tone={cap.tone}>
          {cap.text}
        </span>
      )}
    </span>
  );
}
