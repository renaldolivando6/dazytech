import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { LoginForm } from './login-form';

export const metadata: Metadata = { title: 'Sign in' };

// Dua "tile" ala DESIGN.md: tile gelap (brand) + kanvas terang (form).
// Pergantian warna permukaan itu sendiri yang jadi pemisah, tanpa garis/bayangan.
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await getCurrentUser()) redirect('/admin/');
  const { next } = await searchParams;
  const year = new Date().getFullYear();

  return (
    <main className="grid min-h-screen grid-rows-[auto_1fr] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:grid-rows-1">
      {/* Tile gelap */}
      <section className="flex flex-col justify-between bg-[#272729] px-6 py-6 text-white sm:px-10 lg:px-16 lg:py-14">
        <span className="flex items-center gap-2 text-[17px] font-semibold tracking-[-0.01em]">
          <Image src="/brand/mark-white-64.png" alt="" width={24} height={24} className="rounded-full" />
          Dazytech
        </span>
        <div className="hidden max-w-md lg:block">
          <p className="text-[14px] font-semibold text-[#2997ff]">Dazytech Internal</p>
          <h1 className="mt-3 text-[56px] font-semibold leading-[1.07] tracking-[-0.02em]">
            Team access
            <br />
            only.
          </h1>
          <p className="mt-6 text-[21px] leading-[1.38] text-[#cccccc]">This workspace is reserved for the Dazytech internal team.</p>
        </div>
        <p className="hidden text-[12px] text-white/50 lg:block">© {year} Dazytech · Internal use only</p>
      </section>

      {/* Kanvas terang */}
      <section className="flex flex-col bg-white px-6 py-6 sm:px-10 lg:px-16 lg:py-14">
        <div className="flex justify-end">
          <Link href="/" className="text-[13px] text-muted transition-colors hover:text-ink">
            dazytech.web.id ↗
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-[360px]">
            <h2 className="mb-8 text-[28px] font-semibold leading-[1.14] tracking-[-0.015em]">Sign in to Dazytech</h2>
            <LoginForm next={next} />
          </div>
        </div>
        <p className="text-center text-[12px] text-faint lg:text-right">Sessions expire after 7 days without activity.</p>
      </section>
    </main>
  );
}
