import { Inter } from "next/font/google";
import "./globals.css";

// Pengganti SF Pro di non-Apple (DESIGN.md). Di Mac/iOS stack --font-sans
// memakai -apple-system lebih dulu, jadi tetap SF Pro asli.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Default untuk semua halaman. Halaman utama (ID & EN) mengisi title,
// canonical, dan hreflang sendiri (src/app/page.tsx, src/app/en/page.tsx);
// canonical sengaja tidak dipasang di sini supaya halaman lain tidak
// menunjuk ke beranda.
export const metadata = {
  metadataBase: new URL('https://dazytech.web.id'),

  title: {
    default: 'Jasa ERP Custom & Aplikasi Bisnis Jakarta | Dazytech Solutions',
    template: '%s | Dazytech Solutions'
  },

  description: 'Software house Jakarta untuk ERP berbasis web dan aplikasi bisnis yang mengikuti proses kerja perusahaan. Website mulai Rp499 ribu.',

  authors: [{ name: 'Dazytech Solutions' }],
  creator: 'Dazytech Solutions',
  publisher: 'Dazytech Solutions',

  // Halaman publik mengisi openGraph/twitter sendiri lewat shareMetadata()
  // (src/lib/seo.ts); ini cadangan untuk halaman lain.
  openGraph: {
    siteName: 'Dazytech Solutions',
    images: [{ url: '/og/dazytech-id.png', width: 1200, height: 630, alt: 'Dazytech Solutions' }],
    locale: 'id_ID',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    images: ['/og/dazytech-id.png'],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({ children }) {
  return (
    // data-scroll-behavior: Next mematikan smooth scroll sementara saat pindah
    // halaman, supaya halaman baru langsung mulai dari atas.
    <html lang="id" data-scroll-behavior="smooth">
      <body className={`${inter.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
