import type { Metadata } from 'next';
import { Badge, Page, Panel, cx } from '@/components/admin/ui';
import { requireApp } from '@/lib/auth/session';
import { listCompanies } from '@/lib/companies';
import { getCurrentCompany } from '@/lib/company';
import { getDb } from '@/lib/db/client';
import { formatNumber } from '@/lib/format';
import { selectCompanyAction } from './actions';
import { CreateCompanyForm } from './create-form';

export const metadata: Metadata = { title: 'Pilih Company' };

export default async function CompanyPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  await requireApp('komisi');
  const { next } = await searchParams;
  const current = await getCurrentCompany();
  const companies = listCompanies(getDb());

  return (
    <Page
      title={current ? 'Company' : 'Pilih company'}
      back={{ href: '/admin/', label: 'Portal' }}
      narrow
      description="Data faktur, perhitungan, dan master tarif terpisah per company. Pilih company yang mau dikerjakan."
    >
      <div className="space-y-6">
        <Panel flush>
          <ul>
            {companies.map((c) => {
              const active = current?.id === c.id;
              return (
                <li key={c.id} className="border-b border-divider last:border-b-0">
                  <form action={selectCompanyAction}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="next" value={next ?? ''} />
                    <button
                      type="submit"
                      className={cx(
                        'flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-pearl active:bg-black/[0.03]',
                        active && 'bg-pearl',
                      )}
                    >
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-black/[0.05] text-[15px] font-semibold text-ink-80">
                        {c.name.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] font-semibold">{c.name}</span>
                        <span className="block text-[12px] text-muted">
                          {formatNumber(c.lines)} baris faktur · {c.runs} perhitungan
                        </span>
                      </span>
                      {active && <Badge tone="green">Aktif</Badge>}
                      <span aria-hidden className="text-[20px] leading-none text-faint">
                        ›
                      </span>
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        </Panel>

        <Panel title="Tambah company" description="Bisa langsung memakai salinan master tarif company lain.">
          <CreateCompanyForm companies={companies.map((c) => ({ id: c.id, name: c.name }))} />
        </Panel>
      </div>
    </Page>
  );
}
