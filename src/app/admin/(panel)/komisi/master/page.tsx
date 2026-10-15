import type { Metadata } from 'next';
import Link from 'next/link';
import { Alert, Page, Panel } from '@/components/admin/ui';
import { requireCompany } from '@/lib/company';
import { getDb } from '@/lib/db/client';
import { listCategoriesWithConversions, listUnmatchedCategoryUnits } from '@/lib/komisi/queries';
import { MasterTable, type MasterCategory } from './master-table';

export const metadata: Metadata = { title: 'Master Tarif Komisi' };

export default async function MasterPage({ searchParams }: { searchParams: Promise<{ code?: string; unit?: string }> }) {
  const { company } = await requireCompany();
  const sp = await searchParams;
  const db = getDb();
  const categories: MasterCategory[] = listCategoriesWithConversions(db, company.id).map((c) => ({
    id: c.id,
    code: c.code,
    label: c.label,
    baseUnit: c.baseUnit,
    rate: c.rate,
    isActive: c.isActive,
    conversions: c.conversions.map((u) => ({ id: u.id, unit: u.unit, factor: u.factor })),
  }));
  const unmatched = listUnmatchedCategoryUnits(db, company.id);

  return (
    <Page
      title="Master Tarif"
      description={`${company.name} · Perubahan tarif berlaku untuk perhitungan berikutnya; perhitungan yang sudah disimpan memakai snapshot tarif dan tidak berubah.`}
    >
      {unmatched.length > 0 && (
        <Alert tone="amber" title="Ada data yang belum punya tarif">
          <ul className="space-y-0.5">
            {unmatched.map((u) => (
              <li key={`${u.category}|${u.unit}`}>
                {u.category} / {u.unit} — {u.lines} baris belum dikomisikan.{' '}
                <Link
                  href={`/admin/komisi/master/?code=${encodeURIComponent(u.category)}&unit=${encodeURIComponent(u.unit)}`}
                  className="underline"
                >
                  Tambahkan
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-1.5 text-[12px]">
            Kategori sudah ada tapi satuannya beda (mis. KTK vs PCS)? Klik <span className="font-semibold">+ satuan</span> di baris
            kategorinya. Tidak berkomisi? Beri tarif Rp 0.
          </p>
        </Alert>
      )}

      <Panel flush>
        <MasterTable
          key={`${sp.code ?? ''}|${sp.unit ?? ''}`}
          categories={categories}
          prefillCode={sp.code}
          prefillUnit={sp.unit}
        />
      </Panel>
    </Page>
  );
}
