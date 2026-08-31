-- ============================================================
-- Abu Ali Telecom: Manager permissions and economic ledger
-- Database: abu_ali_telecom
-- Safe migration: does not DROP or DELETE existing data.
-- ============================================================

SET NAMES utf8mb4;
USE `abu_ali_telecom`;

-- 1) Extend users for local manager accounts.
SET @sql := IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'username') = 0,
  'ALTER TABLE `users` ADD COLUMN `username` VARCHAR(100) NULL UNIQUE AFTER `openId`',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'passwordHash') = 0,
  'ALTER TABLE `users` ADD COLUMN `passwordHash` VARCHAR(255) NULL AFTER `username`',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Keep existing user/admin values and allow the new manager role.
ALTER TABLE `users`
  MODIFY COLUMN `role` ENUM('user','admin','manager') NOT NULL DEFAULT 'user';

-- 2) Backfill product columns required by the current application.
-- Older databases may not have these columns; existing product rows are preserved.
SET @sql := IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'categoryId') = 0, 'ALTER TABLE `products` ADD COLUMN `categoryId` INT NULL AFTER `category`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'brandId') = 0, 'ALTER TABLE `products` ADD COLUMN `brandId` INT NULL AFTER `categoryId`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'isSellable') = 0, 'ALTER TABLE `products` ADD COLUMN `isSellable` TINYINT(1) NOT NULL DEFAULT 1 AFTER `isRentable`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'purchasePrice') = 0, 'ALTER TABLE `products` ADD COLUMN `purchasePrice` DECIMAL(10,2) NULL AFTER `isSellable`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'rentalPrice') = 0, 'ALTER TABLE `products` ADD COLUMN `rentalPrice` DECIMAL(10,2) NULL AFTER `purchasePrice`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'images') = 0, 'ALTER TABLE `products` ADD COLUMN `images` JSON NULL AFTER `image`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3) Link each category to a section and each section to its responsible manager.
SET @sql := IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'category' AND COLUMN_NAME = 'sectionId') = 0, 'ALTER TABLE `category` ADD COLUMN `sectionId` INT NULL AFTER `description`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'brand' AND COLUMN_NAME = 'managerId') = 0, 'ALTER TABLE `brand` ADD COLUMN `managerId` INT NULL AFTER `logo`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 4) Assign one manager to one or more product categories (legacy compatibility).
CREATE TABLE IF NOT EXISTS `managerCategoryAssignments` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `managerId` INT NOT NULL,
  `categoryId` INT NOT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_manager_category_manager` (`managerId`),
  KEY `idx_manager_category_category` (`categoryId`),
  UNIQUE KEY `uq_manager_category` (`managerId`,`categoryId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3) Sales ledger. One order may create several rows, one per product.
CREATE TABLE IF NOT EXISTS `sales` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `orderId` INT NULL,
  `managerId` INT NULL,
  `categoryId` INT NULL,
  `productId` INT NULL,
  `productName` VARCHAR(255) NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `unitPrice` DECIMAL(12,2) NOT NULL,
  `unitCost` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `totalAmount` DECIMAL(12,2) NOT NULL,
  `profitAmount` DECIMAL(12,2) NOT NULL,
  `status` ENUM('confirmed','cancelled') NOT NULL DEFAULT 'confirmed',
  `saleDate` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sales_order` (`orderId`),
  KEY `idx_sales_manager` (`managerId`),
  KEY `idx_sales_category` (`categoryId`),
  KEY `idx_sales_date` (`saleDate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4) Purchases ledger. Product creation with stock and purchase price creates a row.
CREATE TABLE IF NOT EXISTS `purchases` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `managerId` INT NULL,
  `categoryId` INT NULL,
  `productId` INT NULL,
  `productName` VARCHAR(255) NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `unitCost` DECIMAL(12,2) NOT NULL,
  `totalAmount` DECIMAL(12,2) NOT NULL,
  `status` ENUM('confirmed','cancelled') NOT NULL DEFAULT 'confirmed',
  `purchaseDate` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_purchases_manager` (`managerId`),
  KEY `idx_purchases_category` (`categoryId`),
  KEY `idx_purchases_date` (`purchaseDate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5) Expenses ledger: rent, electricity, salaries, transport, and other expenses.
CREATE TABLE IF NOT EXISTS `expenses` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `managerId` INT NULL,
  `title` VARCHAR(255) NOT NULL,
  `expenseCategory` VARCHAR(100) NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `notes` TEXT NULL,
  `expenseDate` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_expenses_manager` (`managerId`),
  KEY `idx_expenses_date` (`expenseDate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6) Cashbox ledger: income, expense, or adjustment movements.
CREATE TABLE IF NOT EXISTS `cashTransactions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `managerId` INT NULL,
  `type` ENUM('income','expense','adjustment') NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `description` VARCHAR(255) NOT NULL,
  `sourceType` VARCHAR(50) NULL,
  `sourceId` INT NULL,
  `transactionDate` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_cash_manager` (`managerId`),
  KEY `idx_cash_source` (`sourceType`,`sourceId`),
  KEY `idx_cash_date` (`transactionDate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migration completed. Manager passwords are intentionally not inserted here.
-- Create managers from the application so passwords are stored as scrypt hashes.
