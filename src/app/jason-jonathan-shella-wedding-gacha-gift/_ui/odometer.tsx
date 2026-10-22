'use client';

import { useEffect, useRef, useState } from 'react';
import styles from '../gacha.module.css';

// Angka yang bergulir seperti odometer (300ms) saat nilainya berubah: hub roda,
// total kantong, "sisa putaran" di desktop. Nilai lama keluar ke atas (naik)
// atau ke bawah (turun). Reduced motion: CSS mematikan animasinya, angka langsung ganti.

type Roll = { from: string; dir: 'up' | 'down'; id: number };

const ROLL_MS = 300;

export function Odometer({ value, className = '' }: { value: string | number; className?: string }) {
  const text = String(value);
  const prevRef = useRef(text);
  const [roll, setRoll] = useState<Roll | null>(null);
  const idRef = useRef(0);

  useEffect(() => {
    const prev = prevRef.current;
    if (prev === text) return;
    prevRef.current = text;
    const a = Number(prev.replace(/\D/g, ''));
    const b = Number(text.replace(/\D/g, ''));
    const dir = Number.isFinite(a) && Number.isFinite(b) && b < a ? 'down' : 'up';
    const id = ++idRef.current;
    setRoll({ from: prev, dir, id });
    const t = setTimeout(() => setRoll((r) => (r && r.id === id ? null : r)), ROLL_MS);
    return () => clearTimeout(t);
  }, [text]);

  return (
    <span className={`${styles.odometer} ${className}`} data-dir={roll?.dir}>
      {roll && (
        <span key={`o${roll.id}`} className={styles.odoOut} aria-hidden="true">
          {roll.from}
        </span>
      )}
      <span key={`i${roll?.id ?? 0}`} className={roll ? styles.odoIn : styles.odoNow}>
        {text}
      </span>
    </span>
  );
}
