-- =============================================================================
-- Rollback untuk migrasi 20261101101500_add_perf_indexes
-- Jalankan HANYA jika index baru menimbulkan masalah (mis. write latency naik).
-- Sifat: hanya DROP INDEX — tidak menyentuh data.
-- =============================================================================

DROP INDEX `lpm_audit_butir_auditee_idx` ON `lpm_audit_butir`;
DROP INDEX `lpm_audit_butir_standarId_hasil_idx` ON `lpm_audit_butir`;
DROP INDEX `lpm_audit_butir_periodeId_hasil_idx` ON `lpm_audit_butir`;
DROP INDEX `lpm_audit_butir_createdAt_idx` ON `lpm_audit_butir`;
DROP INDEX `lpm_audit_butir_hasil_idx` ON `lpm_audit_butir`;

DROP INDEX `lpm_periode_ami_tahun_status_idx` ON `lpm_periode_ami`;
DROP INDEX `lpm_periode_ami_status_idx` ON `lpm_periode_ami`;

DROP INDEX `lpm_dokumen_mutu_createdAt_idx` ON `lpm_dokumen_mutu`;
DROP INDEX `lpm_dokumen_mutu_standarId_jenis_idx` ON `lpm_dokumen_mutu`;
DROP INDEX `lpm_dokumen_mutu_tahun_idx` ON `lpm_dokumen_mutu`;
DROP INDEX `lpm_dokumen_mutu_jenis_tahun_idx` ON `lpm_dokumen_mutu`;

DROP INDEX `lpm_standar_spmi_nama_idx` ON `lpm_standar_spmi`;
DROP INDEX `lpm_standar_spmi_tahun_idx` ON `lpm_standar_spmi`;
DROP INDEX `lpm_standar_spmi_kategori_tahun_idx` ON `lpm_standar_spmi`;
