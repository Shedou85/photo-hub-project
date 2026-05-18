-- Migration: add_public_profile_fields
-- Description: Adds public profile fields to User and Collection tables
--              for the photographer public profile / portfolio feature.
-- Run manually in phpMyAdmin on prod DB (Marius).

-- --------------------------------------------------------
-- 1. User table — new public profile fields
-- --------------------------------------------------------

ALTER TABLE `User`
  ADD COLUMN `username`         VARCHAR(50)  NULL AFTER `name`,
  ADD COLUMN `isProfilePublic`  BOOLEAN      NOT NULL DEFAULT false AFTER `username`,
  ADD COLUMN `profileTagline`   VARCHAR(160) NULL AFTER `bio`,
  ADD COLUMN `specialties`      VARCHAR(255) NULL AFTER `profileTagline`,
  ADD COLUMN `location`         VARCHAR(120) NULL AFTER `specialties`,
  ADD COLUMN `instagramUrl`     VARCHAR(191) NULL AFTER `websiteUrl`;

-- Unique constraint on username (NULL values are allowed to be non-unique in MySQL)
ALTER TABLE `User`
  ADD UNIQUE KEY `User_username_key` (`username`);

-- Index for fast lookup by username
ALTER TABLE `User`
  ADD KEY `User_username_idx` (`username`);

-- --------------------------------------------------------
-- 2. Collection table — portfolio fields
-- --------------------------------------------------------

ALTER TABLE `Collection`
  ADD COLUMN `isPublicPortfolio` BOOLEAN NOT NULL DEFAULT false AFTER `allowPromotionalUse`,
  ADD COLUMN `portfolioOrder`    INT     NULL                   AFTER `isPublicPortfolio`;

-- Index for fetching portfolio collections per user efficiently
ALTER TABLE `Collection`
  ADD KEY `Collection_userId_portfolio_idx` (`userId`, `isPublicPortfolio`);
