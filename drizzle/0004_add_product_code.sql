ALTER TABLE `products`
  ADD COLUMN `productCode` varchar(64) NULL;

UPDATE `products`
SET `productCode` = CONCAT(
  COALESCE(`brandId`, 0),
  '-',
  COALESCE(`categoryId`, 0),
  '-',
  LPAD(`id`, 6, '0')
)
WHERE `productCode` IS NULL;

ALTER TABLE `products`
  MODIFY COLUMN `productCode` varchar(64) NOT NULL;

CREATE UNIQUE INDEX `products_productCode_unique` ON `products` (`productCode`);


