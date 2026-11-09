# Changelog — LPM UNUSU

## [2026-11-09] — Desentralisasi Otentikasi, Seeder Granular 37 Izin, & Sinkronisasi Callback

### Added
- **Desentralisasi Penuh RBAC LPM**: Mengaktifkan relasi mandiri `lpm_user_roles` dan `lpm_role_permissions` di database lokal LPM.
- **Seeder Granular 37 Permissions**: Menyemai 37 permissions domain PPEPP, Kebijakan Mutu, Auditor/Auditee AMI, Temuan, dan tata kelola RBAC lokal.

### Changed
- **Endpoint SSO (`POST /api/auth/sso`)**: Membaca identitas, peran, dan permissions dari database lokal `lpm_users` dengan mekanisme auto-provisioning pengguna baru.
- **Penyelarasan Callback per Lingkungan**: Mendukung callback mode lokal (`http://localhost:5177/sso/callback`) dan mode VPS (`/lpm/sso/callback`) yang dikelola terpusat dari gateway ONE UNUSU.

## [2026-11-06] — Dashboard Laporan & Template Formulir Seragam

### Changed
- **Dashboard** (`src/client/pages/Dashboard.tsx`): tombol aksi cepat pada banner ("Tambah Standar", "Catat Temuan AMI") diganti lencana informasi. Enam kartu metrik lama diganti `MetricTile`, dan blok ringkasan audit diganti empat `ReportCard` berisi grafik: donut hasil audit mutu, bar repositori mutu, tiga `GaugeRing` tata kelola akses, serta tabel catatan temuan audit terakhir.
- **Halaman formulir** (`StandarForm.tsx`, `DokumenForm.tsx`, `AmiForm.tsx`): seluruhnya dimigrasikan ke `FormPageTemplate` sehingga kerangka header, galat, dan baris aksi identik.
- **Sidebar** (`src/client/components/SidebarLayout.tsx`): `isActive` ditulis ulang dengan batas segmen + kecocokan terpanjang, tetap menghormati alias rute lama (`/admin/users`, `/admin/roles`, `/admin/permissions`). Label grup menu manajemen diseragamkan menjadi **TATA KELOLA** dengan item **Manajemen Pengguna** di paling bawah.
- **Seksi Tentang Platform** (`src/client/pages/Landing.tsx`): blok "Mengenal LPM UNUSU" yang sebelumnya ditulis inline kini memakai komponen bersama `TentangPlatform` (teks kiri, foto kanan) dan anchor-nya berpindah dari `#profil` ke **`#tentang`**, seragam dengan aplikasi cabang lain. Foto auditor tetap `public/assets/profil-auditor.png`, dengan cadangan `public/assets/hero/lpm-hero-1.png` bila aset potret tidak ditemukan.

### Added
- `src/client/components/LaporanCharts.tsx`, `src/client/components/FormPageTemplate.tsx`, `src/client/components/TentangPlatform.tsx`.

### Documentation
- `docs/design-system/COMPONENTS.md` dan `PAGE_TEMPLATES.md` diperbarui (LaporanCharts, TentangPlatform, aturan `isActive`).

### Verification
- `tsc --noEmit` — bersih. `vite build` — berhasil.


Semua perubahan penting pada aplikasi satelit LPM UNUSU didokumentasikan di file ini.
Format mengikuti standar ISO `[YYYY-MM-DD]`.

## [2026-11-04] (lanjutan)

