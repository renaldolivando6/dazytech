CREATE TABLE `gacha_campaigns` (
	`slug` text PRIMARY KEY NOT NULL,
	`pin` text NOT NULL,
	`secret` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `gacha_spins` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`campaign` text NOT NULL,
	`spin_no` integer NOT NULL,
	`prize` text NOT NULL,
	`code` text,
	`spun_at` integer,
	`revealed_at` integer,
	FOREIGN KEY (`campaign`) REFERENCES `gacha_campaigns`(`slug`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `gacha_spins_campaign_spin_uq` ON `gacha_spins` (`campaign`,`spin_no`);