import { PricingPage, pricingMetadata } from '@/components/site/pricing-page';

export const metadata = pricingMetadata('en');

export default function PricingEn() {
  return <PricingPage locale="en" />;
}
