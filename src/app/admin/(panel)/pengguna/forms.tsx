'use client';

import { useActionState, useEffect, useRef, useState, useTransition, type ReactNode } from 'react';
import { SubmitButton } from '@/components/admin/submit-button';
import { Alert, Badge, Td, buttonClass, cx, inputClass, inputSmClass, labelClass } from '@/components/admin/ui';
import { valueOf } from '@/lib/action-result';
import { APPS, type AppKey, type Role } from '@/lib/auth/apps';
import { createUserAction, deleteUserAction, resetPasswordAction, saveAccessAction } from './actions';

// ---------------------------------------------------------------- dialog

// <dialog> native (Esc menutup, fokus terkunci), gaya sama dengan ConfirmDialog.
function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-[420px] rounded-[18px] border border-black/[0.08] bg-white p-0 font-admin text-ink backdrop:bg-black/30 backdrop:backdrop-blur-sm"
    >
      {open && (
        <div className="px-6 pb-6 pt-5">
          <h2 className="text-[17px] font-semibold leading-[1.24] tracking-[-0.01em]">{title}</h2>
          <div className="mt-4">{children}</div>
        </div>
      )}
    </dialog>
  );
}

function PasswordReveal({ username, password, onDone }: { username: string; password: string; onDone: () => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="space-y-4">
      <p className="text-[13px] leading-[1.45] text-muted">
        Password awal untuk <span className="font-semibold text-ink">{username}</span>. Berikan ke yang bersangkutan. Password ini hanya tampil
        sekali dan wajib diganti saat login pertama.
      </p>
      <div className="flex items-center gap-2 rounded-xl bg-parchment px-4 py-3">
        <span className="min-w-0 flex-1 select-all break-all font-mono text-[17px] font-semibold tracking-normal">{password}</span>
        <button
          type="button"
          onClick={() => navigator.clipboard?.writeText(password).then(() => setCopied(true))}
          className={buttonClass('ghost', 'sm')}
        >
          {copied ? 'Tersalin' : 'Salin'}
        </button>
      </div>
      <button type="button" autoFocus onClick={onDone} className={cx(buttonClass('primary'), 'w-full')}>
        Selesai
      </button>
    </div>
  );
}

// ---------------------------------------------------------------- tambah pengguna

export function CreateUserButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={buttonClass('primary')}>
        Tambah pengguna
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Tambah pengguna">
        {/* Dirender ulang setiap dibuka, jadi isian & hasil sebelumnya hilang. */}
        <CreateUserForm onDone={() => setOpen(false)} />
      </Modal>
    </>
  );
}

