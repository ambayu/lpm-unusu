# Migrasi `20261102093000_add_ppepp_indikator_tindak_lanjut`

> Status: **BELUM DIEKSEKUSI — MENUNGGU PERSETUJUAN**
> Database: `lpm_unusu_db` (MySQL) · ORM: Prisma 5.22
> Sifat: **ADDITIVE ONLY** (3 tabel baru + 5 kolom baru) — tanpa DROP, tanpa UPDATE/DELETE data.

---

## 1. Masalah yang diselesaikan

Modul 1 di `AGENTS.md` menuntut **pengelolaan Siklus PPEPP** serta **indikator & target capaian mutu**.
Schema sebelum migrasi ini tidak mampu memenuhinya:

| Kebutuhan modul | Kondisi schema lama | Dampak |
| --- | --- | --- |
| Indikator & target capaian per butir standar | Hanya kolom teks `StandarSpmi.indikator` dan `StandarSpmi.target` (satu standar = satu teks) | Tidak bisa diagregasi, tidak ada capaian realisasi, tidak ada satuan/tahun |
| Siklus PPEPP (5 tahap) | Tidak ada tabel | Progres PPEPP tidak terlacak, tidak bisa divisualkan |
| Pengendalian & Peningkatan (tindak lanjut temuan) | Hanya `AuditButir.rekomendasi` (teks) | Temuan tidak punya status penyelesaian, penanggung jawab, dan tenggat |
| Status & masa berlaku dokumen mutu | `DokumenMutu` tidak punya status/berlaku | Tidak bisa memisahkan Draft / Review / Berlaku / Kedaluwarsa |
| Rentang pelaksanaan audit | `PeriodeAmi` hanya punya `tahun` | Tidak ada tanggal mulai/selesai audit |

---

## 2. Perubahan schema

### 2.1 Tabel baru

**`lpm_indikator_spmi`** — indikator & target capaian per butir standar
| Kolom | Tipe | Catatan |
| --- | --- | --- |
| `id` | INT PK AI | |
| `standarId` | INT NOT NULL | FK → `lpm_standar_spmi.id`, `ON DELETE CASCADE` |
| `kode` | VARCHAR(40) | contoh `IND-PEND-01-1` |
| `nama` | VARCHAR(255) | |
| `satuan` | VARCHAR(40) NULL | `%`, `orang`, `dokumen`, `artikel` |
| `target` / `capaian` | DECIMAL(10,2) NULL | dibandingkan untuk hitung ketercapaian |
| `tahun` | INT DEFAULT 2026 | |
| `status` | VARCHAR(20) DEFAULT `'Belum Dinilai'` | Tercapai, Belum Tercapai, Melebihi Target |
| `catatan` | TEXT NULL | |

Index: `UNIQUE (standarId, kode)`, `(standarId, tahun)`, `(tahun, status)`.

**`lpm_siklus_ppepp`** — jejak 5 tahap PPEPP per standar per tahun
| Kolom | Tipe | Catatan |
| --- | --- | --- |
| `standarId` | INT NOT NULL | FK → `lpm_standar_spmi.id`, CASCADE |
| `periodeId` | INT NULL | FK → `lpm_periode_ami.id`, `ON DELETE SET NULL` |
| `tahap` | VARCHAR(20) | Penetapan / Pelaksanaan / Evaluasi / Pengendalian / Peningkatan |
| `status` | VARCHAR(20) DEFAULT `'Belum Mulai'` | Belum Mulai / Berjalan / Selesai / Terlambat |
| `tanggalMulai`, `tanggalSelesai` | DATETIME(3) NULL | |
| `penanggungJawab` | VARCHAR(120) NULL | |

Index: `UNIQUE (standarId, tahun, tahap)` (idempoten, cegah duplikasi tahap), `(tahun, tahap, status)`, `(periodeId, tahap)`.

**`lpm_tindak_lanjut`** — rencana tindak lanjut temuan audit
| Kolom | Tipe | Catatan |
| --- | --- | --- |
| `auditId` | INT NULL | FK → `lpm_audit_butir.id`, `ON DELETE SET NULL` |
| `standarId` | INT NOT NULL | FK → `lpm_standar_spmi.id`, CASCADE |
| `uraian` | TEXT NOT NULL | |
| `status` | VARCHAR(20) DEFAULT `'Terbuka'` | Terbuka / Dikerjakan / Selesai / Dibatalkan |
| `prioritas` | VARCHAR(10) DEFAULT `'Sedang'` | Rendah / Sedang / Tinggi |
| `tenggat`, `tanggalSelesai` | DATETIME(3) NULL | |
| `buktiPath` | VARCHAR(191) NULL | lampiran bukti penyelesaian |

