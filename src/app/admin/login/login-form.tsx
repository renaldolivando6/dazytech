'use client';

import { useActionState } from 'react';
import { SubmitButton } from '@/components/admin/submit-button';
import { Alert, inputClass, labelClass } from '@/components/admin/ui';
import { valueOf } from '@/lib/action-result';
import { loginAction } from './actions';

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(loginAction, null);

  return (
    <form action={action} className="space-y-4">
      {state && !state.ok && <Alert tone="red">{state.error}</Alert>}
      <input type="hidden" name="next" value={next ?? ''} />
      <div>
        <label htmlFor="username" className={labelClass}>
          Username
        </label>
        <input
          id="username"
          name="username"
          autoComplete="username"
          required
          autoFocus
          defaultValue={valueOf(state, 'username')}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="password" className={labelClass}>
          Password
        </label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className={inputClass} />
      </div>
      <SubmitButton pendingText="Masuk…" className="mt-2 w-full">
        Masuk
      </SubmitButton>
    </form>
  );
}
