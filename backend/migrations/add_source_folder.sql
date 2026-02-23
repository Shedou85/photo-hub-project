-- Migration: Add sourceFolder column to Collection table
-- Stores the local filesystem path where the photographer keeps the original photos
-- (e.g. "D:\Photos\Wedding2024" or "/Users/john/Photos/Wedding2024")
-- Used by the "Open in Lightroom" feature to locate original files on the photographer's computer.

ALTER TABLE `Collection` ADD COLUMN `sourceFolder` VARCHAR(500) NULL AFTER `coverPhotoId`;
