'use client';

import { createContext, useContext, type ReactNode } from 'react';

// Company aktif untuk komponen client. Dipasang di layout panel; setiap form
// mutasi menyertakan <CompanyField/> supaya server bisa menolak form dari tab
// yang masih memegang company lama (lihat requireCompanyForAction).
const CompanyContext = createContext<{ id: number; name: string } | null>(null);

export function CompanyProvider({ company, children }: { company: { id: number; name: string } | null; children: ReactNode }) {
  return <CompanyContext.Provider value={company}>{children}</CompanyContext.Provider>;
}

export function useCompany() {
  return useContext(CompanyContext);
}

export function CompanyField() {
  const company = useCompany();
  return <input type="hidden" name="companyId" value={company?.id ?? ''} />;
}
