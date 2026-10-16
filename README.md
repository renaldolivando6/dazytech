# Dazytech

Company profile `dazytech.web.id` + area admin internal (`/admin`) untuk modul
**komisi** (import Excel Accurate → hitung komisi per cutoff tanggal 15).

Next.js 15 (App Router) **standalone** · SQLite (`better-sqlite3` + Drizzle) ·
Tailwind 4. Halaman compro tetap di-prerender statis; `/admin` dinamis dan wajib login.

## Jalan di local (full Docker, tanpa Node di host)

```bash
npm run docker:dev        # dev + hot reload           -> http://localhost:3000
npm run docker:preview    # image production persis   -> http://localhost:8080
npm run docker:dev:down
```

- Setelah `package.json` berubah, jalankan ulang `npm run docker:dev`
  (`--renew-anon-volumes` membuang `node_modules` lama).
- Perintah lain dijalankan di dalam container:
  `docker exec dazytech-dev npm test` · `npm run typecheck` · `npm run db:generate`.
- Database dev: `./data/dazytech.db` (di-gitignore). Hapus file itu untuk mulai dari nol.

### Login admin pertama

Saat database masih kosong, server membuat user `admin` dengan password acak
dan mencetaknya **sekali** ke log:

```bash
docker logs dazytech-dev 2>&1 | grep auth        # dev
docker logs dazytech-app 2>&1 | grep auth        # production (via SSM)
```

Login pertama wajib ganti password. Alternatif: set `ADMIN_USERNAME` /
`ADMIN_INITIAL_PASSWORD` sebelum start pertama.

## Portal & akses

Login (`/admin/login/`) berlaku untuk semua tim internal. Setelah login masuk ke
**portal** `/admin/` yang berisi aplikasi: **Website** (artikel & leads) dan **Komisi**.

- Peran **admin**: semua aplikasi + kelola pengguna di `/admin/pengguna/`.
- Peran **anggota**: hanya aplikasi yang dicentang (tabel `user_apps`). Aplikasi tanpa
  akses tetap tampil di portal tapi terkunci; membuka URL-nya langsung dikembalikan ke portal.
- Tambah pengguna (mis. `okta` dengan akses Komisi saja) dari `/admin/pengguna/`.
  Password awal dibuat otomatis, tampil sekali, dan wajib diganti saat login pertama.
- Menambah aplikasi baru: `src/lib/auth/apps.ts`, enum `user_apps.app` di
  `src/lib/db/schema.ts`, dan menu di `src/app/admin/(panel)/nav.tsx`.

## Company

Semua data komisi (faktur, import, perhitungan, master tarif) terpisah per
**company**. Default: **Pangan** dan **Test** (migrasi `0002`; data lama masuk
Pangan, Test dapat salinan master tarif).

- Setelah login pilih company di `/admin/company/` (bisa tambah company, opsional
  salin master tarif dari company lain). Ganti kapan saja lewat switcher di header.
- Company aktif disimpan di cookie `dz_company`. Setiap form mutasi ikut mengirim
  `companyId`; kalau company sudah diganti di tab lain, aksi ditolak
  (`requireCompanyForAction`) supaya data tidak masuk ke company yang salah.
- Kunci duplikat faktur unik **per company**.

## Modul komisi

| Halaman | Isi |
|---|---|
| `/admin/komisi/` | Import Excel (cek dulu → import), riwayat import, data faktur + filter |
| `/admin/komisi/perhitungan/` | Preview per tanggal cutoff → simpan & kunci, riwayat, export Excel/PDF, batalkan |
| `/admin/komisi/master/` | Tarif per KATEGORI + konversi satuan (mis. 1 KTK = 5 PCS) |

Aturan:

- **Kunci duplikat** per baris = `NO INV | NAMA BARANG | urutan kemunculan di faktur itu`.
  Import ulang file yang sama → semua baris ditandai *duplikat*, tidak masuk lagi.
- Baris yang sudah ada & **belum dikomisikan** ikut diperbarui (mis. `blm.lunas`
  berubah Ya → Tidak = siap dihitung di periode berikutnya).
- Baris yang **sudah dikomisikan** tidak pernah diubah; kalau datanya berbeda di
  file baru → ditandai *konflik* untuk dicek manual.
- Yang dihitung: faktur s/d tanggal cutoff, `blm.lunas = Tidak`, belum pernah
  dikomisikan, kategori+satuannya punya tarif. Komisi = qty × konversi × tarif.
- Perhitungan yang disimpan menyimpan **snapshot tarif**; ubah tarif tidak
  mengubah perhitungan lama. Batalkan perhitungan = baris dilepas lagi, catatan tetap ada.
- Hanya kolom yang relevan yang dipakai: NO INV, TGL, NAMA BARANG, KATEGORI, QTY,
  SATUAN, blm.lunas. Kolom dicari berdasarkan nama header, bukan posisi.

Uji dengan file Accurate asli (tidak di-commit, berisi data pelanggan):

```bash
docker cp "file.xlsx" dazytech-dev:/tmp/real.xlsx
docker exec -e REAL_XLSX=/tmp/real.xlsx dazytech-dev npx vitest run tests/real-file.test.ts
```

