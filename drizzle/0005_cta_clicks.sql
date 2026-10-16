CREATE TABLE `cta_clicks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cta` text NOT NULL,
	`locale` text NOT NULL,
	`path` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `cta_clicks_created_idx` ON `cta_clicks` (`created_at`);