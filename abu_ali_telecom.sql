-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: 30 أغسطس 2026 الساعة 19:38
-- إصدار الخادم: 12.2.2-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `abu_ali_telecom`
--

-- --------------------------------------------------------

--
-- بنية الجدول `brand`
--

CREATE TABLE `brand` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `logo` text DEFAULT NULL,
  `managerId` int(11) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `brandCode` varchar(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- إرجاع أو استيراد بيانات الجدول `brand`
--

INSERT INTO `brand` (`id`, `name`, `slug`, `description`, `logo`, `managerId`, `isActive`, `createdAt`, `updatedAt`, `brandCode`) VALUES
(9201, 'Samsung', 'samsung', 'أجهزة Samsung', NULL, NULL, 1, '2026-08-26 02:11:31', '2026-08-26 02:11:31', 'SAM-001'),
(9202, 'TP-Link', 'tp-link', 'معدات الشبكات TP-Link', NULL, NULL, 1, '2026-08-26 02:11:31', '2026-08-26 02:11:31', 'TP-001'),
(9203, 'عام', 'generic', 'منتجات متنوعة', NULL, NULL, 1, '2026-08-26 02:11:31', '2026-08-26 02:11:31', 'GEN-001');

-- --------------------------------------------------------

--
-- بنية الجدول `cartitems`
--

CREATE TABLE `cartitems` (
  `id` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `productId` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `addedAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `rentalDate` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- بنية الجدول `cashtransactions`
--

CREATE TABLE `cashtransactions` (
  `id` int(11) NOT NULL,
  `managerId` int(11) DEFAULT NULL,
  `type` enum('income','expense','adjustment') NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `description` varchar(255) NOT NULL,
  `sourceType` varchar(50) DEFAULT NULL,
  `sourceId` int(11) DEFAULT NULL,
  `transactionDate` timestamp NOT NULL DEFAULT current_timestamp(),
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- إرجاع أو استيراد بيانات الجدول `cashtransactions`
--

INSERT INTO `cashtransactions` (`id`, `managerId`, `type`, `amount`, `description`, `sourceType`, `sourceId`, `transactionDate`, `createdAt`, `updatedAt`) VALUES
(9801, 9002, 'income', 5100000.00, 'تحصيل مبيعات الطلب 9401', 'sale', 9401, '2026-08-25 02:11:31', '2026-08-26 02:11:31', '2026-08-26 02:11:31'),
(9802, 9001, 'expense', 2500000.00, 'دفع إيجار المحل', 'expense', 9701, '2026-08-24 02:11:31', '2026-08-26 02:11:31', '2026-08-26 02:11:31'),
(9803, 9001, 'expense', 450000.00, 'دفع فاتورة الكهرباء', 'expense', 9702, '2026-08-22 02:11:31', '2026-08-26 02:11:31', '2026-08-26 02:11:31'),
(9804, 9002, 'adjustment', 100000.00, 'تسوية صندوق تجريبية', 'manual', NULL, '2026-08-16 02:11:31', '2026-08-26 02:11:31', '2026-08-26 02:11:31');

-- --------------------------------------------------------

--
-- بنية الجدول `category`
--

CREATE TABLE `category` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `sectionId` int(11) DEFAULT NULL,
  `image` text DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `categoryCode` varchar(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- إرجاع أو استيراد بيانات الجدول `category`
--

INSERT INTO `category` (`id`, `name`, `slug`, `description`, `sectionId`, `image`, `isActive`, `createdAt`, `updatedAt`, `categoryCode`) VALUES
(9101, 'الإلكترونيات', 'electronics', 'هواتف وإكسسوارات وأجهزة إلكترونية', NULL, NULL, 1, '2026-08-26 02:11:31', '2026-08-26 02:11:31', 'ELEC-001'),
(9102, 'الشبكات والاتصالات', 'networks', 'معدات الشبكات والاتصالات', NULL, NULL, 1, '2026-08-26 02:11:31', '2026-08-26 02:11:31', 'NET-001'),
(9103, 'المستلزمات المكتبية', 'office-supplies', 'قرطاسية ومستلزمات مكتبية', NULL, NULL, 1, '2026-08-26 02:11:31', '2026-08-26 02:11:31', 'OFF-001'),
(9104, 'سهره', 'category-1788090890846', NULL, NULL, '/uploads/1788090855109__1.webp', 1, '2026-08-30 11:54:50', '2026-08-30 11:54:50', 'CAT-1788090890846');

-- --------------------------------------------------------

--
-- بنية الجدول `expenses`
--

CREATE TABLE `expenses` (
  `id` int(11) NOT NULL,
  `managerId` int(11) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `expenseCategory` varchar(100) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `notes` text DEFAULT NULL,
  `expenseDate` timestamp NOT NULL DEFAULT current_timestamp(),
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- إرجاع أو استيراد بيانات الجدول `expenses`
--

INSERT INTO `expenses` (`id`, `managerId`, `title`, `expenseCategory`, `amount`, `notes`, `expenseDate`, `createdAt`, `updatedAt`) VALUES
(9701, 9001, 'إيجار المحل', 'إيجار', 2500000.00, 'مصروف إيجار شهري تجريبي', '2026-08-24 02:11:31', '2026-08-26 02:11:31', '2026-08-26 02:11:31'),
(9702, 9001, 'فاتورة الكهرباء', 'خدمات', 450000.00, 'فاتورة كهرباء تجريبية', '2026-08-22 02:11:31', '2026-08-26 02:11:31', '2026-08-26 02:11:31'),
(9703, 9002, 'صيانة أجهزة الشبكة', 'صيانة', 175000.00, 'صيانة دورية للمعدات', '2026-08-18 02:11:31', '2026-08-26 02:11:31', '2026-08-26 02:11:31');

-- --------------------------------------------------------

--
-- بنية الجدول `managercategoryassignments`
--

CREATE TABLE `managercategoryassignments` (
  `id` int(11) NOT NULL,
  `managerId` int(11) NOT NULL,
  `categoryId` int(11) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- إرجاع أو استيراد بيانات الجدول `managercategoryassignments`
--

INSERT INTO `managercategoryassignments` (`id`, `managerId`, `categoryId`, `createdAt`) VALUES
(1, 9002, 9101, '2026-08-26 02:11:31'),
(2, 9002, 9102, '2026-08-26 02:11:31'),
(3, 9190, 9103, '2026-08-30 11:06:37');

-- --------------------------------------------------------

--
-- بنية الجدول `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `totalPrice` decimal(10,2) NOT NULL,
  `status` enum('pending','processing','shipped','delivered','cancelled') DEFAULT 'pending',
  `items` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`items`)),
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `paymentMethod` varchar(100) NOT NULL,
  `customerName` text DEFAULT NULL,
  `customerPhone` varchar(20) DEFAULT NULL,
  `shippingAddress` text DEFAULT NULL,
  `paymentStatus` enum('unpaid','paid','refunded') NOT NULL DEFAULT 'unpaid',
  `estimatedDeliveryMinutes` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- إرجاع أو استيراد بيانات الجدول `orders`
