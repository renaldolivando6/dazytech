import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseAccurateExcel } from '@/lib/komisi/excel';
import { commitImport } from '@/lib/komisi/import';
import { previewRun } from '@/lib/komisi/runs';
import { memoryDb } from './helpers';

// Uji opsional dengan file export Accurate asli (tidak di-commit karena berisi
// data pelanggan). Jalankan:
//   REAL_XLSX=/path/ke/file.xlsx REAL_EXPECTED_AMOUNT=193560 npx vitest run tests/real-file.test.ts
const file = process.env.REAL_XLSX;

describe.skipIf(!file)('file export Accurate asli', () => {
  it('terbaca tanpa error dan total komisinya sesuai hitungan manual', async () => {
    const parsed = await parseAccurateExcel(fs.readFileSync(file!));
    expect(parsed.errors).toEqual([]);

    const db = memoryDb();
    const { summary } = commitImport(db, { fileName: 'real.xlsx', fileHash: 'real', parsed, userId: null });
    const preview = previewRun(db, '9999-12-31');

    console.table(preview.groups);
    console.log({ summary, totalAmount: preview.totalAmount, excluded: preview.excluded });

    if (process.env.REAL_EXPECTED_AMOUNT) {
      expect(preview.totalAmount).toBe(Number(process.env.REAL_EXPECTED_AMOUNT));
    }
  });
});
