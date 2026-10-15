'use client';

import { useActionState, useEffect, useRef } from 'react';
import { SubmitButton } from '@/components/admin/submit-button';
import { Alert, inputClass, labelClass } from '@/components/admin/ui';
import { valueOf } from '@/lib/action-result';
import { createCompanyAction } from './actions';

export function CreateCompanyForm({ companies }: { companies: { id: number; name: string }[] }) {
  const [state, action] = useActionState(createCompanyAction, null);
  const formRef = useRef<HTMLFormElement>(null);
  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined;

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-3">
      {state?.ok && <Alert tone="green">{state.message}</Alert>}
      {state && !state.ok && !fieldErrors && <Alert tone="red">{state.error}</Alert>}
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_200px_auto] sm:items-end">
        <div>
          <label htmlFor="company-name" className={labelClass}>
            Nama company
          </label>
          <input id="company-name" name="name" required maxLength={60} defaultValue={valueOf(state, 'name')} className={inputClass} />
          {fieldErrors?.name && <p className="mt-1 text-[12px] text-danger">{fieldErrors.name}</p>}
        </div>
        <div>
          <label htmlFor="copy-rates" className={labelClass}>
            Master tarif
          </label>
          <select id="copy-rates" name="copyRatesFrom" defaultValue={valueOf(state, 'copyRatesFrom')} className={inputClass}>
            <option value="">Mulai kosong</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                Salin dari {c.name}
              </option>
            ))}
          </select>
        </div>
        <SubmitButton pendingText="Menyimpan…">Tambah</SubmitButton>
      </div>
    </form>
  );
}
