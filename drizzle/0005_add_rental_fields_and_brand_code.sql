ALTER TABLE `products`
  ADD COLUMN `isRentable` boolean NOT NULL DEFAULT false,
  ADD COLUMN `rentalPrice` decimal(10, 2) NULL;

UPDATE `products`
SET `productCode` = CONCAT(
  UPPER(SUBSTRING(REPLACE(TRIM(`brand`), ' ', ''), 1, 3)),
  '-',
  COALESCE(`categoryId`, 0),
  '-',
  LPAD(`id`, 6, '0')
)
WHERE `productCode` IS NOT NULL;
