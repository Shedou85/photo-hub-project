-- Stripe integration migration
-- Run this in phpMyAdmin or via MySQL CLI

-- Add stripeSubscriptionId to User table
ALTER TABLE `User` ADD COLUMN `stripeSubscriptionId` VARCHAR(191) NULL AFTER `stripeCustomerId`;
ALTER TABLE `User` ADD UNIQUE KEY `User_stripeSubscriptionId_key` (`stripeSubscriptionId`);

-- Payment history table
CREATE TABLE `Payment` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `stripeInvoiceId` VARCHAR(191) NULL,
  `stripeSubscriptionId` VARCHAR(191) NULL,
  `amount` INT NOT NULL COMMENT 'Amount in cents',
  `currency` VARCHAR(10) NOT NULL DEFAULT 'usd',
  `status` ENUM('succeeded', 'failed', 'pending') NOT NULL,
  `plan` ENUM('STANDARD', 'PRO') NULL,
  `description` VARCHAR(500) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Payment_stripeInvoiceId_key` (`stripeInvoiceId`),
  KEY `Payment_userId_idx` (`userId`),
  KEY `Payment_createdAt_idx` (`createdAt`),
  CONSTRAINT `Payment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
