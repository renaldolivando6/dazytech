import { LegalPage, legalMetadata } from '@/components/site/legal-page';

export const metadata = legalMetadata('id', 'privacy');

export default function PrivacyPolicy() {
  return <LegalPage locale="id" kind="privacy" />;
}
