# Changelog — LPM UNUSU

Semua perubahan penting pada aplikasi satelit LPM UNUSU didokumentasikan di file ini.
Format mengikuti standar ISO `[YYYY-MM-DD]`.

## [2026-10-30]

### Changed
- **Tokenisasi Design System & Brand Unification**:
  - Mendefinisikan seluruh warna brand hijau kampus (`lpm-green-*`), gold (`lpm-gold-*`), dan navigation (`lpm-nav-*`) sebagai token di `tailwind.config.js`. Mengganti seluruh 13+ arbitrary hex (`bg-[#145A32]`, `bg-[#EEF7EF]`, dll) di SidebarLayout, Landing, Login menjadi class Tailwind semantik.
  - Menyatukan palette Landing page (sebelumnya `blue-900`) dan Admin panel (sebelumnya `emerald-950` + arbitrary hex) ke satu brand hijau kampus yang konsisten.
  - Import font `Plus Jakarta Sans` dan `Inter` via Google Fonts di `index.css` dan mendefinisikan `fontFamily.sans` di Tailwind config. Font yang sebelumnya hanya direferensikan di SVG tapi tidak pernah di-load sekarang aktif di seluruh aplikasi.

### Added
- **Komponen `ErrorState`** (`src/client/components/ErrorState.tsx`): UI error reusable dengan ikon peringatan, pesan deskriptif, dan tombol retry. Menggantikan `console.error` silent failure di Standar, Dokumen, dan Ami.
- **State tracking `error`** di Standar.tsx, Dokumen.tsx, Ami.tsx: Setiap halaman data kini menangkap error API dan menampilkan `ErrorState` dengan opsi retry, bukan hanya diam atau `alert()`.
- **`FORMULIR_SOP` case** di `StatusBadge.tsx`: Fix bug di mana value `"Formulir / SOP"` jatuh ke default case abu-abu karena normalisasi yang tidak menangani karakter `/`.
- **Status `DRAFT`, `BERJALAN`, `SELESAI`** di `StatusBadge.tsx`: Menambah case untuk status periode AMI.
- **`role="status"`** di `StatusBadge.tsx` untuk aksesibilitas screen reader.

### Fixed
- **Aksesibilitas**:
  - `aria-label` pada hamburger menu (Landing, SidebarLayout), collapse toggle, logout button.
  - `role="dialog"` dan `aria-modal="true"` pada semua modal (Standar, Dokumen, Ami).
  - `aria-label` pada `AnimatedFlatSsoLogo` interactive element.
  - `prefers-reduced-motion` media query pada `AnimatedFlatSsoLogo` (sebelumnya hanya `OneUnusuMark` yang menangani ini).
  - `aria-label="Sidebar navigasi"` pada elemen `<aside>`.
  - `aria-current="page"` pada nav item aktif.
  - `role="navigation"` wrapper pada menu sidebar.

### Removed
- **Komponen legacy tidak terpakai**: `Navbar.tsx`, `HeroSlider.tsx`, `SsoLoginForm.tsx` dihapus. Tidak ada import atau referensi ke komponen ini di seluruh codebase.
- **Unused import**: `CheckCircleIcon` dari Standar.tsx, `ExclamationTriangleIcon` dari Ami.tsx.

### Documentation
- `docs/design-system/COLORS.md`: Ditulis ulang sepenuhnya untuk mencerminkan token Tailwind baru di `tailwind.config.js`.
- `docs/design-system/TYPOGRAPHY.md`: Diperbarui dengan informasi import font aktual dan aturan penggunaan.
- `docs/design-system/COMPONENTS.md`: Diperbarui: menambah `ErrorState`, memperbarui props `StatusBadge`, mencatat komponen legacy yang dihapus, dan memisahkan komponen yang belum diimplementasikan.

### Added (sebelumnya)
- **Komponen Logo Flat Animasi SSO ONE UNUSU (`AnimatedFlatSsoLogo.tsx`)**:
  - Format vektor SVG flat modern berukuran besar (145px) dengan ketajaman kristal di semua resolusi.
  - Memiliki animasi berlapis:
    1. *Orbit Ring Luar*: Berputar searah jarum jam (18s) beraksen node satelit biru & emas.
    2. *Orbit Ring Dalam*: Berputar berlawanan jarum jam (12s) memberikan efek depth seimbang.
    3. *Core Badge*: Squircle flat navy blue dengan border gembok emas dan angka '1' tegas dengan denyut lembut (pulse).
    4. *Ambient Glow*: Efek pendaran cahaya lembut yang hidup.
- Mengintegrasikan logo animasi tersebut tepat di atas tombol SSO pada halaman `/login`.
