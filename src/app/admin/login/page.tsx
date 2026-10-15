import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { LoginForm } from './login-form';

export const metadata: Metadata = { title: 'Masuk' };

// Dua "tile" ala DESIGN.md: tile gelap (brand) + kanvas terang (form).
// Pergantian warna permukaan itu sendiri yang jadi pemisah — tanpa garis/bayangan.
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await getCurrentUser()) redirect('/admin/komisi/');
  const { next } = await searchParams;
  const year = new Date().getFullYear();

  return (
    <main className="grid min-h-screen grid-rows-[auto_1fr] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:grid-rows-1">
      {/* Tile gelap */}
      <section className="flex flex-col justify-between bg-[#272729] px-6 py-6 text-white sm:px-10 lg:px-16 lg:py-14">
        <span className="text-[17px] font-semibold tracking-[-0.01em]">Dazytech</span>
        <div className="hidden max-w-md lg:block">
          <p className="text-[14px] font-semibold text-[#2997ff]">Commission Engine</p>
          <h1 className="mt-3 text-[56px] font-semibold leading-[1.07] tracking-[-0.02em]">
            Commissions,
            <br />
            calculated.
          </h1>
          <p className="mt-6 text-[21px] leading-[1.38] text-[#cccccc]">
            Import invoices, catch duplicates, and lock every payout period.
          </p>
        </div>
        <p className="hidden text-[12px] text-white/50 lg:block">© {year} Dazytech · Internal use only</p>
      </section>

      {/* Kanvas terang */}
      <section className="flex items-center justify-center bg-white px-6 py-14 sm:px-10">
        <div className="w-full max-w-[380px]">
          <h2 className="text-[34px] font-semibold leading-[1.15] tracking-[-0.02em]">Masuk</h2>
          <p className="mb-8 mt-2 text-[17px] leading-[1.47] text-muted">Gunakan akun admin Dazytech Anda.</p>
          <LoginForm next={next} />
        </div>
      </section>
    </main>
  );
}
