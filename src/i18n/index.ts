import { en } from './en';
import { id, type SiteCopy } from './id';

// Situs publik dua bahasa: Indonesia (default) di "/", Inggris di "/en/".
// Halaman artikel dan admin hanya bahasa Indonesia.
export type Locale = 'id' | 'en';
export type { SiteCopy };

export const LOCALES: Locale[] = ['id', 'en'];

export function getCopy(locale: Locale): SiteCopy {
  return locale === 'en' ? en : id;
}

export function isLocale(value: unknown): value is Locale {
  return value === 'id' || value === 'en';
}

// Alternatif bahasa untuk metadata (hreflang) halaman utama.
export const HOME_ALTERNATES = {
  'id-ID': '/',
  en: '/en/',
  'x-default': '/',
};
