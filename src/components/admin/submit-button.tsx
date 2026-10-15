'use client';

import { useRef, useState, type ReactNode } from 'react';
import { useFormStatus } from 'react-dom';
import { ConfirmDialog, type ConfirmOptions } from './confirm-dialog';
import { buttonClass } from './ui';

// Tombol submit yang otomatis non-aktif selama form diproses (cegah klik ganda).
// Dengan `confirm`, klik membuka modal dulu; form baru dikirim setelah disetujui.
export function SubmitButton({
  children,
  pendingText,
  variant = 'primary',
  size = 'md',
  confirm,
  disabled,
  className,
}: {
  children: ReactNode;
  pendingText?: string;
  variant?: 'primary' | 'destructive' | 'secondary' | 'utility' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  confirm?: ConfirmOptions;
  disabled?: boolean;
  className?: string;
}) {
  const { pending } = useFormStatus();
  const [asking, setAsking] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button
        ref={ref}
        type="submit"
        disabled={pending || disabled}
        className={`${buttonClass(variant, size)} ${className ?? ''}`}
        onClick={(e) => {
          if (!confirm) return;
          e.preventDefault();
          // Isian belum valid: tampilkan pesan validasi dulu, jangan tanya.
          const form = ref.current?.form;
          if (form && !form.checkValidity()) {
            form.reportValidity();
            return;
          }
          setAsking(true);
        }}
      >
        {pending ? (pendingText ?? 'Memproses…') : children}
      </button>
      {confirm && (
        <ConfirmDialog
          open={asking}
          options={confirm}
          onCancel={() => setAsking(false)}
          onConfirm={() => {
            setAsking(false);
            // requestSubmit tidak memicu onClick lagi, dan tetap menjalankan
            // validasi form + action React (useFormStatus ikut pending).
            ref.current?.form?.requestSubmit(ref.current);
          }}
        />
      )}
    </>
  );
}
