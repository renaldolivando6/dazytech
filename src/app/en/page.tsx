import type { Metadata } from 'next';
import { HomePage } from '@/components/site/home';
import { HOME_ALTERNATES, getCopy } from '@/i18n';
import { shareMetadata } from '@/lib/seo';

const t = getCopy('en');

export const metadata: Metadata = {
  title: { absolute: t.meta.title },
  description: t.meta.description,
  alternates: { canonical: '/en/', languages: HOME_ALTERNATES },
  ...shareMetadata({ locale: 'en', title: t.meta.title, description: t.meta.description, url: '/en/' }),
};

export default function HomeEn() {
  return <HomePage locale="en" />;
}
