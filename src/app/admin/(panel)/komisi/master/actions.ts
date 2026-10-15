'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { fieldErrorsOf, submittedValues, type ActionState } from '@/lib/action-result';
import { requireUser } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';
import { komisiCategories, komisiUnitConversions } from '@/lib/db/schema';
import { normalizeCode, normalizeText } from '@/lib/komisi/normalize';

const code = z.string().transform(normalizeCode).pipe(z.string().min(1, 'Wajib diisi.').max(60));
const unit = z.string().transform(normalizeCode).pipe(z.string().min(1, 'Wajib diisi.').max(20));
const rate = z.coerce.number().int('Harus bilangan bulat.').min(0, 'Tidak boleh negatif.').max(1_000_000_000);
const id = z.coerce.number().int().positive();

const categoryFields = {
  label: z.string().transform(normalizeText).pipe(z.string().min(1, 'Wajib diisi.').max(100)),
  baseUnit: unit,
  rate,
};

function done(message: string): ActionState {
  revalidatePath('/admin/komisi', 'layout');
  return { ok: true, message };
}

// Gagal validasi: kembalikan isian supaya form tidak kosong lagi (lihat ActionState).
function fail(formData: FormData, fieldErrors: Record<string, string>): ActionState {
  return { ok: false, error: 'Periksa kembali isian.', fieldErrors, values: submittedValues(formData, [...formData.keys()]) };
}

function invalid(formData: FormData, issues: { path: PropertyKey[]; message: string }[]): ActionState {
  return fail(formData, fieldErrorsOf(issues));
}

export async function createCategoryAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const parsed = z.object({ code, ...categoryFields }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(formData, parsed.error.issues);

  const db = getDb();
  if (db.select().from(komisiCategories).where(eq(komisiCategories.code, parsed.data.code)).get()) {
    return fail(formData, { code: 'Kategori ini sudah ada.' });
  }
  db.insert(komisiCategories).values({ ...parsed.data, isActive: true }).run();
  return done(`Kategori ${parsed.data.code} ditambahkan.`);
}

export async function updateCategoryAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const parsed = z
    .object({ id, ...categoryFields, isActive: z.literal('on').optional() })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(formData, parsed.error.issues);
  const { id: categoryId, isActive, ...values } = parsed.data;

  const db = getDb();
  const clash = db
    .select()
    .from(komisiUnitConversions)
    .where(and(eq(komisiUnitConversions.categoryId, categoryId), eq(komisiUnitConversions.unit, values.baseUnit)))
    .get();
  if (clash) {
    return fail(formData, { baseUnit: `${values.baseUnit} sudah dipakai sebagai konversi. Hapus konversinya dulu.` });
  }

  const res = db
    .update(komisiCategories)
    .set({ ...values, isActive: isActive === 'on' })
    .where(eq(komisiCategories.id, categoryId))
    .run();
  if (res.changes === 0) return { ok: false, error: 'Kategori tidak ditemukan.' };
  return done('Tersimpan.');
}

export async function deleteCategoryAction(formData: FormData): Promise<void> {
  await requireUser();
  const parsed = id.safeParse(formData.get('id'));
  if (!parsed.success) return;
  // Perhitungan lama tidak terpengaruh: tarifnya sudah di-snapshot.
  getDb().delete(komisiCategories).where(eq(komisiCategories.id, parsed.data)).run();
  revalidatePath('/admin/komisi', 'layout');
}

export async function addConversionAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const parsed = z
    .object({
      categoryId: id,
      unit,
      factor: z.coerce.number().int('Harus bilangan bulat.').min(1, 'Minimal 1.').max(1_000_000),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(formData, parsed.error.issues);

  const db = getDb();
  const category = db.select().from(komisiCategories).where(eq(komisiCategories.id, parsed.data.categoryId)).get();
  if (!category) return { ok: false, error: 'Kategori tidak ditemukan.' };
  if (category.baseUnit === parsed.data.unit) {
    return fail(formData, { unit: 'Ini satuan dasarnya (faktor selalu 1).' });
  }
  const exists = db
    .select()
    .from(komisiUnitConversions)
    .where(and(eq(komisiUnitConversions.categoryId, category.id), eq(komisiUnitConversions.unit, parsed.data.unit)))
    .get();
  if (exists) {
    db.update(komisiUnitConversions).set({ factor: parsed.data.factor }).where(eq(komisiUnitConversions.id, exists.id)).run();
  } else {
    db.insert(komisiUnitConversions).values(parsed.data).run();
  }
  return done(`1 ${parsed.data.unit} = ${parsed.data.factor} ${category.baseUnit}`);
}

export async function deleteConversionAction(formData: FormData): Promise<void> {
  await requireUser();
  const parsed = id.safeParse(formData.get('id'));
  if (!parsed.success) return;
  getDb().delete(komisiUnitConversions).where(eq(komisiUnitConversions.id, parsed.data)).run();
  revalidatePath('/admin/komisi', 'layout');
}
