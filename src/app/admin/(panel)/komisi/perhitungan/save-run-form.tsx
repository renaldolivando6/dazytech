'use client';

import { useActionState } from 'react';
import { CompanyField } from '@/components/admin/company-context';
import { SubmitButton } from '@/components/admin/submit-button';
import { Alert, inputClass, labelClass, textareaClass } from '@/components/admin/ui';
import { valueOf } from '@/lib/action-result';
import { formatRupiah } from '@/lib/format';
import { createRunAction } from './actions';

export function SaveRunForm({
  cutoffDate,
  defaultLabel,
  totalAmount,
  totalLines,
}: {
  cutoffDate: string;
  defaultLabel: string;
  totalAmount: number;
  totalLines: number;
}) {
  const [state, action] = useActionState(createRunAction, null);
  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <form action={action} className="space-y-4">
      {state && !state.ok && <Alert tone="red">{state.error}</Alert>}
      <CompanyField />
      <input type="hidden" name="cutoffDate" value={cutoffDate} />
      <input type="hidden" name="expectedAmount" value={totalAmount} />

      <div className="flex items-baseline justify-between border-b border-black/[0.06] pb-4">
        <span className="text-[12px] text-muted">{totalLines} baris</span>
        <span className="text-[24px] font-semibold tracking-[-0.02em] tabular-nums">{formatRupiah(totalAmount)}</span>
      </div>

      <div>
        <label htmlFor="label" className={labelClass}>
          Nama periode
        </label>
        <input id="label" name="label" defaultValue={valueOf(state, 'label', defaultLabel)} required maxLength={100} className={inputClass} />
        {fieldErrors?.label && <p className="mt-1 text-[12px] text-danger">{fieldErrors.label}</p>}
      </div>
      <div>
        <label htmlFor="note" className={labelClass}>
          Catatan (opsional)
        </label>
        <textarea
          id="note"
          name="note"
          defaultValue={valueOf(state, 'note')}
          rows={2}
          maxLength={500}
          className={textareaClass}
        />
      </div>
      <SubmitButton
        pendingText="Menyimpan…"
        className="w-full"
        confirm={{
          title: `Kunci ${formatRupiah(totalAmount)}?`,
          message: `${totalLines} baris faktur ditandai sudah dikomisikan dan tidak akan dihitung lagi di periode berikutnya.`,
          confirmLabel: 'Simpan & kunci',
        }}
      >
        Simpan & kunci
      </SubmitButton>
      <p className="text-[12px] leading-[1.4] text-muted">
        Baris ini akan ditandai &ldquo;sudah dikomisikan&rdquo;. Kalau salah, perhitungan bisa dibatalkan dari halaman detailnya.
      </p>
    </form>
  );
}
