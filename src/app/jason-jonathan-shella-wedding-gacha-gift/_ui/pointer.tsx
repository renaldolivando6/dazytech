'use client';

import type { Ref } from 'react';
import styles from '../gacha.module.css';

// Jarum (DESIGN 5.5): daun mutiara yang menggantung dari sekrup poros. Poros
// 34u di atas tepi roda, ujung 48u masuk ke wajah (lewat cincin pasak). Box
// seni 90x130u, poros di (45, 26). Bagian yang berputar (`rotRef`) hanya diberi
// transform oleh rAF; bayangannya ikut berputar. Tiga halo permata (emas, biru,
// koral) statis di poros, disilangkan lewat opacity (atribut data-jewel di frame).

const LEAF = 'M45 108 C31 86 22 60 25 41 C27 28 35 19 45 19 C55 19 63 28 65 41 C68 60 59 86 45 108 Z';

export function Pointer({ rotRef }: { rotRef: Ref<HTMLDivElement> }) {
  return (
    <div className={styles.pointer} aria-hidden="true">
      <span className={`${styles.jewelHalo} ${styles.haloGold}`} />
      <span className={`${styles.jewelHalo} ${styles.haloBlue}`} />
      <span className={`${styles.jewelHalo} ${styles.haloCoral}`} />
      <div ref={rotRef} className={styles.pointerRot}>
        <svg viewBox="0 0 90 130" className={styles.pointerSvg} focusable="false">
          <defs>
            <linearGradient id="gpBody" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#F6EFE7" />
              <stop offset="0.72" stopColor="#D9CFC3" />
              <stop offset="1" stopColor="#B9AB9B" />
            </linearGradient>
            <radialGradient id="gpRuby" cx="0.38" cy="0.35" r="0.65">
              <stop offset="0" stopColor="#FF8A8E" />
              <stop offset="0.5" stopColor="#E5484D" />
              <stop offset="1" stopColor="#8A1F22" />
            </radialGradient>
            <filter id="gpBlur" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" />
            </filter>
          </defs>
          <path d={LEAF} transform="translate(6 10)" fill="rgba(0,0,0,0.45)" filter="url(#gpBlur)" />
          <path d={LEAF} fill="url(#gpBody)" stroke="#B8873A" strokeWidth={2} strokeLinejoin="round" />
          <path d="M45 104 C40 96 37 90 35 84 L55 84 C53 90 50 96 45 104 Z" fill="#9C8C7B" fillOpacity={0.35} />
          <circle cx={45} cy={26} r={13} fill="#C9AE84" stroke="#8C7253" strokeWidth={1.5} />
          <circle cx={45} cy={26} r={8.5} fill="url(#gpRuby)" />
          <circle cx={42} cy={23} r={2.4} fill="#FFFFFF" fillOpacity={0.9} />
        </svg>
      </div>
    </div>
  );
}