## Halaman utama (compro)

Gaya visual mengikuti design system Apple (`awesome-design-md/apple/DESIGN.md`),
token warnanya sama dengan `/admin` (`src/app/globals.css`). Ganti warna aksi
(sekarang biru) cukup di tiga `--color-accent*`.

- Dua bahasa: Indonesia di `/` (default) dan Inggris di `/en/`, dengan hreflang,
  canonical, dan sitemap. Semua teks ada di `src/i18n/id.ts` dan `src/i18n/en.ts`;
  kontak & nomor WhatsApp di `src/components/site/content.ts`.
- Susunan: hero (maskot 3D) → contoh alur ERP (tab) → layanan & biaya → contoh
  website → pengalaman → cara kerja → FAQ → kontak.
- Ilustrasi dibuat dengan kode (bukan gambar), datanya fiktif:
  `erp-demo.tsx` (demo ERP interaktif: pesanan → alokasi stok → surat jalan → tagihan),
  `mockups.tsx` (bingkai aplikasi desktop), `cards.tsx` (kartu versi HP & kartu
  "pesanan terhubung" cadangan hero), `websites.tsx` (konsep website desktop + HP).
- Model 3D hero: `public/models/doggy.glb` (dioptimasi dari 11,5 MB → 200 KB:
  simplify 15 ribu segitiga, normal halus, tekstur WebP 1024, meshopt). Viewer di
  `model-stage.tsx`; tukar ke kartu pesanan lewat `HERO_VISUAL` di `home.tsx`.
- Kebijakan Privasi & Syarat Layanan dua bahasa (`/privacy-policy/`,
  `/terms-of-service/`, `/en/...`): isi di `src/i18n/legal.ts`, tampilan di
  `legal-page.tsx`.
- Pratinjau saat link dibagikan (og:image, 1200×630): `public/og/dazytech-{id,en}.png`.
  Setiap halaman publik mengisi metadata share lewat `shareMetadata()` (`src/lib/seo.ts`),
  karena openGraph milik halaman menimpa (tidak menggabung) milik layout. Buat ulang
  gambarnya kalau headline hero berubah.
- Halaman utama tetap statis. Artikel terbaru di menu samping diambil lewat
  `/api/articles/`; form kontak memakai server action (`src/app/actions.ts`).
- Klik tombol WhatsApp dicatat per jalur (`data-cta`: `wa_erp`, `wa_website`,
  `wa_general`) ke tabel `cta_clicks` lewat `/api/track/`, tanpa IP/data pengunjung.
  Ringkasan 30 hari tampil di `/admin/leads/`.

## Artikel & leads

| Halaman | Isi |
|---|---|
| `/admin/artikel/` | Tulis artikel (Markdown + toolbar + pratinjau), draft / terbit, slug & meta description |
| `/admin/leads/` | Isian form kontak halaman utama, status Baru → Dihubungi → Selesai |
| `/artikel/`, `/artikel/<slug>/` | Halaman publik; dirender per request, masuk `sitemap.xml` otomatis |

- Tidak terikat company (beda dengan data komisi).
- Markdown dirender dengan `html: false`: tag HTML mentah di isi artikel tampil
  sebagai teks, link `javascript:` ditolak.
- Form kontak: honeypot + maks 5 kiriman per IP per jam (di memori proses).

## Production

- Server **WEB_LINUX**, `/opt/apps/rere-apps/dazytech`, container `dazytech-app`
  (port 3000, **tanpa port publik**) di belakang repo `nginx-reverse-proxy`.
- Deploy: GitHub Actions → *Deploy Dazytech (Next.js)* (manual). Urutan: test →
  build & push `sungaibudiwebdev/dazytech:latest` (yang lama jadi `:previous`) →
  SSM `docker compose up -d --force-recreate --wait`.
- Database: named volume **`dazytech-data`** → `/app/data/dazytech.db`.
  Aman saat container dihapus/di-recreate. **Jangan pernah `docker compose down -v`.**
- Migrasi skema jalan otomatis saat container start (`src/instrumentation.ts`).
  Ubah skema: edit `src/lib/db/schema.ts` → `npm run db:generate` → commit folder `drizzle/`.
  SQLite tidak bisa `ADD COLUMN ... NOT NULL` tanpa default: migrasi seperti itu harus
  ditulis manual dengan rebuild tabel (contoh: `drizzle/0002_companies.sql`). Foreign key
  dimatikan selama migrasi lalu dicek (`runMigrations`); `tests/migration.test.ts` menguji data lama tetap utuh.
- PDF laporan dibuat di server dengan `@react-pdf/renderer` (font Helvetica bawaan PDF).
  Font standar pdfkit dimuat dinamis, jadi didaftarkan di `outputFileTracingIncludes`
  (`next.config.mjs`) — tanpa itu PDF error 500 hanya di build standalone.
- Hardening container: user non-root, filesystem read-only, `/tmp` noexec,
  `cap_drop: ALL`, `no-new-privileges`.

Rollback: di server ubah tag image ke `:previous` lalu `docker compose up -d`.
Migrasi skema tidak otomatis mundur.
