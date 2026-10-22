'use client';

import { AnimatePresence, m } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react';
import styles from '../gacha.module.css';
import { ACHIEVEMENT_OVERLINE } from './copy';
import { sfx } from './sfx';

// Toast (DESIGN 4.10): pill kaca di tengah atas, 3,2 detik, yang terbaru
// menggantikan yang lama. Selama `blocked` (dialog terbuka, kilat, hadiah
// terbang) semua toast diantre, lalu dikeluarkan satu per satu 200ms setelah
// blokir lepas. Achievement memainkan bunyi `achievement` saat tampil.
// Wadahnya role="status" yang selalu ter-mount, jadi pembaca layar membacanya
// (achievement tidak dikirim lagi ke pengumum utama).

export type ToastInput = { kind: 'text'; text: string } | { kind: 'achievement'; name: string; desc: string };
type Toast = ToastInput & { id: number };

export type ToastsHandle = {
  push(t: ToastInput): void;
  clear(): void;
};

const SHOW_MS = 3200;
const FLUSH_DELAY_MS = 200;

export function Toasts({ ref, blocked }: { ref?: Ref<ToastsHandle>; blocked: boolean }) {
  const [current, setCurrent] = useState<Toast | null>(null);
  const queue = useRef<Toast[]>([]);
  const seq = useRef(0);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blockedRef = useRef(blocked);
  blockedRef.current = blocked;
  const currentRef = useRef<Toast | null>(null);

  const show = useRef((t: Toast | null) => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = null;
    currentRef.current = t;
    setCurrent(t);
    if (!t) return;
    if (t.kind === 'achievement') sfx.achievement();
    hideTimer.current = setTimeout(() => {
      hideTimer.current = null;
      const next = !blockedRef.current ? queue.current.shift() : undefined;
      show.current(next ?? null);
    }, SHOW_MS);
  });

  useImperativeHandle(ref, () => ({
    push(input) {
      const t = { ...input, id: ++seq.current } as Toast;
      if (blockedRef.current) queue.current.push(t);
      else show.current(t);
    },
    clear() {
      queue.current = [];
      show.current(null);
    },
  }));

  // Blokir lepas: keluarkan antrean 200ms kemudian. Blokir datang: toast yang
  // sedang tampil disembunyikan (tidak pernah menimpa dialog atau kilat).
  useEffect(() => {
    if (flushTimer.current) clearTimeout(flushTimer.current);
    flushTimer.current = null;
    if (blocked) {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = null;
      // Achievement yang terpotong diantre lagi di depan.
      const cur = currentRef.current;
      if (cur?.kind === 'achievement') queue.current.unshift({ ...cur, id: ++seq.current });
      currentRef.current = null;
      setCurrent(null);
      return;
    }
    if (queue.current.length) {
      flushTimer.current = setTimeout(() => {
        flushTimer.current = null;
        if (!blockedRef.current) show.current(queue.current.shift() ?? null);
      }, FLUSH_DELAY_MS);
    }
  }, [blocked]);

  useEffect(
    () => () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      if (flushTimer.current) clearTimeout(flushTimer.current);
    },
    [],
  );

  return (
    <div className={styles.toastHost} role="status" aria-live="polite" aria-atomic="true">
      <AnimatePresence mode="wait">
        {current && (
          <m.div
            key={current.id}
            className={`${styles.toast} ${styles.glassSolid}`}
            data-kind={current.kind}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            {current.kind === 'achievement' ? (
              <>
                <span className={styles.toastTrophy} aria-hidden="true">
                  <Trophy size={20} strokeWidth={1.75} />
                </span>
                <span className={styles.toastText}>
                  <span className={`${styles.tOverline} ${styles.inkGold}`}>{ACHIEVEMENT_OVERLINE}</span>
                  <span className={styles.tHeadline}>{current.name}</span>
                  <span className={`${styles.tFootnote} ${styles.text2}`}>{current.desc}</span>
                </span>
              </>
            ) : (
              <span className={`${styles.tFootnote} ${styles.toastPlain}`}>{current.text}</span>
            )}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
