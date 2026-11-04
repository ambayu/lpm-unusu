-- =============================================================================
-- Migration  : 20261102093000_add_ppepp_indikator_tindak_lanjut
-- Project    : LPM UNUSU (lpm_unusu_db)
-- Tujuan     : Melengkapi skema Modul 1 (Siklus PPEPP + indikator & target
--              capaian mutu) dan tahap Pengendalian/Peningkatan (tindak lanjut).
--
-- SIFAT PERUBAHAN — ADDITIVE ONLY:
--   * 3 CREATE TABLE baru (lpm_indikator_spmi, lpm_siklus_ppepp, lpm_tindak_lanjut)
--   * 5 ADD COLUMN (semuanya NULL-able atau ber-DEFAULT) pada tabel eksisting
--   * CREATE INDEX pendukung
--   TIDAK ADA: DROP TABLE, DROP COLUMN, MODIFY COLUMN, UPDATE, DELETE,
--              atau backfill data. Data lama tidak tersentuh.
--
-- KOMPATIBILITAS:
--   MySQL 8.0.12+ menerapkan ADD COLUMN secara INSTANT (metadata-only, tanpa
--   rebuild tabel, tanpa lock panjang). Pada MySQL 5.7 operasi berjalan INPLACE
--   dan tetap aman untuk tabel berukuran kecil–menengah.
--
-- STATUS     : BELUM DIEKSEKUSI.
--              [APPROVAL_REQUIRED: menjalankan `npx prisma migrate deploy`
--               (migration 20261102093000_add_ppepp_indikator_tindak_lanjut)
--               pada database lpm_unusu_db]
--
-- Prasyarat  : prisma/scripts/preflight_ppepp_check.sql (READ ONLY) harus
--              mengembalikan 0 baris pada bagian "bentrok nama objek".
-- Rollback   : prisma/migrations/20261102093000_add_ppepp_indikator_tindak_lanjut/rollback.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. lpm_indikator_spmi — indikator & target capaian per butir standar
-- -----------------------------------------------------------------------------
CREATE TABLE `lpm_indikator_spmi` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `standarId` INTEGER NOT NULL,
    `kode` VARCHAR(40) NOT NULL,
    `nama` VARCHAR(255) NOT NULL,
    `satuan` VARCHAR(40) NULL,
    `target` DECIMAL(10, 2) NULL,
    `capaian` DECIMAL(10, 2) NULL,
    `tahun` INTEGER NOT NULL DEFAULT 2026,
    `status` VARCHAR(20) NOT NULL DEFAULT 'Belum Dinilai',
    `catatan` TEXT NULL,
    `author` VARCHAR(100) NULL DEFAULT 'Super Admin LPM',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `lpm_indikator_spmi_standarId_kode_key`(`standarId`, `kode`),
    INDEX `lpm_indikator_spmi_standarId_tahun_idx`(`standarId`, `tahun`),
    INDEX `lpm_indikator_spmi_tahun_status_idx`(`tahun`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2. lpm_siklus_ppepp — jejak 5 tahap PPEPP per standar per tahun
-- -----------------------------------------------------------------------------
CREATE TABLE `lpm_siklus_ppepp` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `standarId` INTEGER NOT NULL,
    `periodeId` INTEGER NULL,
    `tahap` VARCHAR(20) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'Belum Mulai',
    `tahun` INTEGER NOT NULL DEFAULT 2026,
    `tanggalMulai` DATETIME(3) NULL,
    `tanggalSelesai` DATETIME(3) NULL,
    `penanggungJawab` VARCHAR(120) NULL,
    `catatan` TEXT NULL,
    `author` VARCHAR(100) NULL DEFAULT 'Super Admin LPM',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `lpm_siklus_ppepp_standarId_tahun_tahap_key`(`standarId`, `tahun`, `tahap`),
    INDEX `lpm_siklus_ppepp_tahun_tahap_status_idx`(`tahun`, `tahap`, `status`),
    INDEX `lpm_siklus_ppepp_periodeId_tahap_idx`(`periodeId`, `tahap`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. lpm_tindak_lanjut — rencana tindak lanjut temuan audit
-- -----------------------------------------------------------------------------
CREATE TABLE `lpm_tindak_lanjut` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `auditId` INTEGER NULL,
    `standarId` INTEGER NOT NULL,
    `uraian` TEXT NOT NULL,
    `penanggungJawab` VARCHAR(120) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'Terbuka',
    `prioritas` VARCHAR(10) NOT NULL DEFAULT 'Sedang',
    `tenggat` DATETIME(3) NULL,
    `tanggalSelesai` DATETIME(3) NULL,
    `buktiPath` VARCHAR(191) NULL,
    `author` VARCHAR(100) NULL DEFAULT 'Super Admin LPM',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `lpm_tindak_lanjut_auditId_status_idx`(`auditId`, `status`),
    INDEX `lpm_tindak_lanjut_status_tenggat_idx`(`status`, `tenggat`),
    INDEX `lpm_tindak_lanjut_standarId_status_idx`(`standarId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. Kolom additive pada tabel eksisting (NULL-able / ber-DEFAULT)
-- -----------------------------------------------------------------------------
-- 4a. lpm_dokumen_mutu: status daur hidup + masa berlaku
ALTER TABLE `lpm_dokumen_mutu`
    ADD COLUMN `status` VARCHAR(20) NOT NULL DEFAULT 'Berlaku',
    ADD COLUMN `berlakuMulai` DATETIME(3) NULL,
    ADD COLUMN `berlakuSampai` DATETIME(3) NULL;

CREATE INDEX `lpm_dokumen_mutu_status_tahun_idx`
    ON `lpm_dokumen_mutu` (`status`, `tahun`) ALGORITHM=INPLACE LOCK=NONE;

CREATE INDEX `lpm_dokumen_mutu_berlakuSampai_idx`
    ON `lpm_dokumen_mutu` (`berlakuSampai`) ALGORITHM=INPLACE LOCK=NONE;

-- 4b. lpm_periode_ami: rentang pelaksanaan audit
ALTER TABLE `lpm_periode_ami`
    ADD COLUMN `tanggalMulai` DATETIME(3) NULL,
    ADD COLUMN `tanggalSelesai` DATETIME(3) NULL;

-- -----------------------------------------------------------------------------
-- 5. Foreign key untuk tabel baru
-- -----------------------------------------------------------------------------
ALTER TABLE `lpm_indikator_spmi`
    ADD CONSTRAINT `lpm_indikator_spmi_standarId_fkey`
    FOREIGN KEY (`standarId`) REFERENCES `lpm_standar_spmi`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `lpm_siklus_ppepp`
    ADD CONSTRAINT `lpm_siklus_ppepp_standarId_fkey`
    FOREIGN KEY (`standarId`) REFERENCES `lpm_standar_spmi`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `lpm_siklus_ppepp`
    ADD CONSTRAINT `lpm_siklus_ppepp_periodeId_fkey`
    FOREIGN KEY (`periodeId`) REFERENCES `lpm_periode_ami`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `lpm_tindak_lanjut`
    ADD CONSTRAINT `lpm_tindak_lanjut_auditId_fkey`
    FOREIGN KEY (`auditId`) REFERENCES `lpm_audit_butir`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `lpm_tindak_lanjut`
    ADD CONSTRAINT `lpm_tindak_lanjut_standarId_fkey`
    FOREIGN KEY (`standarId`) REFERENCES `lpm_standar_spmi`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;
