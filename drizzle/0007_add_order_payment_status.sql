-- Keep delivery workflow and payment workflow as separate order states.
ALTER TABLE `orders`
  ADD COLUMN `paymentStatus` enum('unpaid','paid','refunded') NOT NULL DEFAULT 'unpaid' AFTER `status`;
