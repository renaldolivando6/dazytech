'use server';

import { createHash } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';
import { ExcelFormatError, parseAccurateExcel, type ParseResult } from '@/lib/komisi/excel';
import { commitImport, previewImport, type ImportPreview, type ImportSummary } from '@/lib/komisi/import';

const MAX_FILE_BYTES = 10 * 1024 * 1024;

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

async function readUpload(formData: FormData): Promise<Result<{ fileName: string; fileHash: string; parsed: ParseResult }>> {
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: 'Pilih file Excel dulu.' };
  if (!/\.xlsx$/i.test(file.name)) return { ok: false, error: 'File harus berformat .xlsx (export Excel dari Accurate).' };
  if (file.size > MAX_FILE_BYTES) return { ok: false, error: 'Ukuran file maksimal 10 MB.' };

  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    const parsed = await parseAccurateExcel(buffer);
    return {
      ok: true,
      data: {
        fileName: file.name.slice(0, 200),
        fileHash: createHash('sha256').update(buffer).digest('hex'),
        parsed,
      },
    };
  } catch (err) {
    if (err instanceof ExcelFormatError) return { ok: false, error: err.message };
    console.error('[komisi] gagal membaca excel', err);
    return { ok: false, error: 'File tidak bisa dibaca. Pastikan ini file export Accurate yang benar.' };
  }
}

// Langkah 1: cek file tanpa menyimpan apa pun.
export async function previewImportAction(formData: FormData): Promise<Result<ImportPreview>> {
  await requireUser();
  const upload = await readUpload(formData);
  if (!upload.ok) return upload;
  return { ok: true, data: previewImport(getDb(), upload.data) };
}

// Langkah 2: simpan. File dikirim ulang dan diklasifikasi ulang di dalam
// transaksi, jadi hasil tetap benar walau data berubah sejak preview.
export async function commitImportAction(formData: FormData): Promise<Result<{ importId: number; summary: ImportSummary }>> {
  const user = await requireUser();
  const upload = await readUpload(formData);
  if (!upload.ok) return upload;

  const result = commitImport(getDb(), { ...upload.data, userId: user.id });
  revalidatePath('/admin/komisi', 'layout');
  return { ok: true, data: result };
}
