// Dipakai juga oleh middleware (Edge runtime), jadi jangan import modul Node di sini.
export const SESSION_COOKIE = 'dz_session';
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 hari, diperpanjang selama dipakai

export function sessionCookieOptions(maxAgeMs = SESSION_TTL_MS) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    // Di production selalu lewat HTTPS (nginx). Di dev localhost masih HTTP.
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: Math.floor(maxAgeMs / 1000),
  };
}

// Hanya izinkan redirect balik ke halaman admin sendiri (cegah open redirect).
export function safeAdminPath(next: string | null | undefined): string | null {
  if (!next || !next.startsWith('/admin/') || next.startsWith('//') || next.includes('\\')) return null;
  if (next.startsWith('/admin/login')) return null;
  return next;
}
