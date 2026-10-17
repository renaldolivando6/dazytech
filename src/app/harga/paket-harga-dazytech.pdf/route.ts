import { pricingPdfResponse } from '@/lib/pricing-pdf';

// Daftar harga PDF (tombol "Unduh PDF" di /harga/).
export function GET() {
  return pricingPdfResponse('id');
}
