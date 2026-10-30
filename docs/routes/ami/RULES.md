# Route Rules — Audit Mutu Internal / AMI (`/ami`)

## 1. Tanggung Jawab Modul
Modul ini mencatat dan memonitor siklus Audit Mutu Internal tahunan/semester:
- Pemilihan periode AMI (Tahun & Semester).
- Penilaian butir audit per auditee (Program Studi / Lembaga / Biro).
- Kategorisasi hasil temuan: `TERLAMPAUI`, `SESUAI`, `KTS_MINOR`, `KTS_MAYOR`, `OBSERVASI`.
- Rumusan Rekomendasi Tindak Lanjut (RTL) untuk Rapat Tinjauan Manajemen (RTM).

## 2. Template & Komponen yang Digunakan
- Card Container statistik capaian AMI (Ringkasan KTS vs Sesuai).
- List data temuan audit per auditee & auditor.
- Form pengisian hasil audit menggunakan `FormSectionCard` (Part 10.8).
- Shared Components: `CardContainer`, `StatusBadge`, `EmptyState`, Heroicons.
