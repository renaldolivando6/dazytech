'use client';

import { useActionState, useEffect, useState } from 'react';
import { SubmitButton } from '@/components/admin/submit-button';
import { Badge, Code, EmptyRow, Table, Td, Th, buttonClass, cx, inputSmClass } from '@/components/admin/ui';
import { valueOf, type ActionState } from '@/lib/action-result';
import { formatRupiah } from '@/lib/format';
import {
  addConversionAction,
  createCategoryAction,
  deleteCategoryAction,
  deleteConversionAction,
  updateCategoryAction,
} from './actions';

export type MasterCategory = {
  id: number;
  code: string;
  label: string;
  baseUnit: string;
  rate: number;
  isActive: boolean;
  conversions: { id: number; unit: string; factor: number }[];
};

// Input ringkas untuk dalam baris tabel (lebar ditentukan per kolom).
const cellInput = inputSmClass;

function FieldError({ state, name }: { state: ActionState; name: string }) {
  const msg = state && !state.ok ? state.fieldErrors?.[name] : undefined;
  return msg ? <p className="mt-1 text-[11px] text-danger">{msg}</p> : null;
}

function FormError({ state }: { state: ActionState }) {
  return state && !state.ok && !state.fieldErrors ? <p className="mt-1 text-[11px] text-danger">{state.error}</p> : null;
}

export function MasterTable({
  categories,
  prefillCode,
  prefillUnit,
}: {
  categories: MasterCategory[];
  prefillCode?: string;
  prefillUnit?: string;
}) {
  const [adding, setAdding] = useState(Boolean(prefillCode));

  return (
    <>
      <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-4">
        <div>
          <h2 className="text-[14px] font-semibold">Tarif per kategori</h2>
          <p className="mt-0.5 text-[12px] text-muted">Kode = persis nilai kolom KATEGORI di Excel. Tarif dalam rupiah per satuan dasar.</p>
        </div>
        {!adding && (
          <button type="button" onClick={() => setAdding(true)} className={buttonClass('primary', 'sm')}>
            Tambah kategori
          </button>
        )}
      </div>
      <Table>
        <thead>
          <tr>
            <Th className="w-[30%]">Kategori</Th>
            <Th>Satuan dasar</Th>
            <Th className="text-right">Tarif</Th>
            <Th>Satuan lain</Th>
            <Th>Status</Th>
            <Th className="text-right">
              <span className="sr-only">Aksi</span>
            </Th>
          </tr>
        </thead>
        <tbody>
          {adding && <AddRow defaultCode={prefillCode} defaultUnit={prefillUnit} onDone={() => setAdding(false)} />}
          {categories.length === 0 && !adding && <EmptyRow colSpan={6}>Belum ada kategori.</EmptyRow>}
          {categories.map((c) => (
            <CategoryRow key={c.id} category={c} />
          ))}
        </tbody>
      </Table>
    </>
  );
}

// ---------------------------------------------------------------- baris kategori

