'use client';

import type { Ref } from 'react';
import styles from '../gacha.module.css';
import { COVER } from './copy';

// Panel cover (DESIGN 4.2). Saat layar PIN terbuka panel ini tetap di layout
// (tidak ada yang loncat) tapi pudar dan inert. Compact: baris *S&K disembunyikan
// (ada di Info) dan petunjuk suara + footer digabung jadi satu baris.

export function CoverPanel({
  open,
  faded,
  ctaRef,
  onStart,
}: {
  /** State sudah `open` (tanpa PIN): tombol "Mulai". */
  open: boolean;
  faded: boolean;
  ctaRef?: Ref<HTMLButtonElement>;
  onStart(): void;
}) {
  return (
    <div className={styles.coverPanel} data-faded={faded ? '' : undefined} inert={faded}>
      <h1 className={`${styles.tNames} ${styles.coverNames} ${styles.fxFadeUp}`} style={{ animationDelay: '300ms' }}>
        {COVER.names}
      </h1>
      <div className={`${styles.coverBody} ${styles.fxFadeUp}`} style={{ animationDelay: '420ms' }}>
        <p className={`${styles.tCaption} ${styles.text2}`}>{COVER.party}</p>
        <p className={`${styles.tBody} ${styles.text2} ${styles.coverLede}`}>{COVER.lede}</p>
        <p className={`${styles.tFootnote} ${styles.text3} ${styles.hideCompact}`}>{COVER.fine}</p>
        <button ref={ctaRef} type="button" className={`${styles.cta} ${styles.coverCta}`} onClick={onStart}>
          {open ? COVER.ctaOpen : COVER.ctaLocked}
        </button>
        <div className={styles.coverFoot}>
          <p className={`${styles.tFootnote} ${styles.text2} ${styles.hideCompact}`}>{COVER.soundHint}</p>
          <p className={`${styles.tFootnote} ${styles.text3} ${styles.hideCompact}`}>{COVER.footer}</p>
          <p className={`${styles.tFootnote} ${styles.text2} ${styles.onlyCompact}`}>{COVER.footerCompact}</p>
        </div>
      </div>
    </div>
  );
}
