-- Multi-company. Ditulis manual (bukan hasil drizzle-kit apa adanya):
-- SQLite tidak bisa `ALTER TABLE ADD COLUMN ... NOT NULL` tanpa default, jadi
-- 4 tabel dibangun ulang dengan prosedur resmi SQLite (buat tabel baru ->
-- salin data -> drop -> rename). Foreign key dimatikan selama migrasi oleh
-- runMigrations() (src/lib/db/open.ts) lalu dicek dengan foreign_key_check.
--
-- Data yang sudah ada dimasukkan ke company "Pangan".
CREATE TABLE `companies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `companies_name_unique` ON `companies` (`name`);
--> statement-breakpoint
INSERT INTO `companies` (`name`, `created_at`) VALUES
  ('Pangan', CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('Test',   CAST(strftime('%s','now') AS INTEGER) * 1000);
--> statement-breakpoint

-- ---------------------------------------------------------------- komisi_categories
CREATE TABLE `__new_komisi_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_id` integer NOT NULL,
	`code` text NOT NULL,
	`label` text NOT NULL,
	`base_unit` text NOT NULL,
	`rate` integer NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_komisi_categories` (`id`, `company_id`, `code`, `label`, `base_unit`, `rate`, `is_active`, `created_at`, `updated_at`)
SELECT `id`, (SELECT `id` FROM `companies` WHERE `name` = 'Pangan'), `code`, `label`, `base_unit`, `rate`, `is_active`, `created_at`, `updated_at`
FROM `komisi_categories`;
--> statement-breakpoint
DROP TABLE `komisi_categories`;
--> statement-breakpoint
ALTER TABLE `__new_komisi_categories` RENAME TO `komisi_categories`;
--> statement-breakpoint
CREATE UNIQUE INDEX `komisi_categories_company_code_uq` ON `komisi_categories` (`company_id`,`code`);
--> statement-breakpoint

-- ---------------------------------------------------------------- komisi_imports
CREATE TABLE `__new_komisi_imports` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_id` integer NOT NULL,
	`file_name` text NOT NULL,
	`file_hash` text NOT NULL,
	`imported_by` integer,
	`rows_total` integer DEFAULT 0 NOT NULL,
	`rows_new` integer DEFAULT 0 NOT NULL,
	`rows_updated` integer DEFAULT 0 NOT NULL,
	`rows_duplicate` integer DEFAULT 0 NOT NULL,
	`rows_locked` integer DEFAULT 0 NOT NULL,
	`rows_conflict` integer DEFAULT 0 NOT NULL,
	`rows_error` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`imported_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_komisi_imports` (`id`, `company_id`, `file_name`, `file_hash`, `imported_by`, `rows_total`, `rows_new`, `rows_updated`, `rows_duplicate`, `rows_locked`, `rows_conflict`, `rows_error`, `created_at`)
SELECT `id`, (SELECT `id` FROM `companies` WHERE `name` = 'Pangan'), `file_name`, `file_hash`, `imported_by`, `rows_total`, `rows_new`, `rows_updated`, `rows_duplicate`, `rows_locked`, `rows_conflict`, `rows_error`, `created_at`
FROM `komisi_imports`;
--> statement-breakpoint
DROP TABLE `komisi_imports`;
--> statement-breakpoint
ALTER TABLE `__new_komisi_imports` RENAME TO `komisi_imports`;
--> statement-breakpoint
CREATE INDEX `komisi_imports_company_idx` ON `komisi_imports` (`company_id`);
--> statement-breakpoint

-- ---------------------------------------------------------------- komisi_runs
CREATE TABLE `__new_komisi_runs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_id` integer NOT NULL,
	`label` text NOT NULL,
	`cutoff_date` text NOT NULL,
	`status` text DEFAULT 'final' NOT NULL,
	`total_lines` integer NOT NULL,
	`total_amount` integer NOT NULL,
	`note` text,
	`created_by` integer,
	`created_at` integer NOT NULL,
	`voided_at` integer,
	`voided_by` integer,
	`void_reason` text,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`voided_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_komisi_runs` (`id`, `company_id`, `label`, `cutoff_date`, `status`, `total_lines`, `total_amount`, `note`, `created_by`, `created_at`, `voided_at`, `voided_by`, `void_reason`)
SELECT `id`, (SELECT `id` FROM `companies` WHERE `name` = 'Pangan'), `label`, `cutoff_date`, `status`, `total_lines`, `total_amount`, `note`, `created_by`, `created_at`, `voided_at`, `voided_by`, `void_reason`
FROM `komisi_runs`;
--> statement-breakpoint
DROP TABLE `komisi_runs`;
--> statement-breakpoint
ALTER TABLE `__new_komisi_runs` RENAME TO `komisi_runs`;
--> statement-breakpoint
CREATE INDEX `komisi_runs_company_idx` ON `komisi_runs` (`company_id`);
--> statement-breakpoint

-- ---------------------------------------------------------------- komisi_lines
CREATE TABLE `__new_komisi_lines` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_id` integer NOT NULL,
	`line_key` text NOT NULL,
	`invoice_no` text NOT NULL,
	`invoice_date` text NOT NULL,
	`customer` text,
	`item_name` text NOT NULL,
	`category` text NOT NULL,
	`qty` real NOT NULL,
	`unit` text NOT NULL,
	`price` real,
	`total` real,
	`salesperson` text,
	`is_unpaid` integer NOT NULL,
	`paid_seen_at` integer,
	`first_import_id` integer,
	`last_import_id` integer,
	`commission_run_id` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`first_import_id`) REFERENCES `komisi_imports`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`last_import_id`) REFERENCES `komisi_imports`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`commission_run_id`) REFERENCES `komisi_runs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_komisi_lines` (`id`, `company_id`, `line_key`, `invoice_no`, `invoice_date`, `customer`, `item_name`, `category`, `qty`, `unit`, `price`, `total`, `salesperson`, `is_unpaid`, `paid_seen_at`, `first_import_id`, `last_import_id`, `commission_run_id`, `created_at`, `updated_at`)