### Added
- **Notifikasi Penolakan di Halaman Login** (`LoginPage`): membaca penanda `sessionStorage['lpm_sso_denied']` yang ditulis `SsoCallbackPage`, lalu menampilkan kartu `role="alert"` berisi peran SSO terdeteksi, aplikasi pemilik peran, dan langkah lanjutan (tombol "Masuk ke panel aplikasi Anda" + "Tutup", keduanya 44px). Penanda langsung dibersihkan setelah dibaca sehingga tidak berulang; parsing dibungkus `try/catch` karena `sessionStorage` dapat diblokir.
- **Panel "Cakupan Peran per Aplikasi"** (`RolesPage`): dua kolom dari `GET /api/auth/app-roles` — peran yang diizinkan (badge Admin/Pengguna + penanda "Peran Anda") dan peran milik aplikasi lain beserta nama aplikasinya, dengan catatan `403 FOREIGN_APP_ADMIN`.
- **Revalidasi Sesi Saat Tab Aktif Kembali** (`AuthContext`): `visibilitychange` + `focus` memicu `refreshSession()` (throttle 60 detik) sehingga peran yang dicabut atau dipindah ke aplikasi lain langsung menutup panel LPM tanpa menunggu reload. Bila server membalas `appAccess.allowed === false`, token & data pengguna di `localStorage` dibuang dan `ProtectedRoute` mengalihkan ke `/akses-ditolak`.
- **Sinkronisasi Cakupan Peran dari Server** (`UsersPage`): dropdown "Peran SSO" kini mengambil `GET /api/auth/app-roles` (fallback konstanta lokal bila endpoint gagal), plus indikator kecil "tersinkron dengan /api/auth/app-roles". Daftar peran yang ditolak pada catatan peringatan juga berasal dari `deniedRoles` server, bukan hardcode.
- **Jejak Audit Penolakan Akses Lintas Aplikasi**:
  - `recordAccessDenial()` + buffer `accessDenials` (maks 100 entri) di `src/server/index.ts`, dipanggil pada dua titik penolakan: tukar token SSO (`source: "sso_exchange"`) dan middleware `authenticate` (`source: "api_request"`).
  - Endpoint `GET /api/security/access-denials` (guard `requireLpmAdmin`) mengembalikan entri terbaru + `summary.foreignAdmin` / `summary.other`.
  - `fetchAccessDenials()` + tipe `AccessDenialItem` di `src/client/services/api.ts`.
  - Panel "Jejak Penolakan Akses Lintas Aplikasi" pada `PermissionsPage` (Card Container + badge total, dua kartu ringkasan, tabel waktu/akun/peran/sumber, state loading–empty–error, tombol muat ulang 44px).
- **Penolakan SSO Terstruktur di Halaman Callback**: `SsoCallbackPage` kini membedakan kegagalan token (generik) dari penolakan cakupan aplikasi (`403 FOREIGN_APP_ADMIN`), menampilkan peran SSO, panel tujuan, aplikasi asal peran, langkah perbaikan, serta aksi "Buka Portal ONE UNUSU" / "Kembali ke Halaman Login". Penanda `sessionStorage['lpm_sso_denied']` disimpan untuk konteks halaman login.

### Changed
- `SsoCallbackPage` memakai container standar (`rounded-[14px]`, `border-[#CBD5E1]`, header `#F8FAFC`) menggantikan kartu `rounded-3xl` ad-hoc, dengan tap target minimum 44px.

### Fixed
- `RolesPage` menentukan hak admin dari `isAppAdmin` (AuthContext) alih-alih menebak dari `currentUser.role === 'admin'`/`ssoRole`, sehingga tombol tambah/ubah/hapus peran tidak lagi tampil bagi pengguna yang bukan admin sah panel LPM.
- Pesan penolakan lintas aplikasi tidak lagi tampil sebagai "Login SSO Gagal" generik yang menyesatkan pengguna dengan peran sah di aplikasi lain.

## [2026-11-04]

### Added
- **Bootstrap Dokumentasi Proyek (`docs/`) — Docs Governance**:
  - `docs/README.md`: indeks dokumentasi, urutan baca wajib (pre-coding audit), peta folder, ringkasan struktur repo aktual, perintah operasional, dan aturan pemeliharaan dokumen.
  - `docs/PROJECT_RULES.md`: hierarki aturan (user → `AGENTS.md` → `PROJECT_RULES` → `ARCHITECTURE` → design-system), boundary peran (Frontend/Database/QA), larangan eksekusi (build/test, mutasi destruktif, `git push`), konvensi kode frontend/backend/database, aturan UI wajib, aturan SSO app-scoped, workflow Definition of Done, dan daftar anti-pattern.
  - `docs/routes/ROUTE_MANIFEST.md`: manifest rute aktual dari `App.tsx` (publik, admin, `adminOnly`), perilaku `ProtectedRoute`, sinkronisasi menu sidebar, dan checklist menambah rute.
  - `docs/API_ENDPOINTS.md`: referensi seluruh endpoint `/api` beserta middleware guard-nya (`authenticate`, `requireRole`, `requireLpmAdmin`) dan catatan RBAC in-memory.
  - `docs/adr/README.md` + `docs/adr/ADR-0001-app-scoped-admin.md`: format ADR dan keputusan pemisahan administrator per aplikasi (konteks, keputusan, konsekuensi, alternatif ditolak).
