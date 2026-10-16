'use server';

import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { submittedValues, type ActionState } from '@/lib/action-result';
import { safeAdminPath } from '@/lib/auth/constants';
import { verifyAgainstDummy, verifyPassword } from '@/lib/auth/password';
import { clearLoginFailures, loginBlockedFor, recordLoginFailure } from '@/lib/auth/rate-limit';
import { clientIp, createSession } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';
import { users } from '@/lib/db/schema';

const schema = z.object({
  username: z.string().trim().min(1).max(100),
  password: z.string().min(1).max(200),
  next: z.string().optional(),
});

// Halaman login berbahasa Inggris (lihat CLAUDE.md), begitu juga pesannya.
const INVALID = 'Incorrect username or password.';

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const values = submittedValues(formData, ['username']);
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: 'Enter your username and password.', values };
  const { username, password, next } = parsed.data;

  const ip = await clientIp();
  const waitMs = loginBlockedFor(ip, username);
  if (waitMs > 0) {
    const minutes = Math.ceil(waitMs / 60000);
    return { ok: false, error: `Too many failed attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`, values };
  }

  const user = getDb().select().from(users).where(eq(users.username, username)).get();
  const valid = user ? await verifyPassword(password, user.passwordHash) : (await verifyAgainstDummy(password), false);
  if (!user || !valid) {
    recordLoginFailure(ip, username);
    return { ok: false, error: INVALID, values };
  }

  clearLoginFailures(ip, username);
  await createSession(user.id);
  if (user.mustChangePassword) redirect('/admin/akun/?wajib=1');
  // Default ke portal. Company baru ditanyakan saat masuk aplikasi Komisi (requireCompany).
  redirect(safeAdminPath(next) ?? '/admin/');
}
