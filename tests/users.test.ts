import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { appForPath, appsForUser } from '@/lib/auth/apps';
import { verifyPassword } from '@/lib/auth/password';
import { sessions, users } from '@/lib/db/schema';
import { accessOf, createUser, deleteUser, listUsers, resetUserPassword, setUserAccess, UserError } from '@/lib/users';
import { memoryDb } from './helpers';

describe('akses aplikasi', () => {
  it('admin otomatis semua aplikasi, member hanya yang diberikan', () => {
    expect(appsForUser('admin', [])).toEqual(['website', 'komisi']);
    expect(appsForUser('member', ['komisi'])).toEqual(['komisi']);
    expect(appsForUser('member', ['tidak-ada'])).toEqual([]);
  });

  it('halaman admin dipetakan ke aplikasinya', () => {
    expect(appForPath('/admin/komisi/master/')).toBe('komisi');
    expect(appForPath('/admin/company/')).toBe('komisi');
    expect(appForPath('/admin/artikel/3/')).toBe('website');
    expect(appForPath('/admin/leads/')).toBe('website');
    expect(appForPath('/admin/')).toBeNull();
    expect(appForPath('/admin/pengguna/')).toBeNull();
  });
});

describe('pengguna', () => {
  async function setup() {
    const db = memoryDb();
    const admin = db.insert(users).values({ username: 'admin', passwordHash: 'x', role: 'admin' }).returning({ id: users.id }).get();
    return { db, adminId: admin.id };
  }

  it('membuat member khusus komisi dengan password awal yang wajib diganti', async () => {
    const { db } = await setup();
    const { id, password } = await createUser(db, { username: ' Okta ', role: 'member', apps: ['komisi'] });
    const row = db.select().from(users).where(eq(users.id, id)).get()!;
    expect(row.username).toBe('okta');
    expect(row.mustChangePassword).toBe(true);
    expect(await verifyPassword(password, row.passwordHash)).toBe(true);
    expect(accessOf(db, id, 'member')).toEqual(['komisi']);
    expect(listUsers(db).find((u) => u.username === 'okta')?.apps).toEqual(['komisi']);
  });

  it('username divalidasi dan harus unik', async () => {
    const { db } = await setup();
    await expect(createUser(db, { username: 'a b', role: 'member', apps: [] })).rejects.toThrow(UserError);
    await expect(createUser(db, { username: 'ADMIN', role: 'member', apps: [] })).rejects.toThrow(/sudah dipakai/);
  });

  it('ubah akses; admin tidak bisa menurunkan diri sendiri atau admin terakhir', async () => {
    const { db, adminId } = await setup();
    const { id } = await createUser(db, { username: 'okta', role: 'member', apps: ['komisi'] });
    setUserAccess(db, adminId, id, { role: 'member', apps: ['website', 'komisi'] });
    expect(accessOf(db, id, 'member')).toEqual(['website', 'komisi']);
    setUserAccess(db, adminId, id, { role: 'member', apps: [] });
    expect(accessOf(db, id, 'member')).toEqual([]);

    expect(() => setUserAccess(db, adminId, adminId, { role: 'member', apps: [] })).toThrow(/akun sendiri/);
    // okta jadi admin, lalu menurunkan admin pertama: boleh karena masih ada admin lain.
    setUserAccess(db, adminId, id, { role: 'admin', apps: [] });
    setUserAccess(db, id, adminId, { role: 'member', apps: ['komisi'] });
    expect(() => setUserAccess(db, adminId, id, { role: 'member', apps: [] })).toThrow(/minimal satu admin/);
  });

  it('reset password mengeluarkan semua sesi user itu', async () => {
    const { db } = await setup();
    const { id } = await createUser(db, { username: 'okta', role: 'member', apps: ['komisi'] });
    db.update(users).set({ mustChangePassword: false }).where(eq(users.id, id)).run();
    db.insert(sessions).values({ id: 'hash', userId: id, expiresAt: new Date(Date.now() + 60_000) }).run();
    const password = await resetUserPassword(db, id);
    const row = db.select().from(users).where(eq(users.id, id)).get()!;
    expect(row.mustChangePassword).toBe(true);
    expect(await verifyPassword(password, row.passwordHash)).toBe(true);
    expect(db.select().from(sessions).where(eq(sessions.userId, id)).all()).toHaveLength(0);
  });

  it('hapus pengguna, kecuali diri sendiri', async () => {
    const { db, adminId } = await setup();
    const { id } = await createUser(db, { username: 'okta', role: 'member', apps: ['komisi'] });
    expect(() => deleteUser(db, adminId, adminId)).toThrow(/akun sendiri/);
    deleteUser(db, adminId, id);
    expect(listUsers(db).map((u) => u.username)).toEqual(['admin']);
  });
});
