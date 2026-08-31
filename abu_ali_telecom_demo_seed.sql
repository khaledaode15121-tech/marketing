-- ============================================================
-- Abu Ali Telecom: demo data seed
-- Database: abu_ali_telecom
-- Demo manager password for both accounts: Demo1234!
-- This file is intended for a fresh/demo database.
-- ============================================================

SET NAMES utf8mb4;
USE `abu_ali_telecom`;

-- Demo users and managers. Passwords are scrypt hashes, never plain text.
INSERT INTO `users` (`id`,`openId`,`username`,`passwordHash`,`name`,`email`,`phone`,`address`,`loginMethod`,`role`)
VALUES
(9001,'demo-admin-openid','demo_admin','scrypt:136c59f1921d04fcf2c7001a6449e734:f552bfd330b14dd20e8a64a39964dd63030906b4bba15c37561ebdf1d2969d646ea69bab1206a349347e57d53b8ddbb0883b47a129b6e86cd8a70982b50d7bc7','المدير العام التجريبي','admin.demo@example.com','0999000001','دمشق','local','admin'),
(9002,'demo-manager-openid','manager_electronics','scrypt:136c59f1921d04fcf2c7001a6449e734:f552bfd330b14dd20e8a64a39964dd63030906b4bba15c37561ebdf1d2969d646ea69bab1206a349347e57d53b8ddbb0883b47a129b6e86cd8a70982b50d7bc7','مدير قسم الإلكترونيات','manager.demo@example.com','0999000002','حمص','local','manager'),
(9003,'demo-customer-openid',NULL,NULL,'عميل تجريبي','customer.demo@example.com','0999000003','دمشق','local','user')
ON DUPLICATE KEY UPDATE
  `name`=VALUES(`name`), `email`=VALUES(`email`), `phone`=VALUES(`phone`), `role`=VALUES(`role`), `passwordHash`=VALUES(`passwordHash`);

INSERT INTO `category` (`id`,`categoryCode`,`name`,`slug`,`description`,`isActive`)
VALUES
(9101,'ELEC-001','الإلكترونيات','electronics','هواتف وإكسسوارات وأجهزة إلكترونية',1),
(9102,'NET-001','الشبكات والاتصالات','networks','معدات الشبكات والاتصالات',1),
(9103,'OFF-001','المستلزمات المكتبية','office-supplies','قرطاسية ومستلزمات مكتبية',1)
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`), `description`=VALUES(`description`), `isActive`=VALUES(`isActive`);

INSERT INTO `brand` (`id`,`brandCode`,`name`,`slug`,`description`,`isActive`)
VALUES
(9201,'SAM-001','Samsung','samsung','أجهزة Samsung',1),
(9202,'TP-001','TP-Link','tp-link','معدات الشبكات TP-Link',1),
(9203,'GEN-001','عام','generic','منتجات متنوعة',1)
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`), `description`=VALUES(`description`), `isActive`=VALUES(`isActive`);

INSERT INTO `managerCategoryAssignments` (`managerId`,`categoryId`)
SELECT u.id,c.id FROM `users` u JOIN `category` c
WHERE u.username='manager_electronics' AND c.categoryCode IN ('ELEC-001','NET-001')
ON DUPLICATE KEY UPDATE `categoryId`=VALUES(`categoryId`);

