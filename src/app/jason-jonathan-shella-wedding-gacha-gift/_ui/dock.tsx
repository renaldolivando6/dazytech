'use client';

import { RotateCw } from 'lucide-react';
import { useId, type Ref } from 'react';
import styles from '../gacha.module.css';
import { STAGE } from './copy';
import { formatRp, prizeShort } from './format';
import { Odometer } from './odometer';
import { dockSlotLabel, type DockSlot } from './reactions';

// Dok "Kantong hadiah" (DESIGN 4.4). Satu tombol yang membuka sheet Kantong.
// Varian penuh (HP tinggi): label + total + 7 slot berlabel. Varian mini
// (compact): 7 slot warna material saja, di samping CTA. Keduanya dirender dan
// ditukar lewat CSS. Setiap slot punya data-dock-slot={n} sebagai target
// animasi hadiah terbang dari dialog hasil.

export type DockProps = {
  slots: DockSlot[];
  totalIdr: number;
  /** Sisa putaran 1 dan diam: slot terakhir berdenyut emas + chip HARD PITY?. */
  pity: boolean;
  /** Nomor slot yang baru terisi (animasi pop). */
  popN: number | null;
  disabled: boolean;
  btnRef?: Ref<HTMLButtonElement>;
  onOpen(): void;
};

function SlotFace({ slot }: { slot: DockSlot }) {
  if (slot.status === 'pending') return <RotateCw size={14} strokeWidth={1.75} aria-hidden="true" />;
  if (slot.status === 'empty' || slot.status === 'flight') return <span aria-hidden="true">?</span>;
  return <span aria-hidden="true">{prizeShort(slot.status)}</span>;
}

function materialClass(slot: DockSlot): string {
  if (slot.status === 'steam_600k') return styles.matGold;
  if (slot.status === 'steam_100k') return styles.matIce;
  if (slot.status === 'zonk') return styles.matZonk;
  return '';
}

export function Dock({ slots, totalIdr, pity, popN, disabled, btnRef, onOpen, variant }: DockProps & { variant: 'full' | 'mini' }) {
  const descId = useId();
  const filled = slots.filter((s) => s.reveal).length;
  const last = slots.length;
  const desc = (
    <span id={descId} className={styles.srOnly}>
      {slots.map((s) => dockSlotLabel(s)).join('. ')}
    </span>
  );

  if (variant === 'mini') {
    return (
      <button
        ref={btnRef}
        type="button"
        className={styles.dockMini}
        aria-label={STAGE.dockAria(filled)}
        aria-describedby={descId}
        aria-disabled={disabled ? 'true' : undefined}
        inert={disabled}
        onClick={disabled ? undefined : onOpen}
        data-dock="mini"
      >
        {slots.map((s) => (
          <span
            key={s.n}
            className={`${styles.miniSlot} ${materialClass(s)} ${s.status === 'flight' || s.status === 'pending' || (pity && s.n === last) ? styles.fxBreathe : ''} ${s.n === popN ? styles.slotPop : ''}`}
            data-status={s.status}
            data-pity={pity && s.n === last ? '' : undefined}
            data-dock-slot={s.n}
          />
        ))}
        {desc}
      </button>
    );
  }

  return (
    <button
      ref={btnRef}
      type="button"
      className={`${styles.dock} ${styles.dockFull}`}
      aria-label={STAGE.dockAria(filled)}
      aria-describedby={descId}
      aria-disabled={disabled ? 'true' : undefined}
      inert={disabled}
      onClick={disabled ? undefined : onOpen}
      data-dock="full"
    >
      <span className={styles.dockHead} aria-hidden="true">
        <span className={`${styles.tFootnote} ${styles.text2}`}>{STAGE.dockTitle}</span>
        {pity && <span className={`${styles.chip} ${styles.chipGoldOutline} ${styles.dockPity}`}>{STAGE.hardPity}</span>}
        <Odometer value={formatRp(totalIdr)} className={`${styles.tFootnote} ${styles.dockTotal}`} />
      </span>
      <span className={styles.dockSlots} aria-hidden="true">
        {slots.map((s) => (
          <span
            key={s.n}
            className={`${styles.dockSlot} ${materialClass(s)} ${s.n === popN ? styles.slotPop : ''}`}
            data-status={s.status}
            data-pity={pity && s.n === last ? '' : undefined}
            data-dock-slot={s.n}
          >
            {(s.status === 'flight' || s.status === 'pending' || (pity && s.n === last)) && (
              <span className={`${styles.slotRing} ${styles.fxBreathe}`} />
            )}
            <SlotFace slot={s} />
          </span>
        ))}
      </span>
      {desc}
    </button>
  );
}
