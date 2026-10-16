import type { Metadata } from 'next';
import Link from 'next/link';
import { Alert, Badge, Code, EmptyRow, Page, Panel, Stat, StatStrip, Table, Td, Th, buttonClass, cx, inputSmClass } from '@/components/admin/ui';
import { requireCompany } from '@/lib/company';
import { getDb } from '@/lib/db/client';
import { defaultCutoff, defaultRunLabel, formatDate, formatDateTime, formatNumber, formatRupiah, isIsoDate, jakartaToday } from '@/lib/format';
import { listRuns, previewRun } from '@/lib/komisi/runs';
import { SaveRunForm } from './save-run-form';

export const metadata: Metadata = { title: 'Perhitungan Komisi' };

export default async function PerhitunganPage({ searchParams }: { searchParams: Promise<{ cutoff?: string }> }) {
  const { company } = await requireCompany();
  const { cutoff: rawCutoff } = await searchParams;
  const today = jakartaToday();
  const cutoff = rawCutoff && isIsoDate(rawCutoff) ? rawCutoff : defaultCutoff(today);

  const db = getDb();
  const preview = previewRun(db, company.id, cutoff);
  const runs = listRuns(db, company.id);
  const noRateLines = preview.excluded.noRate.reduce((s, g) => s + g.lines, 0);

  return (
    <Page
      title="Perhitungan Komisi"
      back={{ href: '/admin/', label: 'Portal' }}
      description={`${company.name} · Cutoff tiap tanggal 15 (default ${formatDate(defaultCutoff(today))}). Yang dihitung: faktur s/d tanggal cutoff, sudah lunas, dan belum pernah dikomisikan. Tarif = master tarif saat ini.`}
      actions={
        <form className="flex items-center gap-2">
          <label htmlFor="cutoff" className="whitespace-nowrap text-[12px] text-muted">
            Faktur s/d
          </label>
          <input id="cutoff" type="date" name="cutoff" defaultValue={cutoff} max="9999-12-31" required className={inputSmClass} />
          <button type="submit" className={buttonClass('utility', 'sm')}>
            Hitung
          </button>
        </form>
      }
    >
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <StatStrip cols={3}>
            <Stat label={`Total komisi · cutoff ${formatDate(cutoff)}`} tone="green" value={formatRupiah(preview.totalAmount)} hint={`${preview.totalLines} baris faktur`} />
            <Stat
              label="Menunggu lunas"
              tone="amber"
              value={formatRupiah(preview.excluded.unpaid.amount)}
              hint={`${preview.excluded.unpaid.lines} baris · otomatis ikut periode berikutnya`}
            />
            <Stat
              label="Di luar perhitungan"
              tone={noRateLines > 0 ? 'red' : 'gray'}
              value={noRateLines + preview.excluded.afterCutoff}
              hint={`${noRateLines} tanpa tarif · ${preview.excluded.afterCutoff} setelah cutoff`}
            />
          </StatStrip>

          {(noRateLines > 0 || preview.excluded.afterCutoff > 0) && (
            <div className="space-y-2">
              {noRateLines > 0 && (
                <Alert tone="red" title={`${noRateLines} baris lunas tidak ikut karena belum ada tarif`}>
                  {preview.excluded.noRate.map((g) => `${g.category} (${g.unit}): ${g.lines} baris`).join(' · ')}.{' '}
                  <Link href="/admin/komisi/master/" className="underline">
                    Tambah di Master Tarif
                  </Link>
                  , atau beri tarif Rp 0 kalau memang tidak berkomisi.
                </Alert>
              )}
              {preview.excluded.afterCutoff > 0 && (
                <Alert>
                  {preview.excluded.afterCutoff} baris belum dikomisikan bertanggal setelah {formatDate(cutoff)}, masuk periode
                  berikutnya.
                </Alert>
              )}
            </div>
          )}

          <Panel title="Rincian per kategori" description="Belum tersimpan." flush>
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
                {preview.groups.length === 0 && <EmptyRow colSpan={5}>Tidak ada baris yang siap dihitung untuk cutoff ini.</EmptyRow>}
                {preview.groups.map((g) => (
                  <tr key={`${g.category}|${g.unit}`} className="hover:bg-pearl">
                    <Td>
                      <span className="inline-flex items-center gap-2">
                        <span className="font-semibold">{g.label}</span>
                        <Code>{g.category}</Code>
                      </span>
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
              {preview.groups.length > 0 && (
                <tfoot>
                  <tr>
                    <td className="px-5 py-3 font-semibold">Total</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">{preview.totalLines}</td>
                    <td colSpan={2} />
                    <td className="px-5 py-3 text-right text-[15px] font-semibold tabular-nums">{formatRupiah(preview.totalAmount)}</td>
                  </tr>
                </tfoot>
              )}
            </Table>
          </Panel>

          {preview.eligible.length > 0 && (
            <Panel flush>
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-[14px] font-semibold">
                  {preview.eligible.length} baris yang dihitung
                  <span className="text-[13px] font-normal text-accent group-open:hidden">Tampilkan</span>
                  <span className="hidden text-[13px] font-normal text-accent group-open:inline">Sembunyikan</span>
                </summary>
                <Table className="max-h-[28rem] overflow-y-auto">
                  <thead className="sticky top-0">
                    <tr>
                      <Th>Tgl</Th>
                      <Th>No Inv</Th>
                      <Th>Barang</Th>
                      <Th className="text-right">Qty</Th>
                      <Th className="text-right">Komisi</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.eligible.map((l) => (
                      <tr key={l.id} className="hover:bg-pearl">
                        <Td className="whitespace-nowrap text-muted">{formatDate(l.invoiceDate)}</Td>
                        <Td className="whitespace-nowrap tabular-nums">{l.invoiceNo}</Td>
                        <Td>{l.itemName}</Td>
                        <Td className="whitespace-nowrap text-right tabular-nums">
                          {formatNumber(l.qty)} <span className="text-muted">{l.unit}</span>
                        </Td>
                        <Td className="text-right tabular-nums">{formatRupiah(l.amount)}</Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </details>
            </Panel>
          )}
        </div>

        <div className="lg:sticky lg:top-28">
          <Panel title="Simpan perhitungan" description="Mengunci baris supaya tidak dihitung dua kali.">
            {preview.totalLines > 0 ? (
              <SaveRunForm
                key={`${cutoff}-${preview.totalAmount}`}
                cutoffDate={cutoff}
                defaultLabel={defaultRunLabel(cutoff)}
                totalAmount={preview.totalAmount}
                totalLines={preview.totalLines}
              />
            ) : (
              <p className="text-[13px] text-muted">Tidak ada yang bisa disimpan untuk cutoff ini.</p>
            )}
          </Panel>
        </div>
      </div>

      <Panel title="Riwayat perhitungan" flush>
        <Table>
          <thead>
            <tr>
              <Th>#</Th>
              <Th>Periode</Th>
              <Th>Cutoff</Th>
              <Th className="text-right">Baris</Th>
              <Th className="text-right">Total</Th>
              <Th>Status</Th>
              <Th>Dibuat</Th>
              <Th className="text-right">
                <span className="sr-only">Export</span>
              </Th>
            </tr>
          </thead>
          <tbody>
            {runs.length === 0 && <EmptyRow colSpan={8}>Belum ada perhitungan tersimpan.</EmptyRow>}
            {runs.map((r) => (
              <tr key={r.id} className="hover:bg-pearl">
                <Td>
                  <Link href={`/admin/komisi/perhitungan/${r.id}/`} className="text-accent hover:underline">
                    #{r.id}
                  </Link>
                </Td>
                <Td className={cx(r.status === 'void' ? 'text-faint line-through' : 'font-semibold')}>{r.label}</Td>
                <Td className="whitespace-nowrap text-muted">{formatDate(r.cutoffDate)}</Td>
                <Td className="text-right tabular-nums">{r.totalLines}</Td>
                <Td className="text-right tabular-nums">{formatRupiah(r.totalAmount)}</Td>
                <Td>{r.status === 'void' ? <Badge tone="red">Dibatalkan</Badge> : <Badge tone="green">Final</Badge>}</Td>
                <Td className="whitespace-nowrap text-[12px] text-muted">
                  {formatDateTime(r.createdAt)} · {r.createdBy ?? '–'}
                </Td>
                <Td className="text-right">
                  <a
                    href={`/admin/komisi/perhitungan/${r.id}/pdf/`}
                    target="_blank"
                    rel="noopener"
                    className={buttonClass('secondary', 'sm')}
                  >
                    PDF
                  </a>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Panel>
    </Page>
  );
}
