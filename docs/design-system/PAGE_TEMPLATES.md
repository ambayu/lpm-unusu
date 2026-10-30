# Page Templates Registry — LPM UNUSU

Sesuai aturan `project-docs-governance` Part 9, seluruh halaman di LPM UNUSU wajib menggunakan template standar berikut:

## 1. List / Table Page Template (`ListPageTemplate`)
Digunakan untuk halaman daftar Standar SPMI, Bank Dokumen Mutu, dan Riwayat Temuan AMI:
- **Komponen Utama**:
  - `PageHeader`: Banner konteks modul dengan badge siklus PPEPP.
  - `ToolbarCard`: Panel pencarian, filter kategori/periode, dan tombol aksi tambah.
  - `TableCard`: Tabel data dengan header berbobot, status badge, tombol aksi edit/hapus, serta penanganan EmptyState & LoadingState.

## 2. Form Page Template (`FormPageTemplate`)
Digunakan untuk modal / drawer / halaman formulir pembuatan dan penyuntingan data:
- **Aturan Part 10.8**:
  - Semua field wajib berada di dalam `FormSectionCard`.
  - Dilarang meletakkan input mengambang langsung di atas background halaman.
  - Action button (Batal / Simpan) berada di container aksi terpisah di bagian bawah card.

## 3. Detail Page Template (`DetailPageTemplate`)
Digunakan untuk melihat rincian butir standar mutu atau laporan lengkap audit program studi.
