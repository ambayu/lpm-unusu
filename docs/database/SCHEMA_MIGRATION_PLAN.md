# Rencana Skema Data & Migrasi Aman — Index Performa LPM UNUSU

> Status: **DRAFT / MENUNGGU PERSETUJUAN**
> Migration ID: `20261101101500_add_perf_indexes`
> Database target: `lpm_unusu_db` (MySQL, prefix `lpm_`)
> Sifat perubahan: **ADDITIVE ONLY** — hanya `CREATE INDEX`. Tidak ada DROP/ALTER kolom, tidak ada UPDATE/DELETE data.

---

## 1. Latar belakang

Schema awal (`prisma/migrations/20261027171906_init`) hanya membuat **PRIMARY KEY** dan **UNIQUE INDEX** pada
`lpm_standar_spmi.kode` serta `lpm_dokumen_mutu.kodeDokumen`. Selain itu hanya ada index implisit
dari constraint FOREIGN KEY:

| Tabel | Index implisit (dari FK) |
| --- | --- |
| `lpm_dokumen_mutu` | `lpm_dokumen_mutu_standarId_fkey` (`standarId`) |
| `lpm_audit_butir` | `lpm_audit_butir_periodeId_fkey` (`periodeId`), `lpm_audit_butir_standarId_fkey` (`standarId`) |

Akibatnya semua query **filter + urut + agregasi** pada endpoint utama melakukan *full table scan* +
*filesort*:

| Endpoint | Query lama | Masalah |
| --- | --- | --- |
| `GET /api/dashboard/stats` | `auditButir.findMany()` **tanpa limit**, lalu `.filter()` di JS | Seluruh isi tabel ditransfer ke Node, 4× scan di memori |
| `GET /api/audit` | `findMany` + `orderBy createdAt desc` | Filesort penuh, tanpa filter |
| `GET /api/dokumen-mutu` | `findMany` + `orderBy createdAt desc` | Filesort penuh, tanpa filter |
| `GET /api/standar` | `findMany` + `orderBy kode asc` | Tidak ada filter kategori/tahun |

---

## 2. Perubahan schema (`prisma/schema.prisma`)

Semua index dideklarasikan di level model (`@@index`) sehingga `prisma migrate diff` dan
`prisma migrate deploy` konsisten dengan file SQL migrasi.

### `lpm_standar_spmi`
| Index | Kolom | Melayani query |
| --- | --- | --- |
| `lpm_standar_spmi_kategori_tahun_idx` | `(kategori, tahun)` | Tab kategori Pangkalan SPMI + filter tahun |
| `lpm_standar_spmi_tahun_idx` | `(tahun)` | Arsip standar per tahun akademik |
| `lpm_standar_spmi_nama_idx` | `(nama)` | Pencarian/pengurutan nama standar |

### `lpm_dokumen_mutu`
| Index | Kolom | Melayani query |
| --- | --- | --- |
| `lpm_dokumen_mutu_jenis_tahun_idx` | `(jenis, tahun)` | Tab Kebijakan / Manual / Standar / Formulir-SOP |
| `lpm_dokumen_mutu_tahun_idx` | `(tahun)` | Arsip dokumen per tahun |
| `lpm_dokumen_mutu_standarId_jenis_idx` | `(standarId, jenis)` | Drill-down dokumen milik satu standar |
| `lpm_dokumen_mutu_createdAt_idx` | `(createdAt DESC)` | `orderBy createdAt desc` (listing default) |

### `lpm_periode_ami`
| Index | Kolom | Melayani query |
| --- | --- | --- |
| `lpm_periode_ami_status_idx` | `(status)` | Cari periode aktif (`Berjalan`) untuk dropdown |
| `lpm_periode_ami_tahun_status_idx` | `(tahun, status)` | Rekap periode per tahun akademik |

### `lpm_audit_butir`
| Index | Kolom | Melayani query |
| --- | --- | --- |
| `lpm_audit_butir_hasil_idx` | `(hasil)` | `GROUP BY hasil` dashboard & rekap AMI |
| `lpm_audit_butir_createdAt_idx` | `(createdAt DESC)` | `orderBy createdAt desc` + `take: 5` |
| `lpm_audit_butir_periodeId_hasil_idx` | `(periodeId, hasil)` | Matriks temuan per periode |
| `lpm_audit_butir_standarId_hasil_idx` | `(standarId, hasil)` | Rekap temuan per butir standar |
| `lpm_audit_butir_auditee_idx` | `(auditee)` | Riwayat audit per prodi/fakultas |

> Catatan desain: `standarId` dan `periodeId` **tidak** dibuat index tunggal baru karena MySQL/InnoDB
> sudah otomatis membuat index untuk kolom FK. Index komposit di atas memperluas index tersebut
> (leftmost prefix) sehingga filter FK + filter `hasil` memakai satu index yang sama.

---

## 3. Perubahan query (`src/server/index.ts`)

