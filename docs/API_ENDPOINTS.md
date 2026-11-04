# API Endpoints — LPM UNUSU

Sumber kode: `src/server/index.ts` (Express, port `5004`, base path `/api`).
Format respons konsisten: `{ success: boolean, data?: T, message?: string, code?: string }`.

## Middleware & Otorisasi

| Middleware | Perilaku |
|---|---|
| `authenticate` | Verifikasi Bearer JWT (`JWT_SECRET`), lalu hitung ulang `resolveAppAccess(ssoRole)`. Peran di luar cakupan LPM → `403` (`FOREIGN_APP_ADMIN` / `APP_ACCESS_DENIED`). |
| `requireRole('admin')` | Role internal harus `admin`. |
| `requireLpmAdmin` | Khusus `ADMIN_LPM` / `SUPERADMIN` (`403 LPM_ADMIN_ONLY`). |

Seluruh route di bawah `app.use('/api', authenticate)` **kecuali** `/api/health` dan
`/api/auth/sso`.

## Autentikasi & Sesi

| Method | Path | Guard | Keterangan |
|---|---|---|---|
| GET | `/api/health` | publik | Status server |
| POST | `/api/auth/sso` | publik | Tukar single-use token ke Portal (`verify-token` v2) → JWT 7 hari + `user` + `appAccess`. `403` bila peran bukan milik LPM |
| GET | `/api/auth/me` | login | Verifikasi sesi + cakupan aplikasi (dipakai `AuthContext` saat boot) |
| GET | `/api/auth/app-roles` | login | Daftar peran sah LPM + daftar peran aplikasi lain yang ditolak |
| GET | `/api/security/access-denials?limit=25` | `requireLpmAdmin` | Jejak penolakan akses lintas aplikasi (`source`, `ssoRole`, `reason`, akun, `foreignApp`, `path`, `ip`) + `summary.foreignAdmin` / `summary.other`. Disimpan in-memory maks 100 entri |

## Standar SPMI

| Method | Path | Guard |
|---|---|---|
| GET | `/api/standar` | login (termasuk `dokumenList`) |
| GET | `/api/standar/:id` | login |
| POST | `/api/standar` | admin |
| PUT | `/api/standar/:id` | admin |
| DELETE | `/api/standar/:id` | admin |

Field: `kode`, `nama`, `kategori`, `pernyataan`, `indikator`, `target`, `tahun`, `author`.

## Dokumen Mutu & SOP

| Method | Path | Guard |
|---|---|---|
| GET | `/api/dokumen-mutu` | login (relasi `standar`) |
| GET | `/api/dokumen-mutu/:id` | login |
| POST | `/api/dokumen-mutu` | admin |
| PUT | `/api/dokumen-mutu/:id` | admin |
| DELETE | `/api/dokumen-mutu/:id` | admin |

Field: `standarId`, `kodeDokumen`, `judul`, `jenis`, `revisi`, `filePath`, `tahun`, `author`.

## Audit Mutu Internal (AMI)

| Method | Path | Guard | Keterangan |
|---|---|---|---|
| GET | `/api/periode-ami` | login | Daftar periode audit |
| GET | `/api/audit` | login | Temuan audit (relasi `periode`, `standar`) |
| GET | `/api/audit/rekap` | login | Rekapitulasi temuan per hasil |
| GET | `/api/audit/:id` | login | Detail temuan |
| POST | `/api/audit` | admin | Catat temuan |
| PUT | `/api/audit/:id` | admin | Ubah temuan |
| DELETE | `/api/audit/:id` | admin | Hapus temuan |

Field: `periodeId`, `standarId`, `auditee`, `auditor`, `hasil`
(`Sesuai` / `Temuan Minor` / `Temuan Mayor`), `deskripsi`, `rekomendasi`.

## Dashboard & RBAC

| Method | Path | Guard | Keterangan |
|---|---|---|---|
| GET | `/api/dashboard/stats` | login | Metrik standar/dokumen/audit/users/roles/permissions + 5 audit terbaru |
| GET | `/api/users` | login | Daftar pengguna (in-memory store) |
| POST | `/api/users` | `requireLpmAdmin` | Tambah pengguna; `ssoRole` divalidasi cakupan LPM (`403 FOREIGN_APP_ROLE`) |
| PUT | `/api/users/:id` | `requireLpmAdmin` | Ubah pengguna (validasi peran sama) |
| DELETE | `/api/users/:id` | `requireLpmAdmin` | Hapus pengguna |
| GET | `/api/roles` | login | Daftar peran + jumlah pengguna |
| POST / PUT / DELETE | `/api/roles[/:id]` | admin | CRUD peran |
| GET | `/api/permissions` | login | Matriks izin (`lpm:view_dashboard`, `lpm:manage_standar`, dst.) |

## Catatan Implementasi

- **RBAC masih in-memory** (`rbacUsers`, `rbacRoles`, `rbacPermissions`). Perubahan hilang
  saat server restart. Migrasi ke tabel Prisma dicatat di
  `docs/database/SCHEMA_MIGRATION_PLAN.md`.
- Tabel domain (`StandarSpmi`, `DokumenMutu`, `PeriodeAmi`, `AuditButir`) memakai Prisma.
- `GET /api/dashboard/stats` mengagregasi hasil audit di memori — hati-hati bila volume
  temuan membesar (kandidat `groupBy` Prisma).
