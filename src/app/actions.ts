'use server';

import { headers } from 'next/headers';
import { getCopy, isLocale } from '@/i18n';
import { fieldErrorsOf, submittedValues, type ActionState } from '@/lib/action-result';
import { clientIp } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';
import { createLead, leadAllowed, leadSchemaFor } from '@/lib/leads';

// Form kontak di halaman utama (ID & EN) -> tabel leads (dibaca di /admin/leads).
// Pesan error mengikuti bahasa halaman; `data.name` dipakai form untuk ucapan terima kasih.
export async function submitLeadAction(_prev: ActionState<{ name: string }>, formData: FormData): Promise<ActionState<{ name: string }>> {
  const locale = isLocale(formData.get('locale')) ? (formData.get('locale') as 'id' | 'en') : 'id';
  const errors = getCopy(locale).contact.form.errors;

  // Honeypot: field tersembunyi yang hanya diisi bot. Pura-pura berhasil.
  if (String(formData.get('website') ?? '') !== '') return { ok: true, data: { name: '' } };

  const values = submittedValues(formData, ['name', 'contact', 'service', 'message']);
  const parsed = leadSchemaFor(locale).safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: errors.check, fieldErrors: fieldErrorsOf(parsed.error.issues), values };
  }

  const ip = await clientIp();
  if (!leadAllowed(ip)) return { ok: false, error: errors.rateLimited, values };

  createLead(getDb(), parsed.data, { ipAddress: ip, userAgent: (await headers()).get('user-agent') });
  return { ok: true, data: { name: parsed.data.name.split(' ')[0] } };
}
