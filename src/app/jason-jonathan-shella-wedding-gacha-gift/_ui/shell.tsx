'use client';

import { AnimatePresence } from 'framer-motion';
import type { Ref } from 'react';
import styles from '../gacha.module.css';
import { STAGE } from './copy';
import { CoverPanel } from './cover-panel';
import { PinCard, type PinCardProps } from './pin-card';
import { Placard, type PlacardHandle } from './placard';
import { Legend, StagePanel, type StagePanelProps } from './stage-panel';
import { TopBar, type TopBarProps } from './top-bar';
import { Wheel, type WheelProps } from './wheel';

// Shell bersama Cover, PIN, dan Stage (DESIGN 4.0, 4.1): roda tidak pernah
// unmount di antara ketiganya, jadi perpindahannya cuma ganti isi di sekitar
// roda yang diam. Layar PIN menumpuk kartu di atas cover (atau stage kalau
// sesi habis di tengah jalan); panel di belakangnya pudar dan inert.

export type ShellProps = {
  screen: 'cover' | 'pin' | 'stage';
  /** Yang ada di belakang kartu PIN. */
  behind: 'cover' | 'stage';
  kbOpen: boolean;
  reduced: boolean;
  topBar: Omit<TopBarProps, 'variant' | 'collapsed' | 'reduced'>;
  wheel: WheelProps;
  placardRef: Ref<PlacardHandle>;
  cover: { open: boolean; ctaRef?: Ref<HTMLButtonElement>; onStart(): void };
  /** null = tidak ter-mount (status bukan locked). */
  pin: Omit<PinCardProps, 'visible' | 'reduced'> | null;
  stage: StagePanelProps | null;
};

export function Shell(p: ShellProps) {
  const lower = p.screen === 'pin' ? p.behind : p.screen;
  const showStage = lower === 'stage' && p.stage;
  return (
    <div className={styles.shell} data-screen={p.screen} data-kb={p.kbOpen ? '' : undefined}>
      <TopBar {...p.topBar} variant={lower === 'stage' ? 'stage' : 'cover'} collapsed={p.kbOpen && p.screen === 'pin'} reduced={p.reduced} />

      {/* Satu h1 per layar: cover memakai nama pasangan (CoverPanel), stage judul tersembunyi. */}
      {lower === 'stage' && <h1 className={styles.srOnly}>{STAGE.srTitle}</h1>}
      <div className={styles.wheelCell}>
        <div className={styles.placardSlot}>
          <Placard ref={p.placardRef} cover={lower === 'cover'} reduced={p.reduced} />
        </div>
        <Wheel {...p.wheel} dim={p.screen === 'pin'} reduced={p.reduced} layoutKey={lower} />
        {showStage && (
          <div className={`${styles.legendBelow} ${styles.onlyDesktop}`}>
            <Legend />
          </div>
        )}
      </div>

      <div className={styles.lowerPanel} data-lower={lower}>
        {lower === 'cover' && <CoverPanel open={p.cover.open} faded={p.screen === 'pin'} ctaRef={p.cover.ctaRef} onStart={p.cover.onStart} />}
        {showStage && p.stage && (
          <div className={styles.sidePanel} data-faded={p.screen === 'pin' ? '' : undefined} inert={p.screen === 'pin'}>
            <StagePanel {...p.stage} />
          </div>
        )}
        <AnimatePresence>{p.pin && <PinCard key="pin" {...p.pin} visible={p.screen === 'pin'} reduced={p.reduced} />}</AnimatePresence>
      </div>
    </div>
  );
}
