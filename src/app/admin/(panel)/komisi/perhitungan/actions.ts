'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { fieldErrorsOf, submittedValues, type ActionState } from '@/lib/action-result';
import { requireUser } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';
import { isIsoDate } from '@/lib/format';
import { createRun, RunError, voidRun } from '@/lib/komisi/runs';

const createSchema = z.object({
  cutoffDate: z.string().refine(isIsoDate, 'Tanggal cutoff tidak valid.'),
  label: z.string().trim().min(1, 'Isi nama periode.').max(100),
  note: z.string().trim().max(500).optional(),
  // Total yang dilihat user di layar (lihat createRun).
  expectedAmount: z.coerce.number().int(),
});

export async function createRunAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const values = submittedValues(formData, ['label', 'note']);
  const parsed = createSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: 'Periksa kembali isian.', fieldErrors: fieldErrorsOf(parsed.error.issues), values };
  }

  let runId: number;
  try {
    runId = createRun(getDb(), {
      cutoffDate: parsed.data.cutoffDate,
      label: parsed.data.label,
      note: parsed.data.note || null,
      userId: user.id,
      expectedAmount: parsed.data.expectedAmount,
    }).runId;
  } catch (err) {
    if (err instanceof RunError) return { ok: false, error: err.message, values };
    throw err;
  }

  revalidatePath('/admin/komisi', 'layout');
  redirect(`/admin/komisi/perhitungan/${runId}/?baru=1`);
}

const voidSchema = z.object({
  runId: z.coerce.number().int().positive(),
  reason: z.string().trim().min(3, 'Tulis alasan pembatalan (min. 3 karakter).').max(500),
});

export async function voidRunAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const values = submittedValues(formData, ['reason']);
  const parsed = voidSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: 'Periksa kembali isian.', fieldErrors: fieldErrorsOf(parsed.error.issues), values };
  }

  try {
    voidRun(getDb(), { runId: parsed.data.runId, reason: parsed.data.reason, userId: user.id });
  } catch (err) {
    if (err instanceof RunError) return { ok: false, error: err.message, values };
    throw err;
  }

  revalidatePath('/admin/komisi', 'layout');
  return { ok: true, message: 'Perhitungan dibatalkan. Baris-barisnya kembali bisa dihitung.' };
}
