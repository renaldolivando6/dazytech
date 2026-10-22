'use client';

import { useEffect, useLayoutEffect, useRef, type ReactNode, type RefObject, type SyntheticEvent } from 'react';
import styles from '../gacha.module.css';

// <dialog> selayar transparan + showModal() (DESIGN 4.7): focus trap dan
// halaman di belakangnya inert dari browser. Scrim, panel, dan canvas partikel
// dirender sendiri oleh isi dialog. Esc (event `cancel`) selalu dicegah dan
// diteruskan ke onCancel; dialog tidak pernah tertutup sendiri dan Esc tidak
// pernah memulai putaran.

export function Modal({
  labelledBy,
  onCancel,
  initialFocus,
  className = '',
  children,
}: {
  labelledBy: string;
  onCancel?: () => void;
  /** Elemen yang difokus saat buka (biasanya judul dengan tabIndex -1). */
  initialFocus?: RefObject<HTMLElement | null>;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef(onCancel);
  cancelRef.current = onCancel;

  useLayoutEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (!d.open) {
      try {
        d.showModal();
      } catch {
        d.setAttribute('open', '');
      }
    }
    initialFocus?.current?.focus({ preventScroll: true });
    return () => {
      if (d.open) d.close();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Tutup paksa (mis. dialog form method=dialog): buka lagi, penutupan hanya lewat pemilik.
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const onClose = () => {
      if (d.isConnected && !d.open) {
        try {
          d.showModal();
        } catch {
          // abaikan
        }
      }
    };
    d.addEventListener('close', onClose);
    return () => d.removeEventListener('close', onClose);
  }, []);

  const onCancelEvent = (e: SyntheticEvent<HTMLDialogElement>) => {
    e.preventDefault();
    cancelRef.current?.();
  };

  return (
    <dialog ref={ref} className={`${styles.modal} ${className}`} aria-labelledby={labelledBy} onCancel={onCancelEvent}>
      {children}
    </dialog>
  );
}
