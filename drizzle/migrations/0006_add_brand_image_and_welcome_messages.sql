-- Add image column to brand table
ALTER TABLE `brand` ADD COLUMN `image` text;

-- Create welcomeMessages table
CREATE TABLE `welcomeMessages` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `name` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `color` varchar(50) DEFAULT '#000000',
  `style` json,
  `isActive` boolean DEFAULT true NOT NULL,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);
