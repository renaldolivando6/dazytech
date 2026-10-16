import { asc, count, eq } from 'drizzle-orm';
import { appsForUser, type AppKey, type Role } from '@/lib/auth/apps';
import { generatePassword, hashPassword } from '@/lib/auth/password';
import type { DB } from '@/lib/db/open';
import { sessions, userApps, users } from '@/lib/db/schema';

export class UserError extends Error {
  constructor(
    message: string,
    readonly field?: string,
  ) {
    super(message);
  }
}

export const USERNAME_PATTERN = /^[a-z0-9._-]{3,32}$/;

// `db` atau `tx` di dalam db.transaction(): keduanya punya query builder yang sama.
type Conn = Pick<DB, 'select' | 'insert' | 'update' | 'delete'>;

// Aplikasi yang boleh dibuka user ini (dipakai getCurrentUser di setiap request).
export function accessOf(db: DB, userId: number, role: Role): AppKey[] {
  if (role === 'admin') return appsForUser('admin', []);
  const granted = db.select({ app: userApps.app }).from(userApps).where(eq(userApps.userId, userId)).all();
  return appsForUser('member', granted.map((g) => g.app));
}

export function listUsers(db: DB) {
  const grants = new Map<number, AppKey[]>();
  for (const g of db.select().from(userApps).all()) grants.set(g.userId, [...(grants.get(g.userId) ?? []), g.app]);
  return db
    .select({ id: users.id, username: users.username, role: users.role, mustChangePassword: users.mustChangePassword, createdAt: users.createdAt })
    .from(users)
    .orderBy(asc(users.username))
    .all()
    .map((u) => ({ ...u, apps: appsForUser(u.role, grants.get(u.id) ?? []) }));
}

function setGrants(db: Conn, userId: number, role: Role, apps: AppKey[]) {
  db.delete(userApps).where(eq(userApps.userId, userId)).run();
  // Admin tidak butuh baris user_apps (otomatis semua aplikasi).
  if (role === 'member') for (const app of new Set(apps)) db.insert(userApps).values({ userId, app }).run();
}

function adminCount(db: Conn): number {
  return db.select({ n: count() }).from(users).where(eq(users.role, 'admin')).get()?.n ?? 0;
}

// Password awal hasil generate dikembalikan SEKALI untuk diberikan ke orangnya;
// wajib diganti saat login pertama.
export async function createUser(db: DB, input: { username: string; role: Role; apps: AppKey[] }): Promise<{ id: number; password: string }> {
  const username = input.username.trim().toLowerCase();
  if (!USERNAME_PATTERN.test(username)) {
    throw new UserError('3–32 karakter: huruf kecil, angka, titik, garis bawah, atau tanda hubung.', 'username');
  }
  if (db.select({ id: users.id }).from(users).where(eq(users.username, username)).get()) {
    throw new UserError(`Username "${username}" sudah dipakai.`, 'username');
  }
  const password = generatePassword();
  const passwordHash = await hashPassword(password);
  const id = db.transaction((tx) => {
    const created = tx.insert(users).values({ username, passwordHash, role: input.role, mustChangePassword: true }).returning({ id: users.id }).get();
    setGrants(tx, created.id, input.role, input.apps);
    return created.id;
  });
  return { id, password };
}

export function setUserAccess(db: DB, actorId: number, userId: number, input: { role: Role; apps: AppKey[] }): void {
  db.transaction((tx) => {
    const target = tx.select({ role: users.role }).from(users).where(eq(users.id, userId)).get();
    if (!target) throw new UserError('Pengguna tidak ditemukan.');
    if (target.role === 'admin' && input.role !== 'admin') {
      if (userId === actorId) throw new UserError('Tidak bisa menurunkan peran akun sendiri.');
      if (adminCount(tx) <= 1) throw new UserError('Harus ada minimal satu admin.');
    }
    tx.update(users).set({ role: input.role }).where(eq(users.id, userId)).run();
    setGrants(tx, userId, input.role, input.apps);
  });
}

// Password baru hasil generate; semua sesi user itu dikeluarkan.
export async function resetUserPassword(db: DB, userId: number): Promise<string> {
  if (!db.select({ id: users.id }).from(users).where(eq(users.id, userId)).get()) throw new UserError('Pengguna tidak ditemukan.');
  const password = generatePassword();
  const passwordHash = await hashPassword(password);
  db.transaction((tx) => {
    tx.update(users).set({ passwordHash, mustChangePassword: true }).where(eq(users.id, userId)).run();
    tx.delete(sessions).where(eq(sessions.userId, userId)).run();
  });
  return password;
}

export function deleteUser(db: DB, actorId: number, userId: number): void {
  if (userId === actorId) throw new UserError('Tidak bisa menghapus akun sendiri.');
  db.transaction((tx) => {
    const target = tx.select({ role: users.role }).from(users).where(eq(users.id, userId)).get();
    if (!target) return;
    if (target.role === 'admin' && adminCount(tx) <= 1) throw new UserError('Harus ada minimal satu admin.');
    tx.delete(users).where(eq(users.id, userId)).run();
  });
}
