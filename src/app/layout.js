import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL('https://dazytech.web.id'),

  title: {
    default: 'Dazytech Solutions | Jasa Pembuatan Software ERP & Aplikasi Custom Jakarta',
    template: '%s | Dazytech Solutions'
  },

  description: 'Software House Jakarta terpercaya. Spesialis pembuatan Sistem ERP, Aplikasi Gudang (WMS), HRIS & Payroll, Software Akuntansi untuk transformasi digital bisnis Indonesia.',

  keywords: [
    'Jasa Pembuatan Software',
    'Software House Jakarta',
    'Sistem ERP Indonesia',
    'Aplikasi Gudang WMS',
    'Software HRIS Payroll',
    'Vendor IT Jakarta',
    'Jasa Software Custom',
    'ERP Custom Indonesia',
    'Software Akuntansi',
    'Transformasi Digital',
  ],

  authors: [{ name: 'Dazytech Solutions Team' }],
  creator: 'Dazytech Solutions',
  publisher: 'Dazytech Solutions',

  openGraph: {
    title: 'Dazytech Solutions - Jasa Software ERP & Aplikasi Custom Jakarta',
    description: 'Transformasi bisnis Anda dengan sistem ERP, WMS, HRIS, dan aplikasi custom yang sesuai kebutuhan perusahaan Indonesia.',
    url: 'https://dazytech.web.id',
    siteName: 'Dazytech Solutions',
    images: [
      {
        url: '/dazytech-logo-circle.png',
        width: 500,
        height: 500,
        alt: 'Dazytech Solutions Logo',
      },
    ],
    locale: 'id_ID',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Dazytech Solutions - Software House Jakarta',
    description: 'Jasa pembuatan software ERP, aplikasi custom, dan transformasi digital',
    images: ['/dazytech-logo-circle.png'],
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

  alternates: {
    canonical: 'https://dazytech.web.id',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}