- **Pemisahan Administrator per Aplikasi (App-Scoped Role)**:
  - `resolveAppAccess()` di `src/server/index.ts` sebagai satu sumber kebenaran otorisasi: `LPM_APP_ROLES` (`SUPERADMIN`, `ADMIN_LPM`, `DOSEN`) vs `FOREIGN_APP_ADMIN_ROLES` (`ADMIN_LPPM`, `ADMIN_ESURAT`, `ADMIN_SARPRAS`, `ADMIN_AKREDITASI`, `ADMIN_LMS`, `ADMIN_SSO`).
  - Endpoint baru `GET /api/auth/me` (verifikasi sesi + `appAccess`) dan `GET /api/auth/app-roles` (peran sah vs peran ditolak).
  - Middleware `requireLpmAdmin` pada CRUD `/api/users`; penugasan `ssoRole` di luar cakupan LPM ditolak `403 FOREIGN_APP_ROLE`.
  - Halaman `src/client/pages/AccessDenied.tsx` (rute `/akses-ditolak`) yang menjelaskan peran, cakupan aplikasi, dan langkah perbaikan.

### Changed
- **`POST /api/auth/sso`**: peran di luar cakupan LPM kini ditolak dengan `403` + `code` eksplisit (`FOREIGN_APP_ADMIN` / `APP_ACCESS_DENIED`) dan pesan spesifik, bukan lagi pesan generik.
- **Middleware `authenticate`**: memvalidasi ulang peran setiap request sehingga token lama (terbit sebelum pemisahan) tidak dapat dipakai lintas aplikasi; JWT menyertakan `appCode: "lpm-unusu"`.
- **`AuthContext`**: menambah `appAccess`, `accessDenied`, `roleLabel`, `isAppAdmin`, `refreshSession()`; sesi divalidasi ulang ke server saat boot sehingga `localStorage` tidak lagi menjadi dasar otorisasi.
- **`App.tsx`**: `ProtectedRoute` menerima prop `adminOnly`; rute RBAC (`/admin/pengguna|users|peran|roles|izin|permissions`) kini khusus administrator LPM; peran di luar cakupan diarahkan ke `/akses-ditolak`.
- **`SidebarLayout`**: menu "Kontrol Akses & RBAC" hanya tampil untuk `isAppAdmin`; label peran memakai `roleLabel`; dropdown profil menampilkan cakupan akses panel.
- **`UsersPage`**: dropdown peran diganti menjadi "Peran SSO (Cakupan LPM)" berisi tiga peran sah, ditambah banner aturan pemisahan admin dan badge tabel berbasis `ssoRole`.
- **`DashboardPage`**: banner sambutan menampilkan chip peran dan chip "Akses panel: LPM UNUSU".
- **Dokumen design system disinkronkan dengan kode aktual**:
  - `TYPOGRAPHY.md`: font efektif adalah `Quicksand` (dari `tailwind.config.js`); import Google Fonts `Plus Jakarta Sans`/`Inter` di `index.css` dicatat sebagai tech-debt.
  - `COLORS.md`: menambah tabel nilai netral/struktural yang benar-benar dipakai (`#CBD5E1`, `#F8FAFC`, `#DBEAFE`, `#E2EDFB`, `#F0F4FA`, `#E9EFF7`, `#1E3A8A`) + aturan kontras AA.
  - `DESIGN_RULES.md`: menambah bagian layout/container, aksesibilitas, otorisasi tampil di UI, state & ketahanan data, serta ikon/copywriting.
  - `COMPONENTS.md`: menambah `AdminPanelTemplate` dan peta pemakaian komponen.
  - `PAGE_TEMPLATES.md`: menambah template Auth (SSO), Guard/Access Denied, Dashboard, serta peta halaman → template.

### Fixed
- **Kebocoran otorisasi lintas aplikasi**: administrator LPPM (atau admin aplikasi lain) tidak lagi dapat memperoleh sesi panel LPM maupun memanggil API mutasi, baik lewat tukar token SSO maupun token lama.

## [2026-11-01]

### Added
- **Halaman Matriks Hak Akses & Izin (`PermissionsPage.tsx`)**:
  - Implementasi komponen halaman hak akses sistem RBAC LPM lengkap dengan pencarian real-time dan wrapper `CardContainer` (Part 10.8).
  - Integrasi API endpoint `/api/permissions` untuk menampilkan matriks guard perizinan modul penjaminan mutu.
- **REST API Endpoints RBAC & Dashboard di Backend (`src/server/index.ts`)**:
  - Penambahan endpoint `/api/dashboard/stats` untuk ringkasan real-time metrik SPMI, Dokumen, Audit AMI, Users, Roles, dan Permissions.
  - Penambahan endpoint `/api/users` (CRUD), `/api/roles` (CRUD), dan `/api/permissions` (READ) yang diproteksi `authenticate` dan `requireRole("admin")`.