function CreateUserForm({ onDone }: { onDone: () => void }) {
  const [state, action] = useActionState(createUserAction, null);
  const [role, setRole] = useState<Role>('member');
  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined;

  if (state?.ok && state.data) return <PasswordReveal username={state.data.username} password={state.data.password} onDone={onDone} />;

  return (
    <form action={action} className="space-y-4">
      {state && !state.ok && !fieldErrors && <Alert tone="red">{state.error}</Alert>}
      <div>
        <label htmlFor="new-username" className={labelClass}>
          Username
        </label>
        <input
          id="new-username"
          name="username"
          required
          autoFocus
          maxLength={32}
          autoComplete="off"
          placeholder="mis. okta"
          defaultValue={valueOf(state, 'username')}
          className={inputClass}
        />
        {fieldErrors?.username && <p className="mt-1 text-[12px] text-danger">{fieldErrors.username}</p>}
      </div>
      <div>
        <p className={labelClass}>Peran</p>
        <div className="grid grid-cols-2 gap-0.5 rounded-lg bg-black/[0.05] p-0.5">
          {(
            [
              ['member', 'Anggota'],
              ['admin', 'Admin'],
            ] as const
          ).map(([value, label]) => (
            <label
              key={value}
              className={cx(
                'cursor-pointer rounded-md py-1.5 text-center text-[13px] transition-colors',
                role === value ? 'bg-white font-semibold text-ink ring-1 ring-black/[0.06]' : 'text-ink-80 hover:text-ink',
              )}
            >
              <input type="radio" name="role" value={value} checked={role === value} onChange={() => setRole(value)} className="sr-only" />
              {label}
            </label>
          ))}
        </div>
      </div>
      <div>
        <p className={labelClass}>Akses aplikasi</p>
        {role === 'admin' ? (
          <p className="text-[13px] text-muted">Admin otomatis bisa membuka semua aplikasi dan mengelola pengguna.</p>
        ) : (
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {APPS.map((app) => (
              <label key={app.key} className="flex items-center gap-2 text-[13px]">
                <input type="checkbox" name="apps" value={app.key} className="size-4 accent-[var(--color-accent)]" />
                {app.name}
              </label>
            ))}
          </div>
        )}
      </div>
      <p className="text-[12px] text-muted">Password awal dibuat otomatis.</p>
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onDone} className={cx(buttonClass('secondary'), 'flex-1')}>
          Batal
        </button>
        <SubmitButton pendingText="Membuat…" className="flex-1">
          Tambah
        </SubmitButton>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------- baris tabel

export type UserRowData = {
  id: number;
  username: string;
  role: Role;
  apps: AppKey[];
  mustChangePassword: boolean;
  createdAt: string;
};

// Peran & akses tersimpan otomatis saat diubah. Kalau ditolak server (mis.
// admin terakhir), tampilan kembali ke data yang tersimpan.
export function UserRow({ user, isSelf }: { user: UserRowData; isSelf: boolean }) {
  const [role, setRole] = useState<Role>(user.role);
  const [apps, setApps] = useState<AppKey[]>(user.apps);
  const [saveState, saveAction, saving] = useActionState(saveAccessAction, null);
  const [resetState, resetAction] = useActionState(resetPasswordAction, null);
  const [deleteState, deleteAction] = useActionState(deleteUserAction, null);
  const [, startTransition] = useTransition();
  const [revealed, setRevealed] = useState<string | null>(null);
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    if (saveState && !saveState.ok) {
      setRole(user.role);
      setApps(user.apps);
    }
    if (saveState?.ok) {
      setShowSaved(true);
      const t = setTimeout(() => setShowSaved(false), 2000);
      return () => clearTimeout(t);
    }
    // Hanya bereaksi pada hasil simpan baru, bukan saat data user berubah.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveState]);

  useEffect(() => {
    if (resetState?.ok && resetState.data) setRevealed(resetState.data.password);
  }, [resetState]);

  function save(nextRole: Role, nextApps: AppKey[]) {
    setRole(nextRole);
    setApps(nextApps);
    const fd = new FormData();
    fd.set('id', String(user.id));
    fd.set('role', nextRole);
    for (const a of nextApps) fd.append('apps', a);
    startTransition(() => saveAction(fd));
  }

  const error = [saveState, resetState, deleteState].map((s) => (s && !s.ok ? s.error : null)).find(Boolean);

  return (
    <tr className={cx('hover:bg-pearl', saving && 'opacity-60')}>
      <Td>
        <div className="flex items-center gap-3">
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-black/[0.05] text-[12px] font-semibold text-ink-80">
            {user.username.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="font-semibold">
              {user.username}
              {isSelf && <span className="ml-1 font-normal text-muted">(Anda)</span>}
            </p>
            {error ? (
              <p className="text-[12px] text-danger">{error}</p>
            ) : (
              showSaved && <p className="text-[12px] text-[#248a3d]">Tersimpan</p>
            )}
          </div>
        </div>
      </Td>
      <Td>
        <select
          aria-label={`Peran ${user.username}`}
          value={role}
          disabled={isSelf || saving}
          onChange={(e) => save(e.target.value as Role, apps)}
          className={`${inputSmClass} w-[112px]`}
        >
          <option value="member">Anggota</option>
          <option value="admin">Admin</option>
        </select>
      </Td>
      {APPS.map((app) => (
        <Td key={app.key} className="text-center">
          <input
            type="checkbox"
            aria-label={`Akses ${app.name} untuk ${user.username}`}
            title={role === 'admin' ? 'Admin otomatis punya semua akses' : undefined}
            checked={role === 'admin' || apps.includes(app.key)}
            disabled={role === 'admin' || saving}
            onChange={(e) => save(role, e.target.checked ? [...apps, app.key] : apps.filter((a) => a !== app.key))}
            className="size-4 accent-[var(--color-accent)] disabled:opacity-50"
          />
        </Td>
      ))}
      <Td>{user.mustChangePassword ? <Badge tone="amber">Belum ganti password</Badge> : <Badge tone="green">Aktif</Badge>}</Td>
      <Td className="whitespace-nowrap text-muted">{user.createdAt}</Td>
      <Td>
        {isSelf ? (
          <span className="block text-right text-[12px] text-faint">-</span>
        ) : (
          <div className="flex justify-end gap-1">
            <form action={resetAction}>
              <input type="hidden" name="id" value={user.id} />
              <SubmitButton
                variant="ghost"
                size="sm"
                pendingText="Membuat…"
                confirm={{
                  title: `Reset password ${user.username}?`,
                  message: 'Password baru dibuat otomatis, sesi yang sedang login dikeluarkan, dan wajib diganti saat login berikutnya.',
                  confirmLabel: 'Reset password',
                }}
              >
                Reset password
              </SubmitButton>
            </form>
            <form action={deleteAction}>
              <input type="hidden" name="id" value={user.id} />
              <SubmitButton
                variant="danger"
                size="sm"
                pendingText="Menghapus…"
                confirm={{
                  title: `Hapus ${user.username}?`,
                  message: 'Akun ini tidak bisa login lagi. Riwayat import dan perhitungan yang pernah dibuatnya tetap ada.',
                  confirmLabel: 'Hapus',
                  destructive: true,
                }}
              >
                Hapus
              </SubmitButton>
            </form>
            <Modal open={revealed !== null} onClose={() => setRevealed(null)} title="Password baru">
              {revealed && <PasswordReveal username={user.username} password={revealed} onDone={() => setRevealed(null)} />}
            </Modal>
          </div>
        )}
      </Td>
    </tr>
  );
}
