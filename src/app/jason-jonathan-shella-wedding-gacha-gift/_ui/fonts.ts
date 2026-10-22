import { Geist, Instrument_Serif, JetBrains_Mono } from 'next/font/google';

// Font halaman hadiah (DESIGN 3.3), hanya untuk route ini. Hanya Geist yang
// di-preload; mono (kode, PIN, caption) dan serif (nama, surat) menyusul.
// Dipasang lewat `fontVars` di div root page.tsx.

const geist = Geist({ subsets: ['latin'], variable: '--g-font-ui', display: 'swap' });

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['500', '700'],
  variable: '--g-font-mono',
  display: 'swap',
  preload: false,
});

const serif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--g-font-serif',
  display: 'swap',
  preload: false,
});

export const fontVars = `${geist.variable} ${mono.variable} ${serif.variable}`;