--

INSERT INTO `orders` (`id`, `userId`, `totalPrice`, `status`, `items`, `createdAt`, `updatedAt`, `paymentMethod`, `customerName`, `customerPhone`, `shippingAddress`, `paymentStatus`, `estimatedDeliveryMinutes`) VALUES
(9401, 9003, 5100000.00, 'delivered', '[{\"productId\":9301,\"quantity\":1,\"price\":4250000,\"title\":\"هاتف Samsung Galaxy A55\"},{\"productId\":9302,\"quantity\":1,\"price\":850000,\"title\":\"راوتر TP-Link Archer C6\"}]', '2026-08-26 02:11:31', '2026-08-26 02:11:31', 'cash', 'عميل تجريبي', '0999000003', 'دمشق - المزة', 'paid', 45),
(9402, 9003, 850000.00, 'cancelled', '[{\"productId\":9302,\"quantity\":1,\"price\":850000,\"title\":\"راوتر TP-Link Archer C6\"}]', '2026-08-26 02:11:31', '2026-08-26 02:11:31', 'cash', 'عميل تجريبي', '0999000003', 'دمشق - المزة', 'refunded', 60);

-- --------------------------------------------------------

--
-- بنية الجدول `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `brand` varchar(100) NOT NULL,
  `category` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `oldPrice` decimal(10,2) DEFAULT NULL,
  `image` text DEFAULT NULL,
  `images` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`images`)),
  `rating` decimal(3,2) DEFAULT 0.00,
  `reviewCount` int(11) DEFAULT 0,
  `stock` int(11) DEFAULT 0,
  `badge` varchar(100) DEFAULT NULL,
  `badgeColor` varchar(50) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `categoryId` int(11) DEFAULT NULL,
  `brandId` int(11) DEFAULT NULL,
  `color` varchar(100) DEFAULT NULL,
  `size` varchar(100) DEFAULT NULL,
  `productCode` varchar(64) NOT NULL,
  `isRentable` tinyint(1) NOT NULL DEFAULT 0,
  `isSellable` tinyint(1) NOT NULL DEFAULT 1,
  `purchasePrice` decimal(10,2) DEFAULT NULL,
  `rentalPrice` decimal(10,2) DEFAULT NULL,
  `isOnSale` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- إرجاع أو استيراد بيانات الجدول `products`
--

INSERT INTO `products` (`id`, `name`, `brand`, `category`, `description`, `price`, `oldPrice`, `image`, `images`, `rating`, `reviewCount`, `stock`, `badge`, `badgeColor`, `createdAt`, `updatedAt`, `categoryId`, `brandId`, `color`, `size`, `productCode`, `isRentable`, `isSellable`, `purchasePrice`, `rentalPrice`, `isOnSale`) VALUES
(9301, 'هاتف Samsung Galaxy A55', 'Samsung', 'الإلكترونيات', 'هاتف ذكي بشاشة عالية الدقة وذاكرة 128GB', 4250000.00, 4500000.00, 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800', '[\"https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800\",\"/uploads/1787716827356_2.webp\"]', 4.80, 12, 8, 'الأكثر مبيعاً', '#2563eb', '2026-08-26 02:11:31', '2026-08-26 04:00:33', 9101, 9201, 'أسود', '128GB', 'SAM-001-ELEC-001-009301', 0, 1, 3600000.00, NULL, 1),
(9302, 'راوتر TP-Link Archer C6', 'TP-Link', 'الشبكات والاتصالات', 'راوتر لاسلكي بسرعة AC1200 مناسب للمنزل والمكتب', 850000.00, 950000.00, 'https://images.unsplash.com/photo-1606904825846-647eb07f5be2?w=800', '[\"https://images.unsplash.com/photo-1606904825846-647eb07f5be2?w=800\"]', 4.50, 8, 15, 'عرض خاص', '#16a34a', '2026-08-26 02:11:31', '2026-08-26 02:11:31', 9102, 9202, 'أبيض', 'AC1200', 'TP-001-NET-001-000002', 0, 1, 620000.00, NULL, 1),
(9303, 'طابعة مكتبية متعددة الوظائف', 'عام', 'المستلزمات المكتبية', 'طابعة للاستخدام المكتبي والطباعة اليومية', 1250000.00, NULL, 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=800', '[\"https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=800\"]', 4.20, 5, 3, 'للإيجار', '#9333ea', '2026-08-26 02:11:31', '2026-08-26 02:11:31', 9103, 9203, 'أبيض', 'A4', 'GEN-001-OFF-001-000003', 1, 0, NULL, 75000.00, 0),
(9304, 'بفله', 'عام', 'الإلكترونيات', 'بفله ملونه', 100.00, NULL, '/uploads/1787814056101_Gemini_Generated_Image_rkr78prkr78prkr7.webp', '[\"/uploads/1787814056101_Gemini_Generated_Image_rkr78prkr78prkr7.webp\",\"/uploads/1787814056089_Gemini_Generated_Image_97ds0597ds0597ds.webp\",\"/uploads/1787814056084_Gemini_Generated_Image_qb59saqb59saqb59.webp\"]', 0.00, 0, 20, NULL, 'bg-blue-600', '2026-08-26 02:32:39', '2026-08-27 07:00:58', 9101, 9203, NULL, NULL, 'GEN-001-ELEC-001-009304', 1, 1, 500.00, 50.00, 0);

-- --------------------------------------------------------

--
-- بنية الجدول `purchases`
--

CREATE TABLE `purchases` (
  `id` int(11) NOT NULL,
  `managerId` int(11) DEFAULT NULL,
  `categoryId` int(11) DEFAULT NULL,
  `productId` int(11) DEFAULT NULL,
  `productName` varchar(255) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `unitCost` decimal(12,2) NOT NULL,
  `totalAmount` decimal(12,2) NOT NULL,
  `status` enum('confirmed','cancelled') NOT NULL DEFAULT 'confirmed',
  `purchaseDate` timestamp NOT NULL DEFAULT current_timestamp(),
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- إرجاع أو استيراد بيانات الجدول `purchases`
--

INSERT INTO `purchases` (`id`, `managerId`, `categoryId`, `productId`, `productName`, `quantity`, `unitCost`, `totalAmount`, `status`, `purchaseDate`, `createdAt`, `updatedAt`) VALUES
(9601, 9002, 9101, 9301, 'هاتف Samsung Galaxy A55', 10, 3600000.00, 36000000.00, 'confirmed', '2026-08-19 02:11:31', '2026-08-26 02:11:31', '2026-08-26 02:11:31'),
(9602, 9002, 9102, 9302, 'راوتر TP-Link Archer C6', 20, 620000.00, 12400000.00, 'confirmed', '2026-08-20 02:11:31', '2026-08-26 02:11:31', '2026-08-26 02:11:31'),
(9603, 9001, 9103, 9303, 'طابعة مكتبية متعددة الوظائف', 3, 900000.00, 2700000.00, 'confirmed', '2026-08-14 02:11:31', '2026-08-26 02:11:31', '2026-08-26 02:11:31');

-- --------------------------------------------------------

--
-- بنية الجدول `rentalbookings`
--

CREATE TABLE `rentalbookings` (
  `id` int(11) NOT NULL,
  `productId` int(11) NOT NULL,
  `rentalDate` date NOT NULL,
  `status` enum('booked','available') NOT NULL DEFAULT 'booked',
  `quantity` int(11) NOT NULL DEFAULT 1,
  `rentalPrice` decimal(10,2) NOT NULL DEFAULT 0.00,
  `payments` decimal(10,2) NOT NULL DEFAULT 0.00,
  `remaining` decimal(10,2) NOT NULL DEFAULT 0.00,
  `rentalRequestId` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- بنية الجدول `rentalrequests`
--

CREATE TABLE `rentalrequests` (
  `id` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `productId` int(11) NOT NULL,
  `rentalDate` date NOT NULL,
  `status` enum('pending','unavailable','approved','cancelled','returned') NOT NULL DEFAULT 'pending',
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- بنية الجدول `reviews`
--

CREATE TABLE `reviews` (
  `id` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `productId` int(11) NOT NULL,
  `rating` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `comment` text DEFAULT NULL,
  `helpful` int(11) DEFAULT 0,
  `verified` tinyint(1) DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- بنية الجدول `sales`
--

CREATE TABLE `sales` (
  `id` int(11) NOT NULL,
  `orderId` int(11) DEFAULT NULL,
  `managerId` int(11) DEFAULT NULL,
  `categoryId` int(11) DEFAULT NULL,
  `productId` int(11) DEFAULT NULL,
  `productName` varchar(255) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `unitPrice` decimal(12,2) NOT NULL,
  `unitCost` decimal(12,2) NOT NULL DEFAULT 0.00,
  `totalAmount` decimal(12,2) NOT NULL,
  `profitAmount` decimal(12,2) NOT NULL,
  `status` enum('confirmed','cancelled') NOT NULL DEFAULT 'confirmed',
  `saleDate` timestamp NOT NULL DEFAULT current_timestamp(),
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- إرجاع أو استيراد بيانات الجدول `sales`
--

INSERT INTO `sales` (`id`, `orderId`, `managerId`, `categoryId`, `productId`, `productName`, `quantity`, `unitPrice`, `unitCost`, `totalAmount`, `profitAmount`, `status`, `saleDate`, `createdAt`, `updatedAt`) VALUES
(9501, 9401, 9002, 9101, 9301, 'هاتف Samsung Galaxy A55', 1, 4250000.00, 3600000.00, 4250000.00, 650000.00, 'confirmed', '2026-08-25 02:11:31', '2026-08-26 02:11:31', '2026-08-26 02:11:31'),
(9502, 9401, 9002, 9102, 9302, 'راوتر TP-Link Archer C6', 1, 850000.00, 620000.00, 850000.00, 230000.00, 'confirmed', '2026-08-23 02:11:31', '2026-08-26 02:11:31', '2026-08-26 02:11:31'),
(9503, 9402, 9002, 9102, 9302, 'راوتر TP-Link Archer C6', 1, 850000.00, 620000.00, 850000.00, 230000.00, 'cancelled', '2026-08-21 02:11:31', '2026-08-26 02:11:31', '2026-08-26 02:11:31');

-- --------------------------------------------------------

--
-- بنية الجدول `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `openId` varchar(64) NOT NULL,
  `name` text DEFAULT NULL,
  `email` varchar(320) DEFAULT NULL,
  `loginMethod` varchar(64) DEFAULT NULL,
  `role` enum('user','admin','manager') NOT NULL DEFAULT 'user',
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `lastSignedIn` timestamp NOT NULL DEFAULT current_timestamp(),
  `phone` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `token` text DEFAULT NULL,
  `username` varchar(100) DEFAULT NULL,
  `passwordHash` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- إرجاع أو استيراد بيانات الجدول `users`
