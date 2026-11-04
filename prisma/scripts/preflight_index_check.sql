-- =============================================================================
-- Pre-flight check — jalankan SEBELUM migrasi 20261101101500_add_perf_indexes
-- Sifat: READ ONLY (hanya SELECT). Tidak mengubah apa pun.
--
-- Tujuan:
--   1. Memastikan 13 nama index baru belum ada (mencegah error duplicate key).
--   2. Melihat index eksisting per tabel agar tidak terjadi duplikasi fungsi.
--   3. Mengukur volume baris (estimasi durasi DDL).
-- =============================================================================

-- 1) Index eksisting pada keempat tabel LPM
SELECT TABLE_NAME, INDEX_NAME, GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS kolom,
       NON_UNIQUE, INDEX_TYPE
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('lpm_standar_spmi', 'lpm_dokumen_mutu', 'lpm_periode_ami', 'lpm_audit_butir')
GROUP BY TABLE_NAME, INDEX_NAME, NON_UNIQUE, INDEX_TYPE
ORDER BY TABLE_NAME, INDEX_NAME;

-- 2) Cek bentrok nama index baru (harus 0 baris)
SELECT TABLE_NAME, INDEX_NAME
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
  AND INDEX_NAME IN (
    'lpm_standar_spmi_kategori_tahun_idx',
    'lpm_standar_spmi_tahun_idx',
    'lpm_standar_spmi_nama_idx',
    'lpm_dokumen_mutu_jenis_tahun_idx',
    'lpm_dokumen_mutu_tahun_idx',
    'lpm_dokumen_mutu_standarId_jenis_idx',
    'lpm_dokumen_mutu_createdAt_idx',
    'lpm_periode_ami_status_idx',
    'lpm_periode_ami_tahun_status_idx',
    'lpm_audit_butir_hasil_idx',
    'lpm_audit_butir_createdAt_idx',
    'lpm_audit_butir_periodeId_hasil_idx',
    'lpm_audit_butir_standarId_hasil_idx',
    'lpm_audit_butir_auditee_idx'
  );

-- 3) Estimasi volume data (durasi DDL berbanding lurus dengan angka ini)
SELECT TABLE_NAME, TABLE_ROWS, ROUND(DATA_LENGTH / 1024 / 1024, 2) AS data_mb,
       ROUND(INDEX_LENGTH / 1024 / 1024, 2) AS index_mb
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('lpm_standar_spmi', 'lpm_dokumen_mutu', 'lpm_periode_ami', 'lpm_audit_butir');

-- 4) Cek kualitas data: nilai `hasil` yang tidak sesuai enum aplikasi
--    (index `hasil` tetap dibuat apa pun hasilnya, ini hanya laporan)
SELECT hasil, COUNT(*) AS jumlah
FROM lpm_audit_butir
GROUP BY hasil
ORDER BY jumlah DESC;

-- 5) Cek data orphan (harus 0 baris) — memastikan FK konsisten sebelum DDL
SELECT 'audit_tanpa_periode' AS isu, COUNT(*) AS jumlah
FROM lpm_audit_butir a LEFT JOIN lpm_periode_ami p ON p.id = a.periodeId
WHERE p.id IS NULL
UNION ALL
SELECT 'audit_tanpa_standar', COUNT(*)
FROM lpm_audit_butir a LEFT JOIN lpm_standar_spmi s ON s.id = a.standarId
WHERE s.id IS NULL
UNION ALL
SELECT 'dokumen_tanpa_standar_opsional', COUNT(*)
FROM lpm_dokumen_mutu d LEFT JOIN lpm_standar_spmi s ON s.id = d.standarId
WHERE d.standarId IS NOT NULL AND s.id IS NULL;
