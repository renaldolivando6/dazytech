import type { Locale } from '@/i18n';

// Paket & harga: halaman /harga/ (EN /en/pricing/), kartu website di beranda,
// dan PDF daftar harga. Angka hanya ditulis di PACKAGES & EXTRAS supaya sama di
// kedua bahasa, di web, dan di PDF; teks per bahasa ada di PRICING.
//
// Isinya penawaran yang sudah disetujui pemilik (17 Okt 2026). Jangan menambah
// paket, harga, atau ketentuan (garansi, pembayaran, jadwal) tanpa persetujuan;
// rincian akhir tetap di penawaran tertulis. Harga berubah = perbarui PRICING_UPDATED.

// Hanya untuk lastModified di sitemap; tanggal sengaja tidak ditampilkan di halaman/PDF.
export const PRICING_UPDATED = '2026-10-17';

export type CategoryKey = 'website' | 'app';
export type PackageKey = 'portfolio' | 'landing' | 'company' | 'companyPlus' | 'catalog' | 'appBasic' | 'appBusiness' | 'erp';
export type ExtraKey =
  | 'androidNative'
  | 'androidScreen'
  | 'apk'
  | 'playStore'
  | 'ads'
  | 'domainCom'
  | 'custom'
  | 'content'
  | 'section'
  | 'page'
  | 'hourly'
  | 'bugfix';

export type PackageData = {
  key: PackageKey;
  category: CategoryKey;
  // null = sesuai cakupan (ERP).
  price: number | null;
  // Biaya mulai tahun kedua. null = sesuai server & cakupan.
  renewal: { year: number; month?: number } | null;
  featured?: boolean;
  // Tambahan yang relevan, tampil di rincian paket.
  addons: ExtraKey[];
};

// Urutan = urutan tampil. Grid website 3 kolom: baris kedua diakhiri kartu "Butuh yang lain?".
export const PACKAGES: PackageData[] = [
  { key: 'portfolio', category: 'website', price: 499_000, renewal: { year: 199_000 }, addons: ['domainCom'] },
  { key: 'landing', category: 'website', price: 599_000, renewal: { year: 449_000 }, addons: ['ads'] },
  { key: 'company', category: 'website', price: 999_000, renewal: { year: 699_000 }, featured: true, addons: ['ads', 'page'] },
  { key: 'companyPlus', category: 'website', price: 1_799_000, renewal: { year: 999_000 }, addons: ['ads', 'page'] },
  { key: 'catalog', category: 'website', price: 1_499_000, renewal: { year: 999_000 }, addons: ['apk'] },
  { key: 'appBasic', category: 'app', price: 1_800_000, renewal: { year: 1_500_000, month: 150_000 }, addons: ['apk', 'androidNative'] },
  { key: 'appBusiness', category: 'app', price: 3_300_000, renewal: { year: 2_000_000, month: 200_000 }, featured: true, addons: ['androidNative', 'playStore'] },
  { key: 'erp', category: 'app', price: null, renewal: null, addons: [] },
];

export type ExtraData = {
  key: ExtraKey;
  group: 'addon' | 'change';
  // null = penawaran khusus, 0 = gratis.
  price: number | null;
  from?: boolean;
  renewalYear?: number;
};

export const EXTRAS: ExtraData[] = [
  { key: 'androidNative', group: 'addon', price: 999_000, from: true },
  { key: 'androidScreen', group: 'addon', price: 150_000 },
  { key: 'apk', group: 'addon', price: 499_000 },
  { key: 'playStore', group: 'addon', price: 299_000 },
  { key: 'ads', group: 'addon', price: 249_000 },
  { key: 'domainCom', group: 'addon', price: 150_000, renewalYear: 399_000 },
  { key: 'custom', group: 'addon', price: null },
  { key: 'content', group: 'change', price: 50_000 },
  { key: 'section', group: 'change', price: 150_000 },
  { key: 'page', group: 'change', price: 250_000 },
  { key: 'hourly', group: 'change', price: 100_000 },
  { key: 'bugfix', group: 'change', price: 0 },
];

export function packagesIn(category: CategoryKey): PackageData[] {
  return PACKAGES.filter((p) => p.category === category);
}

export function getPackage(key: PackageKey): PackageData {
  return PACKAGES.find((p) => p.key === key)!;
}

