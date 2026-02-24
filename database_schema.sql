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
  `emailVerified` BOOLEAN NOT NULL DEFAULT false,
  `password` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NULL,
  `country` VARCHAR(191) NULL,
  `role` ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
  `status` ENUM('ACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
  `trialEndsAt` DATETIME(3) NULL,
  `planDowngradedAt` DATETIME(3) NULL,
  `subscriptionStatus` ENUM('FREE_TRIAL', 'ACTIVE', 'CANCELED', 'INACTIVE') NOT NULL DEFAULT 'FREE_TRIAL',
  `subscriptionEndsAt` DATETIME(3) NULL,
  `stripeCustomerId` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  `bio` TEXT NULL,
  `emailNotifications` BOOLEAN NOT NULL DEFAULT true,
  `passwordResetExpires` DATETIME(3) NULL,
  `passwordResetToken` VARCHAR(191) NULL,
  `emailVerificationToken` VARCHAR(191) NULL,
  `profileImageUrl` VARCHAR(191) NULL,
  `websiteUrl` VARCHAR(191) NULL,
  `plan` ENUM('FREE_TRIAL', 'STANDARD', 'PRO') NOT NULL DEFAULT 'FREE_TRIAL',
  `collectionsCreatedCount` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_email_key` (`email`),
  UNIQUE KEY `User_stripeCustomerId_key` (`stripeCustomerId`),
  UNIQUE KEY `User_passwordResetToken_key` (`passwordResetToken`),
  KEY `User_emailVerificationToken_idx` (`emailVerificationToken`)
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
  `shareId` VARCHAR(255) NOT NULL,
  `deliveryToken` VARCHAR(255) NULL,
  `userId` VARCHAR(191) NOT NULL,
  `processedZipPath` VARCHAR(255) NULL,
  `clientEmail` VARCHAR(191) NULL,
  `clientName` VARCHAR(191) NULL,
  `expiresAt` DATETIME(3) NULL,
  `password` VARCHAR(255) NULL,
  `status` ENUM('DRAFT', 'SELECTING', 'REVIEWING', 'DELIVERED', 'DOWNLOADED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  `allowPromotionalUse` BOOLEAN NOT NULL DEFAULT false,
  `coverPhotoId` VARCHAR(191) NULL,
  `sourceFolder` VARCHAR(500) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Collection_shareId_key` (`shareId`),
  UNIQUE KEY `Collection_deliveryToken_key` (`deliveryToken`),
  KEY `Collection_coverPhotoId_idx` (`coverPhotoId`),
  KEY `Collection_userId_idx` (`userId`),
  KEY `Collection_userId_status_idx` (`userId`, `status`),
  KEY `Collection_expiresAt_idx` (`expiresAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Photo`
--

CREATE TABLE `Photo` (
  `id` VARCHAR(191) NOT NULL,
  `filename` VARCHAR(255) NOT NULL,
  `storagePath` VARCHAR(255) NOT NULL,
  `thumbnailPath` VARCHAR(255) NULL DEFAULT NULL,
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
  `filename` VARCHAR(255) NOT NULL,
  `storagePath` VARCHAR(255) NOT NULL,
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
  `order` INT NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `PromotionalPhoto_photoId_key` (`photoId`),
  UNIQUE KEY `PromotionalPhoto_collectionId_photoId_key` (`collectionId`, `photoId`),
  KEY `PromotionalPhoto_collectionId_order_idx` (`collectionId`, `order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Download`
--

CREATE TABLE `Download` (
  `id` VARCHAR(191) NOT NULL,
  `collectionId` VARCHAR(191) NOT NULL,
  `downloadType` ENUM('ZIP', 'INDIVIDUAL') NOT NULL,
  `photoId` VARCHAR(191) NULL,
  `sessionId` VARCHAR(191) NOT NULL,
  `downloadedAt` DATETIME(3) NOT NULL,
  `userAgent` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Download_collectionId_idx` (`collectionId`),
  KEY `Download_photoId_idx` (`photoId`),
  KEY `Download_collectionId_downloadedAt_idx` (`collectionId`, `downloadedAt`),
  UNIQUE KEY `Download_deduplication_key` (`collectionId`, `downloadType`, `sessionId`, `downloadedAt`)
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
  ADD CONSTRAINT `PromotionalPhoto_collectionId_fkey` FOREIGN KEY (`collectionId`) REFERENCES `Collection` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `Download`
--
ALTER TABLE `Download`
  ADD CONSTRAINT `Download_collectionId_fkey` FOREIGN KEY (`collectionId`) REFERENCES `Collection` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `Download_photoId_fkey` FOREIGN KEY (`photoId`) REFERENCES `EditedPhoto` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- --------------------------------------------------------
--
-- Migration: Add thumbnailPath to Photo table (run on existing databases)
--
-- ALTER TABLE `Photo` ADD COLUMN `thumbnailPath` VARCHAR(191) NULL DEFAULT NULL AFTER `storagePath`;

-- --------------------------------------------------------
--
-- Migration: Add deliveryToken to Collection table (run on existing databases)
--
-- ALTER TABLE `Collection` ADD COLUMN `deliveryToken` VARCHAR(191) NULL AFTER `shareId`;
-- ALTER TABLE `Collection` ADD UNIQUE KEY `Collection_deliveryToken_key` (`deliveryToken`);

-- --------------------------------------------------------
--
-- Migration: Create Download table (run on existing databases)
--
-- CREATE TABLE `Download` (
--   `id` VARCHAR(191) NOT NULL,
--   `collectionId` VARCHAR(191) NOT NULL,
--   `downloadType` ENUM('ZIP', 'INDIVIDUAL') NOT NULL,
--   `photoId` VARCHAR(191) NULL,
--   `sessionId` VARCHAR(191) NOT NULL,
--   `downloadedAt` DATETIME(3) NOT NULL,
--   `userAgent` VARCHAR(500) NULL,
--   `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
--   PRIMARY KEY (`id`),
--   KEY `Download_collectionId_idx` (`collectionId`),
--   UNIQUE KEY `Download_deduplication_key` (`collectionId`, `downloadType`, `sessionId`, `downloadedAt`)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--
-- ALTER TABLE `Download`
--   ADD CONSTRAINT `Download_collectionId_fkey` FOREIGN KEY (`collectionId`) REFERENCES `Collection` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
--   ADD CONSTRAINT `Download_photoId_fkey` FOREIGN KEY (`photoId`) REFERENCES `EditedPhoto` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- --------------------------------------------------------
--
-- Migration: Add DOWNLOADED status to Collection ENUM (run on existing databases)
--
-- ALTER TABLE `Collection` MODIFY COLUMN `status` ENUM('DRAFT', 'SELECTING', 'REVIEWING', 'DELIVERED', 'DOWNLOADED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT';

-- --------------------------------------------------------
--
-- Migration: Wave 1 — Add indexes (run on existing databases)
--
-- CREATE INDEX Collection_userId_status_idx ON `Collection`(`userId`, `status`);
-- CREATE INDEX Collection_expiresAt_idx ON `Collection`(`expiresAt`);
-- CREATE INDEX Download_photoId_idx ON `Download`(`photoId`);
-- CREATE INDEX Download_collectionId_downloadedAt_idx ON `Download`(`collectionId`, `downloadedAt`);
-- CREATE INDEX PromotionalPhoto_collectionId_order_idx ON `PromotionalPhoto`(`collectionId`, `order`);
-- ALTER TABLE `Collection`
--   DROP KEY `Collection_coverPhotoId_key`,
--   ADD KEY `Collection_coverPhotoId_idx` (`coverPhotoId`);

-- --------------------------------------------------------
--
-- Migration: Wave 2 — Column type changes (run on existing databases)
--
-- ALTER TABLE `Collection`
--   MODIFY COLUMN `shareId` VARCHAR(255) NOT NULL,
--   MODIFY COLUMN `deliveryToken` VARCHAR(255) NULL,
--   MODIFY COLUMN `processedZipPath` VARCHAR(255) NULL,
--   MODIFY COLUMN `password` VARCHAR(255) NULL;
-- ALTER TABLE `Photo`
--   MODIFY COLUMN `filename` VARCHAR(255) NOT NULL,
--   MODIFY COLUMN `storagePath` VARCHAR(255) NOT NULL,
--   MODIFY COLUMN `thumbnailPath` VARCHAR(255) NULL DEFAULT NULL;
-- ALTER TABLE `EditedPhoto`
--   MODIFY COLUMN `filename` VARCHAR(255) NOT NULL,
--   MODIFY COLUMN `storagePath` VARCHAR(255) NOT NULL;
-- ALTER TABLE `Download`
--   MODIFY COLUMN `userAgent` TEXT NULL;
-- UPDATE `PromotionalPhoto` SET `order` = 0 WHERE `order` IS NULL;
-- ALTER TABLE `PromotionalPhoto`
--   MODIFY COLUMN `order` INT NOT NULL DEFAULT 0;

-- --------------------------------------------------------
--
-- Migration: Add planDowngradedAt to User table (run on existing databases)
--
-- ALTER TABLE `User` ADD COLUMN `planDowngradedAt` DATETIME(3) NULL AFTER `trialEndsAt`;

-- --------------------------------------------------------
--
-- Migration: Add email verification columns to User table (run on existing databases)
--
-- ALTER TABLE `User` ADD COLUMN `emailVerified` BOOLEAN NOT NULL DEFAULT false AFTER `email`;
-- ALTER TABLE `User` ADD COLUMN `emailVerificationToken` VARCHAR(191) NULL AFTER `passwordResetToken`;
-- UPDATE `User` SET `emailVerified` = true;  -- Mark existing users as verified

-- --------------------------------------------------------
--
-- Migration: Add emailVerificationToken index (run on existing databases)
--
-- CREATE INDEX User_emailVerificationToken_idx ON `User`(`emailVerificationToken`);

-- --------------------------------------------------------
--
-- Table structure for table `AuditLog`
--

CREATE TABLE `AuditLog` (
  `id` VARCHAR(191) NOT NULL,
  `adminUserId` VARCHAR(191) NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `targetEntityType` VARCHAR(50) NOT NULL,
  `targetEntityId` VARCHAR(191) NOT NULL,
  `targetEmail` VARCHAR(191) NULL,
  `changes` JSON NULL,
  `ipAddress` VARCHAR(45) NULL,
  `userAgent` VARCHAR(500) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `AuditLog_adminUserId_idx` (`adminUserId`),
  KEY `AuditLog_targetEntityId_idx` (`targetEntityId`),
  KEY `AuditLog_action_idx` (`action`),
  KEY `AuditLog_createdAt_idx` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Constraints for table `AuditLog`
--
ALTER TABLE `AuditLog`
  ADD CONSTRAINT `AuditLog_adminUserId_fkey` FOREIGN KEY (`adminUserId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- --------------------------------------------------------
--
-- Migration: Drop PromotionalPhoto.photoId FK (now references EditedPhoto, validated in PHP)
--
-- ALTER TABLE `PromotionalPhoto` DROP FOREIGN KEY `PromotionalPhoto_photoId_fkey`;

-- --------------------------------------------------------
--
-- Migration: Create AuditLog table (run on existing databases)
--
-- CREATE TABLE `AuditLog` (
--   `id` VARCHAR(191) NOT NULL,
--   `adminUserId` VARCHAR(191) NOT NULL,
--   `action` VARCHAR(100) NOT NULL,
--   `targetEntityType` VARCHAR(50) NOT NULL,
--   `targetEntityId` VARCHAR(191) NOT NULL,
--   `targetEmail` VARCHAR(191) NULL,
--   `changes` JSON NULL,
--   `ipAddress` VARCHAR(45) NULL,
--   `userAgent` VARCHAR(500) NULL,
--   `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
--   PRIMARY KEY (`id`),
--   KEY `AuditLog_adminUserId_idx` (`adminUserId`),
--   KEY `AuditLog_targetEntityId_idx` (`targetEntityId`),
--   KEY `AuditLog_action_idx` (`action`),
--   KEY `AuditLog_createdAt_idx` (`createdAt`)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--
-- ALTER TABLE `AuditLog`
--   ADD CONSTRAINT `AuditLog_adminUserId_fkey` FOREIGN KEY (`adminUserId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
