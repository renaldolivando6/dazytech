'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { fieldErrorsOf, type ActionState } from '@/lib/action-result';
import { ArticleError, deleteArticle, saveArticle } from '@/lib/articles/queries';
import { SLUG_PATTERN, slugify } from '@/lib/articles/slug';
import { requireApp } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';

const articleSchema = z.object({
  title: z.string().trim().min(5, 'Minimal 5 karakter.').max(140, 'Maksimal 140 karakter.'),
  slug: z
    .string()
    .trim()
    .min(3, 'Minimal 3 karakter.')
    .max(80, 'Maksimal 80 karakter.')
    .regex(SLUG_PATTERN, 'Hanya huruf kecil, angka, dan tanda hubung (-).'),
  excerpt: z.string().trim().max(300, 'Maksimal 300 karakter.'),
  content: z.string().max(200_000, 'Isi artikel terlalu panjang.'),
  status: z.enum(['draft', 'published']),
});

function parseId(raw: FormDataEntryValue | null): number | null | 'invalid' {
  const s = String(raw ?? '');
  if (!s) return null;
  const id = Number.parseInt(s, 10);
  return Number.isSafeInteger(id) && id > 0 ? id : 'invalid';
}

// Editor tidak memakai `values` untuk mengisi ulang form: isinya disimpan di
// state editor (bisa ribuan karakter), jadi tidak hilang saat validasi gagal.
export async function saveArticleAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireApp('website');
  const id = parseId(formData.get('id'));
  if (id === 'invalid') return { ok: false, error: 'Artikel tidak valid.' };

  const title = String(formData.get('title') ?? '');
  const slug = String(formData.get('slug') ?? '').trim() || slugify(title);
  const parsed = articleSchema.safeParse({ ...Object.fromEntries(formData), slug });
  if (!parsed.success) return { ok: false, error: 'Periksa kembali isian.', fieldErrors: fieldErrorsOf(parsed.error.issues) };

  const input = { ...parsed.data, content: parsed.data.content.replace(/\r\n/g, '\n') };
  if (input.status === 'published' && input.content.trim().length < 20) {
    return { ok: false, error: 'Periksa kembali isian.', fieldErrors: { content: 'Isi artikel masih terlalu pendek untuk diterbitkan.' } };
  }

  let savedId: number;
  try {
    savedId = saveArticle(getDb(), id, input, user.id);
  } catch (err) {
    if (err instanceof ArticleError) {
      return { ok: false, error: err.message, fieldErrors: err.field ? { [err.field]: err.message } : undefined };
    }
    throw err;
  }

  revalidatePath('/admin/artikel');
  if (id === null) redirect(`/admin/artikel/${savedId}/?baru=1`);
  revalidatePath(`/admin/artikel/${savedId}`);
  return { ok: true, message: input.status === 'published' ? 'Tersimpan. Artikel sudah tayang.' : 'Draft tersimpan.' };
}

export async function deleteArticleAction(formData: FormData): Promise<void> {
  await requireApp('website');
  const id = parseId(formData.get('id'));
  if (typeof id === 'number') deleteArticle(getDb(), id);
  revalidatePath('/admin/artikel');
  redirect('/admin/artikel/?dihapus=1');
}
