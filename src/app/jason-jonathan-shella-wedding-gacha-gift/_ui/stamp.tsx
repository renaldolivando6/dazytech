'use client';

import { m } from 'framer-motion';
import { useId } from 'react';
import styles from '../gacha.module.css';
import { PIN, REVEAL } from './copy';

// Stempel karet (DESIGN 4.3, 4.7.3). Dibungkus AnimatePresence oleh pemanggil:
// masuk = dibanting (scale besar ke 1), keluar = diangkat (pudar, scale 1.1).
// MotionConfig reducedMotion="user" membuat semuanya cukup pudar di tempat.

export type PinStampKind = 'wrong' | 'lock' | 'ok';

const PIN_TEXT: Record<PinStampKind, string> = {
  wrong: PIN.stampWrong,
  lock: PIN.stampLock,
  ok: PIN.stampOk,
};

/** TIDAK SAH (koral), LOKET TUTUP (koral, tetap), SAH (emas) di atas slot PIN. */
export function PinStamp({ kind }: { kind: PinStampKind }) {
  return (
    <m.div
      className={styles.pinStamp}
      data-kind={kind}
      aria-hidden="true"
      initial={{ opacity: 0, scale: 1.6, rotate: -6 }}
      animate={{ opacity: 1, scale: 1, rotate: -6, transition: { duration: 0.14, ease: [0.5, 0, 0.75, 0] } }}
      exit={{ opacity: 0, scale: 1.1, rotate: -6, transition: { duration: 0.24, ease: 'easeOut' } }}
    >
      {PIN_TEXT[kind]}
    </m.div>
  );
}

/** Stempel bulat "SAH" dengan teks melingkar "ZONK RESMI" untuk tiket ZONK (dipakai dialog ZONK). */
export function SealStamp({ className = '' }: { className?: string }) {
  const arcId = useId();
  return (
    <m.div
      className={`${styles.sealStamp} ${className}`}
      aria-hidden="true"
      initial={{ opacity: 0, scale: 1.8, rotate: -14 }}
      animate={{ opacity: 0.9, scale: 1, rotate: -8, transition: { duration: 0.18, ease: [0.5, 0, 0.75, 0] } }}
    >
      <svg viewBox="0 0 76 76" width="76" height="76" focusable="false">
        <defs>
          <path id={arcId} d="M 14 38 A 24 24 0 0 1 62 38" />
        </defs>
        <circle cx="38" cy="38" r="35.5" fill="none" stroke="currentColor" strokeWidth="3" />
        <circle cx="38" cy="38" r="30" fill="none" stroke="currentColor" strokeWidth="1" />
        <text fontSize="8.5" fontWeight="800" letterSpacing="1.6" fill="currentColor" style={{ fontFamily: 'var(--g-font-ui), system-ui, sans-serif' }}>
          <textPath href={`#${arcId}`} startOffset="50%" textAnchor="middle">
            {REVEAL.stampArc}
          </textPath>
        </text>
        <text
          x="38"
          y="49"
          textAnchor="middle"
          fontSize="22"
          fontWeight="800"
          fill="currentColor"
          style={{ fontFamily: 'var(--g-font-ui), system-ui, sans-serif' }}
        >
          {REVEAL.stamp}
        </text>
      </svg>
    </m.div>
  );
}