// Harga & perpanjangan termurah per kategori (untuk teks "mulai ...").
export function startingPrice(category: CategoryKey): number {
  return Math.min(...packagesIn(category).map((p) => p.price ?? Infinity));
}

export function startingRenewal(category: CategoryKey): number {
  return Math.min(...packagesIn(category).map((p) => p.renewal?.year ?? Infinity));
}

export function getExtra(key: ExtraKey): ExtraData {
  return EXTRAS.find((e) => e.key === key)!;
}

// 499000 -> "Rp499.000" (id) / "Rp499,000" (en).
export function formatIdr(locale: Locale, n: number): string {
  return `Rp${n.toLocaleString(locale === 'en' ? 'en-US' : 'id-ID')}`;
}

// Bentuk ringkas untuk teks "mulai ..." di beranda: 499000 -> "Rp499 ribu",
// 1800000 -> "Rp1,8 juta". Bahasa Inggris tetap angka penuh.
export function formatIdrShort(locale: Locale, n: number): string {
  if (locale === 'en') return formatIdr(locale, n);
  if (n >= 1_000_000) return `Rp${(n / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 3 })} juta`;
  if (n >= 1_000 && n % 1_000 === 0) return `Rp${n / 1_000} ribu`;
  return formatIdr(locale, n);
}

export function pricingHref(locale: Locale): string {
  return locale === 'en' ? '/en/pricing/' : '/harga/';
}

export function pricingPdfHref(locale: Locale): string {
  return locale === 'en' ? '/en/pricing/dazytech-pricing.pdf' : '/harga/paket-harga-dazytech.pdf';
}

type PackageCopy = {
  name: string;
  audience: string;
  // Daya tarik utama, tampil menonjol di bawah harga (mis. gratis domain + hosting).
  bonus: string;
  features: string[];
  // Sejajar dengan `specLabels` kategorinya.
  specs: string[];
};

type ExtraCopy = { name: string; note?: string; unit?: string };

export type PricingCopy = {
  meta: { title: string; description: string };
  promises: { title: string; body: string }[];
  localNav: { title: string; links: { href: string; label: string }[]; pdf: string };
  categories: Record<CategoryKey, { id: string; title: string; lead: string; specLabels: string[] }>;
  custom: { title: string; body: string; cta: string };
  packages: Record<PackageKey, PackageCopy>;
  extras: Record<ExtraKey, ExtraCopy>;
  extrasSection: { id: string; title: string; lead: string; addonTitle: string; changeTitle: string };
  renewalSection: {
    id: string;
    title: string;
    lead: string;
    tableTitle: string;
    includes: Record<CategoryKey, { title: string; items: string[] }>;
  };
  notes: string[];
  faq: { id: string; title: string; items: { q: string; a: string }[] };
  cta: { title: string; body: string; primary: string };
  labels: {
    recommended: string;
    byScope: string;
    from: string;
    free: string;
    custom: string;
    renewal: string;
    renewalMonthly: string;
    renewalScope: string;
    renewalTo: string;
    yearly: string;
    monthlyAlt: string;
    byServer: string;
    choose: string;
    discuss: string;
    details: string;
    addons: string;
    waPackage: string;
    waCustom: string;
    pdfTitle: string;
    pdfSubtitle: string;
    pdfPrice: string;
    pdfRenewal: string;
    pdfAudience: string;
    pdfIncluded: string;
    pdfContact: string;
    pdfPage: string;
  };
};

