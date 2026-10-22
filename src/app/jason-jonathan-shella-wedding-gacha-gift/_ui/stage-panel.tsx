'use client';

import { RotateCw } from 'lucide-react';
import { useState, type Ref } from 'react';
import styles from '../gacha.module.css';
import { CaptionChip } from './caption-chip';
import { STAGE } from './copy';
import { Dock } from './dock';
import { formatRp } from './format';
import { Odometer } from './odometer';
import { PocketList } from './pocket-list';
import type { DockSlot } from './reactions';

// Panel bawah stage (DESIGN 4.4, 4.6, 4.9). Satu DOM untuk HP dan desktop;
// urutan visual diatur CSS (`order`) supaya urutan keyboard tetap: CTA lalu dok.
//   HP tinggi : legend/caption, status, dok penuh, CTA
//   compact   : legend/caption, status, [dok mini | CTA]
//   desktop   : SISA PUTARAN, status, caption, kartu pending, CTA, daftar kantong
// Kartu pending menggantikan legend + status selama ada putaran yang tertunda.

export type StagePhase = 'idle' | 'spinning' | 'revealing';

export type StagePanelProps = {
  phase: StagePhase;
  status: string;
  pending: boolean;
  remaining: number;
  /** Angka hub (sisa, sudah dikurangi satu sejak cue launch). */
  hub: number;
  slots: DockSlot[];
  totalIdr: number;
  popN: number | null;
  boot: 'first' | 'short' | null;
  ctaRef?: Ref<HTMLButtonElement>;
  dockRef?: Ref<HTMLButtonElement>;
  dockMiniRef?: Ref<HTMLButtonElement>;
  onSpin(): void;
  onOpenPocket(): void;
  announce(msg: string): void;
};

export function Legend() {
  return (
    <span className={`${styles.legend} ${styles.tLegend} ${styles.text2}`}>
      <span className={styles.legendItem}>
        <span className={`${styles.swatch} ${styles.swatchReal}`} aria-hidden="true" />
        {STAGE.legend.real}
      </span>
      <span className={styles.legendItem}>
        <span className={`${styles.swatch} ${styles.swatchPearl}`} aria-hidden="true" />
        {STAGE.legend.lebay}
      </span>
      <span className={styles.legendItem}>
        <span className={`${styles.swatch} ${styles.swatchZonk}`} aria-hidden="true" />
        {STAGE.legend.zonk}
      </span>
    </span>
  );
}

export function StagePanel(p: StagePanelProps) {
  // Animasi masuk hanya dibaca saat mount (boot pertama: stagger, kembali: fade).
  const [boot] = useState(p.boot);
  const idle = p.phase === 'idle';
  const pity = idle && !p.pending && p.remaining === 1;
  const label = !idle ? STAGE.ctaBusy : p.pending ? STAGE.ctaPending : p.remaining === 1 ? STAGE.ctaLast : STAGE.cta;
  const enter = (i: number) =>
    boot === 'first'
      ? { className: styles.bootIn, style: { animationDelay: `${600 + i * 30}ms` } }
      : boot === 'short'
        ? { className: styles.fxFade, style: { animationDelay: '150ms' } }
        : { className: '', style: undefined };
  const e = [0, 1, 2, 3, 4, 5].map(enter);

  return (
    <div className={styles.stagePanel} data-phase={p.phase}>
      <div className={`${styles.remainingBlock} ${styles.onlyDesktop}`}>
        <p className={`${styles.tOverline} ${styles.text2}`}>{STAGE.remainingTitle}</p>
        <p className={styles.tTitle1}>
          <Odometer value={STAGE.remainingOf(p.hub)} />
        </p>
      </div>

      {p.pending && idle ? (
        <div className={`${styles.pendingCard} ${styles.glass} ${styles.squircle} ${e[0].className}`} style={e[0].style}>
          <RotateCw size={18} strokeWidth={1.75} aria-hidden="true" className={styles.pendingIcon} />
          <div>
            <p className={styles.tHeadline}>{STAGE.pendingTitle}</p>
            <p className={`${styles.tFootnote} ${styles.text2}`}>{STAGE.pendingBody}</p>
          </div>
        </div>
      ) : (
        <>
          <div className={`${styles.legendRow} ${e[0].className}`} style={e[0].style} data-show={idle ? 'legend' : 'caption'}>
            <span className={`${styles.legendLayer} ${styles.hideDesktop}`} inert={!idle}>
              <Legend />
            </span>
            <CaptionChip className={styles.captionLayer} />
          </div>
          <p className={`${styles.statusLine} ${styles.tCallout} ${e[1].className}`} style={e[1].style} aria-hidden="true">
            {p.status}
          </p>
        </>
      )}

      <div className={`${styles.ctaRow} ${e[3].className}`} style={e[3].style}>
        <button
          ref={p.ctaRef}
          type="button"
          className={`${styles.cta} ${styles.stageCta}`}
          aria-disabled={idle ? undefined : 'true'}
          onClick={idle ? p.onSpin : undefined}
          data-boot={boot ?? undefined}
        >
          {label}
        </button>
        <Dock
          variant="mini"
          btnRef={p.dockMiniRef}
          slots={p.slots}
          totalIdr={p.totalIdr}
          pity={pity}
          popN={p.popN}
          disabled={!idle}
          onOpen={p.onOpenPocket}
        />
      </div>

      <div className={`${styles.dockCell} ${e[2].className}`} style={e[2].style}>
        <Dock
          variant="full"
          btnRef={p.dockRef}
          slots={p.slots}
          totalIdr={p.totalIdr}
          pity={pity}
          popN={p.popN}
          disabled={!idle}
          onOpen={p.onOpenPocket}
        />
      </div>

      <section className={`${styles.pocketSection} ${styles.onlyDesktop} ${e[4].className}`} style={e[4].style} aria-label={STAGE.dockTitle}>
        <div className={styles.pocketHead}>
          <h2 className={`${styles.tOverline} ${styles.text2}`}>{STAGE.dockTitle}</h2>
          {pity && <span className={`${styles.chip} ${styles.chipGoldOutline}`}>{STAGE.hardPity}</span>}
          <Odometer value={formatRp(p.totalIdr)} className={`${styles.tHeadline} ${styles.inkGold}`} />
        </div>
        <div className={styles.pocketScroll}>
          <PocketList slots={p.slots} announce={p.announce} />
        </div>
      </section>
    </div>
  );
}