--

INSERT INTO `users` (`id`, `openId`, `name`, `email`, `loginMethod`, `role`, `createdAt`, `updatedAt`, `lastSignedIn`, `phone`, `address`, `token`, `username`, `passwordHash`) VALUES
(9001, 'demo-admin-openid', 'المدير العام التجريبي', 'admin.demo@example.com', 'local', 'admin', '2026-08-26 02:11:30', '2026-08-30 11:54:58', '2026-08-30 08:54:58', '0999000001', 'دمشق', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcGVuSWQiOiJkZW1vLWFkbWluLW9wZW5pZCIsImFwcElkIjoibG9jYWwiLCJuYW1lIjoi2KfZhNmF2K_ZitixINin2YTYudin2YUg2KfZhNiq2KzYsdmK2KjZiiIsImV4cCI6MTgxOTUxODQ0M30.rmZhMxKtTDJQr069HdHDnnqPL_w-yWDIxxuJ-fQHPvQ', 'demo_admin', 'scrypt:136c59f1921d04fcf2c7001a6449e734:f552bfd330b14dd20e8a64a39964dd63030906b4bba15c37561ebdf1d2969d646ea69bab1206a349347e57d53b8ddbb0883b47a129b6e86cd8a70982b50d7bc7'),
(9002, 'demo-manager-openid', 'مدير قسم الإلكترونيات', 'manager.demo@example.com', 'local', 'manager', '2026-08-26 02:11:30', '2026-08-26 02:42:58', '2026-08-25 23:42:58', '0999000002', 'حمص', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcGVuSWQiOiJkZW1vLW1hbmFnZXItb3BlbmlkIiwiYXBwSWQiOiJsb2NhbCIsIm5hbWUiOiLZhdiv2YrYsSDZgtiz2YUg2KfZhNil2YTZg9iq2LHZiNmG2YrYp9iqIiwiZXhwIjoxODE5MjQ2OTQ1fQ.7DRbbavM8oNa59aiZZwzP1Lk3d7cOgenfxTki9PeoEI', 'manager_electronics', 'scrypt:136c59f1921d04fcf2c7001a6449e734:f552bfd330b14dd20e8a64a39964dd63030906b4bba15c37561ebdf1d2969d646ea69bab1206a349347e57d53b8ddbb0883b47a129b6e86cd8a70982b50d7bc7'),
(9003, 'demo-customer-openid', 'عميل تجريبي', 'customer.demo@example.com', 'local', 'user', '2026-08-26 02:11:30', '2026-08-26 02:11:30', '2026-08-26 02:11:30', '0999000003', 'دمشق', NULL, NULL, NULL),
(9190, 'local:khaledaode15122@gmail.com', 'علي', 'khaledaode15122@gmail.com', 'email', 'admin', '2026-08-29 06:33:37', '2026-08-30 11:06:37', '2026-08-29 03:33:37', '0986366100', 'حمص', NULL, 'ali', 'scrypt:7f859e1762f02dcefb7f975ea69cbff0:17085711da01e01267e184aa0679a2d582015555b2ffac66ce87ee4477a680a48e719bb196f41df5976366945b6e8129dd320266fd747a5ed54c8fe4746855b6');

-- --------------------------------------------------------

--
-- بنية الجدول `welcomemessages`
--

CREATE TABLE `welcomemessages` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `color` varchar(50) DEFAULT '#000000',
  `style` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`style`)),
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- إرجاع أو استيراد بيانات الجدول `welcomemessages`
--

