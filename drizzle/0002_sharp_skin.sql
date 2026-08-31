CREATE TABLE `brand` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`description` text,
	`logo` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `brand_id` PRIMARY KEY(`id`),
	CONSTRAINT `brand_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `category` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`description` text,
	`image` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `category_id` PRIMARY KEY(`id`),
	CONSTRAINT `category_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
ALTER TABLE `orders` ADD `paymentMethod` varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `customerName` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `customerPhone` varchar(20);--> statement-breakpoint
ALTER TABLE `orders` ADD `shippingAddress` text;--> statement-breakpoint
ALTER TABLE `products` ADD `categoryId` int;--> statement-breakpoint
ALTER TABLE `products` ADD `brandId` int;--> statement-breakpoint
ALTER TABLE `products` ADD `color` varchar(100);--> statement-breakpoint
ALTER TABLE `products` ADD `size` varchar(100);--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `address` text;--> statement-breakpoint
ALTER TABLE `users` ADD `token` text;