const id: PricingCopy = {
  meta: {
    title: 'Paket & Harga Website dan Aplikasi Bisnis',
    description:
      'Daftar harga Dazytech: website mulai {website}, aplikasi bisnis mulai {app}. Domain dan hosting tahun pertama termasuk, biaya perpanjangan tertulis di setiap paket.',
  },
  promises: [
    { title: 'Domain atas nama Anda', body: 'Domain didaftarkan atas nama Anda atau usaha Anda, bukan atas nama kami.' },
    { title: 'Tahun pertama termasuk', body: 'Domain, hosting, dan SSL tahun pertama sudah masuk di harga paket.' },
    { title: 'Biaya tahun kedua tertulis', body: 'Harga perpanjangan tercantum di setiap paket sejak awal.' },
    { title: 'Bug diperbaiki gratis', body: 'Bug dari kode kami diperbaiki tanpa biaya selama perpanjangan aktif.' },
  ],
  localNav: {
    title: 'Paket & harga',
    links: [
      { href: '#website', label: 'Website' },
      { href: '#aplikasi', label: 'Aplikasi' },
      { href: '#tambahan', label: 'Tambahan' },
      { href: '#perpanjangan', label: 'Perpanjangan' },
      { href: '#faq', label: 'FAQ' },
    ],
    pdf: 'Unduh PDF',
  },
  categories: {
    website: {
      id: 'website',
      title: 'Website',
      lead: 'Untuk tampil profesional dan mudah dihubungi. Domain, hosting, dan SSL tahun pertama sudah termasuk.',
      specLabels: ['Revisi desain', 'Pendampingan setelah rilis', 'Materi dari Anda'],
    },
    app: {
      id: 'aplikasi',
      title: 'Aplikasi bisnis',
      lead: 'Untuk proses yang masih dicatat manual. Mulai dari satu modul, lalu tambah saat dibutuhkan.',
      specLabels: ['Pengguna', 'Akses dari HP', 'Hosting', 'Pendampingan setelah rilis'],
    },
  },
  custom: {
    title: 'Butuh yang lain?',
    body: 'Versi 2 bahasa, lebih dari 10 halaman, atau toko online dengan pembayaran dan ongkir otomatis. Kami buatkan penawaran sesuai kebutuhan.',
    cta: 'Tanya via WhatsApp ›',
  },
  packages: {
    portfolio: {
      name: 'Portfolio',
      audience: 'Freelancer, profesional, dan mahasiswa',
      bonus: 'Gratis domain .my.id + hosting 1 tahun',
      features: ['1 halaman: profil, keahlian, dan pengalaman', 'Galeri hingga 8 karya', 'Tombol unduh CV, WhatsApp, dan media sosial', 'Tampilan rapi di HP dan desktop'],
      specs: ['2x', '30 hari', 'Foto profil, daftar karya, dan CV'],
    },
    landing: {
      name: 'Landing Page',
      audience: 'Promosi satu produk, jasa, atau acara',
      bonus: 'Gratis domain .com + hosting 1 tahun',
      features: ['1 halaman, hingga 7 bagian', 'Tombol WhatsApp, formulir, dan Google Maps', 'SEO dasar, Google Analytics & Search Console', 'Tampilan rapi di HP dan desktop'],
      specs: ['3x', '30 hari', 'Teks promosi, foto, dan logo'],
    },
    company: {
      name: 'Company Profile',
      audience: 'Usaha yang butuh website lengkap',
      bonus: 'Gratis domain .com + hosting 1 tahun',
      features: [
        'Hingga 5 halaman: Beranda, Tentang, Layanan, Galeri, Kontak',
        'Tombol WhatsApp, formulir, dan Google Maps',
        'SEO dasar, Google Analytics & Search Console',
        'Tampilan rapi di HP dan desktop',
      ],
      specs: ['3x', '30 hari', 'Profil usaha, daftar layanan, foto, dan logo'],
    },
    companyPlus: {
      name: 'Company Profile Plus',
      audience: 'Usaha yang rutin berbagi kabar dan artikel',
      bonus: 'Gratis domain .com + hosting 1 tahun',
      features: ['Hingga 10 halaman', 'Artikel dan berita yang bisa Anda isi sendiri', 'Panel admin untuk mengelola konten', 'SEO dasar, Google Analytics & Search Console'],
      specs: ['4x', '60 hari', 'Profil usaha, foto, logo, dan artikel awal (opsional)'],
    },
    catalog: {
      name: 'Katalog Online',
      audience: 'Toko dan distributor yang menerima pesanan lewat WhatsApp',
      bonus: 'Gratis domain .com + hosting 1 tahun',
      features: [
        'Hingga 50 produk dengan kategori dan pencarian',
        'Pesanan masuk ke WhatsApp dengan rincian lengkap',
        'Panel admin untuk produk, harga, dan stok',
        'SEO dasar, Google Analytics & Search Console',
      ],
      specs: ['3x', '30 hari', 'Daftar produk, harga, dan foto produk'],
    },
    appBasic: {
      name: 'Aplikasi Dasar',
      audience: 'Satu proses yang masih dicatat di Excel atau kertas',
      bonus: 'Gratis domain .com + hosting 1 tahun',
      features: ['1 modul, misalnya inventaris, absensi, atau data anggota', 'Login dengan 2 peran: admin dan pengguna', 'Tambah, ubah, hapus, dan cari data', 'Ekspor laporan ke Excel dan PDF'],
      specs: ['2 peran: admin dan pengguna', 'Bisa dipasang di HP seperti aplikasi (PWA)', 'Server bersama, termasuk 1 tahun', '30 hari'],
    },
    appBusiness: {
      name: 'Aplikasi Bisnis + Android',
      audience: 'Tim kantor dan lapangan dalam satu sistem',
      bonus: 'Gratis domain .com + hosting 1 tahun',
      features: [
        'Hingga 3 modul, misalnya pemesanan, stok, dan laporan',
        'Dashboard ringkasan untuk pemilik usaha',
        'Notifikasi WhatsApp dan email',
        'Aplikasi Android untuk tim, satu data dengan versi web',
      ],
      specs: ['Lebih dari 2 peran dengan hak akses berbeda', 'Aplikasi Android (berbasis web) dan PWA', 'Server bersama, termasuk 1 tahun', '60 hari'],
    },
    erp: {
      name: 'ERP Custom',
      audience: 'Perusahaan dengan beberapa divisi atau gudang',
      bonus: 'Konsultasi awal gratis',
      features: ['Modul penjualan, pembelian, stok, keuangan, dan HR', 'Integrasi Accurate, API, dan WhatsApp', 'Migrasi data dari aplikasi lama', 'Dibangun bertahap, mulai dari modul terpenting'],
      specs: ['Sesuai struktur perusahaan', 'Android native bila dibutuhkan', 'Server terpisah, biaya sesuai tagihan penyedia', 'Sesuai kesepakatan'],
    },
  },
  extras: {
    androidNative: { name: 'Aplikasi Android native', note: 'Hingga 3 layar, terhubung ke aplikasi buatan Dazytech.' },
    androidScreen: { name: 'Layar Android tambahan', unit: '/layar' },
    apk: { name: 'APK Android berbasis web', note: 'Untuk Aplikasi Dasar dan Katalog Online. Bisa dipasang langsung tanpa Play Store.' },
    playStore: { name: 'Bantu rilis ke Play Store', note: 'Akun developer atas nama Anda. Biaya pendaftaran Google US$25 dibayar sekali.' },
    ads: {
      name: 'Pixel iklan Meta & TikTok',
      note: 'Untuk yang beriklan di Facebook, Instagram, atau TikTok. Klik WhatsApp dan isian formulir tercatat sebagai hasil iklan, jadi iklan bisa dioptimalkan.',
    },
    domainCom: { name: 'Domain .com untuk Portfolio' },
    custom: { name: 'Versi 2 bahasa, iOS, pembayaran online, ongkir otomatis', note: 'Dihitung dari kebutuhan.' },
    content: { name: 'Ganti teks, foto, atau kontak', unit: '/permintaan' },
    section: { name: 'Tambah bagian di halaman', unit: '/bagian' },
    page: { name: 'Tambah halaman', unit: '/halaman' },
    hourly: { name: 'Pekerjaan lain', note: 'Estimasi disepakati sebelum dikerjakan.', unit: '/jam' },
    bugfix: { name: 'Perbaikan bug dari kode kami', note: 'Selama perpanjangan aktif.' },
  },
  extrasSection: {
    id: 'tambahan',
    title: 'Tambahan',
    lead: 'Pilih sesuai kebutuhan. Biaya perubahan setelah rilis juga tertulis di sini, jadi tidak ada tagihan yang mengejutkan.',
    addonTitle: 'Tambahan paket',
    changeTitle: 'Perubahan setelah rilis',
  },
  renewalSection: {
    id: 'perpanjangan',
    title: 'Perpanjangan',
    lead: 'Mulai tahun kedua, website dan aplikasi tetap berjalan dengan biaya yang sudah tertulis sejak awal.',
    tableTitle: 'Biaya perpanjangan',
    includes: {
      website: { title: 'Termasuk di perpanjangan website', items: ['Domain, hosting, dan SSL', 'Backup rutin dan pemantauan server', 'Perbaikan bug dari kode kami', '2x perubahan kecil per tahun'] },
      app: { title: 'Termasuk di perpanjangan aplikasi', items: ['Hosting, domain, dan SSL', 'Backup rutin dan pemantauan server', 'Perbaikan bug dari kode kami', '4 jam bantuan per tahun'] },
    },
  },
  notes: [
    'Harga dalam rupiah.',
    'Biaya layanan pihak ketiga ditanggung klien sesuai pemakaian: WhatsApp API resmi, payment gateway, API ongkir, email bisnis, serta akun Play Store atau App Store.',
    'Rincian akhir, jadwal, dan cara pembayaran tertulis di penawaran sebelum pengerjaan dimulai.',
  ],
  faq: {
    id: 'faq',
    title: 'Pertanyaan seputar paket.',
    items: [
      {
        q: 'Apa yang terjadi setelah tahun pertama?',
        a: 'Website atau aplikasi tetap berjalan selama perpanjangan dibayar. Perpanjangan mencakup domain, hosting, SSL, backup, perbaikan bug, dan perubahan kecil. Kalau tidak diperpanjang, website berhenti tayang di akhir masa aktif. Domain terdaftar atas nama Anda, jadi bisa dipindahkan ke penyedia lain.',
      },
      {
        q: 'Apa beda revisi dan perbaikan bug?',
        a: 'Revisi adalah perubahan tampilan atau isi yang Anda minta selama pengerjaan, jumlahnya sesuai paket. Bug adalah fungsi yang tidak berjalan sesuai yang disepakati. Bug dari kode kami diperbaiki gratis selama perpanjangan aktif.',
      },
      {
        q: 'Materi apa yang perlu saya siapkan?',
        a: 'Teks, foto, dan logo usaha Anda. Daftar materi untuk setiap paket ada di rincian paket. Kami bantu merapikan susunan dan tampilannya.',
      },
      {
        q: 'Biaya apa saja yang tidak termasuk?',
        a: 'Layanan pihak ketiga yang ditagih sesuai pemakaian, seperti WhatsApp API resmi, payment gateway, API ongkir, email bisnis, dan akun Play Store atau App Store.',
      },
      {
        q: 'Apakah aplikasi Android harus lewat Play Store?',
        a: 'Tidak. Aplikasi untuk tim internal bisa dipasang langsung dari file APK. Untuk rilis publik di Play Store, akun developer dibuat atas nama Anda. Akun pribadi yang baru wajib menjalani uji tertutup dengan minimal 12 penguji selama 14 hari sebelum rilis.',
      },
      {
        q: 'Bisa naik ke paket yang lebih besar nanti?',
        a: 'Bisa. Website dan aplikasi bisa dikembangkan bertahap. Biaya tambahan dihitung dari bagian yang perlu ditambah.',
      },
    ],
  },
  cta: {
    title: 'Belum yakin paket mana yang cocok?',
    body: 'Ceritakan kebutuhan Anda lewat WhatsApp. Kami bantu pilihkan paket yang paling masuk akal.',
    primary: 'Chat WhatsApp',
  },
  labels: {
    recommended: 'Rekomendasi',
    byScope: 'Sesuai cakupan',
    from: 'Mulai',
    free: 'Gratis',
    custom: 'Penawaran khusus',
    renewal: 'Perpanjangan {year}/tahun',
    renewalMonthly: 'Perpanjangan {year}/tahun atau {month}/bulan',
    renewalScope: 'Perpanjangan sesuai server dan cakupan',
    renewalTo: 'Perpanjangan menjadi {price}/tahun.',
    yearly: '{price}/tahun',
    monthlyAlt: 'atau {price}/bulan',
    byServer: 'Sesuai server',
    choose: 'Pilih paket',
    discuss: 'Diskusikan kebutuhan',
    details: 'Rincian paket',
    addons: 'Pilihan tambahan',
    waPackage: 'Halo Dazytech, saya tertarik dengan paket {name} ({price}).',
    waCustom: 'Halo Dazytech, saya butuh website atau aplikasi di luar paket yang ada.',
    pdfTitle: 'Paket & Harga',
    pdfSubtitle: 'Website dan aplikasi bisnis',
    pdfPrice: 'Harga',
    pdfRenewal: 'Perpanjangan',
    pdfAudience: 'Cocok untuk',
    pdfIncluded: 'Termasuk',
    pdfContact: 'Konsultasi gratis lewat WhatsApp {wa} atau kunjungi {url}',
    pdfPage: 'Halaman {page} / {total}',
  },
};