Index: `(auditId, status)`, `(status, tenggat)`, `(standarId, status)`.

### 2.2 Kolom baru pada tabel eksisting (semuanya nullable / ber-default)

| Tabel | Kolom | Tipe | Alasan aman |
| --- | --- | --- | --- |
| `lpm_dokumen_mutu` | `status` | VARCHAR(20) NOT NULL DEFAULT `'Berlaku'` | NOT NULL + DEFAULT → baris lama otomatis terisi, MySQL 8.0.12+ INSTANT |
| `lpm_dokumen_mutu` | `berlakuMulai`, `berlakuSampai` | DATETIME(3) NULL | nullable, data lama tetap `NULL` |
| `lpm_periode_ami` | `tanggalMulai`, `tanggalSelesai` | DATETIME(3) NULL | nullable |

Index tambahan: `lpm_dokumen_mutu (status, tahun)` dan `(berlakuSampai)`.

### 2.3 Relasi baru (Prisma)

```
StandarSpmi 1─n IndikatorSpmi
StandarSpmi 1─n SiklusPpepp ─n─1 PeriodeAmi (opsional)
StandarSpmi 1─n TindakLanjut ─n─1 AuditButir  (opsional)
```

---

## 3. Perubahan query / endpoint pendukung

| Endpoint | Fungsi | Index yang dipakai |
| --- | --- | --- |
| `GET /api/indikator?standarId=&tahun=&status=&page=&limit=` | Daftar indikator + relasi standar | `standarId_tahun_idx`, `tahun_status_idx` |
| `POST /api/indikator` | Tambah indikator; `P2002` → `409` kode duplikat | `standarId_kode_key` |
| `PUT /api/indikator/:id` · `DELETE /api/indikator/:id` | Ubah/hapus; `P2025` → `404` | PK |
| `GET /api/siklus-ppepp?standarId=&tahun=&tahap=&status=&periodeId=` | Papan PPEPP + ringkasan `progres` per standar | `tahun_tahap_status_idx`, `periodeId_tahap_idx` |
| `POST /api/siklus-ppepp` | **Upsert** idempoten per `(standarId, tahun, tahap)`; validasi 5 tahap | `standarId_tahun_tahap_key` |
| `PUT /api/siklus-ppepp/:id` | Update status/tanggal/PJ | PK |
| `GET /api/tindak-lanjut?auditId=&standarId=&status=&prioritas=` | Monitoring tindak lanjut (urut tenggat) | `auditId_status_idx`, `status_tenggat_idx` |
| `POST` / `PUT /api/tindak-lanjut` | Buat/perbarui tindak lanjut; `P2003` → `400` referensi invalid | PK |
| `GET /api/dashboard/stats` | **+** `indikatorTotal`, `indikatorTercapai`, `tindakLanjutTerbuka` | `hasil_idx`, `tahun_status_idx`, `status_tenggat_idx` |

Semua endpoint baru mengikuti pola yang sudah ada: `requireRole("admin")` untuk mutasi,
`{ success, data }` untuk respons, dan paginasi **opt-in** (`?page=`).

---

## 4. Seeder (`prisma/seed.ts`)

Ditambahkan dua blok idempoten (aman dijalankan berulang):

1. **4 indikator** (`IND-PEND-01-1`, `IND-PEND-01-2`, `IND-PEND-02-1`, `IND-PENEL-01-1`) dengan
   target vs capaian realistis — memakai `upsert` pada `standarId_kode`.
2. **5 tahap PPEPP** untuk standar pendidikan (Penetapan & Pelaksanaan `Selesai`,
   Evaluasi `Berjalan`, Pengendalian & Peningkatan `Belum Mulai`) — `upsert` pada `standarId_tahun_tahap`.

> Seeder **memutasi data** → termasuk operasi yang menunggu persetujuan (`npx prisma db seed`).

---

## 5. Prosedur eksekusi (belum dijalankan)

