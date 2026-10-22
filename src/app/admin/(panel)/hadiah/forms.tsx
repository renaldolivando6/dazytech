'use client';

import { useActionState } from 'react';
import { SubmitButton } from '@/components/admin/submit-button';
import { Alert, cx, inputClass, labelClass } from '@/components/admin/ui';
import { valueOf } from '@/lib/action-result';
import { resetGachaAction, saveGachaAction } from './actions';

export type CodeFieldData = { name: string; label: string; value: string };

export function GachaForm({ pin, groups }: { pin: string; groups: { title: string; fields: CodeFieldData[] }[] }) {
  const [state, action] = useActionState(saveGachaAction, null);
  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <form action={action} className="space-y-5">
      {state?.ok && <Alert tone="green">{state.message}</Alert>}
      {state && !state.ok && <Alert tone="red">{state.error}</Alert>}

      <div className="max-w-[200px]">
        <label htmlFor="gacha-pin" className={labelClass}>
          PIN (6 angka)
        </label>
        <input
          id="gacha-pin"
          name="pin"
          required
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={6}
          autoComplete="off"
          defaultValue={valueOf(state, 'pin', pin)}
          aria-invalid={!!fieldErrors?.pin}
          className={cx(inputClass, 'font-mono tracking-[0.2em]')}
        />
        {fieldErrors?.pin && <p className="mt-1 text-[12px] text-danger">{fieldErrors.pin}</p>}
      </div>

      {groups.map((group) => (
        <fieldset key={group.title}>
          <legend className="mb-2 text-[13px] font-semibold">{group.title}</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {group.fields.map((f) => (
              <div key={f.name}>
                <label htmlFor={`gacha-${f.name}`} className={labelClass}>
                  {f.label}
                </label>
                <input
                  id={`gacha-${f.name}`}
                  name={f.name}
                  required
                  maxLength={40}
                  autoComplete="off"
                  spellCheck={false}
                  autoCapitalize="characters"
                  placeholder="XXXXX-XXXXX-XXXXX"
                  defaultValue={valueOf(state, f.name, f.value)}
                  aria-invalid={!!fieldErrors?.[f.name]}
                  className={cx(inputClass, 'font-mono uppercase')}
                />
                {fieldErrors?.[f.name] && <p className="mt-1 text-[12px] text-danger">{fieldErrors[f.name]}</p>}
              </div>
            ))}
          </div>
        </fieldset>
      ))}

      <p className="text-[12px] leading-[1.45] text-muted">
        Spasi dan tanda hubung boleh, huruf kecil otomatis jadi kapital. Mengubah kode tidak mengubah status putaran; kode yang sudah dibuka ikut
        berganti di halaman hadiah. Mengganti PIN membuat semua perangkat harus memasukkan PIN baru.
      </p>
      <SubmitButton pendingText="Menyimpan…">Simpan</SubmitButton>
    </form>
  );
}

export function ResetForm({ disabled }: { disabled: boolean }) {
  const [state, action] = useActionState(resetGachaAction, null);

  return (
    <form action={action} className="space-y-3">
      {state?.ok && <Alert tone="green">{state.message}</Alert>}
      {state && !state.ok && <Alert tone="red">{state.error}</Alert>}
      <SubmitButton
        variant="secondary"
        pendingText="Mereset…"
        disabled={disabled}
        confirm={{
          title: 'Reset semua putaran?',
          message: 'Ketujuh putaran kembali belum diputar, dan semua perangkat yang sudah memasukkan PIN harus memasukkan PIN lagi. Kode dan PIN tidak berubah.',
          confirmLabel: 'Reset putaran',
          destructive: true,
        }}
      >
        Reset putaran
      </SubmitButton>
    </form>
  );
}