SELECT `id`, (SELECT `id` FROM `companies` WHERE `name` = 'Pangan'), `line_key`, `invoice_no`, `invoice_date`, `customer`, `item_name`, `category`, `qty`, `unit`, `price`, `total`, `salesperson`, `is_unpaid`, `paid_seen_at`, `first_import_id`, `last_import_id`, `commission_run_id`, `created_at`, `updated_at`
FROM `komisi_lines`;
--> statement-breakpoint
DROP TABLE `komisi_lines`;
--> statement-breakpoint
ALTER TABLE `__new_komisi_lines` RENAME TO `komisi_lines`;
--> statement-breakpoint
CREATE UNIQUE INDEX `komisi_lines_company_key_uq` ON `komisi_lines` (`company_id`,`line_key`);
--> statement-breakpoint
CREATE INDEX `komisi_lines_invoice_idx` ON `komisi_lines` (`invoice_no`);
--> statement-breakpoint
CREATE INDEX `komisi_lines_run_idx` ON `komisi_lines` (`commission_run_id`);
--> statement-breakpoint
CREATE INDEX `komisi_lines_pending_idx` ON `komisi_lines` (`company_id`,`commission_run_id`,`is_unpaid`,`invoice_date`);
--> statement-breakpoint

-- ---------------------------------------------------------------- company "Test"
-- Salinan master tarif Pangan, supaya Test bisa langsung dipakai uji coba.
INSERT INTO `komisi_categories` (`company_id`, `code`, `label`, `base_unit`, `rate`, `is_active`, `created_at`, `updated_at`)
SELECT (SELECT `id` FROM `companies` WHERE `name` = 'Test'), `code`, `label`, `base_unit`, `rate`, `is_active`,
       CAST(strftime('%s','now') AS INTEGER) * 1000, CAST(strftime('%s','now') AS INTEGER) * 1000
FROM `komisi_categories`
WHERE `company_id` = (SELECT `id` FROM `companies` WHERE `name` = 'Pangan');
--> statement-breakpoint
INSERT INTO `komisi_unit_conversions` (`category_id`, `unit`, `factor`, `created_at`)
SELECT tc.`id`, u.`unit`, u.`factor`, CAST(strftime('%s','now') AS INTEGER) * 1000
FROM `komisi_unit_conversions` u
JOIN `komisi_categories` pc ON pc.`id` = u.`category_id`
  AND pc.`company_id` = (SELECT `id` FROM `companies` WHERE `name` = 'Pangan')
JOIN `komisi_categories` tc ON tc.`code` = pc.`code`
  AND tc.`company_id` = (SELECT `id` FROM `companies` WHERE `name` = 'Test');