const en: PricingCopy = {
  meta: {
    title: 'Website and Business Application Pricing',
    description:
      'Dazytech pricing: websites from {website}, business applications from {app}. First-year domain and hosting included, renewal cost listed in every package.',
  },
  promises: [
    { title: 'Domain in your name', body: 'The domain is registered to you or your business, not to us.' },
    { title: 'First year included', body: 'First-year domain, hosting, and SSL are part of the package price.' },
    { title: 'Second-year cost listed', body: 'The renewal price is stated in every package from day one.' },
    { title: 'Bugs fixed for free', body: 'Bugs in our code are fixed at no charge while the renewal is active.' },
  ],
  localNav: {
    title: 'Packages & pricing',
    links: [
      { href: '#website', label: 'Websites' },
      { href: '#aplikasi', label: 'Applications' },
      { href: '#tambahan', label: 'Add-ons' },
      { href: '#perpanjangan', label: 'Renewal' },
      { href: '#faq', label: 'FAQ' },
    ],
    pdf: 'Download PDF',
  },
  categories: {
    website: {
      id: 'website',
      title: 'Websites',
      lead: 'Look professional and easy to reach. First-year domain, hosting, and SSL are included.',
      specLabels: ['Design revisions', 'Support after launch', 'Materials from you'],
    },
    app: {
      id: 'aplikasi',
      title: 'Business applications',
      lead: 'For processes still tracked by hand. Start with one module, then add more when you need it.',
      specLabels: ['Users', 'Phone access', 'Hosting', 'Support after launch'],
    },
  },
  custom: {
    title: 'Need something else?',
    body: 'A bilingual site, more than 10 pages, or an online store with automatic payment and shipping rates. We will prepare a quote for your needs.',
    cta: 'Ask on WhatsApp ›',
  },
  packages: {
    portfolio: {
      name: 'Portfolio',
      audience: 'Freelancers, professionals, and students',
      bonus: 'Free .my.id domain + hosting for 1 year',
      features: ['1 page: profile, skills, and experience', 'Gallery of up to 8 works', 'CV download, WhatsApp, and social media buttons', 'Looks right on phone and desktop'],
      specs: ['2 rounds', '30 days', 'Profile photo, list of works, and CV'],
    },
    landing: {
      name: 'Landing Page',
      audience: 'Promoting one product, service, or event',
      bonus: 'Free .com domain + hosting for 1 year',
      features: ['1 page, up to 7 sections', 'WhatsApp button, form, and Google Maps', 'Basic SEO, Google Analytics & Search Console', 'Looks right on phone and desktop'],
      specs: ['3 rounds', '30 days', 'Promotional copy, photos, and logo'],
    },
    company: {
      name: 'Company Profile',
      audience: 'Businesses that need a complete website',
      bonus: 'Free .com domain + hosting for 1 year',
      features: [
        'Up to 5 pages: Home, About, Services, Gallery, Contact',
        'WhatsApp button, form, and Google Maps',
        'Basic SEO, Google Analytics & Search Console',
        'Looks right on phone and desktop',
      ],
      specs: ['3 rounds', '30 days', 'Business profile, list of services, photos, and logo'],
    },
    companyPlus: {
      name: 'Company Profile Plus',
      audience: 'Businesses that share news and articles regularly',
      bonus: 'Free .com domain + hosting for 1 year',
      features: ['Up to 10 pages', 'Articles and news you can publish yourself', 'Admin panel to manage content', 'Basic SEO, Google Analytics & Search Console'],
      specs: ['4 rounds', '60 days', 'Business profile, photos, logo, and first articles (optional)'],
    },
    catalog: {
      name: 'Online Catalog',
      audience: 'Shops and distributors that take orders on WhatsApp',
      bonus: 'Free .com domain + hosting for 1 year',
      features: [
        'Up to 50 products with categories and search',
        'Orders arrive on WhatsApp with full details',
        'Admin panel for products, prices, and stock',
        'Basic SEO, Google Analytics & Search Console',
      ],
      specs: ['3 rounds', '30 days', 'Product list, prices, and product photos'],
    },
    appBasic: {
      name: 'Starter App',
      audience: 'One process still tracked in Excel or on paper',
      bonus: 'Free .com domain + hosting for 1 year',
      features: ['1 module, such as inventory, attendance, or member data', 'Login with 2 roles: admin and user', 'Add, edit, delete, and search records', 'Export reports to Excel and PDF'],
      specs: ['2 roles: admin and user', 'Installable on phones like an app (PWA)', 'Shared server, 1 year included', '30 days'],
    },
    appBusiness: {
      name: 'Business App + Android',
      audience: 'Office and field teams in one system',
      bonus: 'Free .com domain + hosting for 1 year',
      features: [
        'Up to 3 modules, such as orders, stock, and reports',
        'Summary dashboard for the business owner',
        'WhatsApp and email notifications',
        'Android app for your team, sharing data with the web version',
      ],
      specs: ['More than 2 roles with different access', 'Android app (web-based) and PWA', 'Shared server, 1 year included', '60 days'],
    },
    erp: {
      name: 'Custom ERP',
      audience: 'Companies with several divisions or warehouses',
      bonus: 'Free initial consultation',
      features: ['Sales, purchasing, stock, finance, and HR modules', 'Accurate, API, and WhatsApp integration', 'Data migration from older software', 'Built in stages, starting with the most important module'],
      specs: ['Follows your company structure', 'Native Android when needed', 'Dedicated server, billed at provider cost', 'As agreed'],
    },
  },
  extras: {
    androidNative: { name: 'Native Android app', note: 'Up to 3 screens, connected to an application built by Dazytech.' },
    androidScreen: { name: 'Extra Android screen', unit: '/screen' },
    apk: { name: 'Web-based Android APK', note: 'For the Starter App and Online Catalog. Installs directly without the Play Store.' },
    playStore: { name: 'Play Store release support', note: 'Developer account in your name. Google charges a one-time US$25 registration fee.' },
    ads: {
      name: 'Meta & TikTok ad pixels',
      note: 'For businesses advertising on Facebook, Instagram, or TikTok. WhatsApp clicks and form submissions are recorded as ad results, so the ads can be optimized.',
    },
    domainCom: { name: '.com domain for Portfolio' },
    custom: { name: 'Bilingual site, iOS, online payment, automatic shipping rates', note: 'Priced from your requirements.' },
    content: { name: 'Change text, photos, or contact details', unit: '/request' },
    section: { name: 'Add a section to a page', unit: '/section' },
    page: { name: 'Add a page', unit: '/page' },
    hourly: { name: 'Other work', note: 'Estimate agreed before work starts.', unit: '/hour' },
    bugfix: { name: 'Fixing bugs in our code', note: 'While the renewal is active.' },
  },
  extrasSection: {
    id: 'tambahan',
    title: 'Add-ons',
    lead: 'Pick what you need. Post-launch change prices are listed here too, so there are no surprise invoices.',
    addonTitle: 'Package add-ons',
    changeTitle: 'Changes after launch',
  },
  renewalSection: {
    id: 'perpanjangan',
    title: 'Renewal',
    lead: 'From the second year, your website or application keeps running at the price stated from the start.',
    tableTitle: 'Renewal cost',
    includes: {
      website: { title: 'Included in website renewal', items: ['Domain, hosting, and SSL', 'Regular backups and server monitoring', 'Fixing bugs in our code', '2 small changes per year'] },
      app: { title: 'Included in application renewal', items: ['Hosting, domain, and SSL', 'Regular backups and server monitoring', 'Fixing bugs in our code', '4 hours of help per year'] },
    },
  },
  notes: [
    'Prices in Indonesian Rupiah.',
    'Third-party services are paid by the client based on usage: official WhatsApp API, payment gateway, shipping rate API, business email, and Play Store or App Store accounts.',
    'Final details, schedule, and payment terms are set out in the quotation before work starts.',
  ],
  faq: {
    id: 'faq',
    title: 'Questions about the packages.',
    items: [
      {
        q: 'What happens after the first year?',
        a: 'Your website or application keeps running while the renewal is paid. The renewal covers domain, hosting, SSL, backups, bug fixes, and small changes. Without renewal, the website goes offline at the end of the active period. The domain is registered in your name, so you can move it to another provider.',
      },
      {
        q: 'What is the difference between a revision and a bug fix?',
        a: 'A revision is a change to the design or content you request during the project, with the number of rounds set by the package. A bug is a feature that does not work as agreed. Bugs in our code are fixed for free while the renewal is active.',
      },
      {
        q: 'What materials do I need to prepare?',
        a: 'Your business copy, photos, and logo. The materials for each package are listed in its details. We help tidy up the structure and layout.',
      },
      {
        q: 'Which costs are not included?',
        a: 'Third-party services billed by usage, such as the official WhatsApp API, payment gateway, shipping rate API, business email, and Play Store or App Store accounts.',
      },
      {
        q: 'Does the Android app have to go through the Play Store?',
        a: 'No. Apps for internal teams can be installed directly from an APK file. For a public Play Store release, the developer account is created in your name. New personal accounts must run a closed test with at least 12 testers for 14 days before release.',
      },
      {
        q: 'Can I move to a bigger package later?',
        a: 'Yes. Websites and applications can grow in stages. Additional cost is based on what needs to be added.',
      },
    ],
  },
  cta: {
    title: 'Not sure which package fits?',
    body: 'Tell us what you need on WhatsApp. We will help you pick the package that makes the most sense.',
    primary: 'Chat on WhatsApp',
  },
  labels: {
    recommended: 'Recommended',
    byScope: 'Priced by scope',
    from: 'From',
    free: 'Free',
    custom: 'Custom quote',
    renewal: 'Renewal {year}/year',
    renewalMonthly: 'Renewal {year}/year or {month}/month',
    renewalScope: 'Renewal based on server and scope',
    renewalTo: 'Renews at {price}/year.',
    yearly: '{price}/year',
    monthlyAlt: 'or {price}/month',
    byServer: 'Based on server',
    choose: 'Choose package',
    discuss: 'Discuss your needs',
    details: 'Package details',
    addons: 'Optional add-ons',
    waPackage: "Hi Dazytech, I'm interested in the {name} package ({price}).",
    waCustom: 'Hi Dazytech, I need a website or application outside the listed packages.',
    pdfTitle: 'Packages & Pricing',
    pdfSubtitle: 'Websites and business applications',
    pdfPrice: 'Price',
    pdfRenewal: 'Renewal',
    pdfAudience: 'Best for',
    pdfIncluded: 'Included',
    pdfContact: 'Free consultation on WhatsApp {wa} or visit {url}',
    pdfPage: 'Page {page} / {total}',
  },
};

