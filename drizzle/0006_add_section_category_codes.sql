-- Add stable English identifiers for sections (brand table) and categories.
ALTER TABLE `category`
  ADD COLUMN `categoryCode` varchar(32) NULL;

ALTER TABLE `brand`
  ADD COLUMN `brandCode` varchar(32) NULL;

UPDATE `category`
SET `categoryCode` = CONCAT('CAT-', LPAD(`id`, 3, '0'))
WHERE `categoryCode` IS NULL;

UPDATE `brand`
SET `brandCode` = CONCAT('SEC-', LPAD(`id`, 3, '0'))
WHERE `brandCode` IS NULL;

ALTER TABLE `category`
  MODIFY COLUMN `categoryCode` varchar(32) NOT NULL,
  ADD UNIQUE KEY `category_categoryCode_unique` (`categoryCode`);

ALTER TABLE `brand`
  MODIFY COLUMN `brandCode` varchar(32) NOT NULL,
  ADD UNIQUE KEY `brand_brandCode_unique` (`brandCode`);

UPDATE `products` p
LEFT JOIN `brand` b ON b.`id` = p.`brandId`
LEFT JOIN `category` c ON c.`id` = p.`categoryId`
SET p.`productCode` = CONCAT(
  COALESCE(b.`brandCode`, 'SEC-000'),
  '-',
  COALESCE(c.`categoryCode`, 'CAT-000'),
  '-',
  LPAD(p.`id`, 6, '0')
)
WHERE p.`id` IS NOT NULL;
