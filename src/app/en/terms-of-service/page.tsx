import { LegalPage, legalMetadata } from '@/components/site/legal-page';

export const metadata = legalMetadata('en', 'terms');

export default function TermsOfServiceEn() {
  return <LegalPage locale="en" kind="terms" />;
}
