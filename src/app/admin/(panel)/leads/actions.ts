'use server';

import { revalidatePath } from 'next/cache';
import { requireApp } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';
import { LEAD_STATUSES, setLeadStatus, type LeadStatus } from '@/lib/leads';

export async function setLeadStatusAction(formData: FormData): Promise<void> {
  await requireApp('website');
  const id = Number.parseInt(String(formData.get('id') ?? ''), 10);
  const status = String(formData.get('status') ?? '') as LeadStatus;
  if (!Number.isSafeInteger(id) || !LEAD_STATUSES.includes(status)) return;
  setLeadStatus(getDb(), id, status);
  revalidatePath('/admin/leads');
}
