CREATE TABLE IF NOT EXISTS rentalRequests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  productId INT NOT NULL,
  rentalDate DATE NOT NULL,
  status ENUM('pending', 'unavailable', 'approved', 'cancelled', 'returned') NOT NULL DEFAULT 'pending',
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX rental_requests_user_idx (userId),
  INDEX rental_requests_product_date_idx (productId, rentalDate)
);

CREATE TABLE IF NOT EXISTS rentalBookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  productId INT NOT NULL,
  rentalDate DATE NOT NULL,
  status ENUM('booked', 'available') NOT NULL DEFAULT 'booked',
  rentalRequestId INT NOT NULL,
  userId INT NOT NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX rental_bookings_product_date_idx (productId, rentalDate, status),
  INDEX rental_bookings_request_idx (rentalRequestId)
);
