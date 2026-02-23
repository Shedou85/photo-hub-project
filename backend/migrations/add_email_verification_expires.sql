-- Migration: Add email verification token expiration
-- This migration adds a column to track when email verification tokens expire.
-- Tokens will expire after 24 hours and should be validated during verification.

ALTER TABLE `User` ADD COLUMN `emailVerificationTokenExpires` DATETIME(3) NULL AFTER `emailVerificationToken`;
