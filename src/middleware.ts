import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, sessionCookieOptions } from '@/lib/auth/constants';

// Penjaga lapis pertama untuk /admin: tanpa cookie sesi langsung ke halaman
// login. Validasi sesi yang sebenarnya (ke database) ada di requireUser().
export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const isLogin = pathname.startsWith('/admin/login');

  if (!token && !isLogin) {
    const url = req.nextUrl.clone();
    url.pathname = '/admin/login/';
    url.search = pathname.startsWith('/admin/') ? `?next=${encodeURIComponent(pathname + search)}` : '';
    return NextResponse.redirect(url);
  }

  const res = NextResponse.next();
  // Halaman admin tidak boleh diindeks mesin pencari.
  res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  // Perpanjang umur cookie selama admin aktif (sliding session).
  if (token && req.method === 'GET') res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return res;
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};
