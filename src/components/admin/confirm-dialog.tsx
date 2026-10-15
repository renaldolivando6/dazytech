'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { buttonClass, cx } from './ui';

export type ConfirmOptions = {
  title: string;
  message?: ReactNode;
  confirmLabel?: string;
  // true = aksi merusak (hapus/batalkan): tombol konfirmasi merah.
  destructive?: boolean;
};

// Modal konfirmasi pengganti window.confirm. Memakai <dialog> native:
// Esc menutup, fokus terkunci di dalam modal, latar tidak bisa diklik.
// Dirender lewat portal hanya saat terbuka (tidak ada beda SSR vs client),
// ke #admin-root supaya variabel font Inter ikut terbawa.
export function ConfirmDialog({
  open,
  options,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  options: ConfirmOptions;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (open && dialog && !dialog.open) dialog.showModal();
  }, [open]);

  if (!open) return null;

  return createPortal(
    <dialog
      ref={ref}
      aria-labelledby="confirm-title"
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      // Klik di luar kartu (di backdrop) = batal.
      onClick={(e) => {
        if (e.target === ref.current) onCancel();
      }}
      className={cx(
        'm-auto w-[calc(100%-2rem)] max-w-[380px] rounded-[18px] border border-black/[0.08] bg-white p-0 font-admin text-ink',
        'backdrop:bg-black/30 backdrop:backdrop-blur-sm',
      )}
    >
      <div className="px-6 pb-5 pt-6 text-center">
        <h2 id="confirm-title" className="text-[17px] font-semibold leading-[1.24] tracking-[-0.01em]">
          {options.title}
        </h2>
        {options.message && <div className="mt-2 text-[13px] leading-[1.45] text-muted">{options.message}</div>}
      </div>
      <div className="flex gap-2 px-6 pb-6">
        <button type="button" onClick={onCancel} className={cx(buttonClass('secondary'), 'flex-1')}>
          Batal
        </button>
        <button
          type="button"
          autoFocus
          onClick={onConfirm}
          className={cx(buttonClass(options.destructive ? 'destructive' : 'primary'), 'flex-1')}
        >
          {options.confirmLabel ?? 'Lanjutkan'}
        </button>
      </div>
    </dialog>,
    document.getElementById('admin-root') ?? document.body,
  );
}
