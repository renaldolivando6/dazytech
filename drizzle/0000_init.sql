CREATE TABLE `komisi_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`label` text NOT NULL,
	`base_unit` text NOT NULL,
	`rate` integer NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `komisi_categories_code_unique` ON `komisi_categories` (`code`);--> statement-breakpoint
CREATE TABLE `komisi_import_rows` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`import_id` integer NOT NULL,
	`row_number` integer NOT NULL,
	`line_key` text,
	`invoice_no` text,
	`item_name` text,
	`status` text NOT NULL,
	`message` text,
	FOREIGN KEY (`import_id`) REFERENCES `komisi_imports`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `komisi_import_rows_import_idx` ON `komisi_import_rows` (`import_id`);--> statement-breakpoint
CREATE TABLE `komisi_imports` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
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
	FOREIGN KEY (`imported_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `komisi_lines` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
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
	FOREIGN KEY (`first_import_id`) REFERENCES `komisi_imports`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`last_import_id`) REFERENCES `komisi_imports`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`commission_run_id`) REFERENCES `komisi_runs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `komisi_lines_line_key_unique` ON `komisi_lines` (`line_key`);--> statement-breakpoint
CREATE INDEX `komisi_lines_invoice_idx` ON `komisi_lines` (`invoice_no`);--> statement-breakpoint
CREATE INDEX `komisi_lines_run_idx` ON `komisi_lines` (`commission_run_id`);--> statement-breakpoint
CREATE INDEX `komisi_lines_pending_idx` ON `komisi_lines` (`commission_run_id`,`is_unpaid`,`invoice_date`);--> statement-breakpoint
CREATE TABLE `komisi_run_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`run_id` integer NOT NULL,
	`line_id` integer NOT NULL,
	`category` text NOT NULL,
	`unit` text NOT NULL,
	`base_unit` text NOT NULL,
	`qty` real NOT NULL,
	`factor` integer NOT NULL,
	`rate` integer NOT NULL,
	`amount` integer NOT NULL,
	FOREIGN KEY (`run_id`) REFERENCES `komisi_runs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`line_id`) REFERENCES `komisi_lines`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `komisi_run_items_run_idx` ON `komisi_run_items` (`run_id`);--> statement-breakpoint
CREATE INDEX `komisi_run_items_line_idx` ON `komisi_run_items` (`line_id`);--> statement-breakpoint
CREATE TABLE `komisi_runs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
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
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`voided_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `komisi_unit_conversions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category_id` integer NOT NULL,
	`unit` text NOT NULL,
	`factor` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `komisi_categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `komisi_unit_conversions_category_unit_uq` ON `komisi_unit_conversions` (`category_id`,`unit`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`must_change_password` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);