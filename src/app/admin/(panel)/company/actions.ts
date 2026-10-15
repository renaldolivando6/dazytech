'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { fieldErrorsOf, submittedValues, type ActionState } from '@/lib/action-result';
import { safeAdminPath } from '@/lib/auth/constants';
import { requireUser } from '@/lib/auth/session';
import { CompanyError, createCompany, findCompany } from '@/lib/companies';
import { COMPANY_COOKIE, companyCookieOptions } from '@/lib/company';
import { getDb } from '@/lib/db/client';

export async function selectCompanyAction(formData: FormData): Promise<void> {
  await requireUser();
  const id = Number.parseInt(String(formData.get('id') ?? ''), 10);
  const company = Number.isSafeInteger(id) ? findCompany(getDb(), id) : null;
  if (!company) redirect('/admin/company/');

  (await cookies()).set(COMPANY_COOKIE, String(company.id), companyCookieOptions());
  // Selalu ke halaman awal (bukan halaman yang sedang dibuka): halaman detail
  // seperti perhitungan #5 milik company sebelumnya, bukan company baru.
  const next = safeAdminPath(String(formData.get('next') ?? ''));
  redirect(next && !next.startsWith('/admin/company') ? next : '/admin/komisi/');
}

const createSchema = z.object({
  name: z.string().trim().min(2, 'Minimal 2 karakter.').max(60, 'Maksimal 60 karakter.'),
  copyRatesFrom: z.union([z.literal(''), z.coerce.number().int().positive()]),
});

export async function createCompanyAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const values = submittedValues(formData, ['name', 'copyRatesFrom']);
  const parsed = createSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: 'Periksa kembali isian.', fieldErrors: fieldErrorsOf(parsed.error.issues), values };

  const db = getDb();
  const copyFrom = parsed.data.copyRatesFrom === '' ? null : parsed.data.copyRatesFrom;
  if (copyFrom !== null && !findCompany(db, copyFrom)) return { ok: false, error: 'Company sumber tarif tidak ditemukan.', values };

  try {
    createCompany(db, { name: parsed.data.name, copyRatesFrom: copyFrom });
  } catch (err) {
    if (err instanceof CompanyError) return { ok: false, error: 'Periksa kembali isian.', fieldErrors: { name: err.message }, values };
    throw err;
  }
  revalidatePath('/admin/company');
  return { ok: true, message: `Company "${parsed.data.name}" ditambahkan.` };
}
