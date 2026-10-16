import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge, Code, EmptyRow, Page, Pagination, Panel, Stat, StatStrip, Table, Tabs, Td, Th, buttonClass, searchInputClass } from '@/components/admin/ui';
import { requireCompany } from '@/lib/company';
import { getDb } from '@/lib/db/client';
import { formatDate, formatDateTime, formatNumber, formatRupiah, jakartaToday } from '@/lib/format';
import { getOverview, LINE_FILTERS, listImports, listLines, type LineFilter } from '@/lib/komisi/queries';
import { ImportPanel } from './import-panel';
import { LINE_STATE } from './labels';

export const metadata: Metadata = { title: 'Import & Data Komisi' };

const PAGE_SIZE = 50;
const FILTER_LABEL: Record<LineFilter, string> = {
  all: 'Semua',
  ready: 'Siap dihitung',
  unpaid: 'Belum lunas',
  no_rate: 'Tanpa tarif',
  done: 'Dikomisikan',
};

type SearchParams = Promise<{ status?: string; q?: string; page?: string }>;

export default async function KomisiPage({ searchParams }: { searchParams: SearchParams }) {
  const { company } = await requireCompany();
  const sp = await searchParams;
  const filter: LineFilter = (LINE_FILTERS as readonly string[]).includes(sp.status ?? '') ? (sp.status as LineFilter) : 'all';
  const q = (sp.q ?? '').slice(0, 100);
  const page = Math.max(1, Number.parseInt(sp.page ?? '1', 10) || 1);

  const db = getDb();
  const overview = getOverview(db, company.id, jakartaToday());
  const imports = listImports(db, company.id, 10);
  const lines = listLines(db, company.id, { filter, q, page, pageSize: PAGE_SIZE });
  const noRateLines = overview.noRate.reduce((s, g) => s + g.lines, 0);

  const hrefFor = (next: { status?: LineFilter; page?: number }) => {
    const params = new URLSearchParams();
    const status = next.status ?? filter;
    if (status !== 'all') params.set('status', status);
    if (q) params.set('q', q);
    if (next.page && next.page > 1) params.set('page', String(next.page));
    const s = params.toString();
    return `/admin/komisi/${s ? `?${s}` : ''}#data`;
  };

  return (
    <Page
      title="Import & Data"
      back={{ href: '/admin/', label: 'Portal' }}
      description={`${company.name} · Import export Accurate, cek duplikat, dan pantau baris mana yang siap dihitung komisinya.`}
      actions={
        <Link href="/admin/komisi/perhitungan/" className={buttonClass('primary', 'sm')}>
          Hitung komisi
        </Link>
      }
    >
      <StatStrip>
        <Stat
          label="Siap dihitung"
          tone="green"
          value={formatRupiah(overview.ready.amount)}
          hint={`${overview.ready.lines} baris lunas, belum dikomisikan`}
          href={hrefFor({ status: 'ready' })}
        />
        <Stat
          label="Menunggu lunas"
          tone="amber"
          value={formatRupiah(overview.unpaid.amount)}
          hint={`${overview.unpaid.lines} baris · ikut periode berikutnya setelah lunas`}
          href={hrefFor({ status: 'unpaid' })}
        />
        <Stat
          label="Tanpa tarif"
          tone={noRateLines > 0 ? 'red' : 'gray'}
          value={noRateLines}
          hint={
            noRateLines > 0
              ? `Lunas, belum ada tarif: ${overview.noRate.map((g) => `${g.category}/${g.unit}`).join(', ')}`
              : 'Semua baris lunas sudah punya tarif'
          }
          href={noRateLines > 0 ? '/admin/komisi/master/' : undefined}
        />
        <Stat
          label="Sudah dikomisikan"
          tone="blue"
          value={formatRupiah(overview.done.amount)}
          hint={`${overview.done.lines} baris dalam ${overview.done.runs} perhitungan`}
          href="/admin/komisi/perhitungan/"
        />
      </StatStrip>

      <Panel title="Import file Excel" description="Cek file dulu tanpa menyimpan, lalu import baris yang baru atau berubah.">
        <ImportPanel />
      </Panel>

      <Panel title="Riwayat import" description="10 import terakhir" flush>
        <Table>
          <thead>
            <tr>
              <Th>#</Th>
              <Th>Waktu</Th>
              <Th>File</Th>
              <Th>Oleh</Th>
              <Th className="text-right">Baris</Th>
              <Th>Hasil</Th>
            </tr>
          </thead>
          <tbody>
            {imports.length === 0 && <EmptyRow colSpan={6}>Belum ada import.</EmptyRow>}
            {imports.map((imp) => (
              <tr key={imp.id} className="hover:bg-pearl">
                <Td>
                  <Link href={`/admin/komisi/import/${imp.id}/`} className="text-accent hover:underline">
                    #{imp.id}
                  </Link>
                </Td>
                <Td className="whitespace-nowrap">{formatDateTime(imp.createdAt)}</Td>
                <Td className="max-w-xs truncate">{imp.fileName}</Td>
                <Td className="text-muted">{imp.importedBy ?? '–'}</Td>
                <Td className="text-right tabular-nums">{imp.rowsTotal}</Td>
                <Td>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {imp.rowsNew > 0 && <Badge tone="green">{imp.rowsNew} baru</Badge>}
                    {imp.rowsUpdated > 0 && <Badge tone="blue">{imp.rowsUpdated} diperbarui</Badge>}
                    {imp.rowsDuplicate + imp.rowsLocked > 0 && <Badge>{imp.rowsDuplicate + imp.rowsLocked} duplikat</Badge>}
                    {imp.rowsConflict > 0 && <Badge tone="amber">{imp.rowsConflict} konflik</Badge>}
                    {imp.rowsError > 0 && <Badge tone="red">{imp.rowsError} error</Badge>}
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Panel>

      <div id="data" className="scroll-mt-28">
        <Panel
          title="Data faktur"
          description={`${formatNumber(overview.totalLines)} baris tersimpan`}
          flush
          actions={
            <form className="w-full sm:w-auto" action="/admin/komisi/#data">
              {filter !== 'all' && <input type="hidden" name="status" value={filter} />}
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder="Cari no inv, konsumen, barang"
                aria-label="Cari"
                className={`${searchInputClass} w-full sm:w-64`}
              />
            </form>
          }
        >
          <div className="px-5 pb-3">
            <Tabs
              items={LINE_FILTERS.map((f) => ({
                href: hrefFor({ status: f, page: 1 }),
                label: FILTER_LABEL[f],
                active: f === filter,
              }))}
            />
          </div>
          <Table>
            <thead>
              <tr>
                <Th>Tgl</Th>
                <Th>No Inv</Th>
                <Th>Konsumen</Th>
                <Th>Barang</Th>
                <Th>Kategori</Th>
                <Th className="text-right">Qty</Th>
                <Th>Sales</Th>
                <Th>Status</Th>
                <Th className="text-right">Komisi</Th>
              </tr>
            </thead>
            <tbody>
              {lines.rows.length === 0 && (
                <EmptyRow colSpan={9}>{overview.totalLines === 0 ? 'Belum ada data. Import file Excel di atas.' : 'Tidak ada baris yang cocok.'}</EmptyRow>
              )}
              {lines.rows.map((l) => (
                <tr key={l.id} className="hover:bg-pearl">
                  <Td className="whitespace-nowrap text-muted">{formatDate(l.invoiceDate)}</Td>
                  <Td className="whitespace-nowrap tabular-nums">{l.invoiceNo}</Td>
                  <Td className="max-w-48 truncate">{l.customer ?? '–'}</Td>
                  <Td className="min-w-48">{l.itemName}</Td>
                  <Td>
                    <Code>{l.category}</Code>
                  </Td>
                  <Td className="whitespace-nowrap text-right tabular-nums">
                    {formatNumber(l.qty)} <span className="text-muted">{l.unit}</span>
                  </Td>
                  <Td className="whitespace-nowrap text-muted">{l.salesperson ?? '–'}</Td>
                  <Td>
                    {l.state === 'done' ? (
                      <Link href={`/admin/komisi/perhitungan/${l.commissionRunId}/`} className="hover:underline">
                        <Badge tone={LINE_STATE.done.tone}>Dikomisikan #{l.commissionRunId}</Badge>
                      </Link>
                    ) : (
                      <Badge tone={LINE_STATE[l.state].tone} title={l.rateNote ?? undefined}>
                        {LINE_STATE[l.state].label}
                      </Badge>
                    )}
                  </Td>
                  <Td className="whitespace-nowrap text-right tabular-nums">
                    {l.amount === null ? (
                      <span className="text-faint">–</span>
                    ) : l.state === 'done' ? (
                      formatRupiah(l.amount)
                    ) : (
                      <span className="text-muted">≈ {formatRupiah(l.amount)}</span>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Pagination page={page} pageSize={PAGE_SIZE} total={lines.total} hrefFor={(p) => hrefFor({ page: p })} />
        </Panel>
      </div>
    </Page>
  );
}
