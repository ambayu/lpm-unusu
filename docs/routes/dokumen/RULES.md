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

## 3. Relasi ke Standar
- Dokumen mutu dapat berelasi secara opsional ke `StandarSpmi` terkait melalui `standarId`.
- Setiap dokumen wajib memiliki Nomor SK atau kode pengesahan resmi.
