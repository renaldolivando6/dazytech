import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';

// Pengganti SF Pro untuk non-Apple (rekomendasi DESIGN.md). Di Mac/iOS stack
// --font-admin tetap jatuh ke system-ui = SF Pro asli kalau Inter gagal dimuat.
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s · Admin Dazytech' },
  robots: { index: false, follow: false },
  alternates: { canonical: null },
};

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <div
      id="admin-root"
      className={`${inter.variable} min-h-screen bg-parchment font-admin text-[14px] leading-[1.43] text-ink antialiased`}
    >
      {children}
    </div>
  );
}