```bash
# 0) Backup (wajib)
mysqldump -u root -p --single-transaction --routines lpm_unusu_db > backup_lpm_unusu_pre_ppepp.sql

# 1) Pre-flight READ ONLY — bagian (1) & (2) harus 0 baris
mysql -u root -p lpm_unusu_db < prisma/scripts/preflight_ppepp_check.sql

# 2) Terapkan migrasi
npx prisma migrate deploy
#    manual: mysql -u root -p lpm_unusu_db < prisma/migrations/20261102093000_add_ppepp_indikator_tindak_lanjut/migration.sql

# 3) Regenerasi client (sudah dijalankan di repo ini, tidak menyentuh DB)
npx prisma generate

# 4) Seed data contoh (OPSIONAL — memutasi data)
npx prisma db seed
```

### Verifikasi pasca-migrasi (READ ONLY)

```sql
SHOW TABLES LIKE 'lpm_%';
SHOW CREATE TABLE lpm_indikator_spmi;
SHOW CREATE TABLE lpm_siklus_ppepp;
SHOW CREATE TABLE lpm_tindak_lanjut;
SHOW COLUMNS FROM lpm_dokumen_mutu LIKE 'status';
SHOW COLUMNS FROM lpm_periode_ami LIKE 'tanggal%';

EXPLAIN SELECT * FROM lpm_indikator_spmi WHERE standarId = 1 AND tahun = 2026;
-- harap: key = lpm_indikator_spmi_standarId_tahun_idx

EXPLAIN SELECT * FROM lpm_siklus_ppepp WHERE tahun = 2026 AND tahap = 'Evaluasi' AND status = 'Berjalan';
-- harap: key = lpm_siklus_ppepp_tahun_tahap_status_idx

EXPLAIN SELECT * FROM lpm_tindak_lanjut WHERE status = 'Terbuka' ORDER BY tenggat ASC;
-- harap: key = lpm_tindak_lanjut_status_tenggat_idx

-- Pastikan kolom baru terisi default pada data lama
SELECT COUNT(*) AS dokumen_tanpa_status FROM lpm_dokumen_mutu WHERE status IS NULL; -- harap 0
```

---

## 6. Risiko & mitigasi

| Risiko | Tingkat | Mitigasi |
| --- | --- | --- |
| Migrasi gagal di tengah (tabel sudah ada) | Rendah | `preflight_ppepp_check.sql` mendeteksi lebih dulu; setiap `CREATE TABLE` independen, tidak ada data lama tersentuh |
| `ADD COLUMN status NOT NULL DEFAULT` mengunci tabel | Rendah | MySQL 8.0.12+ INSTANT (metadata-only); pada 5.7 tetap INPLACE dan tabel kecil |
| `UNIQUE (standarId, kode)` menolak data seed ganda | Rendah | Seeder memakai `upsert`, bukan `create` |
| Penghapusan standar menghapus indikator/PPEPP | Sedang (by design) | `ON DELETE CASCADE` disengaja; `AuditButir` tetap `RESTRICT` agar riwayat audit tidak hilang |
| Prisma menganggap schema drift | Rendah | Model + index sudah dideklarasikan di `schema.prisma`; `prisma validate` → **valid** |

---

## 7. Rollback

```bash
mysql -u root -p lpm_unusu_db < prisma/migrations/20261102093000_add_ppepp_indikator_tindak_lanjut/rollback.sql
```

Rollback menghapus 3 tabel baru (backup dulu bila sudah berisi data) dan melepas 5 kolom additive.
Data pada `lpm_standar_spmi`, `lpm_dokumen_mutu`, `lpm_periode_ami`, `lpm_audit_butir` **tidak berubah**.

---

## 8. Persetujuan yang dibutuhkan

```
[APPROVAL_REQUIRED: menjalankan `npx prisma migrate deploy` untuk migration
 20261102093000_add_ppepp_indikator_tindak_lanjut pada database lpm_unusu_db —
 3 CREATE TABLE + 5 ADD COLUMN additive + 5 FOREIGN KEY, estimasi < 10 detik,
 rollback tersedia via prisma/migrations/20261102093000_add_ppepp_indikator_tindak_lanjut/rollback.sql]

[APPROVAL_REQUIRED: menjalankan `npx prisma db seed` untuk mengisi 4 indikator SPMI
 dan 5 tahap PPEPP contoh (operasi INSERT/UPDATE pada database lpm_unusu_db)]
```

**Belum ada perintah DDL/DML yang dijalankan ke database.** Yang sudah dieksekusi hanya
`npx prisma validate` dan `npx prisma generate` (keduanya tidak menyentuh database).