function CategoryRow({ category: c }: { category: MasterCategory }) {
  const [editing, setEditing] = useState(false);
  const [state, action] = useActionState(updateCategoryAction, null);
  const formId = `cat-${c.id}`;

  useEffect(() => {
    if (state?.ok) setEditing(false);
  }, [state]);

  if (!editing) {
    return (
      <tr className={cx('hover:bg-pearl', !c.isActive && 'text-muted')}>
        <Td>
          <span className="inline-flex items-center gap-2">
            <span className="font-semibold">{c.label}</span>
            <Code>{c.code}</Code>
          </span>
        </Td>
        <Td>{c.baseUnit}</Td>
        <Td className="whitespace-nowrap text-right tabular-nums">
          {formatRupiah(c.rate)} <span className="text-muted">/ {c.baseUnit}</span>
        </Td>
        <Td>
          <Conversions category={c} />
        </Td>
        <Td>{c.isActive ? <Badge tone="green">Aktif</Badge> : <Badge>Nonaktif</Badge>}</Td>
        <Td className="text-right">
          <button type="button" onClick={() => setEditing(true)} className={buttonClass('ghost', 'sm')}>
            Edit
          </button>
        </Td>
      </tr>
    );
  }

  return (
    <tr className="bg-pearl align-top">
      <Td className="align-top">
        <div className="flex items-center gap-2">
          <Code>{c.code}</Code>
          <input
            form={formId}
            name="label"
            aria-label="Nama tampilan"
            defaultValue={valueOf(state, 'label', c.label)}
            required
            autoFocus
            className={`${cellInput} min-w-0 flex-1`}
          />
        </div>
        <FieldError state={state} name="label" />
      </Td>
      <Td className="align-top">
        <input
          form={formId}
          name="baseUnit"
          aria-label="Satuan dasar"
          defaultValue={valueOf(state, 'baseUnit', c.baseUnit)}
          required
          className={`${cellInput} w-24 uppercase`}
        />
        <FieldError state={state} name="baseUnit" />
      </Td>
      <Td className="align-top">
        <input
          form={formId}
          name="rate"
          type="number"
          min={0}
          step={1}
          aria-label="Tarif"
          defaultValue={valueOf(state, 'rate', String(c.rate))}
          required
          className={`${cellInput} ml-auto w-28 text-right tabular-nums`}
        />
        <FieldError state={state} name="rate" />
      </Td>
      <Td className="align-top">
        <Conversions category={c} />
      </Td>
      <Td className="align-top">
        <label className="flex h-8 items-center gap-2 text-[13px]">
          <input form={formId} type="checkbox" name="isActive" defaultChecked={c.isActive} className="size-4 accent-accent" />
          Aktif
        </label>
      </Td>
      <Td className="align-top">
        <div className="flex items-center justify-end gap-1">
          <form id={formId} action={action}>
            <input type="hidden" name="id" value={c.id} />
            <SubmitButton size="sm" pendingText="…">
              Simpan
            </SubmitButton>
          </form>
          <button type="button" onClick={() => setEditing(false)} className={buttonClass('ghost', 'sm')}>
            Batal
          </button>
          <form action={deleteCategoryAction}>
            <input type="hidden" name="id" value={c.id} />
            <SubmitButton
              variant="danger"
              size="sm"
              pendingText="…"
              confirm={{
                title: `Hapus kategori ${c.code}?`,
                message: `Baris ${c.code} yang belum dikomisikan jadi "tanpa tarif". Perhitungan yang sudah disimpan tidak berubah.`,
                confirmLabel: 'Hapus',
                destructive: true,
              }}
            >
              Hapus
            </SubmitButton>
          </form>
        </div>
        <FormError state={state} />
      </Td>
    </tr>
  );
}

// ---------------------------------------------------------------- satuan lain (konversi)

