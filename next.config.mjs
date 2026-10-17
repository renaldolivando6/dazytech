/** @type {import('next').NextConfig} */

// Header keamanan untuk semua halaman (compro + /admin).
// HSTS tanpa includeSubDomains: belum semua subdomain dazytech.web.id dipastikan HTTPS.
// CSP baru sebatas direktif yang tidak membatasi script/gambar (Next memakai script
// inline untuk hydration, three.js butuh WebAssembly & blob:). Mengunci script-src
// perlu nonce (halaman jadi dinamis) atau uji Report-Only dulu.
const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'" },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

// File di public/ yang namanya tidak ber-hash (default Next: max-age=0, jadi dicek
// ulang setiap kunjungan). Cache 7 hari; ganti file = tunggu maks. 7 hari, atau
// ganti namanya.
const assetCache = [{ key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' }];

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
    // PDF daftar harga (/harga/*.pdf, /en/pricing/*.pdf).
    '/harga/**/*': ['./node_modules/pdfkit/js/standard-fonts/**/*', './node_modules/pdfkit/js/data/**/*'],
    '/en/pricing/**/*': ['./node_modules/pdfkit/js/standard-fonts/**/*', './node_modules/pdfkit/js/data/**/*'],
  },
  experimental: {
    serverActions: {
      // Default 1 MB; file export Accurate bisa lebih besar dari itu.
      bodySizeLimit: '10mb',
    },
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      { source: '/models/:path*', headers: assetCache },
      { source: '/brand/:path*', headers: assetCache },
      { source: '/og/:path*', headers: assetCache },
    ];
  },
};

export default nextConfig;
