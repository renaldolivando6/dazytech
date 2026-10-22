import { HAPTIC_TICK_MAX_SPEED } from './engine';

// Getar (DESIGN 10). Hanya navigator.vibrate (Android); iOS tidak didukung dan
// tidak diakali. Toggle terpisah dari suara, default nyala, disimpan di prefs.

export const HAPTICS = {
  tap: 8,
  tick: 5,
  launch: 20,
  land: 14,
  snap: 28,
  win100: [18, 60, 24],
  win600: [30, 40, 30, 40, 60, 80, 120],
  finale: [40, 60, 40, 60, 40, 120, 200],
  zonk: [80, 120, 40],
  stamp: 35,
  pinOk: [12, 40, 18],
  pinWrong: [50, 50, 50],
  refuse: [20, 30, 20, 30, 20],
  copy: 10,
} as const satisfies Record<string, number | readonly number[]>;

export type HapticName = keyof typeof HAPTICS;

const MIN_GAP_MS = 40; // satu panggilan per 40ms
const TICK_GAP_MS = 45;

/** Cek dukungan getar. Panggil hanya setelah mount (bukan saat render server). */
export function canVibrate(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator && typeof navigator.vibrate === 'function';
}

export class HapticsEngine {
  private enabled = true;
  private last = -Infinity;
  private deferred: ReturnType<typeof setTimeout> | null = null;

  setEnabled(on: boolean): void {
    this.enabled = on;
    if (!on) this.cancel();
  }

  get isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Mainkan pola. Panggilan baru membatalkan pola sebelumnya (perilaku
   * vibrate). Kalau datang < 40ms setelah panggilan terakhir, ditunda ke batas
   * 40ms (yang terakhir menang), jadi land/snap tidak hilang ditelan tick.
   */
  play(name: HapticName): void {
    if (!this.enabled || !canVibrate()) return;
    const now = performance.now();
    const wait = this.last + MIN_GAP_MS - now;
    if (this.deferred) clearTimeout(this.deferred);
    this.deferred = null;
    if (wait > 0) {
      this.deferred = setTimeout(() => {
        this.deferred = null;
        this.fire(name);
      }, wait);
      return;
    }
    this.fire(name);
  }

  /** Tik pasak: hanya saat w <= 360 derajat/detik, minimal 45ms antar tik, dibuang kalau padat. */
  tick(w: number): void {
    if (!this.enabled || Math.abs(w) > HAPTIC_TICK_MAX_SPEED || !canVibrate()) return;
    const now = performance.now();
    if (this.deferred || now - this.last < TICK_GAP_MS) return;
    this.fire('tick');
  }

  cancel(): void {
    if (this.deferred) clearTimeout(this.deferred);
    this.deferred = null;
    try {
      if (canVibrate()) navigator.vibrate(0);
    } catch {
      // abaikan
    }
  }

  private fire(name: HapticName) {
    this.last = performance.now();
    try {
      const p = HAPTICS[name];
      navigator.vibrate(typeof p === 'number' ? p : [...p]);
    } catch {
      // WebView tertentu melempar error kalau tidak ada gesture; abaikan.
    }
  }
}

/** Satu mesin getar per tab. */
export const haptics = new HapticsEngine();
