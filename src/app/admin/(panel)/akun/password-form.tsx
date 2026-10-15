'use client';

import { useActionState } from 'react';
import { SubmitButton } from '@/components/admin/submit-button';
import { Alert, inputClass, labelClass } from '@/components/admin/ui';
import { changePasswordAction } from './actions';

const FIELDS = [
  { name: 'current', label: 'Password saat ini', autoComplete: 'current-password' },
  { name: 'password', label: 'Password baru', autoComplete: 'new-password' },
  { name: 'confirm', label: 'Ulangi password baru', autoComplete: 'new-password' },
] as const;

export function PasswordForm({ minLength }: { minLength: number }) {
  const [state, action] = useActionState(changePasswordAction, null);
  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <form action={action} className="space-y-4">
      {state?.ok && <Alert tone="green">{state.message}</Alert>}
      {state && !state.ok && !fieldErrors && <Alert tone="red">{state.error}</Alert>}
      {FIELDS.map((f) => (
        <div key={f.name}>
          <label htmlFor={f.name} className={labelClass}>
            {f.label}
          </label>
          <input
            id={f.name}
            name={f.name}
            type="password"
            required
            autoComplete={f.autoComplete}
            minLength={f.name === 'current' ? undefined : minLength}
            aria-invalid={!!fieldErrors?.[f.name]}
            className={inputClass}
          />
          {fieldErrors?.[f.name] && <p className="mt-1 text-[12px] text-danger">{fieldErrors[f.name]}</p>}
        </div>
      ))}
      <p className="text-[12px] text-muted">Minimal {minLength} karakter. Sesi di perangkat lain akan otomatis keluar.</p>
      <SubmitButton pendingText="Menyimpan…">Ganti Password</SubmitButton>
    </form>
  );
}
