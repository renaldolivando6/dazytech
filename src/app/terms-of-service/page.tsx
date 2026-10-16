import { LegalPage, legalMetadata } from '@/components/site/legal-page';

export const metadata = legalMetadata('id', 'terms');

export default function TermsOfService() {
  return <LegalPage locale="id" kind="terms" />;
}
