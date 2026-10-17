import { PricingPage, pricingMetadata } from '@/components/site/pricing-page';

export const metadata = pricingMetadata('id');

export default function Harga() {
  return <PricingPage locale="id" />;
}
