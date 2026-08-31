ALTER TABLE orders
  ADD COLUMN paymentMethod VARCHAR(100) NOT NULL DEFAULT 'الدفع عند الاستلام',
  ADD COLUMN customerName TEXT NULL,
  ADD COLUMN customerPhone VARCHAR(20) NULL,
  ADD COLUMN shippingAddress TEXT NULL;
