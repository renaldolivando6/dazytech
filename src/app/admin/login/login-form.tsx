'use client';

import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { cx } from '@/components/admin/ui';
import { valueOf } from '@/lib/action-result';
import { loginAction } from './actions';

// Form sign-in ala Apple Account: username & password dalam satu grup field,
// tombol panah bulat di ujung field password.
export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(loginAction, null);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const error = state && !state.ok ? state.error : null;

  return (
    <form action={action} className="login-form">
      <input type="hidden" name="next" value={next ?? ''} />
      <div
        className={cx(
          'overflow-hidden rounded-xl border bg-white transition-shadow focus-within:ring-4',
          error ? 'border-danger/60 focus-within:ring-danger/10' : 'border-black/[0.15] focus-within:border-accent focus-within:ring-accent/15',
        )}
      >
        <Field
          id="username"
          name="username"
          label="Username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          autoFocus
          defaultValue={valueOf(state, 'username')}
          aria-invalid={!!error}
        />
        <div className="relative border-t border-black/[0.1]">
          <Field
            id="password"
            name="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            aria-invalid={!!error}
            className="pr-[92px]"
            onKeyDown={(e) => setCapsLock(e.getModifierState('CapsLock'))}
            onKeyUp={(e) => setCapsLock(e.getModifierState('CapsLock'))}
            onBlur={() => setCapsLock(false)}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-12 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-faint transition-colors hover:text-ink"
          >
            {showPassword ? <EyeOff className="size-[18px]" strokeWidth={1.8} /> : <Eye className="size-[18px]" strokeWidth={1.8} />}
          </button>
          <SubmitArrow />
        </div>
      </div>

      <div className="mt-3 min-h-[20px] text-[13px] leading-[1.45]">
        {error ? (
          <p role="alert" className="text-danger">
            {error}
          </p>
        ) : (
          capsLock && <p className="text-[#c25e00]">Caps Lock is on.</p>
        )}
      </div>

      <p className="mt-6 text-[13px] leading-[1.45] text-muted">
        Forgot your password? Ask a Dazytech admin to reset it for you.
      </p>
    </form>
  );
}

// Abu-abu sampai kedua field terisi, lalu biru. Murni CSS (:has + :placeholder-shown),
// jadi tetap benar saat browser mengisi otomatis dari password manager.
function SubmitArrow() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label="Sign in"
      className={cx(
        'absolute right-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full transition-[background-color,color,transform] active:scale-90',
        'bg-black/[0.06] text-faint',
        '[.login-form:has(#username:not(:placeholder-shown)):has(#password:not(:placeholder-shown))_&]:bg-accent',
        '[.login-form:has(#username:not(:placeholder-shown)):has(#password:not(:placeholder-shown))_&]:text-white',
        'disabled:bg-accent disabled:text-white',
      )}
    >
      {pending ? (
        <span aria-hidden className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      ) : (
        <ArrowRight className="size-[18px]" strokeWidth={2.2} />
      )}
    </button>
  );
}

// Label di dalam field yang naik saat fokus/terisi.
// `placeholder=" "` dibutuhkan agar :placeholder-shown bisa membedakan kosong/terisi.
function Field({
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
        className={cx('peer block h-[56px] w-full bg-transparent px-4 pb-2 pt-6 text-[17px] text-ink outline-none', className)}
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
