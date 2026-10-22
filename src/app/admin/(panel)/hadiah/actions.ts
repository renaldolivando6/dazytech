'use server';

import { revalidatePath } from 'next/cache';
import { submittedValues, type ActionState } from '@/lib/action-result';
import { requireAdmin } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';
import { CODE_COUNT, codeField, GachaError, resetCampaign, setupCampaign } from '@/lib/gacha/service';

const CODE_FIELDS = {
  steam_600k: Array.from({ length: CODE_COUNT.steam_600k }, (_, i) => codeField('steam_600k', i)),
  steam_100k: Array.from({ length: CODE_COUNT.steam_100k }, (_, i) => codeField('steam_100k', i)),
};

const text = (formData: FormData, key: string) => String(formData.get(key) ?? '');

function failure(err: unknown, values?: Record<string, string>): ActionState<never> {
  if (err instanceof GachaError) return { ok: false, error: err.message, fieldErrors: err.fields, values };
  throw err;
}

// PIN ikut dikembalikan saat gagal: halaman ini memang menampilkan PIN ke admin
// (lihat komentar kolom pin di schema), jadi tidak ada yang baru terbuka.
export async function saveGachaAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const values = submittedValues(formData, ['pin', ...CODE_FIELDS.steam_600k, ...CODE_FIELDS.steam_100k]);
  try {
    setupCampaign(getDb(), {
      pin: text(formData, 'pin'),
      codes600: CODE_FIELDS.steam_600k.map((k) => text(formData, k)),
      codes100: CODE_FIELDS.steam_100k.map((k) => text(formData, k)),
    });
  } catch (err) {
    return failure(err, values);
  }
  revalidatePath('/admin/hadiah');
  return { ok: true, message: 'Kode voucher dan PIN disimpan.' };
}

export async function resetGachaAction(_prev: ActionState): Promise<ActionState> {
  await requireAdmin();
  try {
    resetCampaign(getDb());
  } catch (err) {
    return failure(err);
  }
  revalidatePath('/admin/hadiah');
  return { ok: true, message: 'Putaran direset. Ketujuh putaran kembali utuh.' };
}
