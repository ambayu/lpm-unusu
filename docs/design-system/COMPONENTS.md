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

9. **`AdminPanelTemplate`**
   - Lokasi: `src/client/components/AdminPanelTemplate.tsx`
   - Tanggung Jawab: Panel pembungkus halaman admin (single unified white panel) dengan
     header `title` + `description` + `badge` + `actions`; border `#CBD5E1`,
     radius `[16px]`, `shadow-xs`.
   - Props: `title` (wajib), `description` (wajib), `badge`, `actions`, `children`, `className`.
   - Kapan dipakai: halaman admin yang membutuhkan header panel besar (bukan card per
     section). Untuk tabel/form tunggal di dalam halaman, tetap gunakan `CardContainer`.

10. **`UserAuthorityCard`**
    - Lokasi: `src/client/components/UserAuthorityCard.tsx`
    - Tanggung Jawab: Kartu otoritas pengguna berisi `USERNAME`, `HAK AKSES`, `UNIT KERJA`,
      dan `STATUS AKUN`. Dipasang otomatis oleh `SidebarLayout` di atas konten setiap
      halaman panel sehingga seluruh aplikasi cabang UNUSU tampil seragam.
    - Props: `user` (objek sesi), `roleLabel?` (label hak akses terpetakan), `className?`.
    - Aturan Data: unit kerja diambil berurutan `unitKerja → prodi → fakultas`; status akun
      default `Aktif` bila server belum mengirim nilainya.
    - Ikon: `@heroicons/react/24/outline` (patuh aturan Anti-Lucide pada `AGENTS.md`).

## Peta Pemakaian Komponen

| Komponen | Dipakai di |
|---|---|
| `SidebarLayout` | seluruh rute `/admin/*` via `ProtectedRoute` |
| `CardContainer` | `Dashboard`, `Standar`, `Dokumen`, `Ami`, `Users`, `Roles`, `Permissions`, `AccessDenied` |
| `AdminPanelTemplate` | panel halaman admin ber-header besar (form/detail) |
| `StatusBadge` | tabel Standar, Dokumen, AMI |
| `EmptyState` / `ErrorState` | seluruh halaman data saat kosong / gagal muat |
| `FullHeroSlider`, `OneUnusuMark`, `AnimatedFlatSsoLogo` | `Landing`, `Login` |

## Komponen Dihapus (Legacy)

- ~~`Navbar.tsx`~~ — Tidak digunakan; admin menggunakan `SidebarLayout`, landing punya navbar inline.
- ~~`HeroSlider.tsx`~~ — Digantikan oleh `FullHeroSlider.tsx`.
- ~~`SsoLoginForm.tsx`~~ — Tidak digunakan; `Login.tsx` mengimplementasikan tombol SSO secara langsung.

## Komponen Terdokumentasikan tapi Belum Diimplementasikan

- **`PageHeader`** — Banner konteks modul. Saat ini setiap halaman admin menulis banner header inline.
- **`DataTable`** — Tabel data reusable. Saat ini setiap halaman menulis `<table>` inline.
- **`FormSectionCard`** — Pembungkus form section. Saat ini modal form menggunakan div inline.

> Komponen di atas direncanakan untuk fase refactoring berikutnya (Build Once, Reuse Everywhere).

---

## 4. Komponen Laporan & Grafik

### `LaporanCharts` (`src/client/components/LaporanCharts.tsx`)
- **Tanggung Jawab**: Kumpulan komponen grafik ringkas untuk dashboard panel, dibangun **murni dengan SVG dan CSS** — tanpa library chart eksternal, sehingga ukuran bundle tetap ringan dan tidak menambah dependensi baru.
- **Alasan tidak memakai library**: grafik dashboard bersifat ringkasan (bukan analitik interaktif), dan palette harus mengikuti warna aplikasi masing-masing.
- **Komponen yang tersedia**:
  | Komponen | Kegunaan |
  | --- | --- |
  | `ReportCard` | Kartu pembungkus laporan (judul + subjudul + aksi opsional) |
  | `MetricTile` | Kartu metrik angka besar dengan ikon & aksen warna |
  | `DonutChart` | Proporsi antar kategori (mis. status surat, kondisi fasilitas) |
  | `BarChart` | Perbandingan kategori dengan bar horizontal |
  | `ColumnChart` | Tren per periode dengan kolom vertikal |
  | `TrendChart` | Tren waktu dengan area lembut (SVG path) |
  | `StackedBar` | Komposisi satu batang bertingkat |
  | `GaugeRing` | Capaian persentase tunggal berbentuk cincin |
  | `ActivityFeed` | Daftar kejadian terbaru bersusun waktu |
- **Aksesibilitas**: Setiap grafik memakai `role="img"` + `aria-label` yang merangkum datanya; nilai juga tetap ditampilkan sebagai teks sehingga tidak bergantung pada warna saja.
- **Aturan Pemakaian**: Dashboard setiap aplikasi **wajib** menampilkan laporan/grafik ringkas untuk tiap menu, dan **dilarang** menyertakan panel aksi cepat (tombol pintas tambah/input) di dashboard. Navigasi tetap melalui sidebar.

---

## 5. Komponen Landing Page

### `TentangPlatform` (`src/client/components/TentangPlatform.tsx`)
- **Tanggung Jawab**: Seksi **Tentang Platform** pada halaman landing dengan pola baku ONE UNUSU: **teks di kiri, gambar di kanan**.
- **Komposisi kiri**: eyebrow kecil, judul seksi, dua paragraf penjelas, dan tiga poin centang.
- **Komposisi kanan**: gambar potret dengan latar gradien aksen membulat.
- **Props**:
  - `id?`: anchor & `aria-labelledby` id (default `tentang`)
  - `eyebrow?`: label kecil di atas judul
  - `title`: judul seksi
  - `paragraphs?`: array paragraf
  - `bullets?`: array poin centang
  - `portraitSrc?`: path gambar potret utama
  - `fallbackSrc?`: path gambar cadangan
  - `imageAlt?`: alt text gambar
  - `accentBg? / accentBorder? / bulletBg? / eyebrowClass?`: penyesuaian warna aksen
- **Pola Aset Bertahap**: Komponen mencoba `portraitSrc` lebih dulu; bila aset potret belum tersedia (`img.onError`), komponen otomatis memakai `fallbackSrc` sehingga halaman tidak pernah menampilkan gambar rusak. Begitu file potret ditambahkan ke `public/assets/`, tampilan langsung berganti **tanpa mengubah kode**.
- **Aturan Aset**: Dilarang memakai gambar yang memuat branding institusi lain. Foto suasana kampus resmi UNUSU (`slider1.jpg`) adalah fallback yang sah.
