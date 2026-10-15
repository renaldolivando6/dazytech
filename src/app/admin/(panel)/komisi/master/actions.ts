'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { fieldErrorsOf, submittedValues, type ActionState } from '@/lib/action-result';
import { requireCompanyForAction } from '@/lib/company';
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

const valuesOf = (formData: FormData) => submittedValues(formData, [...formData.keys()]);

// Gagal validasi: kembalikan isian supaya form tidak kosong lagi (lihat ActionState).
function fail(formData: FormData, fieldErrors: Record<string, string>): ActionState {
  return { ok: false, error: 'Periksa kembali isian.', fieldErrors, values: valuesOf(formData) };
}

function invalid(formData: FormData, issues: { path: PropertyKey[]; message: string }[]): ActionState {
  return fail(formData, fieldErrorsOf(issues));
}

// Kategori hanya boleh disentuh kalau milik company aktif.
function findCategory(companyId: number, categoryId: number) {
  return (
    getDb()
      .select()
      .from(komisiCategories)
      .where(and(eq(komisiCategories.id, categoryId), eq(komisiCategories.companyId, companyId)))
      .get() ?? null
  );
}

export async function createCategoryAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await requireCompanyForAction(formData);
  if (!ctx.ok) return { ok: false, error: ctx.error, values: valuesOf(formData) };
  const parsed = z.object({ code, ...categoryFields }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(formData, parsed.error.issues);

  const db = getDb();
  const exists = db
    .select()
    .from(komisiCategories)
    .where(and(eq(komisiCategories.companyId, ctx.company.id), eq(komisiCategories.code, parsed.data.code)))
    .get();
  if (exists) return fail(formData, { code: 'Kategori ini sudah ada.' });

  db.insert(komisiCategories).values({ ...parsed.data, companyId: ctx.company.id, isActive: true }).run();
  return done(`Kategori ${parsed.data.code} ditambahkan.`);
}

export async function updateCategoryAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await requireCompanyForAction(formData);
  if (!ctx.ok) return { ok: false, error: ctx.error, values: valuesOf(formData) };
  const parsed = z
    .object({ id, ...categoryFields, isActive: z.literal('on').optional() })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(formData, parsed.error.issues);
  const { id: categoryId, isActive, ...values } = parsed.data;

  if (!findCategory(ctx.company.id, categoryId)) return { ok: false, error: 'Kategori tidak ditemukan.' };

  const db = getDb();
  const clash = db
    .select()
    .from(komisiUnitConversions)
    .where(and(eq(komisiUnitConversions.categoryId, categoryId), eq(komisiUnitConversions.unit, values.baseUnit)))
    .get();
  if (clash) {
    return fail(formData, { baseUnit: `${values.baseUnit} sudah dipakai sebagai konversi. Hapus konversinya dulu.` });
  }

  db.update(komisiCategories)
    .set({ ...values, isActive: isActive === 'on' })
    .where(and(eq(komisiCategories.id, categoryId), eq(komisiCategories.companyId, ctx.company.id)))
    .run();
  return done('Tersimpan.');
}

export async function deleteCategoryAction(formData: FormData): Promise<void> {
  const ctx = await requireCompanyForAction(formData);
  if (!ctx.ok) return;
  const parsed = id.safeParse(formData.get('id'));
  if (!parsed.success) return;
  // Perhitungan lama tidak terpengaruh: tarifnya sudah di-snapshot.
  getDb()
    .delete(komisiCategories)
    .where(and(eq(komisiCategories.id, parsed.data), eq(komisiCategories.companyId, ctx.company.id)))
    .run();
  revalidatePath('/admin/komisi', 'layout');
}

export async function addConversionAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await requireCompanyForAction(formData);
  if (!ctx.ok) return { ok: false, error: ctx.error, values: valuesOf(formData) };
  const parsed = z
    .object({
      categoryId: id,
      unit,
      factor: z.coerce.number().int('Harus bilangan bulat.').min(1, 'Minimal 1.').max(1_000_000),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(formData, parsed.error.issues);

  const category = findCategory(ctx.company.id, parsed.data.categoryId);
  if (!category) return { ok: false, error: 'Kategori tidak ditemukan.' };
  if (category.baseUnit === parsed.data.unit) {
    return fail(formData, { unit: 'Ini satuan dasarnya (faktor selalu 1).' });
  }

  const db = getDb();
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
  const ctx = await requireCompanyForAction(formData);
  if (!ctx.ok) return;
  const parsed = id.safeParse(formData.get('id'));
  if (!parsed.success) return;

  const db = getDb();
  const conv = db.select().from(komisiUnitConversions).where(eq(komisiUnitConversions.id, parsed.data)).get();
  if (!conv || !findCategory(ctx.company.id, conv.categoryId)) return;
  db.delete(komisiUnitConversions).where(eq(komisiUnitConversions.id, conv.id)).run();
  revalidatePath('/admin/komisi', 'layout');
}
