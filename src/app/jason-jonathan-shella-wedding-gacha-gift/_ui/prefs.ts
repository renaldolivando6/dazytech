// Preferensi per perangkat (DESIGN 16.1): suara, getar, dan berapa kali
// "Putar lagi" sudah ditolak. localStorage bisa tidak ada (mode privat,
// WebView, pratinjau), jadi semua akses di dalam try/catch dan halaman tetap
// jalan dengan nilai default. Baca hanya setelah mount (server tidak punya).

export const PREFS_KEY = 'gacha-jajo-eng:prefs';

export type Prefs = {
  sound: boolean;
  haptics: boolean;
  /** Jumlah ketukan "Putar lagi" di Final (0..6). */
  refusals: number;
};

export const DEFAULT_PREFS: Readonly<Prefs> = { sound: true, haptics: true, refusals: 0 };

function sanitize(raw: unknown): Prefs {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const refusals = typeof o.refusals === 'number' && Number.isFinite(o.refusals) ? Math.max(0, Math.min(99, Math.floor(o.refusals))) : 0;
  return {
    sound: typeof o.sound === 'boolean' ? o.sound : DEFAULT_PREFS.sound,
    haptics: typeof o.haptics === 'boolean' ? o.haptics : DEFAULT_PREFS.haptics,
    refusals,
  };
}

export function readPrefs(): Prefs {
  try {
    if (typeof window === 'undefined') return { ...DEFAULT_PREFS };
    const raw = window.localStorage.getItem(PREFS_KEY);
    return sanitize(raw ? JSON.parse(raw) : null);
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

/** Gabungkan perubahan lalu simpan. Balikan = nilai baru (tetap benar walau gagal simpan). */
export function writePrefs(patch: Partial<Prefs>): Prefs {
  const next = sanitize({ ...readPrefs(), ...patch });
  try {
    if (typeof window !== 'undefined') window.localStorage.setItem(PREFS_KEY, JSON.stringify(next));
  } catch {
    // penyimpanan penuh atau diblokir: preferensi berlaku sampai halaman ditutup
  }
  return next;
}
