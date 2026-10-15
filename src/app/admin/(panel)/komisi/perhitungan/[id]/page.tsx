import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Alert, Code, Page, Panel, Stat, StatStrip, Table, Td, Th, buttonClass } from '@/components/admin/ui';
import { requireUser } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';
import { formatDate, formatDateTime, formatNumber, formatRupiah } from '@/lib/format';
import { getRun } from '@/lib/komisi/runs';
import { VoidRunForm } from './void-form';

export const metadata: Metadata = { title: 'Detail Perhitungan' };

export default async function RunDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ baru?: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const { baru } = await searchParams;
  const runId = Number.parseInt(id, 10);
  if (!Number.isSafeInteger(runId)) notFound();

  const data = getRun(getDb(), runId);
  if (!data) notFound();
  const { run, items, groups } = data;
  const isVoid = run.status === 'void';

  return (
    <Page
      title={run.label}
      description={
        <>
          Perhitungan #{run.id} · dibuat {formatDateTime(run.createdAt)} oleh {run.createdByName ?? '–'}
          {run.note && <> · {run.note}</>}
        </>
      }
      actions={
        <>
          <Link href="/admin/komisi/perhitungan/" className={buttonClass('ghost', 'sm')}>
            ‹ Perhitungan
          </Link>
          <a href={`/admin/komisi/perhitungan/${run.id}/export/`} className={buttonClass('primary', 'sm')}>
            Export Excel
          </a>
        </>
      }
    >
      {baru && !isVoid && (
        <Alert tone="green" title="Perhitungan tersimpan">
          {run.totalLines} baris sudah dikunci dan tidak akan dihitung lagi di periode berikutnya.
        </Alert>
      )}
      {isVoid && (
        <Alert tone="red" title="Perhitungan ini sudah dibatalkan">
          {run.voidedAt && formatDateTime(run.voidedAt)} oleh {run.voidedByName ?? '–'} — alasan: {run.voidReason}. Baris-barisnya
          sudah dilepas dan bisa dihitung ulang. Data di bawah hanya arsip.
        </Alert>
      )}

      <StatStrip>
        <Stat label="Total komisi" tone={isVoid ? 'gray' : 'green'} value={formatRupiah(run.totalAmount)} />
        <Stat label="Baris faktur" value={run.totalLines} />
        <Stat label="Cutoff" value={formatDate(run.cutoffDate)} />
        <Stat label="Status" tone={isVoid ? 'red' : 'green'} value={isVoid ? 'Dibatalkan' : 'Final'} />
      </StatStrip>

      <Panel title="Ringkasan per kategori" description="Tarif = snapshot saat perhitungan disimpan." flush>
        <Table>
          <thead>
            <tr>
              <Th>Kategori</Th>
              <Th className="text-right">Baris</Th>
              <Th className="text-right">Qty</Th>
              <Th className="text-right">Tarif</Th>
              <Th className="text-right">Komisi</Th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <tr key={`${g.category}|${g.unit}|${g.rate}|${g.factor}`} className="hover:bg-pearl">
                <Td>
                  <Code>{g.category}</Code>
                </Td>
                <Td className="text-right tabular-nums">{g.lines}</Td>
                <Td className="whitespace-nowrap text-right tabular-nums">
                  {formatNumber(g.qty)} <span className="text-muted">{g.unit}</span>
                  {g.factor !== 1 && (
                    <span className="block text-[11px] text-muted">
                      = {formatNumber(g.qty * g.factor)} {g.baseUnit}
                    </span>
                  )}
                </Td>
                <Td className="whitespace-nowrap text-right tabular-nums text-muted">
                  {formatRupiah(g.rate)}/{g.baseUnit}
                </Td>
                <Td className="text-right font-semibold tabular-nums">{formatRupiah(g.amount)}</Td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className="px-5 py-3 font-semibold">Total</td>
              <td className="px-4 py-3 text-right font-semibold tabular-nums">{run.totalLines}</td>
              <td colSpan={2} />
              <td className="px-5 py-3 text-right text-[15px] font-semibold tabular-nums">{formatRupiah(run.totalAmount)}</td>
            </tr>
          </tfoot>
        </Table>
      </Panel>

      <Panel title="Rincian baris" description={`${items.length} baris`} flush>
        <Table className="max-h-[36rem] overflow-y-auto">
          <thead className="sticky top-0">
            <tr>
              <Th>Tgl</Th>
              <Th>No Inv</Th>
              <Th>Konsumen</Th>
              <Th>Barang</Th>
              <Th>Kategori</Th>
              <Th className="text-right">Qty</Th>
              <Th className="text-right">Tarif</Th>
              <Th className="text-right">Komisi</Th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.lineId} className="hover:bg-pearl">
                <Td className="whitespace-nowrap text-muted">{formatDate(it.invoiceDate)}</Td>
                <Td className="whitespace-nowrap tabular-nums">{it.invoiceNo}</Td>
                <Td className="max-w-48 truncate">{it.customer ?? '–'}</Td>
                <Td className="min-w-48">{it.itemName}</Td>
                <Td>
                  <Code>{it.category}</Code>
                </Td>
                <Td className="whitespace-nowrap text-right tabular-nums">
                  {formatNumber(it.qty)} <span className="text-muted">{it.unit}</span>
                </Td>
                <Td className="whitespace-nowrap text-right text-[12px] tabular-nums text-muted">
                  {it.factor !== 1 && `${it.factor} × `}
                  {formatRupiah(it.rate)}
                </Td>
                <Td className="text-right tabular-nums">{formatRupiah(it.amount)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Panel>

      {!isVoid && (
        <Panel title="Batalkan" description="Pakai kalau perhitungan ini salah, mis. salah cutoff atau tarif.">
          <VoidRunForm runId={run.id} />
        </Panel>
      )}
    </Page>
  );
}
