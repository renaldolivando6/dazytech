'use client';

import { FastForward, Vibrate, VibrateOff, Volume2, VolumeX } from 'lucide-react';
import styles from '../gacha.module.css';
import { COVER, STAGE } from './copy';

// Bar atas (DESIGN 4.4, 4.6). Cover: tombol suara saja. Stage: nama, pill Skip
// saat roda berputar, getar (kalau didukung), suara.
// Urutan keyboard: Skip, getar, suara (lalu CTA dan dok di panel bawah).

export type TopBarProps = {
  variant: 'cover' | 'stage';
  spinning: boolean;
  collapsed: boolean;
  sound: boolean;
  haptics: boolean;
  /** false sebelum mount atau kalau tidak didukung: tombol getar tidak dirender. */
  canVibrate: boolean;
  /** Reduced motion: pill Skip tidak tampil (putaran singkat). */
  reduced: boolean;
  onSkip(): void;
  onToggleSound(): void;
  onToggleHaptics(): void;
};

export function TopBar(p: TopBarProps) {
  const stage = p.variant === 'stage';
  return (
    <header className={styles.topBar} data-collapsed={p.collapsed ? '' : undefined} data-variant={p.variant}>
      {stage && (
        <span className={styles.topBarNames} aria-hidden="true">
          {COVER.names}
        </span>
      )}
      {stage && <span className={`${styles.topBarEdition} ${styles.tOverline} ${styles.onlyDesktop}`}>{COVER.overline}</span>}
      <div className={styles.topBarActions}>
        {stage && p.spinning && !p.reduced && (
          <button type="button" className={`${styles.pill} ${styles.skipPill}`} onClick={p.onSkip}>
            <FastForward size={16} strokeWidth={1.75} aria-hidden="true" />
            {STAGE.skip}
          </button>
        )}
        {stage && p.canVibrate && (
          <button
            type="button"
            className={styles.iconButton}
            aria-label={p.haptics ? STAGE.hapticsOff : STAGE.hapticsOn}
            onClick={p.onToggleHaptics}
          >
            {p.haptics ? (
              <Vibrate size={22} strokeWidth={1.75} aria-hidden="true" />
            ) : (
              <VibrateOff size={22} strokeWidth={1.75} aria-hidden="true" />
            )}
          </button>
        )}
        <button
          type="button"
          className={styles.iconButton}
          aria-label={p.sound ? STAGE.soundOff : STAGE.soundOn}
          onClick={p.onToggleSound}
        >
          {p.sound ? <Volume2 size={22} strokeWidth={1.75} aria-hidden="true" /> : <VolumeX size={22} strokeWidth={1.75} aria-hidden="true" />}
        </button>
      </div>
    </header>
  );
}
