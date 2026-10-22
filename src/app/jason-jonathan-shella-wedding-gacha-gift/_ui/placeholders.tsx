'use client';

import { ExternalLink } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { CLOSING_LETTER, STEAM_REDEEM_URL } from '@/lib/gacha/config';
import styles from '../gacha.module.css';
import { CaptionChip } from './caption-chip';
import { FINAL, NOT_READY, POCKET, REVEAL } from './copy';
import { formatRp } from './format';
import { Modal } from './modal';
import { CopyCode, PocketList } from './pocket-list';
import { announceFor, chipsFor, copyAriaFor, dockSlots, overlineFor, revealCta, summarize } from './reactions';
import type { FinalSlotProps, NotReadySlotProps, PocketSlotProps, RevealSlotProps } from './slots';

// PLACEHOLDER tahap 2. Versi minimal yang berfungsi supaya alur 7 putaran bisa
// dites ujung ke ujung. Tahap 3 menggantinya dengan dialog dan layar asli
// (DESIGN 4.7, 4.8, 4.11, 4.12) lewat SLOTS di slots.tsx, lalu menghapus file ini.

const EXIT_MS = 200;

export function PlaceholderReveal({ reveal, replay, announce, onClose }: RevealSlotProps) {
  const titleId = useId();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setReady(true);
      announce(announceFor(reveal));
    }, 700);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const close = () => {
    if (!ready || leaving) return;
    setLeaving(true);
    const rect = cardRef.current?.getBoundingClientRect() ?? null;
    setTimeout(() => onClose({ fromRect: rect }), EXIT_MS);
  };

  const mat = reveal.kind === 'steam_600k' ? styles.matGold : reveal.kind === 'steam_100k' ? styles.matIce : styles.matPaper;
  return (
    <Modal labelledBy={titleId} onCancel={close} initialFocus={titleRef}>
      <div className={styles.scrim} data-leaving={leaving ? '' : undefined} />
      <div className={`${styles.sheet} ${styles.glassSolid}`} data-leaving={leaving ? '' : undefined} data-kind={reveal.kind}>
        <div className={styles.sheetBody}>
          <div className={styles.phOverlineRow}>
            <p className={`${styles.tOverline} ${styles.phOverline}`} data-kind={reveal.kind}>
              {overlineFor(reveal)}
            </p>
            <CaptionChip />
          </div>
          <div className={styles.phChips}>
            {chipsFor(reveal, replay).map((c) => (
              <span
                key={c.id}
                className={`${styles.chip} ${c.tone === 'gold' ? styles.chipGold : c.tone === 'pearl' ? styles.chipPearl : styles.chipGlass}`}
              >
                {c.text}
              </span>
            ))}
          </div>
          <h2 id={titleId} ref={titleRef} tabIndex={-1} className={styles.tTitle1}>
            {reveal.title}
          </h2>
          <p className={`${styles.tBody} ${styles.text2}`}>{reveal.note}</p>
          <div ref={cardRef} className={`${styles.phCard} ${mat}`}>
            <span className={styles.tOverline}>{reveal.kind === 'zonk' ? REVEAL.ticketMeta : REVEAL.cardOverline}</span>
            <span className={styles.phCardAmount}>{reveal.kind === 'zonk' ? reveal.title : formatRp(reveal.valueIdr)}</span>
          </div>
          {reveal.code ? (
            <>
              <p className={`${styles.tOverline} ${styles.text2}`}>{REVEAL.codeLabel}</p>
              <CopyCode code={reveal.code} aria={copyAriaFor(reveal)} announce={announce} />
              <a className={styles.phLink} href={STEAM_REDEEM_URL} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={16} strokeWidth={1.75} aria-hidden="true" />
                {REVEAL.redeem}
              </a>
              <p className={`${styles.tFootnote} ${styles.text3}`}>{REVEAL.redeemHelp}</p>
            </>
          ) : (
            <p className={`${styles.tFootnote} ${styles.text3}`}>{REVEAL.zonkFoot}</p>
          )}
          <button type="button" className={styles.cta} aria-disabled={ready ? undefined : 'true'} onClick={close} data-reveal-cta="">
            {revealCta(reveal)}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function PlaceholderPocket({ slots, totalIdr, announce, onClose }: PocketSlotProps) {
  const titleId = useId();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const filled = slots.filter((s) => s.reveal).length;
  return (
    <Modal labelledBy={titleId} onCancel={onClose} initialFocus={titleRef}>
      <div className={styles.scrim} onClick={onClose} />
      <div className={`${styles.sheet} ${styles.glassSolid}`}>
        <div className={styles.sheetBody}>
          <div className={styles.phHead}>
            <h2 id={titleId} ref={titleRef} tabIndex={-1} className={styles.tTitle2}>
              {POCKET.title}
            </h2>
            <span className={`${styles.tFootnote} ${styles.text2}`}>{POCKET.count(filled)}</span>
          </div>
          <div className={styles.phHead}>
            <span className={`${styles.tFootnote} ${styles.text2}`}>{POCKET.total}</span>
            <span className={`${styles.tHeadline} ${styles.inkGold}`}>{formatRp(totalIdr)}</span>
          </div>
          {filled === 0 && <p className={`${styles.tFootnote} ${styles.text3}`}>{POCKET.empty}</p>}
          <PocketList slots={slots} announce={announce} />
          <button type="button" className={styles.cta} onClick={onClose}>
            {POCKET.close}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function PlaceholderFinal({ revealed, announce }: FinalSlotProps) {
  const sum = summarize(revealed);
  return (
    <main className={styles.phScreen}>
      <p className={`${styles.tOverline} ${styles.inkGold}`}>{FINAL.overline}</p>
      <h1 className={styles.tTitle1}>{FINAL.title}</h1>
      <p className={`${styles.tFootnote} ${styles.text2}`}>{FINAL.lead}</p>
      <p className={`${styles.tFootnote} ${styles.text2}`}>{FINAL.totalLabel}</p>
      <p className={`${styles.tAmountXl} ${styles.inkGold}`}>{formatRp(sum.totalIdr)}</p>
      <p className={`${styles.tOverline} ${styles.inkGold}`}>{FINAL.totalWords(sum.totalIdr)}</p>
      <p className={`${styles.tFootnote} ${styles.text3}`}>{FINAL.totalSub(sum.vouchers.length, sum.bonus.length)}</p>
      <PocketList slots={dockSlots(revealed)} announce={announce} />
      <article className={`${styles.matLetter} ${styles.phLetter}`}>
        <p className={styles.tOverline}>{FINAL.letterHeader}</p>
        {CLOSING_LETTER.map((para) => (
          <p key={para} className={styles.tLetter}>
            {para}
          </p>
        ))}
        <p className={styles.tSignature}>{FINAL.signature}</p>
      </article>
      <p className={`${styles.tFootnote} ${styles.text3}`}>{FINAL.footnote1}</p>
    </main>
  );
}

export function PlaceholderNotReady({ onRetry }: NotReadySlotProps) {
  return (
    <main className={styles.phScreen} data-center="">
      <p className={`${styles.tOverline} ${styles.text2}`}>{NOT_READY.overline}</p>
      <h1 className={styles.tTitle1}>{NOT_READY.title}</h1>
      <p className={`${styles.tBody} ${styles.text2}`}>{NOT_READY.body}</p>
      <p className={`${styles.tFootnote} ${styles.text3}`}>{NOT_READY.compensation}</p>
      <button type="button" className={styles.cta} onClick={onRetry}>
        {NOT_READY.cta}
      </button>
    </main>
  );
}
