-- Add the customer-visible delivery outcome used by department managers.
ALTER TABLE `orders`
  MODIFY COLUMN `status` enum('pending','processing','shipped','delivered','contact_failed','cancelled') DEFAULT 'pending';
