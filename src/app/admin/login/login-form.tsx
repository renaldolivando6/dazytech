'use client';

import { useActionState } from 'react';
import { SubmitButton } from '@/components/admin/submit-button';
import { Alert, cx } from '@/components/admin/ui';
import { valueOf } from '@/lib/action-result';
import { loginAction } from './actions';

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(loginAction, null);

  return (
    <form action={action} className="space-y-3">
      {state && !state.ok && (
        <div className="pb-1">
          <Alert tone="red">{state.error}</Alert>
        </div>
      )}
      <input type="hidden" name="next" value={next ?? ''} />
      <FloatingInput
        id="username"
        name="username"
        label="Username"
        autoComplete="username"
        autoFocus
        defaultValue={valueOf(state, 'username')}
      />
      <FloatingInput id="password" name="password" label="Password" type="password" autoComplete="current-password" />
      <div className="pt-3">
        <SubmitButton pendingText="Masuk…" className="h-11! w-full text-[17px]!">
          Masuk
        </SubmitButton>
      </div>
    </form>
  );
}

// Input dengan label di dalam yang naik saat fokus/terisi (gaya form Apple ID).
// `placeholder=" "` dibutuhkan agar :placeholder-shown bisa membedakan kosong/terisi.
function FloatingInput({
  id,
  label,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { id: string; label: string }) {
  return (
    <div className="relative">
      <input
        id={id}
        placeholder=" "
        required
        className={cx(
          'peer block h-[56px] w-full rounded-xl border border-black/[0.15] bg-white px-4 pb-2 pt-6 text-[17px] text-ink outline-none transition-shadow',
          'focus:border-accent focus:ring-4 focus:ring-accent/15',
          className,
        )}
        {...props}
      />
      <label
        htmlFor={id}
        className={cx(
          'pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[17px] text-faint transition-all duration-150',
          'peer-focus:top-[18px] peer-focus:text-[12px] peer-focus:text-muted',
          'peer-[:not(:placeholder-shown)]:top-[18px] peer-[:not(:placeholder-shown)]:text-[12px] peer-[:not(:placeholder-shown)]:text-muted',
          'peer-autofill:top-[18px] peer-autofill:text-[12px]',
        )}
      >
        {label}
      </label>
    </div>
  );
}
