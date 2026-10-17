// Teks situs publik (bahasa Indonesia, default). en.ts wajib punya bentuk yang
// sama persis (dicek TypeScript lewat tipe SiteCopy).
//
// Aturan tulisan (CLAUDE.md): tanpa em dash, klaim harus bisa dipertanggungjawabkan,
// dan cakupan paket yang belum pasti jangan dikarang.

export const id = {
  locale: 'id' as 'id' | 'en',
  path: '/',
  // Gambar/teks di dalam ilustrasi aplikasi tetap bahasa Indonesia di kedua bahasa.

  meta: {
    title: 'Jasa ERP Custom & Aplikasi Bisnis Jakarta | Dazytech Solutions',
    description:
      'Software house Jakarta untuk ERP berbasis web dan aplikasi bisnis yang mengikuti proses kerja perusahaan. Website company profile mulai Rp500 ribu.',
  },

  nav: {
    links: [
      { href: '#contoh', label: 'Contoh ERP' },
      { href: '#layanan', label: 'Layanan' },
      { href: '#website', label: 'Website' },
      { href: '#proses', label: 'Cara kerja' },
      { href: '#faq', label: 'FAQ' },
    ],
    cta: 'Konsultasi',
    articles: 'Artikel',
    openMenu: 'Buka menu',
    closeMenu: 'Tutup menu',
    home: 'Beranda Dazytech',
    latestArticles: 'Artikel terbaru',
    noArticles: 'Artikel pertama segera terbit.',
    allArticles: 'Semua artikel ›',
    whatsapp: 'Chat WhatsApp',
    switchTo: { href: '/en/', short: 'EN', label: 'English' },
    // Produk Dazytech dan proyek kolaborasi (Dazytech bukan pemiliknya, mis. OTP Nusantara)
    // di menu samping. href null = belum rilis, tampil "Segera hadir".
    products: {
      title: 'Produk & kolaborasi',
      soon: 'Segera hadir',
      items: [
        { name: 'BuatCV', description: 'Buat CV gratis dengan format Harvard yang ramah ATS.', href: 'https://buatcv.dazytech.web.id/' },
        { name: 'OSRM API', description: 'API rute, jarak, dan waktu tempuh untuk wilayah Indonesia.', href: 'https://osrm.dazytech.web.id/' },
        { name: 'OTP Nusantara', description: 'Proyek kolaborasi', href: null },
      ],
    },
  },

  // Teks pembuka chat WhatsApp per jalur, supaya chat yang masuk bisa dibedakan.
  wa: {
    erp: 'Halo Dazytech, saya mau diskusi kebutuhan ERP / aplikasi bisnis.',
    website: 'Halo Dazytech, saya tertarik membuat website company profile.',
    general: 'Halo Dazytech, saya mau konsultasi.',
  },

  hero: {
    eyebrow: 'ERP custom & aplikasi bisnis',
    title: 'Software yang mengikuti cara kerja bisnis Anda.',
    lead: 'Kami membuat ERP dan aplikasi bisnis sesuai alur kerja perusahaan Anda. Kami memulai dari modul yang paling dibutuhkan, lalu mengembangkannya bertahap.',
    note: 'Diskusi awal gratis. Ceritakan proses yang ingin dirapikan.',
    primary: 'Chat WhatsApp',
    secondary: 'Lihat alur ERP',
    proof: 'Berpengalaman mengembangkan ERP berbasis web end-to-end di lingkungan perusahaan.',
    websiteQuestion: 'Butuh website company profile?',
    websiteLink: 'Lihat layanan website ›',
    modelLabel: 'Maskot Dazytech dalam bentuk 3D',
  },

  // Kartu "satu pesanan terhubung" di hero. Nomor dokumen sama dengan ilustrasi ERP & gudang.
  flow: {
    label: 'Ilustrasi: satu pesanan yang terhubung dari penjualan sampai penagihan',
    order: 'SO-2026-0142',
    customer: 'Toko Sumber Rejeki',
    summary: '3 barang · 16 Okt 2026',
    amount: 'Rp18,4 jt',
    steps: [
      { module: 'Penjualan', status: 'Pesanan dikonfirmasi', detail: 'Batas kredit pelanggan masih cukup', time: '09.12', state: 'done' },
      { module: 'Gudang', status: 'Stok dialokasikan', detail: 'Gudang Cikarang · 3 dari 3 barang', time: '10.05', state: 'done' },
      { module: 'Pengiriman', status: 'Dalam perjalanan', detail: 'DO-0388 · B 9124 KXT · tiba ±14.20', time: '13.40', state: 'current' },
      { module: 'Keuangan', status: 'Tagihan menunggu', detail: 'INV-0291 terbit saat barang diterima', time: '', state: 'pending' },
    ] as { module: string; status: string; detail: string; time: string; state: 'done' | 'current' | 'pending' }[],
  },

  services: {
    title: 'Layanan & biaya',
    erp: {
      tag: 'Keahlian utama',
      name: 'ERP & aplikasi bisnis',
      price: 'Biaya sesuai cakupan',
      description: 'Hubungkan penjualan, stok, dan keuangan untuk mengurangi input ulang dan waktu rekap.',
      items: ['Penjualan, pembelian, stok & gudang', 'Keuangan, HR & payroll', 'Integrasi Accurate, API & WhatsApp', 'Migrasi dari aplikasi desktop lama'],
      note: 'Biaya dihitung dari modul dan integrasi yang dibutuhkan, lalu disepakati sebelum pengerjaan dimulai.',
      cta: 'Chat WhatsApp',
    },
    website: {
      name: 'Website company profile',
      prefix: 'Mulai',
      price: 'Rp500 ribu',
      description: 'Miliki website sendiri untuk usaha Anda. Tampilkan layanan, lokasi, dan kontak dalam satu tautan yang mudah dibagikan.',
      items: ['Tampilan responsif di HP & desktop', 'Tombol WhatsApp & Google Maps', 'SEO dasar'],
      // TODO(pemilik): isi cakupan paket yang benar-benar ditawarkan, mis.
      // ['Hingga 5 halaman', '2× revisi desain', 'Domain .com & hosting 1 tahun'].
      // Selama kosong, `scopeNote` yang tampil.
      scope: [] as string[],
      scopeNote: 'Rincian halaman, revisi, domain, dan hosting dibahas saat konsultasi.',
      cta: 'Tanya paket website',
      secondary: 'Lihat contoh website ›',
    },
  },

  showcase: {
    title: 'Contoh alur kerja dalam ERP.',
    tablistLabel: 'Contoh alur kerja',
    // Kontrol demo ERP interaktif (erp-demo.tsx).
    demo: {
      steps: ['Pesanan dibuat', 'Stok dialokasikan', 'Dikirim', 'Ditagih'],
      next: 'Langkah berikutnya',
      restart: 'Ulangi',
      hint: 'Coba langkah berikutnya dan lihat perubahan stok, pengiriman, serta tagihan.',
    },
    items: [
      {
        key: 'erp',
        name: 'ERP',
        title: 'Satu pesanan, terlihat di semua bagian.',
        body: 'Saat pesanan dicatat, sistem memeriksa stok. Data yang sama diteruskan ke gudang, pengiriman, dan penagihan tanpa input ulang.',
        features: ['Alokasi stok saat pesanan dikonfirmasi', 'Surat jalan dan tagihan dari dokumen yang sama', 'Batas kredit pelanggan terpantau'],
        story: '',
      },
      {
        key: 'inventory',
        name: 'Gudang',
        title: 'Stok tersedia jelas sebelum pesanan diproses.',
        body: 'Lihat stok fisik, yang sudah dialokasikan untuk pesanan, dan yang benar-benar tersedia di setiap gudang.',
        features: ['Riwayat mutasi per barang', 'Batas stok minimum & saran pembelian', 'Transfer antargudang'],
        story: 'Stok fisik 146 dus, 60 dus sudah dialokasikan untuk SO-2026-0142, jadi yang bisa dijual 86 dus.',
      },
      {
        key: 'pos',
        name: 'Kasir',
        title: 'Setiap transaksi langsung memperbarui stok.',
        body: 'Kasir mencatat penjualan, stok toko ikut berkurang, dan laporan harian siap tanpa rekap manual.',
        features: ['Multi-cabang & multi-kasir', 'Catat pembayaran tunai, QRIS, dan transfer', 'Laporan penjualan harian'],
        story: 'Transaksi #TS-2041 di Toko Sumber Rejeki langsung mengurangi stok: minyak goreng 24 menjadi 22.',
      },
      {
        key: 'crm',
        name: 'CRM',
        title: 'Tim sales tahu siapa yang perlu dihubungi hari ini.',
        body: 'Setiap prospek punya tahap, riwayat aktivitas, dan tindakan berikutnya. Nilai pipeline terlihat tanpa menunggu rekap.',
        features: ['Pengingat follow-up', 'Riwayat kunjungan & penawaran', 'Target dan komisi sales'],
        story: 'Minimarket Sejahtera ada di tahap penawaran. Tindakan berikutnya sudah terjadwal hari ini pukul 14.00.',
      },
      {
        key: 'hris',
        name: 'Payroll',
        title: 'Lembur yang disetujui langsung masuk ke gaji.',
        body: 'Absensi, cuti, dan lembur terhubung ke payroll. Komponen penggajian mengikuti aturan perusahaan Anda.',
        features: ['Absensi GPS & selfie', 'Approval cuti & lembur berjenjang', 'Slip gaji digital'],
        story: 'Enam jam lembur yang disetujui Kepala Gudang masuk ke slip gaji Oktober sebagai Rp315.600.',
      },
    ] as { key: 'erp' | 'inventory' | 'pos' | 'crm' | 'hris'; name: string; title: string; body: string; features: string[]; story: string }[],
  },

  websites: {
    title: 'Contoh website company profile.',
    lead: 'Dua konsep website untuk kebutuhan usaha yang berbeda.',
    concepts: [
      { key: 'distributor', name: 'Distributor & katalog produk', description: 'Bantu pembeli grosir menemukan produk dan meminta daftar harga.' },
      { key: 'service', name: 'Usaha jasa', description: 'Jelaskan layanan dan arahkan calon pelanggan untuk meminta penawaran.' },
    ] as { key: 'distributor' | 'service'; name: string; description: string }[],
    cta: 'Tanya paket website',
  },

  experience: {
    title: 'Pengalaman di balik Dazytech.',
    body: 'Dazytech didirikan oleh software engineer yang mengembangkan aplikasi ERP berbasis web end-to-end di lingkungan grup perusahaan, dari memahami proses kerja di lapangan sampai menjaga server tetap berjalan.',
    items: [
      { title: 'Aplikasi operasional dari nol', body: 'Proses yang sebelumnya di kertas dipindahkan ke sistem: rencana kerja, laporan harian, approval berjenjang, sampai perhitungan upah.' },
      { title: 'Modul keuangan', body: 'Jurnal, buku besar, neraca saldo, dan closing bulanan, termasuk API agar sistem lain bisa mengirim transaksi.' },
      { title: 'Migrasi sistem lama', body: 'Aplikasi desktop lama dipindah ke web dan mobile secara bertahap, berjalan berdampingan tanpa menghentikan operasional.' },
      { title: 'Server & pemeliharaan', body: 'Docker, deploy otomatis, monitoring, dan backup harian, supaya aplikasi tetap stabil setelah rilis.' },
    ],
    techTitle: 'Teknologi dipilih sesuai kebutuhan proyek',
    tech: ['Laravel', 'Next.js', 'React', 'Flutter', 'Spring Boot', 'MySQL', 'SQL Server', 'Docker', 'AWS'],
  },

  process: {
    title: 'Cara kami bekerja.',
    steps: [
      { title: 'Pahami kebutuhan', body: 'Kami membahas proses kerja, kendala, dan fitur yang perlu diprioritaskan.' },
      { title: 'Sepakati cakupan', body: 'Fitur, biaya, dan jadwal disepakati sebelum pengembangan dimulai. Kebutuhan tambahan dibahas dampaknya dulu sebelum dikerjakan.' },
      { title: 'Bangun bertahap', body: 'Anda meninjau hasil dan memberi masukan pada tahap yang disepakati.' },
      { title: 'Rilis & dampingi', body: 'Kami membantu pemasangan dan mendampingi tim Anda di masa awal penggunaan.' },
    ],
  },

  faq: {
    title: 'Pertanyaan yang sering diajukan.',
    items: [
      {
        q: 'Berapa biaya pembuatan ERP atau aplikasi bisnis?',
        a: 'Biaya ditentukan oleh modul dan integrasi yang dibutuhkan. Cakupan, estimasi biaya, dan jadwal dibahas sebelum pengembangan dimulai, jadi Anda tahu angkanya sebelum memutuskan.',
      },
      {
        q: 'Apa saja yang termasuk website company profile mulai Rp500 ribu?',
        a: 'Paket dasar mencakup tampilan responsif di HP dan desktop, tombol WhatsApp, Google Maps, dan SEO dasar. Jumlah halaman, revisi, serta domain dan hosting dijelaskan saat konsultasi sesuai kebutuhan Anda.',
      },
      {
        q: 'Berapa lama pengerjaannya?',
        a: 'Website company profile tergantung jumlah halaman dan kesiapan materi (teks, foto, logo). Aplikasi custom umumnya 2–5 bulan tergantung jumlah modul. Pengembangan dilakukan bertahap, jadi Anda bisa meninjau hasil sebelum seluruh sistem selesai.',
      },
      {
        q: 'Kami masih memakai aplikasi desktop lama. Bisa dipindah ke web?',
        a: 'Bisa. Aturan bisnis yang sudah berjalan dipelajari dan dipertahankan, lalu modul baru dijalankan berdampingan dengan sistem lama sampai siap menggantikannya.',
      },
      {
        q: 'Bisakah tersambung dengan sistem yang sudah ada?',
        a: 'Bisa. Aplikasi baru dapat disambungkan dengan sistem yang sudah berjalan, misalnya Accurate, aplikasi akuntansi lain, atau API pihak ketiga, sehingga Anda tidak perlu mengganti semuanya dari awal.',
      },
      {
        q: 'Apakah memakai WordPress atau template?',
        a: 'Tidak. Website dan aplikasi dikembangkan dengan framework seperti Laravel dan Next.js, tanpa tema siap pakai. Tampilan dan alurnya disesuaikan dengan kebutuhan yang disepakati.',
      },
      {
        q: 'Bagaimana dukungan setelah sistem berjalan?',
        a: 'Kami membantu pemasangan dan penggunaan awal. Perbaikan, penyesuaian, dan pengembangan lanjutan diatur sesuai kesepakatan proyek.',
      },
      {
        q: 'Apakah konsultasinya gratis?',
        a: 'Diskusi awal untuk memahami kebutuhan dan menentukan langkah berikutnya tidak dipungut biaya, dan tidak ada kewajiban melanjutkan proyek.',
      },
    ],
  },

  contact: {
    title: 'Ceritakan kebutuhan usaha Anda.',
    body: 'Belum punya daftar fitur? Tidak masalah. Ceritakan bagaimana pekerjaan dilakukan sekarang dan bagian mana yang ingin diperbaiki.',
    whatsappLabel: 'WhatsApp',
    emailLabel: 'Email',
    officeLabel: 'Kantor',
    form: {
      name: 'Nama',
      contact: 'WhatsApp atau email',
      contactPlaceholder: '08xx atau nama@usaha.com',
      service: 'Kebutuhan',
      // `value` disimpan apa adanya di tabel leads (selalu bahasa Indonesia).
      services: [
        { value: 'ERP & aplikasi bisnis', label: 'ERP & aplikasi bisnis' },
        { value: 'Website company profile', label: 'Website company profile' },
        { value: 'Integrasi / migrasi sistem lama', label: 'Integrasi / migrasi sistem lama' },
        { value: 'Lainnya', label: 'Lainnya' },
      ],
      message: 'Ceritakan singkat (opsional)',
      messagePlaceholder: 'Misalnya: distributor 2 gudang, pesanan dan stok masih dicatat di Excel terpisah.',
      submit: 'Kirim kebutuhan saya',
      submitting: 'Mengirim…',
      note: 'Konsultasi gratis, tanpa kewajiban melanjutkan proyek.',
      privacyNote: 'Kontak Anda dipakai untuk menanggapi pesan ini.',
      privacyLink: 'Baca kebijakan privasi',
      sentTitle: 'Pesan terkirim.',
      sentBody: 'Terima kasih, {name}. Kami akan segera menghubungi Anda.',
      continueWa: 'Atau lanjut chat di WhatsApp ›',
      errors: {
        check: 'Periksa kembali isian.',
        name: 'Isi nama Anda.',
        contact: 'Isi nomor WhatsApp atau email.',
        contactInvalid: 'Nomor WhatsApp atau email belum valid.',
        tooLong: 'Terlalu panjang.',
        rateLimited: 'Terlalu banyak kiriman dari jaringan ini. Silakan hubungi kami lewat WhatsApp.',
      },
    },
  },

  footer: {
    tagline: 'Jasa pengembangan website, aplikasi bisnis, dan ERP custom di Jakarta.',
    menuTitle: 'Dazytech',
    contactTitle: 'Kontak',
    articles: 'Artikel',
    privacy: 'Kebijakan privasi',
    terms: 'Syarat layanan',
    rights: 'Hak cipta dilindungi.',
  },
};

export type SiteCopy = typeof id;
