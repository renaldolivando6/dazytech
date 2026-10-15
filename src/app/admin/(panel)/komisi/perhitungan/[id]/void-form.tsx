'use client';

import { useActionState, useState } from 'react';
import { CompanyField } from '@/components/admin/company-context';
import { SubmitButton } from '@/components/admin/submit-button';
import { Alert, buttonClass, inputClass } from '@/components/admin/ui';
import { valueOf } from '@/lib/action-result';
import { voidRunAction } from '../actions';

export function VoidRunForm({ runId }: { runId: number }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(voidRunAction, null);
  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined;

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={buttonClass('danger', 'sm')}>
        Batalkan perhitungan…
      </button>
    );
  }

  return (
    <form action={action} className="w-full space-y-3">
      {state && !state.ok && !fieldErrors && <Alert tone="red">{state.error}</Alert>}
      <CompanyField />
      <input type="hidden" name="runId" value={runId} />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <div className="flex-1">
          <input
            id="reason"
            name="reason"
            aria-label="Alasan pembatalan"
            defaultValue={valueOf(state, 'reason')}
            required
            minLength={3}
            maxLength={500}
            autoFocus
            className={inputClass}
            placeholder="Alasan pembatalan, mis. salah tanggal cutoff"
          />
          {fieldErrors?.reason && <p className="mt-1 text-[12px] text-danger">{fieldErrors.reason}</p>}
        </div>
        <SubmitButton variant="danger" pendingText="Membatalkan…" confirm={{
            title: 'Batalkan perhitungan ini?',
            message: 'Baris-barisnya dilepas dan bisa dihitung ulang. Catatan perhitungan tetap disimpan sebagai riwayat.',
            confirmLabel: 'Batalkan perhitungan',
            destructive: true,
          }}>
          Batalkan
        </SubmitButton>
        <button type="button" onClick={() => setOpen(false)} className={buttonClass('ghost')}>
          Tutup
        </button>
      </div>
      <p className="text-[12px] text-muted">
        Baris-baris di perhitungan ini dilepas dan bisa dihitung ulang. Catatan perhitungan ini tetap disimpan sebagai riwayat.
      </p>
    </form>
  );
}
