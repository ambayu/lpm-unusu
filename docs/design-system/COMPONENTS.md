# Shared Components Registry — LPM UNUSU

Komponen-komponen bersama (shared components) yang wajib digunakan kembali di seluruh route aplikasi LPM UNUSU untuk mencegah duplikasi kode:

## Komponen Aktif (Sudah Diimplementasikan)

1. **`CardContainer`**
   - Lokasi: `src/client/components/CardContainer.tsx`
   - Tanggung Jawab: Membungkus section, form, dan tabel data sesuai aturan Part 10.8.
   - Props: `title`, `subtitle`, `badge`, `actions`, `children`, `className`.

2. **`StatusBadge`**
   - Lokasi: `src/client/components/StatusBadge.tsx`
   - Tanggung Jawab: Menampilkan status temuan AMI, tipe dokumen mutu, kategori standar, dan status periode.
   - Props: `status`, `size` (`sm` | `md`).
   - Menangani: `TERLAMPAUI`, `SESUAI`, `KTS_MINOR`, `KTS_MAYOR`, `OBSERVASI`, `PENDIDIKAN`, `PENELITIAN`, `PENGABDIAN`, `TATA_KELOLA`, `KEBIJAKAN`, `MANUAL`, `STANDAR`, `SOP`, `FORMULIR`, `FORMULIR_SOP`, `DRAFT`, `BERJALAN`, `SELESAI`.
   - Aksesibilitas: `role="status"`.

3. **`EmptyState`**
   - Lokasi: `src/client/components/EmptyState.tsx`
   - Tanggung Jawab: Placeholder data kosong dengan ikon, judul, deskripsi, dan aksi opsional.
   - Props: `title`, `description`, `action`.

4. **`ErrorState`**
   - Lokasi: `src/client/components/ErrorState.tsx`
   - Tanggung Jawab: Placeholder error saat gagal memuat data, dengan tombol retry opsional.
   - Props: `title`, `description`, `onRetry`.
   - Aksesibilitas: `role="alert"`.

5. **`SidebarLayout`**
   - Lokasi: `src/client/components/SidebarLayout.tsx`
   - Tanggung Jawab: Layout panel admin dengan sidebar navigasi responsif (collapsible desktop, drawer mobile).
   - Props: `children`.

6. **`AnimatedFlatSsoLogo`**
   - Lokasi: `src/client/components/AnimatedFlatSsoLogo.tsx`
   - Tanggung Jawab: Logo animasi SVG ONE UNUSU untuk halaman login.
   - Aksesibilitas: `aria-label`, `prefers-reduced-motion` support.

7. **`OneUnusuMark`**
   - Lokasi: `src/client/components/OneUnusuMark.tsx`
   - Tanggung Jawab: Tanda identitas ONE UNUSU (SVG kecil) untuk konteks non-login.
   - Aksesibilitas: `role="img"`, `aria-label`, `prefers-reduced-motion` support.

8. **`FullHeroSlider`**
   - Lokasi: `src/client/components/FullHeroSlider.tsx`
   - Tanggung Jawab: Hero banner slider full-bleed untuk landing page publik.
   - Aksesibilitas: `aria-label` pada section, dot buttons, dan nav buttons.

## Komponen Dihapus (Legacy)

- ~~`Navbar.tsx`~~ — Tidak digunakan; admin menggunakan `SidebarLayout`, landing punya navbar inline.
- ~~`HeroSlider.tsx`~~ — Digantikan oleh `FullHeroSlider.tsx`.
- ~~`SsoLoginForm.tsx`~~ — Tidak digunakan; `Login.tsx` mengimplementasikan tombol SSO secara langsung.

## Komponen Terdokumentasikan tapi Belum Diimplementasikan

- **`PageHeader`** — Banner konteks modul. Saat ini setiap halaman admin menulis banner header inline.
- **`DataTable`** — Tabel data reusable. Saat ini setiap halaman menulis `<table>` inline.
- **`FormSectionCard`** — Pembungkus form section. Saat ini modal form menggunakan div inline.

> Komponen di atas direncanakan untuk fase refactoring berikutnya (Build Once, Reuse Everywhere).
