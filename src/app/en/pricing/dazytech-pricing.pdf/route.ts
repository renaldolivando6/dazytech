import { pricingPdfResponse } from '@/lib/pricing-pdf';

// Price list PDF ("Download PDF" button on /en/pricing/).
export function GET() {
  return pricingPdfResponse('en');
}
