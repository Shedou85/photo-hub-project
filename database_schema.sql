-- SQL Generated from Prisma Schema
-- Use this script in phpMyAdmin to create your database tables.

-- Make sure you have selected your database before running this script.

-- --------------------------------------------------------

--
-- Table structure for table `User`
--

CREATE TABLE `User` (
  `id` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `password` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NULL,
  `country` VARCHAR(191) NULL,
  `role` ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
  `status` ENUM('ACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
  `trialEndsAt` DATETIME(3) NULL,
  `subscriptionStatus` ENUM('FREE_TRIAL', 'ACTIVE', 'CANCELED', 'INACTIVE') NOT NULL DEFAULT 'FREE_TRIAL',
  `subscriptionEndsAt` DATETIME(3) NULL,
  `stripeCustomerId` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  `bio` TEXT NULL,
  `emailNotifications` BOOLEAN NOT NULL DEFAULT true,
  `passwordResetExpires` DATETIME(3) NULL,
  `passwordResetToken` VARCHAR(191) NULL,
  `profileImageUrl` VARCHAR(191) NULL,
  `websiteUrl` VARCHAR(191) NULL,
  `plan` ENUM('FREE_TRIAL', 'STANDARD', 'PRO') NOT NULL DEFAULT 'FREE_TRIAL',
  `collectionsCreatedCount` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_email_key` (`email`),
  UNIQUE KEY `User_stripeCustomerId_key` (`stripeCustomerId`),
  UNIQUE KEY `User_passwordResetToken_key` (`passwordResetToken`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Account`
--

CREATE TABLE `Account` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `provider` VARCHAR(191) NOT NULL,
  `providerAccountId` VARCHAR(191) NOT NULL,
  `access_token` TEXT NULL,
  `refresh_token` TEXT NULL,
  `expires_at` INT NULL,
  `token_type` VARCHAR(191) NULL,
  `scope` VARCHAR(191) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Account_provider_providerAccountId_key` (`provider`, `providerAccountId`),
  KEY `Account_userId_fkey` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Collection`
--

CREATE TABLE `Collection` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  `shareId` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `processedZipPath` VARCHAR(191) NULL,
  `clientEmail` VARCHAR(191) NULL,
  `clientName` VARCHAR(191) NULL,
  `expiresAt` DATETIME(3) NULL,
  `password` VARCHAR(191) NULL,
  `status` ENUM('DRAFT', 'SELECTING', 'REVIEWING', 'DELIVERED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  `allowPromotionalUse` BOOLEAN NOT NULL DEFAULT false,
  `coverPhotoId` VARCHAR(191) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Collection_shareId_key` (`shareId`),
  UNIQUE KEY `Collection_coverPhotoId_key` (`coverPhotoId`),
  KEY `Collection_userId_idx` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Photo`
--

CREATE TABLE `Photo` (
  `id` VARCHAR(191) NOT NULL,
  `filename` VARCHAR(191) NOT NULL,
  `storagePath` VARCHAR(191) NOT NULL,
  `thumbnailPath` VARCHAR(191) NULL DEFAULT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `collectionId` VARCHAR(191) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Photo_collectionId_idx` (`collectionId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `EditedPhoto`
--

CREATE TABLE `EditedPhoto` (
  `id` VARCHAR(191) NOT NULL,
  `filename` VARCHAR(191) NOT NULL,
  `storagePath` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `collectionId` VARCHAR(191) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `EditedPhoto_collectionId_idx` (`collectionId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Selection`
--

CREATE TABLE `Selection` (
  `id` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `collectionId` VARCHAR(191) NOT NULL,
  `photoId` VARCHAR(191) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Selection_photoId_key` (`photoId`),
  KEY `Selection_collectionId_idx` (`collectionId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `PromotionalPhoto`
--

CREATE TABLE `PromotionalPhoto` (
  `id` VARCHAR(191) NOT NULL,
  `collectionId` VARCHAR(191) NOT NULL,
  `photoId` VARCHAR(191) NOT NULL,
  `order` INT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `PromotionalPhoto_photoId_key` (`photoId`),
  UNIQUE KEY `PromotionalPhoto_collectionId_photoId_key` (`collectionId`, `photoId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `Account`
--
ALTER TABLE `Account`
  ADD CONSTRAINT `Account_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `Collection`
--
ALTER TABLE `Collection`
  ADD CONSTRAINT `Collection_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `Collection_coverPhotoId_fkey` FOREIGN KEY (`coverPhotoId`) REFERENCES `Photo` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `Photo`
--
ALTER TABLE `Photo`
  ADD CONSTRAINT `Photo_collectionId_fkey` FOREIGN KEY (`collectionId`) REFERENCES `Collection` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `EditedPhoto`
--
ALTER TABLE `EditedPhoto`
  ADD CONSTRAINT `EditedPhoto_collectionId_fkey` FOREIGN KEY (`collectionId`) REFERENCES `Collection` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `Selection`
--
ALTER TABLE `Selection`
  ADD CONSTRAINT `Selection_collectionId_fkey` FOREIGN KEY (`collectionId`) REFERENCES `Collection` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `Selection_photoId_fkey` FOREIGN KEY (`photoId`) REFERENCES `Photo` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `PromotionalPhoto`
--
ALTER TABLE `PromotionalPhoto`
  ADD CONSTRAINT `PromotionalPhoto_collectionId_fkey` FOREIGN KEY (`collectionId`) REFERENCES `Collection` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `PromotionalPhoto_photoId_fkey` FOREIGN KEY (`photoId`) REFERENCES `Photo` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- --------------------------------------------------------
--
-- Migration: Add thumbnailPath to Photo table (run on existing databases)
--
-- ALTER TABLE `Photo` ADD COLUMN `thumbnailPath` VARCHAR(191) NULL DEFAULT NULL AFTER `storagePath`;
