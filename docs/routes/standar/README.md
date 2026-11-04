# Modul Standar SPMI (PPEPP)

Catatan modul untuk halaman `/admin/standar` dan turunannya.

## Berkas

| Lapisan | Berkas |
|---|---|
| Halaman list | `src/client/pages/Standar.tsx` |
| Halaman form | `src/client/pages/StandarForm.tsx` |
| Service API | `src/client/services/api.ts` (`fetchStandar`, `createStandar`, `updateStandar`, `deleteStandar`) |
| Endpoint | `src/server/index.ts` (`/api/standar`, `/api/standar/:id`) |
| Model Prisma | `prisma/schema.prisma` → `StandarSpmi` |

## Alur Data

1. `StandarPage` memanggil `GET /api/standar` (menyertakan `dokumenList`).
2. Filter kategori + pencarian dilakukan di klien; hasil kosong → `EmptyState`.
3. Aksi Tambah/Edit/Hapus hanya dirender untuk `isAdmin` (klien) dan tetap dijaga
   `requireRole("admin")` di server.
4. Form menyimpan `kode`, `nama`, `kategori`, `pernyataan`, `indikator`, `target`, `tahun`.

## Aturan

- `kode` unik dan menjadi pengurut utama daftar (`orderBy: { kode: "asc" }`).
- Hapus standar wajib mempertimbangkan relasi `DokumenMutu` dan `AuditButir` — konfirmasi
  dependensi sebelum eksekusi (skill governance #4).
- Setiap perubahan UI mengikuti `ListPageTemplate` / `FormPageTemplate`.
