-- =============================================================================
-- Rollback untuk 20261102093000_add_ppepp_indikator_tindak_lanjut
-- PERINGATAN: rollback ini MENGHAPUS 3 tabel baru beserta SELURUH ISINYA.
-- Jalankan hanya bila tabel baru benar-benar belum dipakai / sudah di-backup:
--   mysqldump -u root -p lpm_unusu_db lpm_indikator_spmi lpm_siklus_ppepp \
--     lpm_tindak_lanjut > backup_ppepp.sql
-- Kolom additive pada tabel eksisting dihapus paling akhir (data lain aman).
-- =============================================================================

-- 1. Lepas foreign key (urutan: anak -> induk)
ALTER TABLE `lpm_tindak_lanjut` DROP FOREIGN KEY `lpm_tindak_lanjut_standarId_fkey`;
ALTER TABLE `lpm_tindak_lanjut` DROP FOREIGN KEY `lpm_tindak_lanjut_auditId_fkey`;
ALTER TABLE `lpm_siklus_ppepp` DROP FOREIGN KEY `lpm_siklus_ppepp_periodeId_fkey`;
ALTER TABLE `lpm_siklus_ppepp` DROP FOREIGN KEY `lpm_siklus_ppepp_standarId_fkey`;
ALTER TABLE `lpm_indikator_spmi` DROP FOREIGN KEY `lpm_indikator_spmi_standarId_fkey`;

-- 2. Hapus tabel baru
DROP TABLE IF EXISTS `lpm_tindak_lanjut`;
DROP TABLE IF EXISTS `lpm_siklus_ppepp`;
DROP TABLE IF EXISTS `lpm_indikator_spmi`;

-- 3. Hapus index & kolom additive pada tabel eksisting
DROP INDEX `lpm_dokumen_mutu_berlakuSampai_idx` ON `lpm_dokumen_mutu`;
DROP INDEX `lpm_dokumen_mutu_status_tahun_idx` ON `lpm_dokumen_mutu`;

ALTER TABLE `lpm_dokumen_mutu`
    DROP COLUMN `berlakuSampai`,
    DROP COLUMN `berlakuMulai`,
    DROP COLUMN `status`;

ALTER TABLE `lpm_periode_ami`
    DROP COLUMN `tanggalSelesai`,
    DROP COLUMN `tanggalMulai`;
