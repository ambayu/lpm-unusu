# Changelog

Seluruh perubahan penting pada proyek **LPM UNUSU** didokumentasikan di berkas ini.
Format mengacu pada standar tanggal ISO (`YYYY-MM-DD`) dengan kategori: `Added`, `Changed`,
`Fixed`, `Removed`, dan `Documentation`.

## [2026-11-04]

### Added
- **`src/client/components/Navbar.tsx`** — navbar publik LPM dengan struktur baku ekosistem
  ONE UNUSU: brand di kiri (logo biru + aksen amber + nama + subteks), menu di tengah
  (Beranda, Standar SPMI, Dokumen Mutu, Audit AMI) dengan `aria-current="page"`, dan aksi di
  kanan ("Website Kampus" + "Masuk SSO", atau identitas pengguna + "Panel Manajemen" +
  "Keluar" bila sudah login). `sticky top-0`, baris `h-16`, seluruh kontrol `min-h-[44px]`,
  hamburger mobile dengan `aria-label` dan `aria-expanded`. Navbar lama yang tertanam di dalam
  `Landing.tsx` dihapus agar tidak ada navbar ganda.
- **Laporan Siklus PPEPP pada dashboard** — `ReportCard` berisi tiga `GaugeRing` (indikator
  tercapai, belum tercapai, RTL terbuka) beserta ringkasan angka.
- **Daftar terbaru pada dashboard**: 5 standar, 5 dokumen, dan 5 temuan audit terakhir.
- `fetchDashboardStats()` bertipe di `services/api.ts` (`DashboardStats` / `DashboardPayload`)
  menggantikan pemanggilan `fetch` mentah dengan `any[]`.
- Dokumentasi §6 (Dashboard Page Template) dan bagian Navbar Landing Page pada
  `docs/design-system/PAGE_TEMPLATES.md`.

### Changed
- **Dashboard diselaraskan dengan pola E-Surat**: banner sapaan dinamis
  (`Selamat pagi/siang/sore/malam` dari `user?.nama`), tombol aksi modul inti, kartu ringkasan
  dengan tombol `Segarkan` berputar, skeleton `animate-pulse`, kartu metrik berfooter
  `Daftar →`, laporan chart, lalu daftar terbaru. Palet biru/amber repo dipertahankan.
- **`GET /api/dashboard/stats` diperluas** dengan agregasi server: `groupBy` status indikator
  dan status tindak lanjut, serta `findMany` + `take: 5` untuk standar, dokumen, dan audit
  terbaru. Seluruh agregasi dilakukan di server.
- **`Standar.tsx`, `Dokumen.tsx`, `Ami.tsx` dikonversi ke `ListPageTemplate`** — sebelumnya
  ketiga halaman memakai `AdminPanelTemplate` dengan tabel manual, padahal template baku sudah
  tersedia namun tidak dipakai satu halaman pun. Seluruh kolom, isi sel, kartu KPI, dan filter
  dipertahankan; template dirender langsung sebagai root tanpa wrapper `max-w-*`/`mx-auto`.
- `aria-label` ditambahkan pada seluruh `<select>` filter di ketiga halaman list (WCAG).

### Fixed
- **Angka dashboard yang tadinya dibuang**: server sudah menghitung `indikatorTotal`,
  `indikatorTercapai`, dan `tindakLanjutTerbuka` (memakai index khusus
  `lpm_indikator_spmi_tahun_status_idx` dan `lpm_tindak_lanjut_status_tenggat_idx`), tetapi UI
  tidak pernah menampilkannya sehingga dashboard tidak melaporkan ketercapaian mutu. Kini
  ditampilkan pada kartu Laporan Siklus PPEPP.
- `CardContainer` dan `UserAuthorityCard` yang menjadi import tak terpakai setelah
  penyelarasan dashboard dibersihkan.

### Removed
- **`src/client/pages/RbacManagement.tsx` dihapus.** Berkas ini adalah dead code (nol impor)
  berisi data karangan — nama dosen fiktif dan hitungan peran/izin hardcoded (2/5/4) — dengan
  palet emerald yang tidak sesuai palet biru LPM. Fungsi RBAC yang sebenarnya sudah dilayani
  tiga halaman terpisah: `Users.tsx`, `Roles.tsx`, dan `Permissions.tsx`.
- **Kartu informasi akun (`UserAuthorityCard`) dihapus dari dashboard.** Identitas pengguna
  tetap tampil di topbar dan sidebar.

### Documentation
- `docs/design-system/PAGE_TEMPLATES.md` mencatat aturan mengikat dashboard: data wajib dari
  API nyata, dilarang membuang field yang dikirim server, dilarang `Math.random()`, larangan
  library chart baru, dan larangan membungkus template dengan container `max-w-*`/`mx-auto`.
