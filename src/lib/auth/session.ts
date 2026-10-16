import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { cache } from 'react';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { eq, lt } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { sessions, users } from '@/lib/db/schema';
import { accessOf } from '@/lib/users';
import type { AppKey, Role } from './apps';
import { SESSION_COOKIE, SESSION_TTL_MS, sessionCookieOptions } from './constants';

export type SessionUser = { id: number; username: string; mustChangePassword: boolean; role: Role; apps: AppKey[] };

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

export async function clientIp(): Promise<string> {
  const h = await headers();
  // App hanya bisa dijangkau lewat nginx (tidak ada port yang dipublish),
  // jadi header dari nginx bisa dipercaya.
  return h.get('x-real-ip') ?? h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
}

export async function createSession(userId: number): Promise<void> {
  const db = getDb();
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  // Bersihkan sesi kedaluwarsa sekalian; tabelnya tidak pernah besar.
  db.delete(sessions).where(lt(sessions.expiresAt, new Date())).run();
  db.insert(sessions)
    .values({
      id: hashToken(token),
      userId,
      expiresAt,
      ipAddress: await clientIp(),
      userAgent: (await headers()).get('user-agent')?.slice(0, 300) ?? null,
    })
    .run();

  (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions());
}

// Satu kali per request (React cache), dipakai layout, page, dan action.
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const db = getDb();
  const id = hashToken(token);
  const row = db
    .select({
      expiresAt: sessions.expiresAt,
      userId: users.id,
      username: users.username,
      mustChangePassword: users.mustChangePassword,
      role: users.role,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(eq(sessions.id, id))
    .get();
  if (!row) return null;

  const now = Date.now();
  if (row.expiresAt.getTime() <= now) {
    db.delete(sessions).where(eq(sessions.id, id)).run();
    return null;
  }
  // Sliding expiry: perpanjang di DB kalau sisa < setengah. Cookie-nya
  // diperpanjang oleh middleware di setiap GET halaman admin.
  if (row.expiresAt.getTime() - now < SESSION_TTL_MS / 2) {
    db.update(sessions).set({ expiresAt: new Date(now + SESSION_TTL_MS) }).where(eq(sessions.id, id)).run();
  }

  return {
    id: row.userId,
    username: row.username,
    mustChangePassword: row.mustChangePassword,
    role: row.role,
    apps: accessOf(db, row.userId, row.role),
  };
});

export async function destroyCurrentSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) getDb().delete(sessions).where(eq(sessions.id, hashToken(token))).run();
  jar.delete(SESSION_COOKIE);
}

// Keluarkan semua sesi lain milik user (dipakai setelah ganti password).
export async function destroyOtherSessions(userId: number): Promise<void> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const keep = token ? hashToken(token) : null;
  const db = getDb();
  for (const s of db.select({ id: sessions.id }).from(sessions).where(eq(sessions.userId, userId)).all()) {
    if (s.id !== keep) db.delete(sessions).where(eq(sessions.id, s.id)).run();
  }
}

// Penjaga di setiap page & server action admin. Middleware hanya cek
// keberadaan cookie; validasi sebenarnya di sini (rekomendasi Next.js:
// jangan mengandalkan middleware/layout sebagai satu-satunya pengaman).
export async function requireUser(opts: { allowPendingPasswordChange?: boolean } = {}): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect('/admin/login/');
  if (user.mustChangePassword && !opts.allowPendingPasswordChange) redirect('/admin/akun/?wajib=1');
  return user;
}

// Penjaga page & action milik satu aplikasi. Tanpa akses -> kembali ke portal,
// yang menampilkan aplikasi itu sebagai terkunci.
export async function requireApp(app: AppKey): Promise<SessionUser> {
  const user = await requireUser();
  if (!user.apps.includes(app)) redirect(`/admin/?terkunci=${app}`);
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== 'admin') redirect('/admin/');
  return user;
}
