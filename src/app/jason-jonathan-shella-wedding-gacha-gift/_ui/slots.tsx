import type { ComponentType } from 'react';
import type { SpinReveal } from '@/lib/gacha/config';
import type { Choreo } from './engine';
import { PlaceholderFinal, PlaceholderNotReady, PlaceholderPocket, PlaceholderReveal } from './placeholders';
import type { DockSlot } from './reactions';
import type { ToastInput } from './toasts';

// Slot dialog dan layar untuk tahap 3. gacha-app.tsx hanya merender komponen
// lewat SLOTS di bawah, dengan props yang sudah tetap di sini. Tahap 3 cukup
// membuat komponen aslinya (reveal-dialog.tsx, takeover-dialog.tsx,
// pocket-dialog.tsx, final-screen.tsx, not-ready.tsx), lalu
// mengganti isi SLOTS dan menghapus placeholders.tsx.

/**
 * Dialog hasil. Host sudah memainkan efek t=0 (DESIGN 8: chime100 + percikan,
 * impact untuk 600K biasa, trombon untuk ZONK, getar) lalu me-mount dialog
 * setelah REVEAL_OPEN_DELAY_MS[kind]; waktu internal dialog dihitung dari mount.
 * revealAction(spinNo) dipanggil host (dengan retry) begitu dialog ter-mount.
 */
export type RevealSlotProps = {
  reveal: SpinReveal;
  /** Dari spinAction (atau putaran tertunda): chip REPLAY. */
  replay: boolean;
  choreo: Choreo;
  reduced: boolean;
  /** Pengumum polite (hasil saat CTA aktif, "Kode kesalin."). */
  announce(msg: string): void;
  /**
   * Tombol utama (atau Esc setelah tombol aktif). Panggil SETELAH animasi keluar
   * dialog (200ms). fromRect = kartu/tiket, asal animasi hadiah terbang ke dok.
   * Putaran terakhir: host langsung ke Final tanpa terbang.
   */
  onClose(info: { fromRect: DOMRect | null }): void;
};

export type PocketSlotProps = {
  slots: DockSlot[];
  totalIdr: number;
  announce(msg: string): void;
  onClose(): void;
};

export type FinalSlotProps = {
  /** Semua hasil yang sudah dibuka (urut putaran). */
  revealed: SpinReveal[];
  /** 'reveal' = baru datang dari dialog terakhir; 'load' = halaman dibuka langsung di Final. */
  from: 'reveal' | 'load';
  reduced: boolean;
  sound: boolean;
  onToggleSound(): void;
  announce(msg: string): void;
  toast(t: ToastInput): void;
};

export type NotReadySlotProps = {
  /** "Cek lagi": router.refresh(). */
  onRetry(): void;
};

/** Jeda dari akhir settle sampai dialog hasil di-mount (DESIGN 7.2, 7.5, 7.6, 8). */
export const REVEAL_OPEN_DELAY_MS = { steam_100k: 350, steam_600k: 250, zonk: 400 } as const;

export const SLOTS: {
  /** 100K dan ZONK: bottom sheet. */
  RevealSheet: ComponentType<RevealSlotProps>;
  /** 600K: takeover selayar. */
  Takeover: ComponentType<RevealSlotProps>;
  Pocket: ComponentType<PocketSlotProps>;
  Final: ComponentType<FinalSlotProps>;
  NotReady: ComponentType<NotReadySlotProps>;
} = {
  RevealSheet: PlaceholderReveal,
  Takeover: PlaceholderReveal,
  Pocket: PlaceholderPocket,
  Final: PlaceholderFinal,
  NotReady: PlaceholderNotReady,
};