INSERT INTO `products` (`id`,`productCode`,`name`,`brand`,`category`,`categoryId`,`brandId`,`description`,`price`,`oldPrice`,`isRentable`,`isSellable`,`purchasePrice`,`rentalPrice`,`image`,`images`,`rating`,`reviewCount`,`stock`,`isOnSale`,`badge`,`badgeColor`,`color`,`size`)
VALUES
(9301,'SAM-001-ELEC-001-000001','هاتف Samsung Galaxy A55','Samsung','الإلكترونيات',9101,9201,'هاتف ذكي بشاشة عالية الدقة وذاكرة 128GB','4250000','4500000',0,1,'3600000',NULL,'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800','["https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800","https://images.unsplash.com/photo-1598327105666-5e5e6e5c6d0f?w=800"]','4.80',12,8,1,'الأكثر مبيعاً','#2563eb','أسود','128GB'),
(9302,'TP-001-NET-001-000002','راوتر TP-Link Archer C6','TP-Link','الشبكات والاتصالات',9102,9202,'راوتر لاسلكي بسرعة AC1200 مناسب للمنزل والمكتب','850000','950000',0,1,'620000',NULL,'https://images.unsplash.com/photo-1606904825846-647eb07f5be2?w=800','["https://images.unsplash.com/photo-1606904825846-647eb07f5be2?w=800"]','4.50',8,15,1,'عرض خاص','#16a34a','أبيض','AC1200'),
(9303,'GEN-001-OFF-001-000003','طابعة مكتبية متعددة الوظائف','عام','المستلزمات المكتبية',9103,9203,'طابعة للاستخدام المكتبي والطباعة اليومية','1250000',NULL,1,0,NULL,'75000','https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=800','["https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=800"]','4.20',5,3,0,'للإيجار','#9333ea','أبيض','A4')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`), `price`=VALUES(`price`), `stock`=VALUES(`stock`), `categoryId`=VALUES(`categoryId`), `brandId`=VALUES(`brandId`), `images`=VALUES(`images`), `isSellable`=VALUES(`isSellable`), `purchasePrice`=VALUES(`purchasePrice`);

INSERT INTO `orders` (`id`,`userId`,`totalPrice`,`status`,`paymentStatus`,`paymentMethod`,`customerName`,`customerPhone`,`shippingAddress`,`estimatedDeliveryMinutes`,`items`)
VALUES
(9401,9003,'5100000','delivered','paid','cash','عميل تجريبي','0999000003','دمشق - المزة',45,'[{"productId":9301,"quantity":1,"price":4250000,"title":"هاتف Samsung Galaxy A55"},{"productId":9302,"quantity":1,"price":850000,"title":"راوتر TP-Link Archer C6"}]'),
(9402,9003,'850000','cancelled','refunded','cash','عميل تجريبي','0999000003','دمشق - المزة',60,'[{"productId":9302,"quantity":1,"price":850000,"title":"راوتر TP-Link Archer C6"}]')
ON DUPLICATE KEY UPDATE `totalPrice`=VALUES(`totalPrice`), `status`=VALUES(`status`), `paymentStatus`=VALUES(`paymentStatus`), `items`=VALUES(`items`);

INSERT INTO `sales` (`id`,`orderId`,`managerId`,`categoryId`,`productId`,`productName`,`quantity`,`unitPrice`,`unitCost`,`totalAmount`,`profitAmount`,`status`,`saleDate`)
VALUES
(9501,9401,9002,9101,9301,'هاتف Samsung Galaxy A55',1,'4250000','3600000','4250000','650000','confirmed',DATE_SUB(NOW(),INTERVAL 1 DAY)),
(9502,9401,9002,9102,9302,'راوتر TP-Link Archer C6',1,'850000','620000','850000','230000','confirmed',DATE_SUB(NOW(),INTERVAL 3 DAY)),
(9503,9402,9002,9102,9302,'راوتر TP-Link Archer C6',1,'850000','620000','850000','230000','cancelled',DATE_SUB(NOW(),INTERVAL 5 DAY))
ON DUPLICATE KEY UPDATE `status`=VALUES(`status`), `totalAmount`=VALUES(`totalAmount`), `profitAmount`=VALUES(`profitAmount`);

INSERT INTO `purchases` (`id`,`managerId`,`categoryId`,`productId`,`productName`,`quantity`,`unitCost`,`totalAmount`,`status`,`purchaseDate`)
VALUES
(9601,9002,9101,9301,'هاتف Samsung Galaxy A55',10,'3600000','36000000','confirmed',DATE_SUB(NOW(),INTERVAL 7 DAY)),
(9602,9002,9102,9302,'راوتر TP-Link Archer C6',20,'620000','12400000','confirmed',DATE_SUB(NOW(),INTERVAL 6 DAY)),
(9603,9001,9103,9303,'طابعة مكتبية متعددة الوظائف',3,'900000','2700000','confirmed',DATE_SUB(NOW(),INTERVAL 12 DAY))
ON DUPLICATE KEY UPDATE `quantity`=VALUES(`quantity`), `unitCost`=VALUES(`unitCost`), `totalAmount`=VALUES(`totalAmount`), `status`=VALUES(`status`);

INSERT INTO `expenses` (`id`,`managerId`,`title`,`expenseCategory`,`amount`,`notes`,`expenseDate`)
VALUES
(9701,9001,'إيجار المحل','إيجار','2500000','مصروف إيجار شهري تجريبي',DATE_SUB(NOW(),INTERVAL 2 DAY)),
(9702,9001,'فاتورة الكهرباء','خدمات','450000','فاتورة كهرباء تجريبية',DATE_SUB(NOW(),INTERVAL 4 DAY)),
(9703,9002,'صيانة أجهزة الشبكة','صيانة','175000','صيانة دورية للمعدات',DATE_SUB(NOW(),INTERVAL 8 DAY))
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`), `expenseCategory`=VALUES(`expenseCategory`), `amount`=VALUES(`amount`), `notes`=VALUES(`notes`);

INSERT INTO `cashTransactions` (`id`,`managerId`,`type`,`amount`,`description`,`sourceType`,`sourceId`,`transactionDate`)
VALUES
(9801,9002,'income','5100000','تحصيل مبيعات الطلب 9401','sale',9401,DATE_SUB(NOW(),INTERVAL 1 DAY)),
(9802,9001,'expense','2500000','دفع إيجار المحل','expense',9701,DATE_SUB(NOW(),INTERVAL 2 DAY)),
(9803,9001,'expense','450000','دفع فاتورة الكهرباء','expense',9702,DATE_SUB(NOW(),INTERVAL 4 DAY)),
(9804,9002,'adjustment','100000','تسوية صندوق تجريبية','manual',NULL,DATE_SUB(NOW(),INTERVAL 10 DAY))
ON DUPLICATE KEY UPDATE `type`=VALUES(`type`), `amount`=VALUES(`amount`), `description`=VALUES(`description`);

-- Quick verification after import:
SELECT COUNT(*) AS demo_products FROM `products` WHERE `productCode` LIKE '%00000%';
SELECT COUNT(*) AS demo_sales FROM `sales` WHERE `id` BETWEEN 9501 AND 9503;
SELECT COUNT(*) AS demo_expenses FROM `expenses` WHERE `id` BETWEEN 9701 AND 9703;
SELECT COUNT(*) AS demo_cash_transactions FROM `cashTransactions` WHERE `id` BETWEEN 9801 AND 9804;
