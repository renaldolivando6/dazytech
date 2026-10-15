-- Master tarif komisi awal. Ditaruh di migrasi (bukan seed saat start) supaya
-- hanya jalan SEKALI: kalau nanti kategori dihapus/diubah lewat halaman Master
-- Tarif, restart container tidak memunculkannya kembali.
-- `code` = persis nilai kolom KATEGORI di export Accurate.
INSERT INTO `komisi_categories` (`code`, `label`, `base_unit`, `rate`, `is_active`, `created_at`, `updated_at`) VALUES
  ('ROKOK FILTER', 'Rokok Filter',   'BKS', 10, 1, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('ROKOK KRETEK', 'Rokok Kretek',   'BKS', 3,  1, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('SUPLEMEN',     'Suplemen Duron', 'PCS', 40, 1, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('MOTI',         'Vape Moti',      'PCS', 60, 1, CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000);
--> statement-breakpoint
-- "DURON 1KTK (ISI 5PCS)": 1 KTK = 5 PCS, jadi komisinya 5 x Rp 40.
INSERT INTO `komisi_unit_conversions` (`category_id`, `unit`, `factor`, `created_at`)
SELECT `id`, 'KTK', 5, CAST(strftime('%s','now') AS INTEGER) * 1000 FROM `komisi_categories` WHERE `code` = 'SUPLEMEN';
