# Modul Dokumen Mutu & SOP

Catatan modul untuk halaman `/admin/dokumen` dan turunannya.

## Berkas

| Lapisan | Berkas |
|---|---|
| Halaman list | `src/client/pages/Dokumen.tsx` |
| Halaman form | `src/client/pages/DokumenForm.tsx` |
| Service API | `src/client/services/api.ts` (`fetchDokumenMutu`, `createDokumenMutu`, dst.) |
| Endpoint | `src/server/index.ts` (`/api/dokumen-mutu`, `/api/dokumen-mutu/:id`) |
| Model Prisma | `prisma/schema.prisma` → `DokumenMutu` |

## Alur Data

1. `GET /api/dokumen-mutu` menyertakan relasi `standar` (`nama`, `kode`) untuk kolom asal standar.
2. Jenis dokumen: `Kebijakan`, `Manual`, `Standar`, `SOP`, `Formulir` — dirender `StatusBadge`.
3. Form menyimpan `standarId` (opsional), `kodeDokumen`, `judul`, `jenis`, `revisi`,
   `filePath`, `tahun`.
4. Revisi bertambah per penerbitan ulang; `filePath` boleh kosong (metadata saja).

## Aturan

- `standarId` harus `null` atau menunjuk `StandarSpmi` yang ada (integritas FK).
- Tautan unduh/preview wajib memakai resolver aset yang aman (hindari double-prefix `BASE_URL`).
- Baris tanpa `filePath` menampilkan label "Belum ada berkas", bukan tautan rusak.
