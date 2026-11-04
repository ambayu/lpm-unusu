-- =============================================================================
-- Pre-flight check — migrasi 20261102093000_add_ppepp_indikator_tindak_lanjut
-- Sifat: READ ONLY (hanya SELECT). Tidak mengubah apa pun.
--
-- Jalankan SEBELUM `npx prisma migrate deploy`.
-- Bagian (1) dan (2) HARUS mengembalikan 0 baris.
-- =============================================================================

-- 1) Bentrok nama tabel baru (harus 0 baris)
SELECT TABLE_NAME
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('lpm_indikator_spmi', 'lpm_siklus_ppepp', 'lpm_tindak_lanjut');

-- 2) Bentrok nama kolom baru pada tabel eksisting (harus 0 baris)
SELECT TABLE_NAME, COLUMN_NAME
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND (
    (TABLE_NAME = 'lpm_dokumen_mutu' AND COLUMN_NAME IN ('status', 'berlakuMulai', 'berlakuSampai'))
    OR (TABLE_NAME = 'lpm_periode_ami' AND COLUMN_NAME IN ('tanggalMulai', 'tanggalSelesai'))
  );

-- 3) Prasyarat data: standar SPMI yang akan direlasikan (harus > 0 baris)
SELECT COUNT(*) AS jumlah_standar FROM lpm_standar_spmi;

-- 4) Periode AMI yang tersedia (untuk relasi opsional lpm_siklus_ppepp.periodeId)
SELECT id, nama, tahun, status FROM lpm_periode_ami ORDER BY tahun DESC;

-- 5) Temuan audit yang bisa ditindaklanjuti (kandidat lpm_tindak_lanjut)
SELECT hasil, COUNT(*) AS jumlah
FROM lpm_audit_butir
GROUP BY hasil
ORDER BY jumlah DESC;

-- 6) Versi MySQL — pastikan >= 8.0.12 agar ADD COLUMN berjalan INSTANT
SELECT VERSION() AS versi_mysql;

-- 7) Kapasitas disk & ukuran tabel eksisting (estimasi ruang untuk 3 tabel baru)
SELECT TABLE_NAME,
       TABLE_ROWS,
       ROUND(DATA_LENGTH / 1024 / 1024, 2) AS data_mb,
       ROUND(INDEX_LENGTH / 1024 / 1024, 2) AS index_mb
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('lpm_standar_spmi', 'lpm_dokumen_mutu', 'lpm_periode_ami', 'lpm_audit_butir');
