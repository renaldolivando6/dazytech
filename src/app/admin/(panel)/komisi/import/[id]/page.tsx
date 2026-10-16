import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Badge, EmptyRow, Page, Panel, Table, Tabs, Td, Th } from '@/components/admin/ui';
import { requireCompany } from '@/lib/company';
import { getDb } from '@/lib/db/client';
import { formatDateTime } from '@/lib/format';
import type { RowStatus } from '@/lib/komisi/import';
import { getImport } from '@/lib/komisi/queries';
import { ROW_STATUS, ROW_STATUS_ORDER } from '../../labels';

export const metadata: Metadata = { title: 'Detail Import' };

export default async function ImportDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { company } = await requireCompany();
  const { id } = await params;
  const { status: rawStatus } = await searchParams;
  const importId = Number.parseInt(id, 10);
  if (!Number.isSafeInteger(importId)) notFound();

  const status: RowStatus | 'all' = (ROW_STATUS_ORDER as string[]).includes(rawStatus ?? '') ? (rawStatus as RowStatus) : 'all';
  const imp = getImport(getDb(), company.id, importId, status);
  if (!imp) notFound();

  const counts: Record<RowStatus, number> = {
    new: imp.rowsNew,
    updated: imp.rowsUpdated,
    duplicate: imp.rowsDuplicate,
    locked: imp.rowsLocked,
    conflict: imp.rowsConflict,
    error: imp.rowsError,
  };

  return (
    <Page
      title={`Import #${imp.id}`}
      back={{ href: '/admin/komisi/', label: 'Import & Data' }}
      description={
        <>
          {imp.fileName} · {formatDateTime(imp.createdAt)} · oleh {imp.importedByName ?? '–'}
        </>
      }
    >
      <Panel flush>
        <div className="px-5 py-3">
          <Tabs
            items={[
              { href: `/admin/komisi/import/${imp.id}/`, label: 'Semua', active: status === 'all', count: imp.rowsTotal },
              ...ROW_STATUS_ORDER.filter((s) => counts[s] > 0).map((s) => ({
                href: `/admin/komisi/import/${imp.id}/?status=${s}`,
                label: ROW_STATUS[s].label,
                active: status === s,
                count: counts[s],
              })),
            ]}
          />
        </div>
        <Table>
          <thead>
            <tr>
              <Th>Baris Excel</Th>
              <Th>Status</Th>
              <Th>No Inv</Th>
              <Th>Barang</Th>
              <Th>Keterangan</Th>
            </tr>
          </thead>
          <tbody>
            {imp.rows.length === 0 && <EmptyRow colSpan={5}>Tidak ada baris.</EmptyRow>}
            {imp.rows.map((r) => (
              <tr key={r.id} className="hover:bg-pearl">
                <Td className="tabular-nums text-faint">{r.rowNumber}</Td>
                <Td>
                  <Badge tone={ROW_STATUS[r.status].tone} title={ROW_STATUS[r.status].hint}>
                    {ROW_STATUS[r.status].label}
                  </Badge>
                </Td>
                <Td className="whitespace-nowrap tabular-nums">{r.invoiceNo ?? '–'}</Td>
                <Td>{r.itemName ?? '–'}</Td>
                <Td className={r.status === 'error' || r.status === 'conflict' ? 'text-[12px] text-danger' : 'text-[12px] text-muted'}>
                  {r.message ?? ''}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Panel>
    </Page>
  );
}
