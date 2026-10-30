# Route Rules — Standar SPMI (`/standar`)

## 1. Tanggung Jawab Modul
Modul ini mengelola pangkalan data Standar SPMI UNUSU yang mencakup 4 pilar utama:
1. Standar Pendidikan
2. Standar Penelitian
3. Standar Pengabdian kepada Masyarakat (PKM)
4. Standar Tata Kelola & Non-Akademik

## 2. Template & Komponen yang Digunakan
- Menggunakan `ListPageTemplate` untuk tabel daftar standar.
- Menggunakan `FormSectionCard` untuk form tambah & edit standar (Aturan Part 10.8).
- Shared Components: `CardContainer`, `StatusBadge`, `EmptyState`, Heroicons.

## 3. Aturan Data & Validasi
- Kode Standar wajib unik (contoh: `STD-PEND-01`, `STD-PENEL-02`).
- Kategori wajib salah satu dari: `Pendidikan`, `Penelitian`, `Pengabdian`, atau `Tata Kelola`.
- Pernyataan standar wajib diisi dan menggambarkan sasaran mutu yang jelas.
