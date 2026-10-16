import { LegalPage, legalMetadata } from '@/components/site/legal-page';

export const metadata = legalMetadata('en', 'privacy');

export default function PrivacyPolicyEn() {
  return <LegalPage locale="en" kind="privacy" />;
}
