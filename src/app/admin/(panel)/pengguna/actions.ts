'use server';

import { revalidatePath } from 'next/cache';
import { submittedValues, type ActionState } from '@/lib/action-result';
import { isAppKey, type AppKey, type Role } from '@/lib/auth/apps';
import { requireAdmin } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';
import { createUser, deleteUser, resetUserPassword, setUserAccess, UserError } from '@/lib/users';

function roleOf(formData: FormData): Role {
  return formData.get('role') === 'admin' ? 'admin' : 'member';
}

function appsOf(formData: FormData): AppKey[] {
  return formData.getAll('apps').filter(isAppKey);
}

function idOf(formData: FormData): number | null {
  const id = Number.parseInt(String(formData.get('id') ?? ''), 10);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function failure(err: unknown, values?: Record<string, string>): ActionState<never> {
  if (err instanceof UserError) {
    return { ok: false, error: err.message, fieldErrors: err.field ? { [err.field]: err.message } : undefined, values };
  }
  throw err;
}

// Password awal hanya dikembalikan di respon ini (tidak disimpan dalam bentuk asli).
export async function createUserAction(
  _prev: ActionState<{ username: string; password: string }>,
  formData: FormData,
): Promise<ActionState<{ username: string; password: string }>> {
  await requireAdmin();
  const values = submittedValues(formData, ['username']);
  const username = String(formData.get('username') ?? '').trim().toLowerCase();
  try {
    const { password } = await createUser(getDb(), { username, role: roleOf(formData), apps: appsOf(formData) });
    revalidatePath('/admin/pengguna');
    return { ok: true, data: { username, password } };
  } catch (err) {
    return failure(err, values);
  }
}

export async function saveAccessAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireAdmin();
  const id = idOf(formData);
  if (!id) return { ok: false, error: 'Pengguna tidak valid.' };
  try {
    setUserAccess(getDb(), actor.id, id, { role: roleOf(formData), apps: appsOf(formData) });
  } catch (err) {
    return failure(err);
  }
  revalidatePath('/admin/pengguna');
  return { ok: true, message: 'Akses disimpan.' };
}

export async function resetPasswordAction(_prev: ActionState<{ password: string }>, formData: FormData): Promise<ActionState<{ password: string }>> {
  await requireAdmin();
  const id = idOf(formData);
  if (!id) return { ok: false, error: 'Pengguna tidak valid.' };
  try {
    const password = await resetUserPassword(getDb(), id);
    revalidatePath('/admin/pengguna');
    return { ok: true, data: { password } };
  } catch (err) {
    return failure(err);
  }
}

export async function deleteUserAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await requireAdmin();
  const id = idOf(formData);
  if (!id) return { ok: false, error: 'Pengguna tidak valid.' };
  try {
    deleteUser(getDb(), actor.id, id);
  } catch (err) {
    return failure(err);
  }
  revalidatePath('/admin/pengguna');
  return { ok: true, message: 'Pengguna dihapus.' };
}
