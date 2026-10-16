import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { getCurrentCompany } from '@/lib/company';
import { getDb } from '@/lib/db/client';
import { renderCommissionPdf } from '@/lib/komisi/pdf';
import { getRun } from '@/lib/komisi/runs';

// Laporan perhitungan komisi sebagai PDF. `inline`: terbuka di viewer PDF
// browser (bisa langsung dicetak/diunduh dari sana).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.mustChangePassword) return new NextResponse('Unauthorized', { status: 401 });
  if (!user.apps.includes('komisi')) return new NextResponse('Forbidden', { status: 403 });
  const company = await getCurrentCompany();
  if (!company) return new NextResponse('Pilih company dulu', { status: 409 });

  const runId = Number.parseInt((await params).id, 10);
  const data = Number.isSafeInteger(runId) ? getRun(getDb(), company.id, runId) : null;
  if (!data) return new NextResponse('Not found', { status: 404 });

  const pdf = await renderCommissionPdf(data, company.name);
  const slug = company.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const fileName = `komisi-${slug}-${data.run.id}-cutoff-${data.run.cutoffDate}.pdf`;
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${fileName}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
