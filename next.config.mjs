/** @type {import('next').NextConfig} */

// Header keamanan untuk semua halaman (compro + /admin).
// CSP sengaja belum dipasang: halaman compro memuat three.js/framer-motion dan
// butuh pengujian sendiri sebelum dikunci.
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Dulu `output: 'export'` (HTML statis di nginx). Sekarang ada backend
  // (SQLite + /admin), jadi jalan sebagai Node server mandiri di port 3000.
  // Halaman compro tetap di-prerender statis saat build.
  output: 'standalone',
  trailingSlash: true,
  poweredByHeader: false,
  images: {
    unoptimized: true,
  },
  // Modul native / berat di sisi server, jangan di-bundle oleh webpack.
  serverExternalPackages: ['better-sqlite3', '@react-pdf/renderer'],
  // pdfkit (dipakai @react-pdf) memuat font standar lewat subpath import
  // `#standard-fonts/...` saat runtime -> tidak terdeteksi file tracing, jadi
  // tidak ikut ke build standalone dan PDF gagal dengan MODULE_NOT_FOUND.
  outputFileTracingIncludes: {
    '/admin/**/*': ['./node_modules/pdfkit/js/standard-fonts/**/*', './node_modules/pdfkit/js/data/**/*'],
  },
  experimental: {
    serverActions: {
      // Default 1 MB; file export Accurate bisa lebih besar dari itu.
      bodySizeLimit: '10mb',
    },
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
