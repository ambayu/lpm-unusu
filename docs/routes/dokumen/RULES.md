# Route Rules — Dokumen Mutu (`/dokumen`)

## 1. Tanggung Jawab Modul
Modul ini mengelola arsip digital dokumen penjaminan mutu UNUSU:
- Kebijakan SPMI
- Manual Mutu
- Standar Mutu
- Formulir & Prosedur Operasional Standar (SOP)

## 2. Template & Komponen yang Digunakan
- Menggunakan `ListPageTemplate` dengan filter berdasarkan tipe dokumen dan tahun penetapan.
- Form modal menggunakan `FormSectionCard` (Part 10.8).
- Shared Components: `CardContainer`, `StatusBadge`, `EmptyState`, Heroicons.

## 2a. Penanganan Galat (WAJIB — berlaku seluruh panel admin)

1. **`alert()` dan `window.confirm()` peramban DILARANG** pada semua halaman panel admin.
   Gunakan `NotificationModal` (`src/client/components/NotificationModal.tsx`):
   - kegagalan aksi → `type="error"`;
   - konfirmasi tindakan destruktif (hapus) → `type="confirm"` + `onConfirm`;
   - keberhasilan/informasi → `type="success"` / `type="info"`.
2. **Pesan wajib menyebut APA yang gagal beserta objeknya.** Contoh:
   "Tindakan \"Menyimpan Dokumen Baru\" pada dokumen «Judul» tidak dapat diselesaikan oleh
   server." Dilarang menampilkan teks tanpa konteks seperti "Gagal menyimpan dokumen."
3. **Penyebab wajib ditampilkan** melalui `details` dan `code`:
   - `message` dari server (mis. "Kategori tidak ditemukan");
   - daftar `errors[{ field, message }]` bila server mengirimkannya;
   - status/kode HTTP sebagai jejak teknis;
   - untuk kegagalan 500, sertakan arahan memeriksa log server.
4. **Susun galat lewat helper**, jangan tulis ulang logika per halaman:
   - `deskripsikanGalat(err, aksi, objek, LABEL_FIELD)` — kegagalan request;
   - `galatValidasi(aksi, objek, details[])` — validasi klien sebelum request.
   Keduanya berada di `src/client/lib/galat.ts`.
5. **Validasi klien mengumpulkan SEMUA masalah sekaligus**, bukan berhenti pada yang pertama,
   agar pengguna tidak memperbaiki formulir satu per satu.
6. Server **tidak boleh** meneruskan `error.message` mentah dari Prisma ke klien (bocor path
   internal). Catat ke `console.error`, balas pesan ringkas + `code` yang aman.

## 2b. Penyimpanan Berkas PDF

- Berkas PDF dikirim sebagai **data URL base64** pada field `filePdfUrl`. Karena itu kolom
  basis data wajib `LONGTEXT` — **bukan** `VARCHAR`. Batas `VARCHAR(500)` pernah membuat
  setiap unggahan gagal ("The provided value for the column is too long").
- Body JSON dibatasi `express.json({ limit: "10mb" })`; berkas maksimal 5 MB ≈ 6,7 MB setelah base64.
- **Batas berkas wajib diambil dari konstanta**, jangan menulis angka langsung:
  `BATAS_UKURAN_PDF_MB` / `BATAS_UKURAN_PDF_BYTE` di `src/client/lib/galat.ts`
  (nilai saat ini **5 MB**). Konstanta yang sama dipakai validasi unggah dan teks bantuan.
- Kegagalan body-parser dibalas JSON terstruktur (`PAYLOAD_TOO_LARGE` / `PAYLOAD_PARSE_FAILED`)
  oleh error handler di `src/server/index.ts`, bukan halaman HTML.

## 2c. Aturan Kolom Tabel Daftar Dokumen (WAJIB)

1. **Satu kolom = satu jenis data.** Dilarang menggabungkan beberapa nilai berbeda
   (nomor + tahun, badge + nama prodi, tanggal mulai + tanggal berakhir) dalam satu sel
   dengan `<span>`/`<div>` bertumpuk atau dipisah "s.d.".
2. **Dilarang menampilkan atribut yang sudah punya kolom sendiri di dalam kolom lain.**
   Contoh pelanggaran: tahun ditulis lagi di kolom DOKUMEN padahal ada kolom TAHUN.
3. **Kolom bertipe badge hanya berisi satu badge.** Nama program studi sebagai teks
   penjelas tidak boleh menempel di kolom TUJUAN PUBLIKASI; sediakan kolom PROGRAM STUDI.
4. **Rentang tanggal dipecah menjadi kolom MULAI dan BERAKHIR** dengan format tanggal
   tunggal, bukan digabung menjadi "01/01/2026 s.d. 31/12/2026".
5. **Nilai kosong ditulis konsisten** sebagai `-` (bukan "Tidak ditentukan", "Tanpa
   Kategori", atau teks pengganti lain) agar kolom mudah dipindai.
6. Kolom tanpa data tetap ditampilkan agar struktur tabel stabil; jangan menyembunyikan
   kolom secara dinamis per baris.

Susunan kolom baku daftar arsip dokumen:

| No | Kolom | Isi |
|---|---|---|
| 1 | NO | nomor urut |
| 2 | JUDUL DOKUMEN | `judul` (teks tebal) |
| 3 | NOMOR DOKUMEN | `nomor` |
| 4 | TAHUN | `tahun` |
| 5 | KATEGORI | satu badge kategori |
| 6 | TUJUAN PUBLIKASI | satu badge (`LPM Internal` / `Program Studi`) |
| 7 | PROGRAM STUDI | `prodiName` (kosong bila tujuan LPM) |
| 8 | MULAI BERLAKU | tanggal tunggal |
| 9 | BERAKHIR | tanggal tunggal |
| 10 | STATUS | satu badge status |
| 11 | BERKAS | tombol Unduh |
| 12 | AKSI | Sunting / Hapus |

## 2d. Filter Daftar Dokumen

Toolbar `/admin/arsip-dokumen` menyediakan dua filter yang saling berlapis (AND) dengan
kotak pencarian:

1. **Semua Status** — `SEMUA` | `Aktif` | `Draft` | `Arsip`.
2. **Semua Kategori** — daftar berasal dari endpoint `GET /api/kategori`, digabung
   dengan kategori milik dokumen yang sudah dimuat (agar filter tetap berguna bila
   endpoint kategori gagal atau kosong), diurutkan menurut nama, dan bebas duplikat
   berdasarkan `id`. Nilai `0` berarti "semua kategori".

Aturan:

- Filter kategori membandingkan `kategoriId` dokumen — **bukan** nama kategori, supaya
  dokumen dengan kategori bernama sama di dua entri berbeda tidak tercampur.
- Tombol **Reset Filter** hanya muncul saat ada filter menyala, dan menampilkan jumlah
  filter aktif pada labelnya.
- Kondisi "tanpa hasil" harus memakai pesan filter (`noResultMessage`) bila salah satu
  filter atau pencarian menyala; pesan kosong biasa hanya untuk arsip yang memang belum
  berisi data.
- Filter bekerja di sisi klien atas data yang sudah dimuat; tidak ada parameter query
  tambahan ke server.


- Dokumen mutu dapat berelasi secara opsional ke `StandarSpmi` terkait melalui `standarId`.
- Setiap dokumen wajib memiliki Nomor SK atau kode pengesahan resmi.
