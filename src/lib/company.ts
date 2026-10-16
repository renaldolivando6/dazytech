import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { requireApp, requireUser, type SessionUser } from '@/lib/auth/session';
import { findCompany } from '@/lib/companies';
import { getDb } from '@/lib/db/client';
import type { Company } from '@/lib/db/schema';

// Company aktif disimpan di cookie (bukan di URL): dipilih sekali setelah login,
// berlaku untuk semua halaman sampai diganti lewat switcher di header.
export const COMPANY_COOKIE = 'dz_company';

export function companyCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  };
}

export const getCurrentCompany = cache(async (): Promise<Company | null> => {
  const raw = (await cookies()).get(COMPANY_COOKIE)?.value;
  const id = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isSafeInteger(id) ? findCompany(getDb(), id) : null;
});

// Penjaga halaman: wajib login, punya akses aplikasi Komisi, DAN sudah memilih company.
export async function requireCompany(): Promise<{ user: SessionUser; company: Company }> {
  const user = await requireApp('komisi');
  const company = await getCurrentCompany();
  if (!company) redirect('/admin/company/');
  return { user, company };
}

// Penjaga server action. Setiap form mengirim `companyId` yang dirender bersama
// halamannya. Kalau company aktif sudah diganti di tab lain, form lama ditolak
// supaya data tidak masuk ke company yang salah (mis. import file Pangan ke Test).
export async function requireCompanyForAction(
  formData: FormData,
): Promise<{ ok: true; user: SessionUser; company: Company } | { ok: false; error: string }> {
  const user = await requireUser();
  if (!user.apps.includes('komisi')) return { ok: false, error: 'Akun ini tidak punya akses ke aplikasi Komisi.' };
  const company = await getCurrentCompany();
  if (!company) return { ok: false, error: 'Pilih company dulu.' };
  if (String(formData.get('companyId') ?? '') !== String(company.id)) {
    return {
      ok: false,
      error: `Company aktif sudah diganti (sekarang: ${company.name}), mungkin dari tab lain. Muat ulang halaman ini lalu coba lagi.`,
    };
  }
  return { ok: true, user, company };
}
