import type { Metadata } from 'next';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { LoginForm } from './login-form';

export const metadata: Metadata = { title: 'Masuk' };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await getCurrentUser()) redirect('/admin/komisi/');
  const { next } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-[360px]">
        <div className="mb-8 text-center">
          <Image src="/dazytech-logo-circle.png" alt="Dazytech" width={48} height={48} className="mx-auto rounded-full" />
          <h1 className="mt-5 text-[28px] font-semibold leading-[1.14] tracking-[-0.02em]">Masuk ke Admin</h1>
          <p className="mt-2 text-[14px] text-muted">Dazytech · area internal</p>
        </div>
        <div className="rounded-[18px] border border-black/[0.08] bg-white p-6">
          <LoginForm next={next} />
        </div>
      </div>
    </main>
  );
}