### Changed
- **Standardisasi Card Container Pattern (Part 10.8) & Error Resilience**:
  - Refactor halaman `UsersPage.tsx`, `RolesPage.tsx`, dan `Dashboard.tsx` agar konsisten menggunakan komponen standar `CardContainer` (border `#CBD5E1`, rounded `[14px]`, header `#F8FAFC`, shadow `2xs`).
  - Menghilangkan struktur div card non-standar (`rounded-2xl`, `border-slate-200`) pada panel data, filter bar, dan grid metrik tata kelola.
  - Integrasi penanganan error dengan komponen `ErrorState` reusable dan tombol retry pada `UsersPage`, `RolesPage`, dan `DashboardPage`.
- **Audit Navigasi & Label Menu RBAC (Anti-Slop Clean Labeling)**:
  - Standardisasi label menu navigasi RBAC pada Sidebar dan Dashboard: `'Pengguna'`, `'Peran'`, `'Izin'` tanpa awalan redundant kata `'Menu'` atau suffix non-standar (`'Peran RBAC'` -> `'Peran'`, `'Hak Akses'` -> `'Izin'`).
  - Penambahan section navigasi `KONTROL AKSES & RBAC` pada `SidebarLayout.tsx` dan link menu Dashboard (`/admin`).
  - Sinkronisasi token storage key (`lpm_unusu_token` dan fallback `lpm_token`) pada seluruh halaman klien RBAC.

### Fixed
- **Navigasi Dashboard & Routing RBAC**:
  - Memverifikasi routing rute `/admin`, `/admin/dashboard`, `/admin/pengguna` (`/admin/users`), `/admin/peran` (`/admin/roles`), dan `/admin/izin` (`/admin/permissions`) terdaftar penuh di `App.tsx` dan dibungkus `ProtectedRoute`.
  - Kontrol hak akses antarmuka (Client-side RBAC Guard): Tombol mutasi data (Tambah, Edit, Hapus) pada `StandarPage`, `DokumenPage`, `AmiPage`, `UsersPage`, dan `RolesPage` kini diproteksi secara kondisional hanya untuk pengguna dengan hak peran administrator (`admin` / `SUPERADMIN` / `ADMIN_LPM`), sementara peran nonsupervisor/auditor dibatasi sebagai *read-only*.
  - Pembersihan safe typing pada state navigasi `LoginPage.tsx` tanpa cast `any` mentah.
  - Verifikasi build check `npm run build` dan typecheck `npx tsc --noEmit` berhasil 100% tanpa error.

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
## [2026-11-06]

### Changed
- **Hero slider landing** (`src/client/components/FullHeroSlider.tsx`): tata letak dipindah ke pola referensi — teks kiri-bawah, indikator titik di kiri-bawah, tombol panah + penghitung slide `01 / 04` di kanan-bawah (kini tampil di semua ukuran layar, sebelumnya tersembunyi di mobile). Ditambah jeda autoplay saat hover, swipe sentuh, `aria-current` pada titik aktif, serta atribut `width`/`height`/`decoding` pada gambar slide.
- **Aset hero diganti** (`public/assets/hero/lpm-hero-1..4.png`): empat foto khusus bertema rapat audit mutu, penilaian instrumen, ruang kendali dokumen SPMI, dan briefing AMI. Gambar lama (visual kampus umum) tidak dipakai lagi.
- **Navbar landing** (`src/client/pages/Landing.tsx`): struktur disamakan dengan ekosistem — brand kiri (logo + LPM UNUSU + subteks), menu tengah, aksi kanan tunggal (`Masuk SSO` / `Panel Manajemen`). Warna `blue-900`/`amber-400` diganti token `lpm-green`/`lpm-gold`; tinggi bar 80px menjadi 64px; menu mobile memakai target 44px.
- **Welcome banner & kartu profil** (`src/client/pages/Dashboard.tsx`): banner gradien biru-indigo diganti `bg-lpm-green` solid dengan aksen `lpm-gold`, lalu ditambahkan `UserAuthorityCard`.

### Added
- `src/client/components/UserAuthorityCard.tsx` — kartu otoritas pengguna (`USERNAME`, `HAK AKSES`, `UNIT KERJA`, `STATUS AKUN`) berbasis Heroicons.

### Documentation
- `docs/design-system/COMPONENTS.md`: registri `UserAuthorityCard`.