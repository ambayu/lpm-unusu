-- =============================================================================
-- Migration  : 20261101101500_add_perf_indexes
-- Project    : LPM UNUSU (lpm_unusu_db)
-- Tujuan     : Menambahkan index performa untuk query filter, listing, dan
--              agregasi dashboard AMI/SPMI.
-- Sifat      : ADDITIVE ONLY — hanya CREATE INDEX.
--              Tidak ada DROP TABLE, DROP COLUMN, UPDATE, DELETE, atau rewrite data.
--              Aman dijalankan pada database berisi data produksi.
-- Dampak     : Tabel tidak dikunci lama (InnoDB Online DDL, ALGORITHM=INPLACE,
--              LOCK=NONE) sehingga API tetap melayani baca/tulis saat migrasi.
-- Estimasi   : < 2 detik per tabel pada volume < 100k baris.
--
-- STATUS     : BELUM DIEKSEKUSI. Menunggu persetujuan:
--              [APPROVAL_REQUIRED: menjalankan `npx prisma migrate deploy`
--               atau menerapkan 20261101101500_add_perf_indexes/migration.sql
--               pada database lpm_unusu_db]
--
-- Prasyarat  : Jalankan prisma/scripts/preflight_index_check.sql lebih dulu
--              untuk memastikan tidak ada index bernama sama.
-- Rollback   : prisma/migrations/20261101101500_add_perf_indexes/rollback.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. lpm_standar_spmi
-- -----------------------------------------------------------------------------
-- Filter daftar standar per kategori + tahun (tab kategori di Pangkalan SPMI)
CREATE INDEX `lpm_standar_spmi_kategori_tahun_idx`
  ON `lpm_standar_spmi` (`kategori`, `tahun`) ALGORITHM=INPLACE LOCK=NONE;

-- Arsip standar per tahun akademik
CREATE INDEX `lpm_standar_spmi_tahun_idx`
  ON `lpm_standar_spmi` (`tahun`) ALGORITHM=INPLACE LOCK=NONE;

-- Pencarian & pengurutan nama standar
CREATE INDEX `lpm_standar_spmi_nama_idx`
  ON `lpm_standar_spmi` (`nama`) ALGORITHM=INPLACE LOCK=NONE;

-- -----------------------------------------------------------------------------
-- 2. lpm_dokumen_mutu
-- -----------------------------------------------------------------------------
-- Tab dokumen per jenis + tahun (Kebijakan / Manual / Standar / Formulir-SOP)
CREATE INDEX `lpm_dokumen_mutu_jenis_tahun_idx`
  ON `lpm_dokumen_mutu` (`jenis`, `tahun`) ALGORITHM=INPLACE LOCK=NONE;

-- Arsip dokumen per tahun
CREATE INDEX `lpm_dokumen_mutu_tahun_idx`
  ON `lpm_dokumen_mutu` (`tahun`) ALGORITHM=INPLACE LOCK=NONE;

-- Drill-down dokumen milik satu standar, difilter jenisnya
CREATE INDEX `lpm_dokumen_mutu_standarId_jenis_idx`
  ON `lpm_dokumen_mutu` (`standarId`, `jenis`) ALGORITHM=INPLACE LOCK=NONE;

-- Default listing orderBy createdAt desc
CREATE INDEX `lpm_dokumen_mutu_createdAt_idx`
  ON `lpm_dokumen_mutu` (`createdAt` DESC) ALGORITHM=INPLACE LOCK=NONE;

-- -----------------------------------------------------------------------------
-- 3. lpm_periode_ami
-- -----------------------------------------------------------------------------
-- Cari periode aktif (status = 'Berjalan') untuk dropdown input audit
CREATE INDEX `lpm_periode_ami_status_idx`
  ON `lpm_periode_ami` (`status`) ALGORITHM=INPLACE LOCK=NONE;

-- Rekap periode per tahun akademik
CREATE INDEX `lpm_periode_ami_tahun_status_idx`
  ON `lpm_periode_ami` (`tahun`, `status`) ALGORITHM=INPLACE LOCK=NONE;

-- -----------------------------------------------------------------------------
-- 4. lpm_audit_butir
-- -----------------------------------------------------------------------------
-- Agregasi dashboard: GROUP BY hasil (Temuan Mayor / Minor / Sesuai)
CREATE INDEX `lpm_audit_butir_hasil_idx`
  ON `lpm_audit_butir` (`hasil`) ALGORITHM=INPLACE LOCK=NONE;

-- Listing default orderBy createdAt desc
CREATE INDEX `lpm_audit_butir_createdAt_idx`
  ON `lpm_audit_butir` (`createdAt` DESC) ALGORITHM=INPLACE LOCK=NONE;

-- Rekap temuan per periode dikelompokkan hasil (matriks AMI)
CREATE INDEX `lpm_audit_butir_periodeId_hasil_idx`
  ON `lpm_audit_butir` (`periodeId`, `hasil`) ALGORITHM=INPLACE LOCK=NONE;

-- Rekap temuan per butir standar dikelompokkan hasil
CREATE INDEX `lpm_audit_butir_standarId_hasil_idx`
  ON `lpm_audit_butir` (`standarId`, `hasil`) ALGORITHM=INPLACE LOCK=NONE;

-- Filter riwayat audit per unit auditee (prodi/fakultas)
CREATE INDEX `lpm_audit_butir_auditee_idx`
  ON `lpm_audit_butir` (`auditee`) ALGORITHM=INPLACE LOCK=NONE;
