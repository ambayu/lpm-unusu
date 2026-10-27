-- CreateTable
CREATE TABLE `lpm_standar_spmi` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `kode` VARCHAR(30) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `kategori` VARCHAR(191) NOT NULL,
    `pernyataan` TEXT NOT NULL,
    `indikator` TEXT NULL,
    `target` VARCHAR(191) NULL,
    `tahun` INTEGER NOT NULL DEFAULT 2026,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `lpm_standar_spmi_kode_key`(`kode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lpm_dokumen_mutu` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `standarId` INTEGER NULL,
    `jenis` VARCHAR(191) NOT NULL DEFAULT 'Kebijakan',
    `kodeDokumen` VARCHAR(50) NOT NULL,
    `judul` VARCHAR(191) NOT NULL,
    `revisi` INTEGER NOT NULL DEFAULT 0,
    `filePath` VARCHAR(191) NULL,
    `tahun` INTEGER NOT NULL DEFAULT 2026,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `lpm_dokumen_mutu_kodeDokumen_key`(`kodeDokumen`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lpm_periode_ami` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(191) NOT NULL,
    `tahun` INTEGER NOT NULL DEFAULT 2026,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Berjalan',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lpm_audit_butir` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `periodeId` INTEGER NOT NULL,
    `standarId` INTEGER NOT NULL,
    `auditee` VARCHAR(191) NOT NULL,
    `auditor` VARCHAR(191) NOT NULL,
    `hasil` VARCHAR(191) NOT NULL DEFAULT 'Sesuai',
    `deskripsi` TEXT NULL,
    `rekomendasi` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `lpm_dokumen_mutu` ADD CONSTRAINT `lpm_dokumen_mutu_standarId_fkey` FOREIGN KEY (`standarId`) REFERENCES `lpm_standar_spmi`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lpm_audit_butir` ADD CONSTRAINT `lpm_audit_butir_periodeId_fkey` FOREIGN KEY (`periodeId`) REFERENCES `lpm_periode_ami`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lpm_audit_butir` ADD CONSTRAINT `lpm_audit_butir_standarId_fkey` FOREIGN KEY (`standarId`) REFERENCES `lpm_standar_spmi`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
