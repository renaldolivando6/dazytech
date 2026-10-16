// Daftar aplikasi internal di portal /admin. Dipakai server (cek akses) dan
// browser (nav, portal), jadi jangan import modul server di sini.
//
// Menambah aplikasi: tambahkan di sini, di enum `user_apps.app`
// (lib/db/schema.ts), dan di APP_LINKS (app/admin/(panel)/nav.tsx).

export const APPS = [
  {
    key: 'website',
    name: 'Website',
    description: 'Tulis artikel untuk SEO dan tindak lanjuti leads dari form kontak dazytech.web.id.',
    href: '/admin/artikel/',
  },
  {
    key: 'komisi',
    name: 'Komisi',
    description: 'Import faktur Accurate, hitung komisi per cutoff, lalu kunci dan export laporannya.',
    href: '/admin/komisi/',
  },
] as const;

export type AppKey = (typeof APPS)[number]['key'];
export type Role = 'admin' | 'member';

export const APP_KEYS: AppKey[] = APPS.map((a) => a.key);

export function isAppKey(value: unknown): value is AppKey {
  return typeof value === 'string' && (APP_KEYS as string[]).includes(value);
}

export function appName(key: AppKey): string {
  return APPS.find((a) => a.key === key)?.name ?? key;
}

// Admin otomatis boleh semua aplikasi; member hanya yang diberikan.
export function appsForUser(role: Role, granted: readonly string[]): AppKey[] {
  return role === 'admin' ? [...APP_KEYS] : APP_KEYS.filter((k) => granted.includes(k));
}

// Halaman /admin/... milik aplikasi mana (untuk nav). null = portal, akun, pengguna.
export function appForPath(pathname: string): AppKey | null {
  if (pathname.startsWith('/admin/komisi') || pathname.startsWith('/admin/company')) return 'komisi';
  if (pathname.startsWith('/admin/artikel') || pathname.startsWith('/admin/leads')) return 'website';
  return null;
}
