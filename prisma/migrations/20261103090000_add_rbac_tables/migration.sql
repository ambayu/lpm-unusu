-- CreateTable
CREATE TABLE `lpm_roles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `kode` VARCHAR(50) NOT NULL,
    `nama` VARCHAR(100) NOT NULL,
    `deskripsi` TEXT NULL,
    `sistem` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `lpm_roles_kode_key`(`kode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lpm_permissions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `kunci` VARCHAR(120) NOT NULL,
    `nama` VARCHAR(150) NOT NULL,
    `grup` VARCHAR(50) NOT NULL DEFAULT 'umum',
    `keterangan` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `lpm_permissions_kunci_key`(`kunci`),
    INDEX `lpm_permissions_grup_idx`(`grup`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lpm_role_permissions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `roleId` INTEGER NOT NULL,
    `permissionId` INTEGER NOT NULL,

    INDEX `lpm_role_permissions_permissionId_idx`(`permissionId`),
    UNIQUE INDEX `lpm_role_permissions_roleId_permissionId_key`(`roleId`, `permissionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lpm_users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `username` VARCHAR(100) NOT NULL,
    `nama` VARCHAR(150) NOT NULL,
    `email` VARCHAR(150) NULL,
    `ssoRole` VARCHAR(50) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'Aktif',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `lpm_users_userId_key`(`userId`),
    UNIQUE INDEX `lpm_users_username_key`(`username`),
    INDEX `lpm_users_ssoRole_idx`(`ssoRole`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lpm_user_roles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `roleId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `lpm_user_roles_roleId_idx`(`roleId`),
    UNIQUE INDEX `lpm_user_roles_userId_roleId_key`(`userId`, `roleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `lpm_role_permissions` ADD CONSTRAINT `lpm_role_permissions_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `lpm_roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lpm_role_permissions` ADD CONSTRAINT `lpm_role_permissions_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `lpm_permissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lpm_user_roles` ADD CONSTRAINT `lpm_user_roles_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `lpm_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lpm_user_roles` ADD CONSTRAINT `lpm_user_roles_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `lpm_roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