INSERT INTO `welcomemessages` (`id`, `name`, `content`, `color`, `style`, `isActive`, `createdAt`, `updatedAt`) VALUES
(1, 'ترحيبيه', 'اهلا وسهلا', '#3b82f6', '{\"fontSize\":\"16px\",\"fontWeight\":\"normal\",\"fontFamily\":\"Cairo\",\"backgroundColor\":\"transparent\"}', 1, '2026-08-29 05:48:12', '2026-08-29 05:48:12');

-- --------------------------------------------------------

--
-- بنية الجدول `wishlistitems`
--

CREATE TABLE `wishlistitems` (
  `id` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `productId` int(11) NOT NULL,
  `addedAt` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- بنية الجدول `__drizzle_migrations`
--

CREATE TABLE `__drizzle_migrations` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `hash` text NOT NULL,
  `created_at` bigint(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- إرجاع أو استيراد بيانات الجدول `__drizzle_migrations`
--

INSERT INTO `__drizzle_migrations` (`id`, `hash`, `created_at`) VALUES
(1, '814a08e40d7fc2bcfd458759d18319198ca8ae394f2fa15617a78678e9c9c93b', 1782205688719),
(2, 'cb68c370c6d6081297575847750e5fa4e466447f85861e7ff9448520b4accd40', 1782205725560),
(3, '0fe98ce4e090f93447a1436c74b11ae4ace8fceca3065728ee7e517ce00faf8f', 1786898627597),
(4, '25ce7cd677e4883f8f3805d06a2070ef3f8d8e211d1a9fd16b7fb38cde859684', 1787709755565);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `brand`
--
ALTER TABLE `brand`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `brand_slug_unique` (`slug`),
  ADD UNIQUE KEY `brand_brandCode_unique` (`brandCode`);

--
-- Indexes for table `cartitems`
--
ALTER TABLE `cartitems`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `cashtransactions`
--
ALTER TABLE `cashtransactions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `category`
--
ALTER TABLE `category`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `category_slug_unique` (`slug`),
  ADD UNIQUE KEY `category_categoryCode_unique` (`categoryCode`);

--
-- Indexes for table `expenses`
--
ALTER TABLE `expenses`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `managercategoryassignments`
--
ALTER TABLE `managercategoryassignments`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `products_productCode_unique` (`productCode`);

--
-- Indexes for table `purchases`
--
ALTER TABLE `purchases`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `rentalbookings`
--
ALTER TABLE `rentalbookings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `rentalrequests`
--
ALTER TABLE `rentalrequests`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `sales`
--
ALTER TABLE `sales`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_openId_unique` (`openId`),
  ADD UNIQUE KEY `users_username_unique` (`username`);

--
-- Indexes for table `welcomemessages`
--
ALTER TABLE `welcomemessages`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `wishlistitems`
--
ALTER TABLE `wishlistitems`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `__drizzle_migrations`
--
ALTER TABLE `__drizzle_migrations`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `brand`
--
ALTER TABLE `brand`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9204;

--
-- AUTO_INCREMENT for table `cartitems`
--
ALTER TABLE `cartitems`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `cashtransactions`
--
ALTER TABLE `cashtransactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9805;

--
-- AUTO_INCREMENT for table `category`
--
ALTER TABLE `category`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9105;

--
-- AUTO_INCREMENT for table `expenses`
--
ALTER TABLE `expenses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9704;

--
-- AUTO_INCREMENT for table `managercategoryassignments`
--
ALTER TABLE `managercategoryassignments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9403;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9305;

--
-- AUTO_INCREMENT for table `purchases`
--
ALTER TABLE `purchases`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9604;

--
-- AUTO_INCREMENT for table `rentalbookings`
--
ALTER TABLE `rentalbookings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `rentalrequests`
--
ALTER TABLE `rentalrequests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `reviews`
--
ALTER TABLE `reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sales`
--
ALTER TABLE `sales`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9504;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9262;

--
-- AUTO_INCREMENT for table `welcomemessages`
--
ALTER TABLE `welcomemessages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `wishlistitems`
--
ALTER TABLE `wishlistitems`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `__drizzle_migrations`
--
ALTER TABLE `__drizzle_migrations`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
