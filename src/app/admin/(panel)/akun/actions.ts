'use server';

import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { fieldErrorsOf, type ActionState } from '@/lib/action-result';
import { hashPassword, MIN_PASSWORD_LENGTH, verifyPassword } from '@/lib/auth/password';
import { destroyOtherSessions, requireUser } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';
import { users } from '@/lib/db/schema';

const schema = z
  .object({
    current: z.string().min(1, 'Isi password saat ini.'),
    password: z
      .string()
      .min(MIN_PASSWORD_LENGTH, `Minimal ${MIN_PASSWORD_LENGTH} karakter.`)
      .max(200, 'Maksimal 200 karakter.'),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'Konfirmasi tidak sama.' })
  .refine((v) => v.password !== v.current, { path: ['password'], message: 'Password baru harus berbeda.' });

export async function changePasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser({ allowPendingPasswordChange: true });
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: 'Periksa kembali isian.', fieldErrors: fieldErrorsOf(parsed.error.issues) };
  }

  const db = getDb();
  const row = db.select().from(users).where(eq(users.id, user.id)).get();
  if (!row || !(await verifyPassword(parsed.data.current, row.passwordHash))) {
    return { ok: false, error: 'Periksa kembali isian.', fieldErrors: { current: 'Password saat ini salah.' } };
  }

  db.update(users)
    .set({ passwordHash: await hashPassword(parsed.data.password), mustChangePassword: false })
    .where(eq(users.id, user.id))
    .run();
  // Sesi di perangkat lain ikut keluar.
  await destroyOtherSessions(user.id);

  if (user.mustChangePassword) redirect('/admin/');
  return { ok: true, message: 'Password berhasil diganti.' };
}