export const PRICING: Record<Locale, PricingCopy> = { id, en };

// Teks harga untuk kartu, PDF, dan pesan WhatsApp.
export function packagePrice(locale: Locale, p: PackageData): string {
  return p.price === null ? PRICING[locale].labels.byScope : formatIdr(locale, p.price);
}

export function packageRenewal(locale: Locale, p: PackageData): string {
  const l = PRICING[locale].labels;
  if (!p.renewal) return l.renewalScope;
  const year = formatIdr(locale, p.renewal.year);
  return p.renewal.month ? l.renewalMonthly.replace('{year}', year).replace('{month}', formatIdr(locale, p.renewal.month)) : l.renewal.replace('{year}', year);
}

export function extraPrice(locale: Locale, e: ExtraData): string {
  const l = PRICING[locale].labels;
  if (e.price === null) return l.custom;
  if (e.price === 0) return l.free;
  const price = `${formatIdr(locale, e.price)}${PRICING[locale].extras[e.key].unit ?? ''}`;
  return e.from ? `${l.from} ${price}` : price;
}

export function extraNote(locale: Locale, e: ExtraData): string | undefined {
  const note = PRICING[locale].extras[e.key].note;
  const renewal = e.renewalYear ? PRICING[locale].labels.renewalTo.replace('{price}', formatIdr(locale, e.renewalYear)) : undefined;
  return [note, renewal].filter(Boolean).join(' ') || undefined;
}

// "Pixel iklan Meta & TikTok (Rp249.000), Tambah halaman (Rp250.000/halaman)" untuk rincian paket.
export function packageAddons(locale: Locale, p: PackageData): string | null {
  if (p.addons.length === 0) return null;
  return p.addons.map((k) => `${PRICING[locale].extras[k].name} (${extraPrice(locale, getExtra(k))})`).join(', ');
}
