# Design Rules — LPM UNUSU

## 1. Prinsip Utama
- **Build Once, Reuse Everywhere**: Hindari duplikasi markup dan layout antar halaman. Gunakan shared component dan page template.
- **Card Container Pattern (Part 10.8)**: Seluruh tabel, formulir, panel filter, dan kartu metrik wajib dibungkus dalam Card Container putih dengan heading section yang jelas. Tidak boleh meletakkan elemen input/data mengambang langsung di atas background halaman.
- **Warna Identitas Kampus**: Nuansa Hijau Modern UNUSU (`#14532D`, `#166534`, `#15803D`) dengan background halaman lembut `#F1F5F2` (soft neutral green).
- **Icon Library**: Heroicons (`@heroicons/react/24/outline` dan `@heroicons/react/24/solid`).
- **Anti-Sparkles Rule**: Dilarang menggunakan icon bintang/sparkles. Gunakan icon representatif sesuai konteks mutu akademik (AcademicCap, DocumentCheck, ShieldCheck, ClipboardDocumentCheck, Funnel, ArrowPath).
- **Semua Status Wajib Memiliki Feedback Visual**: Menyediakan state Loading, Empty, dan Error yang jelas dan informatif.
