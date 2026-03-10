-- Migration: Archive system — auto-archive, delete countdown, plan-based rules
-- Run this on your production database before deploying the archive feature.

ALTER TABLE `Collection`
  ADD COLUMN `autoArchiveAt` DATETIME(3) NULL AFTER `originalsCleanupAt`,
  ADD COLUMN `archivedAt` DATETIME(3) NULL AFTER `autoArchiveAt`,
  ADD COLUMN `deleteAt` DATETIME(3) NULL AFTER `archivedAt`,
  ADD KEY `Collection_autoArchiveAt_idx` (`autoArchiveAt`),
  ADD KEY `Collection_deleteAt_idx` (`deleteAt`);
