'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useRef, useState, useTransition } from 'react';
import { useCompany } from '@/components/admin/company-context';
import { Alert, Badge, Code, EmptyRow, Table, Td, Th, buttonClass, cx } from '@/components/admin/ui';
import { formatDate, formatDateTime, formatNumber } from '@/lib/format';
import type { ImportPreview, ImportSummary, RowStatus } from '@/lib/komisi/import';
import { commitImportAction, previewImportAction } from './actions';
import { ROW_STATUS, ROW_STATUS_ORDER } from './labels';

type Done = { importId: number; summary: ImportSummary };

export function ImportPanel() {
  const router = useRouter();
  const company = useCompany();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [done, setDone] = useState<Done | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<RowStatus | 'all'>('all');
  const [checking, startCheck] = useTransition();
  const [saving, startSave] = useTransition();

  const formData = () => {
    const fd = new FormData();
    if (file) fd.set('file', file);
    fd.set('companyId', String(company?.id ?? ''));
    return fd;
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setFilter('all');
    if (inputRef.current) inputRef.current.value = '';
  };

  const check = () =>
    startCheck(async () => {
      setError(null);
      setDone(null);
      const res = await previewImportAction(formData());
      if (res.ok) {
        setPreview(res.data);
        setFilter('all');
      } else {
        setPreview(null);
        setError(res.error);
      }
    });

  const save = () =>
    startSave(async () => {
      setError(null);
      const res = await commitImportAction(formData());
      if (res.ok) {
        setDone(res.data);
        reset();
        router.refresh();
      } else {
        setError(res.error);
      }
    });

  const rows = useMemo(
    () => (preview ? (filter === 'all' ? preview.rows : preview.rows.filter((r) => r.status === filter)) : []),
    [preview, filter],
  );
  const toWrite = preview ? preview.summary.new + preview.summary.updated : 0;
  const warnings = preview ? preview.rows.filter((r) => r.warning).length : 0;

  return (
    <div className="space-y-4">
      {/* Pilih file */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex h-9 min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-lg border border-dashed border-black/20 bg-pearl px-3 text-[13px] transition-colors hover:border-accent">
          <span className="shrink-0 text-accent">Pilih file…</span>
          <span className={cx('truncate', file ? 'text-ink' : 'text-faint')}>{file ? file.name : 'Export “Rincian Faktur Penjualan” (.xlsx)'}</span>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setPreview(null);
              setDone(null);
              setError(null);
            }}
            className="sr-only"
          />
        </label>
        <button type="button" onClick={check} disabled={!file || checking || saving} className={buttonClass('utility')}>
          {checking ? 'Memeriksa…' : 'Cek file'}
        </button>
      </div>

      {error && <Alert tone="red">{error}</Alert>}

      {done && (
        <Alert tone="green" title="Import tersimpan">
          {done.summary.new} baris baru, {done.summary.updated} diperbarui, {done.summary.duplicate + done.summary.locked} duplikat
          dilewati{done.summary.conflict > 0 && `, ${done.summary.conflict} konflik`}
          {done.summary.error > 0 && `, ${done.summary.error} error`}.{' '}
          <Link href={`/admin/komisi/import/${done.importId}/`} className="underline">
            Lihat detail import #{done.importId}
          </Link>
        </Alert>
      )}

      {preview && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[13px] text-muted">
              <span className="font-semibold text-ink">{preview.fileName}</span> · sheet “{preview.sheetName}” · {preview.summary.total} baris
              faktur
            </p>
            <div className="flex items-center gap-2">
              <button type="button" onClick={reset} disabled={saving} className={buttonClass('ghost')}>
                Batal
              </button>
              <button type="button" onClick={save} disabled={toWrite === 0 || saving} className={buttonClass('primary')}>
                {saving ? 'Menyimpan…' : toWrite === 0 ? 'Tidak ada yang perlu diimport' : `Import ${toWrite} baris`}
              </button>
            </div>
          </div>

          {preview.previousImport && (
            <Alert tone="amber">
              File yang persis sama pernah diimport pada {formatDateTime(new Date(preview.previousImport.createdAt))} (import #
              {preview.previousImport.id}).
            </Alert>
          )}
          {warnings > 0 && (
            <Alert tone="amber">
              {warnings} baris kategori/satuannya belum punya tarif. Tetap disimpan, tapi tidak dihitung sampai tarifnya ditambahkan
              di{' '}
              <Link href="/admin/komisi/master/" className="underline">
                Master Tarif
              </Link>
              .
            </Alert>
          )}

          {/* Filter status (chip pill) */}
          <div className="flex flex-wrap gap-2">
            <FilterChip active={filter === 'all'} onClick={() => setFilter('all')} label="Semua" count={preview.summary.total} />
            {ROW_STATUS_ORDER.filter((s) => preview.summary[s] > 0).map((s) => (
              <FilterChip
                key={s}
                active={filter === s}
                onClick={() => setFilter(s)}
                label={ROW_STATUS[s].label}
                count={preview.summary[s]}
                title={ROW_STATUS[s].hint}
              />
            ))}
          </div>

          <div className="-mx-5 border-t border-black/[0.06]">
            <Table className="max-h-[30rem] overflow-y-auto">
              <thead className="sticky top-0 z-10">
                <tr>
                  <Th>Baris</Th>
                  <Th>Status</Th>
                  <Th>No Inv</Th>
                  <Th>Tgl</Th>
                  <Th>Barang</Th>
                  <Th>Kategori</Th>
                  <Th className="text-right">Qty</Th>
                  <Th>Lunas</Th>
                  <Th>Keterangan</Th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && <EmptyRow colSpan={9}>Tidak ada baris.</EmptyRow>}
                {rows.map((r) => (
                  <tr key={r.rowNumber} className="hover:bg-pearl">
                    <Td className="tabular-nums text-faint">{r.rowNumber}</Td>
                    <Td>
                      <Badge tone={ROW_STATUS[r.status].tone} title={ROW_STATUS[r.status].hint}>
                        {ROW_STATUS[r.status].label}
                      </Badge>
                    </Td>
                    <Td className="whitespace-nowrap tabular-nums">{r.invoiceNo}</Td>
                    <Td className="whitespace-nowrap text-muted">{r.invoiceDate ? formatDate(r.invoiceDate) : '–'}</Td>
                    <Td className="min-w-48">{r.itemName}</Td>
                    <Td>{r.category ? <Code>{r.category}</Code> : '–'}</Td>
                    <Td className="whitespace-nowrap text-right tabular-nums">
                      {r.qty !== null ? (
                        <>
                          {formatNumber(r.qty)} <span className="text-muted">{r.unit}</span>
                        </>
                      ) : (
                        '–'
                      )}
                    </Td>
                    <Td>{r.isUnpaid === null ? '–' : r.isUnpaid ? <Badge tone="amber">Belum</Badge> : <Badge tone="green">Lunas</Badge>}</Td>
                    <Td className="min-w-64 text-[12px]">
                      {r.message && <p className={r.status === 'error' || r.status === 'conflict' ? 'text-danger' : 'text-muted'}>{r.message}</p>}
                      {r.warning && <p className="text-[#7a4f00]">{r.warning}</p>}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}

// Chip pilihan ala configurator: pill hairline, terpilih = ring Action Blue.
function FilterChip({
  active,
  onClick,
  label,
  count,
  title,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className={cx(
        'h-7 rounded-full px-3 text-[12px] transition-[box-shadow,color] active:scale-95',
        active ? 'text-ink ring-2 ring-accent-focus' : 'text-ink-80 ring-1 ring-black/[0.12] hover:ring-black/25',
      )}
    >
      {label} <span className="ml-1 tabular-nums text-muted">{count}</span>
    </button>
  );
}
