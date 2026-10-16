-- Hak akses per aplikasi internal (portal /admin). Hasil drizzle-kit + satu
-- UPDATE manual di akhir: semua user yang sudah ada sebelum migrasi ini adalah
-- admin (dibuat oleh bootstrap), jadi tetap admin dan tidak kehilangan akses.
CREATE TABLE `user_apps` (
	`user_id` integer NOT NULL,
	`app` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `app`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `users` ADD `role` text DEFAULT 'member' NOT NULL;
--> statement-breakpoint
UPDATE `users` SET `role` = 'admin';