| Endpoint | Perubahan | Efek |
| --- | --- | --- |
| `GET /api/dashboard/stats` | `findMany()` penuh + `.filter()` JS → `groupBy({ by: ["hasil"] })` + `findMany({ take: 5 })` | Transfer data turun dari O(n) ke O(1); hitungan dilakukan di DB memakai `hasil_idx` |
| `GET /api/audit` | Tambah filter opsional `periodeId`, `standarId`, `hasil`, `auditee`; paginasi opsional `page`/`limit` | Query menyentuh `periodeId_hasil_idx` / `hasil_idx`; respons tidak membengkak |
| `GET /api/audit/rekap` **(baru)** | `groupBy` per `hasil` dan per `(standarId, hasil)` | Matriks AMI dihitung di DB, bukan di browser |
| `GET /api/periode-ami` **(baru)** | Daftar periode + filter `status`/`tahun` | Dropdown input audit tidak perlu hardcode |
| `GET /api/dokumen-mutu` | Filter `jenis`/`tahun`/`standarId`/`q` + paginasi opsional | Memakai `jenis_tahun_idx`, `standarId_jenis_idx`, `createdAt_idx` |
| `GET /api/standar` | Filter `kategori`/`tahun`/`q` + paginasi opsional | Memakai `kategori_tahun_idx`, `tahun_idx`, `nama_idx` |
| `POST /api/audit` | Validasi `periodeId`/`standarId` sebelum insert | Pelanggaran FK jadi `400` yang jelas, bukan `500` |

**Backward compatibility:** paginasi bersifat *opt-in*. Tanpa `?page=`, respons tetap
`{ success, data }` dengan seluruh baris seperti sebelumnya (klien lama tidak rusak).

---

## 4. Berkas yang dibuat

```
prisma/
├── schema.prisma                                        # @@index ditambahkan
├── migrations/
│   └── 20261101101500_add_perf_indexes/
│       ├── migration.sql                                # 14 CREATE INDEX (BELUM dijalankan)
│       └── rollback.sql                                 # 14 DROP INDEX (manual, bila perlu)
└── scripts/
    └── preflight_index_check.sql                        # READ ONLY — cek bentrok nama & volume
```

---

## 5. Prosedur eksekusi (belum dijalankan)

Urutan yang disarankan, **semua langkah menunggu persetujuan**:

```bash
# 0. Backup logis (wajib sebelum DDL apa pun)
mysqldump -u root -p --single-transaction --routines lpm_unusu_db > backup_lpm_unusu_pre_index.sql

# 1. Pre-flight (READ ONLY)
mysql -u root -p lpm_unusu_db < prisma/scripts/preflight_index_check.sql
#    -> pastikan query "cek bentrok nama index" mengembalikan 0 baris

# 2. Terapkan migrasi (menulis ke DB)
npx prisma migrate deploy
#    alternatif manual:
#    mysql -u root -p lpm_unusu_db < prisma/migrations/20261101101500_add_perf_indexes/migration.sql

# 3. Regenerasi Prisma Client (tidak menyentuh data)
npx prisma generate

# 4. Verifikasi (READ ONLY)
mysql -u root -p lpm_unusu_db -e "EXPLAIN SELECT hasil, COUNT(*) FROM lpm_audit_butir GROUP BY hasil;"
```

### Verifikasi pasca-migrasi (harus menunjukkan `key` terpakai, bukan `NULL`)

```sql
EXPLAIN SELECT hasil, COUNT(*) FROM lpm_audit_butir GROUP BY hasil;
-- harap: key = lpm_audit_butir_hasil_idx

EXPLAIN SELECT * FROM lpm_audit_butir ORDER BY createdAt DESC LIMIT 5;
-- harap: key = lpm_audit_butir_createdAt_idx

EXPLAIN SELECT * FROM lpm_dokumen_mutu WHERE jenis = 'Standar' AND tahun = 2026 ORDER BY createdAt DESC;
-- harap: key = lpm_dokumen_mutu_jenis_tahun_idx

EXPLAIN SELECT * FROM lpm_standar_spmi WHERE kategori = 'Pendidikan' AND tahun = 2026;
-- harap: key = lpm_standar_spmi_kategori_tahun_idx
```

---

## 6. Risiko & mitigasi

| Risiko | Tingkat | Mitigasi |
| --- | --- | --- |
| DDL mengunci tabel saat jam sibuk | Rendah | `ALGORITHM=INPLACE LOCK=NONE` (Online DDL); estimasi < 2 detik/tabel pada < 100k baris |
| Nama index bentrok (migrasi gagal di tengah) | Rendah | `preflight_index_check.sql` dijalankan lebih dulu; tiap `CREATE INDEX` independen sehingga kegagalan tidak merusak data |
| Biaya tulis naik karena 14 index baru | Rendah–Sedang | Hanya kolom filter yang dipakai; pantau `SHOW GLOBAL STATUS LIKE 'Innodb_data_writes'` setelah deploy |
| MySQL < 8.0 mengabaikan `DESC` pada index | Rendah | Tetap valid secara sintaks (diperlakukan ASC); performa `ORDER BY ... DESC` masih terbantu |
| Migrasi Prisma menganggap schema drift | Rendah | Index sudah dideklarasikan di `schema.prisma`, jadi `migrate diff` berikutnya kosong |

---

## 7. Rollback

Jika index baru menimbulkan regresi tulis:

```bash
mysql -u root -p lpm_unusu_db < prisma/migrations/20261101101500_add_perf_indexes/rollback.sql
```

`rollback.sql` hanya menjalankan `DROP INDEX` — tidak menyentuh baris data.
Alternatif resmi Prisma: `npx prisma migrate resolve --rolled-back 20261101101500_add_perf_indexes`.

---

## 8. Persetujuan yang dibutuhkan

```
[APPROVAL_REQUIRED: menjalankan `npx prisma migrate deploy` (migration 20261101101500_add_perf_indexes)
 pada database lpm_unusu_db — 14 CREATE INDEX additive, estimasi < 30 detik total,
 rollback tersedia via prisma/migrations/20261101101500_add_perf_indexes/rollback.sql]
```

**Belum ada perintah database yang dijalankan.** Semua perubahan sejauh ini hanya menyentuh berkas:
`schema.prisma`, `migration.sql`, `rollback.sql`, `preflight_index_check.sql`, dan `src/server/index.ts`.
