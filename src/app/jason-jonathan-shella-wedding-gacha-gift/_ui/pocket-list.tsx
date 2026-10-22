'use client';

import { Check, Copy, RotateCw, Ticket } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import styles from '../gacha.module.css';
import { copyText } from './clipboard';
import { POCKET, REVEAL } from './copy';
import { codeGroups, formatRp, spellCode } from './format';
import { haptics } from './haptics';
import { copyAriaFor, type DockSlot } from './reactions';
import { sfx } from './sfx';

// Daftar isi kantong (DESIGN 4.4 panel kanan desktop, 4.8 sheet Kantong).
// Baris urut putaran: voucher (tepi enamel 6px, nominal, kode + Salin), ZONK
// (tiket, judul, catatan), tertunda, belum diputar. Setiap baris punya
// data-pocket-row={n}: target hadiah terbang di desktop.

const COPIED_MS = 1600;

/** Tombol Salin kecil untuk satu kode (rantai clipboard di clipboard.ts). */
export function CopyCode({ code, aria, announce }: { code: string; aria: string; announce(msg: string): void }) {
  const [state, setState] = useState<'idle' | 'ok' | 'manual'>('idle');
  const codeRef = useRef<HTMLSpanElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  const copy = async () => {
    const res = await copyText(code, codeRef.current);
    if (timer.current) clearTimeout(timer.current);
    if (res === 'ok') {
      setState('ok');
      sfx.copy();
      haptics.play('copy');
      announce(REVEAL.copiedLive);
      timer.current = setTimeout(() => setState('idle'), COPIED_MS);
    } else {
      setState('manual');
      announce(REVEAL.copyFail);
    }
  };

  return (
    <span className={styles.rowCode}>
      <span ref={codeRef} className={styles.rowCodeText} aria-hidden="true" data-flash={state === 'ok' ? '' : undefined}>
        {codeGroups(code).join('-')}
      </span>
      <span className={styles.srOnly}>{spellCode(code)}</span>
      <button type="button" className={`${styles.pill} ${styles.copyPill}`} aria-label={aria} onClick={() => void copy()}>
        {state === 'ok' ? <Check size={16} strokeWidth={2} aria-hidden="true" /> : <Copy size={16} strokeWidth={1.75} aria-hidden="true" />}
        <span aria-hidden="true">{state === 'ok' ? REVEAL.copied : REVEAL.copy}</span>
      </button>
      {state === 'manual' && <span className={`${styles.tFootnote} ${styles.text2} ${styles.rowHint}`}>{REVEAL.copyFail}</span>}
    </span>
  );
}

export function PocketList({ slots, announce }: { slots: DockSlot[]; announce(msg: string): void }) {
  return (
    <ol className={styles.pocketList}>
      {slots.map((s) => {
        const r = s.reveal;
        if (r && r.kind !== 'zonk') {
          return (
            <li key={s.n} className={styles.pocketRow} data-pocket-row={s.n} data-kind={r.kind}>
              <span className={`${styles.rowEdge} ${r.kind === 'steam_600k' ? styles.matGold : styles.matIce}`} aria-hidden="true" />
              <span className={styles.rowMain}>
                <span className={styles.rowTop}>
                  <span className={`${styles.tHeadline} ${r.kind === 'steam_600k' ? styles.inkGold : styles.inkBlue}`}>{formatRp(r.valueIdr)}</span>
                  <span className={`${styles.tFootnote} ${styles.text3}`}>{POCKET.rowMeta(s.n)}</span>
                </span>
                {r.code && <CopyCode code={r.code} aria={copyAriaFor(r)} announce={announce} />}
              </span>
            </li>
          );
        }
        if (r) {
          return (
            <li key={s.n} className={styles.pocketRow} data-pocket-row={s.n} data-kind="zonk">
              <span className={styles.rowIcon} aria-hidden="true">
                <Ticket size={18} strokeWidth={1.75} />
              </span>
              <span className={styles.rowMain}>
                <span className={styles.rowTop}>
                  <span className={styles.tHeadline}>{r.title}</span>
                  <span className={`${styles.tFootnote} ${styles.text3}`}>{POCKET.rowMeta(s.n)}</span>
                </span>
                <span className={`${styles.tFootnote} ${styles.text3}`}>
                  {r.note} {POCKET.rowZonkMeta}
                </span>
              </span>
            </li>
          );
        }
        const pending = s.status === 'pending';
        return (
          <li key={s.n} className={styles.pocketRow} data-pocket-row={s.n} data-kind={pending ? 'pending' : 'empty'}>
            <span className={styles.rowIcon} aria-hidden="true">
              {pending ? <RotateCw size={16} strokeWidth={1.75} /> : '?'}
            </span>
            <span className={`${styles.tFootnote} ${pending ? styles.text2 : styles.text3}`}>
              {pending ? POCKET.rowPending(s.n) : POCKET.rowUnrevealed(s.n)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