// Hanya perlu kalau barang kategori ini juga muncul di Excel dengan satuan
// lain, mis. DURON per KTK (isi 5 PCS).
function Conversions({ category: c }: { category: MasterCategory }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(addConversionAction, null);

  useEffect(() => {
    if (state?.ok) setOpen(false);
  }, [state]);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {c.conversions.map((u) => (
        <form key={u.id} action={deleteConversionAction} className="inline-flex">
          <input type="hidden" name="id" value={u.id} />
          <span className="inline-flex h-6 items-center gap-1 rounded-full bg-black/[0.05] pl-2.5 pr-1 text-[12px] text-ink-80">
            1 {u.unit} = {u.factor} {c.baseUnit}
            <SubmitButton
              variant="ghost"
              size="sm"
              pendingText="…"
              confirm={{
                title: `Hapus satuan ${u.unit}?`,
                message: `Baris ${c.code} bersatuan ${u.unit} yang belum dikomisikan jadi "tanpa tarif".`,
                confirmLabel: 'Hapus',
                destructive: true,
              }}
              className="h-5! rounded-full! px-1! text-muted!"
            >
              ×
            </SubmitButton>
          </span>
        </form>
      ))}

      {open ? (
        <form action={action} className="flex flex-wrap items-center gap-1.5">
          <input type="hidden" name="categoryId" value={c.id} />
          <span className="text-[12px] text-muted">1</span>
          <input
            name="unit"
            aria-label="Satuan"
            placeholder="KTK"
            defaultValue={valueOf(state, 'unit')}
            required
            autoFocus
            className={`${cellInput} w-20 uppercase`}
          />
          <span className="text-[12px] text-muted">=</span>
          <input
            name="factor"
            type="number"
            min={1}
            step={1}
            aria-label="Isi"
            placeholder="isi"
            defaultValue={valueOf(state, 'factor')}
            required
            className={`${cellInput} w-16 text-right`}
          />
          <span className="text-[12px] text-muted">{c.baseUnit}</span>
          <SubmitButton size="sm" pendingText="…">
            Simpan
          </SubmitButton>
          <button type="button" onClick={() => setOpen(false)} className={buttonClass('ghost', 'sm')}>
            Batal
          </button>
          {state && !state.ok && (
            <p className="w-full text-[11px] text-danger">{state.fieldErrors?.unit ?? state.fieldErrors?.factor ?? state.error}</p>
          )}
        </form>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="h-6 rounded-full px-2 text-[12px] text-accent hover:bg-accent/5">
          + satuan
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- tambah kategori

function AddRow({ defaultCode, defaultUnit, onDone }: { defaultCode?: string; defaultUnit?: string; onDone: () => void }) {
  const [state, action] = useActionState(createCategoryAction, null);
  const formId = 'cat-new';

  useEffect(() => {
    if (state?.ok) onDone();
  }, [state, onDone]);

  return (
    <tr className="bg-accent/[0.03] align-top">
      <Td className="align-top">
        <div className="flex gap-2">
          <div className="w-36 shrink-0">
            <input
              form={formId}
              name="code"
              aria-label="Kode KATEGORI"
              placeholder="KODE (mis. KOPI)"
              defaultValue={valueOf(state, 'code', defaultCode)}
              required
              autoFocus
              className={`${cellInput} w-full uppercase`}
            />
            <FieldError state={state} name="code" />
          </div>
          <div className="min-w-0 flex-1">
            <input
              form={formId}
              name="label"
              aria-label="Nama tampilan"
              placeholder="Nama tampilan"
              defaultValue={valueOf(state, 'label')}
              required
              className={`${cellInput} w-full`}
            />
            <FieldError state={state} name="label" />
          </div>
        </div>
      </Td>
      <Td className="align-top">
        <input
          form={formId}
          name="baseUnit"
          aria-label="Satuan dasar"
          placeholder="PCS"
          defaultValue={valueOf(state, 'baseUnit', defaultUnit)}
          required
          className={`${cellInput} w-24 uppercase`}
        />
        <FieldError state={state} name="baseUnit" />
      </Td>
      <Td className="align-top">
        <input
          form={formId}
          name="rate"
          type="number"
          min={0}
          step={1}
          aria-label="Tarif"
          placeholder="0"
          defaultValue={valueOf(state, 'rate')}
          required
          className={`${cellInput} ml-auto w-28 text-right tabular-nums`}
        />
        <FieldError state={state} name="rate" />
      </Td>
      <Td className="align-top text-[12px] text-muted">
        <span className="flex h-8 items-center">bisa ditambah setelah disimpan</span>
      </Td>
      <Td className="align-top">
        <span className="flex h-8 items-center">
          <Badge tone="green">Aktif</Badge>
        </span>
      </Td>
      <Td className="align-top">
        <div className="flex items-center justify-end gap-1">
          <form id={formId} action={action}>
            <SubmitButton size="sm" pendingText="…">
              Tambah
            </SubmitButton>
          </form>
          <button type="button" onClick={onDone} className={buttonClass('ghost', 'sm')}>
            Batal
          </button>
        </div>
        <FormError state={state} />
      </Td>
    </tr>
  );
}
