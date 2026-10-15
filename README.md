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
