import type { Metadata } from 'next';
import { HomePage } from '@/components/site/home';
import { HOME_ALTERNATES, getCopy } from '@/i18n';
import { shareMetadata } from '@/lib/seo';

const t = getCopy('id');

export const metadata: Metadata = {
  title: { absolute: t.meta.title },
  description: t.meta.description,
  alternates: { canonical: '/', languages: HOME_ALTERNATES },
  ...shareMetadata({ locale: 'id', title: t.meta.title, description: t.meta.description, url: '/' }),
};

export default function Home() {
  return <HomePage locale="id" />;
}
