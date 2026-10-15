import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { CompanyProvider } from '@/components/admin/company-context';
import { getCurrentUser } from '@/lib/auth/session';
import { listCompanies } from '@/lib/companies';
import { getCurrentCompany } from '@/lib/company';
import { getDb } from '@/lib/db/client';
import { logoutAction } from './actions';
import { CompanySwitcher } from './company-switcher';
import { AdminNav } from './nav';

// Layout hanya untuk tampilan. Pengecekan login & company ada di setiap
// page/action (requireCompany / requireCompanyForAction) — layout tidak
// dirender ulang saat pindah halaman, jadi bukan pengaman.
export default async function PanelLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  const company = user ? await getCurrentCompany() : null;
  const ready = user && !user.mustChangePassword;
  const companies = ready && company ? listCompanies(getDb()).map((c) => ({ id: c.id, name: c.name })) : [];

  return (
    <CompanyProvider company={company ? { id: company.id, name: company.name } : null}>
      {/* Nav global: bar hitam tipis 44px (global-nav di DESIGN.md). */}
      <header className="sticky top-0 z-30 bg-black/90 text-[12px] text-white backdrop-blur-xl">
        <div className="mx-auto flex h-11 max-w-[1440px] items-center gap-4 px-4 sm:gap-6 sm:px-8">
          <Link href="/admin/komisi/" className="flex shrink-0 items-center gap-2 font-semibold">
            <Image src="/dazytech-logo-white-circle.png" alt="" width={20} height={20} className="rounded-full" />
            <span className="hidden sm:inline">Dazytech</span>
          </Link>
          {ready && company && (
            <>
              <CompanySwitcher current={{ id: company.id, name: company.name }} companies={companies} />
              <AdminNav />
            </>
          )}
          {user && (
            <div className="ml-auto flex shrink-0 items-center gap-4 text-white/70">
              <Link href="/admin/akun/" className="hidden transition-colors hover:text-white sm:inline">
                {user.username}
              </Link>
              <form action={logoutAction}>
                <button type="submit" className="transition-colors hover:text-white">
                  Keluar
                </button>
              </form>
            </div>
          )}
        </div>
      </header>
      {children}
    </CompanyProvider>
  );
}
