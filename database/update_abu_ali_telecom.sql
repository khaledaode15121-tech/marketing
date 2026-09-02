-- تحديث قاعدة بيانات AliGo / abu_ali_telecom
-- يُنفّذ هذا الملف من phpMyAdmin بعد اختيار قاعدة البيانات.
-- لا يحذف أي بيانات موجودة، ويضيف الجداول والأعمدة الناقصة فقط.

CREATE DATABASE IF NOT EXISTS `abu_ali_telecom`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `abu_ali_telecom`;

-- إضافة عمود بشكل آمن إذا لم يكن موجودًا.
DROP PROCEDURE IF EXISTS add_column_if_missing;
DELIMITER $$
CREATE PROCEDURE add_column_if_missing(
  IN p_table VARCHAR(64),
  IN p_column VARCHAR(64),
  IN p_definition TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = p_table
      AND COLUMN_NAME = p_column
  ) THEN
    SET @sql = CONCAT('ALTER TABLE `', p_table, '` ADD COLUMN `', p_column, '` ', p_definition);
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END$$
DELIMITER ;

-- جدول المنتجات: الأعمدة التي يعتمد عليها المتجر ولوحة الإدارة.
CALL add_column_if_missing('products', 'oldPrice', 'DECIMAL(10,2) NULL');
CALL add_column_if_missing('products', 'isRentable', 'BOOLEAN NOT NULL DEFAULT FALSE');
CALL add_column_if_missing('products', 'isSellable', 'BOOLEAN NOT NULL DEFAULT TRUE');
CALL add_column_if_missing('products', 'purchasePrice', 'DECIMAL(10,2) NULL');
CALL add_column_if_missing('products', 'rentalPrice', 'DECIMAL(10,2) NULL');
CALL add_column_if_missing('products', 'images', 'JSON NULL');
CALL add_column_if_missing('products', 'color', 'VARCHAR(100) NULL');
CALL add_column_if_missing('products', 'size', 'VARCHAR(100) NULL');
CALL add_column_if_missing('products', 'stock', 'INT NOT NULL DEFAULT 0');
CALL add_column_if_missing('products', 'isOnSale', 'BOOLEAN NOT NULL DEFAULT FALSE');
CALL add_column_if_missing('products', 'badge', 'VARCHAR(100) NULL');
CALL add_column_if_missing('products', 'badgeColor', 'VARCHAR(50) NULL');

-- جدول المستخدمين.
CALL add_column_if_missing('users', 'token', 'TEXT NULL');

-- جدول السلة. الاسم lowercase مهم على خوادم Linux/MySQL.
CREATE TABLE IF NOT EXISTS `cartitems` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `productId` INT NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `rentalDate` DATE NULL,
  `addedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_cartitems_user` (`userId`),
  KEY `idx_cartitems_product` (`productId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CALL add_column_if_missing('cartitems', 'rentalDate', 'DATE NULL');
CALL add_column_if_missing('cartitems', 'addedAt', 'TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP');
CALL add_column_if_missing('cartitems', 'updatedAt', 'TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

-- جدول الطلبات.
CREATE TABLE IF NOT EXISTS `orders` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `totalPrice` DECIMAL(10,2) NOT NULL,
  `status` ENUM('pending','processing','shipped','delivered','cancelled') DEFAULT 'pending',
  `paymentStatus` ENUM('unpaid','paid','refunded') NOT NULL DEFAULT 'unpaid',
  `paymentMethod` VARCHAR(100) NOT NULL DEFAULT 'الدفع عند الاستلام',
  `customerName` TEXT NULL,
  `customerPhone` VARCHAR(20) NULL,
  `shippingAddress` TEXT NULL,
  `estimatedDeliveryMinutes` INT NULL,
  `items` JSON NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_orders_user` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CALL add_column_if_missing('orders', 'paymentStatus', 'ENUM(''unpaid'',''paid'',''refunded'') NOT NULL DEFAULT ''unpaid''');
CALL add_column_if_missing('orders', 'paymentMethod', 'VARCHAR(100) NOT NULL DEFAULT ''الدفع عند الاستلام''');
CALL add_column_if_missing('orders', 'customerName', 'TEXT NULL');
CALL add_column_if_missing('orders', 'customerPhone', 'VARCHAR(20) NULL');
CALL add_column_if_missing('orders', 'shippingAddress', 'TEXT NULL');
CALL add_column_if_missing('orders', 'estimatedDeliveryMinutes', 'INT NULL');
CALL add_column_if_missing('orders', 'items', 'JSON NULL');
CALL add_column_if_missing('orders', 'createdAt', 'TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP');
CALL add_column_if_missing('orders', 'updatedAt', 'TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

-- جداول الإيجار.
CREATE TABLE IF NOT EXISTS `rentalRequests` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `productId` INT NOT NULL,
  `rentalDate` DATE NOT NULL,
  `status` ENUM('pending','unavailable','approved','cancelled','returned') NOT NULL DEFAULT 'pending',
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), KEY `idx_rental_requests_user` (`userId`),
  KEY `idx_rental_requests_product_date` (`productId`,`rentalDate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `rentalBookings` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `productId` INT NOT NULL,
  `rentalDate` DATE NOT NULL,
  `status` ENUM('booked','available') NOT NULL DEFAULT 'booked',
  `rentalRequestId` INT NULL,
  `userId` INT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `rentalPrice` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `payments` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `remaining` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), KEY `idx_rental_bookings_product_date` (`productId`,`rentalDate`,`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CALL add_column_if_missing('rentalBookings', 'quantity', 'INT NOT NULL DEFAULT 1');
CALL add_column_if_missing('rentalBookings', 'rentalPrice', 'DECIMAL(10,2) NOT NULL DEFAULT 0');
CALL add_column_if_missing('rentalBookings', 'payments', 'DECIMAL(10,2) NOT NULL DEFAULT 0');
CALL add_column_if_missing('rentalBookings', 'remaining', 'DECIMAL(10,2) NOT NULL DEFAULT 0');

-- صور العلامات التجارية ورسائل الترحيب.
CALL add_column_if_missing('brand', 'image', 'TEXT NULL');
CREATE TABLE IF NOT EXISTS `welcomeMessages` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `content` TEXT NOT NULL,
  `color` VARCHAR(50) DEFAULT '#000000',
  `style` JSON NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT TRUE,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP PROCEDURE IF EXISTS add_column_if_missing;

-- فحص سريع بعد التنفيذ:
SELECT TABLE_NAME FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('users','products','cartitems','orders','rentalRequests','rentalBookings','brand','welcomeMessages')
ORDER BY TABLE_NAME;
