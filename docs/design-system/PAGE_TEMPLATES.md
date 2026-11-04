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

## 4. Auth Page Template (SSO)

Digunakan oleh `pages/Login.tsx` dan `pages/SsoCallback.tsx`:
- Layout dua kolom (`lg:flex-row`): panel kiri = judul + penjelasan + tombol masuk SSO;
  panel kanan = visual/identitas ONE UNUSU.
- Satu tombol aksi utama menuju Portal (`/authorize?client_id=lpm-unusu`), `min-h-[44px]`.
- Callback menampilkan tiga state: *memverifikasi* (spinner + keterangan tiket
  single-use), *gagal* (ikon peringatan + pesan server + tombol kembali ke login), dan
  *sukses* (redirect ke `BASE_URL`).
- Tidak ada form kredensial lokal — login hanya lewat SSO.

## 5. Guard / Access Denied Template (`AccessDeniedPage`)

Digunakan oleh `pages/AccessDenied.tsx` untuk peran di luar cakupan aplikasi
(mis. `ADMIN_LPPM`):
- Latar `#F1F5F2`, satu `CardContainer` maksimal `max-w-2xl` di tengah viewport.
- Header card: ikon `LockClosed`/`ShieldExclamation` + judul "Akses Panel Ditolak" + badge `403`.
- Isi: penjelasan sebab (peran milik aplikasi lain), ringkasan **Akun / Peran SSO /
  Cakupan Aplikasi**, lalu blok bantuan berisi langkah perbaikan (minta `ADMIN_LPM`).
- Aksi: "Keluar & Ganti Akun" (primer), "Buka Portal ONE UNUSU", "Beranda LPM" — semua
  `min-h-[44px]`.
- Bila sesi ternyata sah (`appAccess.allowed === true`), tampilkan varian positif dengan
  tombol "Lanjut ke Dashboard LPM" (menghindari pesan menyesatkan saat URL dibuka manual).

## 6. Dashboard Page Template

Digunakan oleh `pages/Dashboard.tsx`:
- Banner gradien gelap (`from-blue-900 to-indigo-900`) berisi sambutan, chip peran
  (`roleLabel`), chip cakupan aplikasi, dan aksi cepat (Tambah Standar, Catat Temuan AMI).
- Baris kartu metrik (grid 1/2/3/6 kolom) dengan `CardContainer`-style card.
- Section tabel aktivitas terbaru + panel ringkasan; setiap section punya judul jelas.
- Tidak memakai `SidebarLayout` sendiri — layout berasal dari `ProtectedRoute`.

## Peta Halaman → Template

| Halaman | Berkas | Template |
|---|---|---|
| Landing | `pages/Landing.tsx` | Public landing (hero slider full-bleed) |
| Login | `pages/Login.tsx` | Auth (4) |
| SSO Callback | `pages/SsoCallback.tsx` | Auth (4) |
| Akses Ditolak | `pages/AccessDenied.tsx` | Guard (5) |
| Dashboard | `pages/Dashboard.tsx` | Dashboard (6) |
| Standar / Dokumen / AMI (list) | `pages/{Standar,Dokumen,Ami}.tsx` | List (1) |
| Standar / Dokumen / AMI (form) | `pages/*Form.tsx` | Form (2) |
| Pengguna / Peran / Izin | `pages/{Users,Roles,Permissions}.tsx` | List (1) + guard `adminOnly` |
