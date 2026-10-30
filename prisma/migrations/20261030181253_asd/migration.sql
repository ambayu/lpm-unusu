-- AlterTable
ALTER TABLE `lpm_audit_butir` ADD COLUMN `author` VARCHAR(100) NULL DEFAULT 'Super Admin LPM';

-- AlterTable
ALTER TABLE `lpm_dokumen_mutu` ADD COLUMN `author` VARCHAR(100) NULL DEFAULT 'Super Admin LPM';

-- AlterTable
ALTER TABLE `lpm_standar_spmi` ADD COLUMN `author` VARCHAR(100) NULL DEFAULT 'Super Admin LPM';
