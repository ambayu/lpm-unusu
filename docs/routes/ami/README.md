# Modul Audit Mutu Internal (AMI)

Catatan modul untuk halaman `/admin/ami` dan turunannya.

## Berkas

| Lapisan | Berkas |
|---|---|
| Halaman list | `src/client/pages/Ami.tsx` |
| Halaman form | `src/client/pages/AmiForm.tsx` |
| Service API | `src/client/services/api.ts` (`fetchAudit`, `fetchAuditDetail`, `createAudit`, dst.) |
| Endpoint | `src/server/index.ts` (`/api/audit`, `/api/audit/rekap`, `/api/periode-ami`) |
| Model Prisma | `prisma/schema.prisma` → `PeriodeAmi`, `AuditButir` |

## Alur Data

1. `GET /api/audit` mengembalikan temuan beserta `periode` dan `standar`.
2. `GET /api/audit/rekap` dipakai untuk agregasi hasil (Sesuai / Minor / Mayor).
3. Form memilih `periodeId` + `standarId`, mengisi `auditee`, `auditor`, `hasil`,
   `deskripsi`, `rekomendasi`.
4. Status hasil dipetakan ke `StatusBadge` (`SESUAI`, `KTS_MINOR`, `KTS_MAYOR`, `OBSERVASI`).

## Aturan

- `hasil` hanya boleh salah satu nilai enum yang dikenal; nilai tak dikenal jatuh ke badge netral.
- Periode `DRAFT` tidak boleh menerima temuan baru (validasi di server, bukan hanya UI).
- Rekap harus defensif terhadap `null` (`Number(x) || 0`) dan tidak boleh error saat data kosong.
- Aksi mutasi temuan dibatasi admin; auditor (dosen) bersifat baca sesuai guard saat ini.
