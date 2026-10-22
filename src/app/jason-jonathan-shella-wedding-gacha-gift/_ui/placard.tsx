'use client';

import { useEffect, useImperativeHandle, useRef, type Ref } from 'react';
import { SLICES } from '@/lib/gacha/config';
import styles from '../gacha.module.css';
import { COVER } from './copy';
import { typingSchedule } from './format';
import { placardText, sliceTone } from './reactions';

// Placard di atas jarum (DESIGN 4.5). Ditulis imperatif (textContent dan
// atribut data-*) supaya tidak ada render React selama putaran:
//   slice: nama potong saat roda pelan (w < 90), hanya kalau potongnya berganti
//   tease: kalimat tease saat hold (pop in), ekornya ditambah saat creep
//   land:  chip hasil di snap/settle, hilang 600ms setelah dialog hasil terbuka
// Di cover dan layar PIN placard menampilkan overline biasa tanpa kapsul.

export type PlacardMode = 'hidden' | 'slice' | 'tease' | 'land';

export type PlacardHandle = {
  slice(idx: number): void;
  /** Kalimat tease. `typed`: diketik 45ms per huruf (finale), kecuali reduced motion. */
  tease(head: string, tone: 'lebay' | 'zonk', opts?: { typed?: boolean }): void;
  /** Tambah ekor kalimat tease ("eh") dengan satu spasi. */
  tail(text: string): void;
  land(idx: number): void;
  hide(): void;
  mode(): PlacardMode;
};

export function Placard({ ref, cover, reduced }: { ref?: Ref<PlacardHandle>; cover: boolean; reduced?: boolean }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const st = useRef({ mode: 'hidden' as PlacardMode, text: '', head: '', slice: -1, timers: [] as ReturnType<typeof setTimeout>[] });
  const reducedRef = useRef(!!reduced);
  reducedRef.current = !!reduced;

  useImperativeHandle(ref, (): PlacardHandle => {
    const s = st.current;
    const clearTimers = () => {
      for (const t of s.timers) clearTimeout(t);
      s.timers = [];
    };
    const write = (mode: PlacardMode, tone: string, text: string) => {
      const box = boxRef.current;
      const span = textRef.current;
      if (!box || !span) return;
      s.mode = mode;
      s.text = text;
      box.setAttribute('data-mode', mode);
      box.setAttribute('data-tone', tone);
      span.textContent = text;
    };
    return {
      slice(idx) {
        if (s.mode === 'tease' || s.mode === 'land') return;
        if (s.mode === 'slice' && s.slice === idx) return;
        s.slice = idx;
        const tone = sliceTone(idx);
        write('slice', tone === 'pearl' ? 'text' : tone, placardText(idx));
      },
      tease(head, tone, opts) {
        clearTimers();
        // Kepala kalimat penuh disimpan, jadi tail() tetap benar walau ketikan belum selesai.
        s.head = head;
        if (!opts?.typed || reducedRef.current) {
          write('tease', tone, head);
          return;
        }
        write('tease', tone, '');
        for (const step of typingSchedule(head)) {
          s.timers.push(
            setTimeout(() => {
              if (s.mode === 'tease' && textRef.current) textRef.current.textContent = head.slice(0, step.upTo);
            }, step.t),
          );
        }
      },
      tail(text) {
        if (s.mode !== 'tease') return;
        clearTimers();
        const full = `${s.head} ${text}`;
        s.text = full;
        if (textRef.current) textRef.current.textContent = full;
      },
      land(idx) {
        clearTimers();
        const tone = sliceTone(idx);
        write('land', tone === 'pearl' ? 'text' : tone, SLICES[idx]?.label.toUpperCase() ?? '');
      },
      hide() {
        clearTimers();
        s.slice = -1;
        s.mode = 'hidden';
        boxRef.current?.setAttribute('data-mode', 'hidden');
      },
      mode: () => s.mode,
    };
  }, []);

  useEffect(() => {
    const s = st.current;
    return () => {
      for (const t of s.timers) clearTimeout(t);
    };
  }, []);

  return (
    <>
      {cover && <span className={`${styles.placardCover} ${styles.tOverline}`}>{COVER.overline}</span>}
      <div ref={boxRef} className={styles.placard} data-mode="hidden" aria-hidden="true">
        <span ref={textRef} />
      </div>
    </>
  );
}
