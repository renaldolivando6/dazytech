# CLAUDE.md

Panduan untuk Claude Code saat bekerja di repo ini. Detail teknis (Docker, database,
modul komisi, artikel) ada di `README.md`.

## Gaya tulisan

- **Jangan pakai em dash (`—`)**, termasuk pola " — " di tengah kalimat. Karakter ini
  terasa generik khas tulisan AI. Berlaku untuk teks di halaman (compro & admin), pesan
  error/validasi, metadata SEO, dokumentasi, pesan commit, dan deskripsi PR.
  Gantinya: titik (pecah jadi dua kalimat), koma, titik dua, atau tanda kurung.
  Untuk pemisah judul pakai `|` atau `·`; untuk sel tabel kosong pakai `-`.
- Teks untuk pengunjung dan admin ditulis dalam bahasa Indonesia yang singkat dan
  spesifik. Hindari kata klise seperti "transformasi digital", "solusi inovatif",
  "mulus", "seamless".
- Poin manfaat untuk pengunjung ditulis sebagai hasil yang dirasakan pemilik usaha
  ("stok gudang dan penjualan selalu cocok"), bukan nama modul atau istilah teknis.
  Istilah seperti API, nama software (Accurate), atau "migrasi" cukup di teks catatan.
- Halaman login `/admin` memakai bahasa Inggris dan tidak menyebut aplikasi
  internal apa saja yang ada (khusus tim internal Dazytech).

## Halaman publik dua bahasa

- Semua teks halaman utama ada di `src/i18n/id.ts` (default, `/`) dan `src/i18n/en.ts`
  (`/en/`). Setiap perubahan teks wajib di kedua file; `tests/site.test.ts` mengecek
  jumlah isi keduanya sama dan tidak ada em dash.
- Kebijakan Privasi & Syarat Layanan (`/privacy-policy/`, `/terms-of-service/`, versi
  EN di `/en/...`) isinya di `src/i18n/legal.ts`. Tulis sesuai data yang benar-benar
  dikumpulkan website; kalau form, pencatatan klik, atau cookie berubah, ubah juga di
  sana dan perbarui `LEGAL_UPDATED`. Ketentuan proyek (harga, garansi, kepemilikan
  kode) merujuk ke penawaran tertulis, jangan dikarang.
- Ilustrasi aplikasi (`src/components/site/mockups.tsx`, `cards.tsx`, `websites.tsx`)
  memakai satu perusahaan fiktif, CV Mitra Pangan, dengan nomor dokumen dan angka yang
  saling cocok (mis. SO-2026-0142, stok 146/60/86). Jaga konsistensinya saat mengubah.
- Positioning: ERP & aplikasi bisnis sebagai keahlian utama, website company profile
  sebagai penawaran kedua. Jangan menyebut pemberi kerja founder sebagai klien Dazytech.
- Paket & harga (`/harga/`, EN `/en/pricing/`, plus PDF-nya) isinya di
  `src/i18n/pricing.ts`: angka di `PACKAGES`/`EXTRAS`, teks dua bahasa di `PRICING`.
  Kartu layanan beranda dan PDF membaca dari file yang sama. Isinya penawaran yang
  disetujui pemilik; jangan menambah paket, harga, atau ketentuan (garansi, pembayaran,
  jadwal) tanpa persetujuan. Tanggal harga tidak ditampilkan di halaman maupun PDF.

## Desain

- Compro dan `/admin` mengikuti design system Apple
  (`awesome-design-md/apple/DESIGN.md`); token warna di `src/app/globals.css`.
  Satu warna aksi saja, tanpa gradient dekoratif, tanpa bayangan di kartu/tombol.

## Database

- Perubahan skema lewat file migrasi: edit `src/lib/db/schema.ts` →
  `docker exec dazytech-dev npx drizzle-kit generate --name <nama>` → commit folder
  `drizzle/`. Migrasi jalan otomatis saat container start. Data lama yang perlu
  disesuaikan ditambahkan manual di file SQL hasil generate (contoh:
  `drizzle/0004_user_roles_apps.sql`), disertai tes di `tests/migration.test.ts`.
