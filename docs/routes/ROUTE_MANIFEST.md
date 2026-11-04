# Route Manifest — LPM UNUSU

Manifest tunggal rute SPA. **Sumber kode:** `src/client/App.tsx`.
Setiap penambahan rute wajib diperbarui di sini **dan** di `SidebarLayout` bila rute
tampil di navigasi.

Basename router ditentukan otomatis dari `import.meta.env.BASE_URL` (mis. `/lpm`).

## 1. Rute Publik

| Path | Komponen | Berkas | Catatan |
|---|---|---|---|
| `/` | `LandingPage` | `pages/Landing.tsx` | Beranda publik, tanpa guard, tanpa redirect paksa |
| `/login` | `LoginPage` | `pages/Login.tsx` | Tombol SSO ke Portal ONE UNUSU (`/authorize?client_id=lpm-unusu`) |
| `/sso/callback` | `SsoCallbackPage` | `pages/SsoCallback.tsx` | Tukar single-use token; dedup request per token (StrictMode-safe) |
| `/akses-ditolak` | `AccessDeniedPage` | `pages/AccessDenied.tsx` | Penolakan lintas aplikasi (mis. `ADMIN_LPPM`), menampilkan peran & cakupan |

## 2. Rute Panel Admin (dibungkus `ProtectedRoute` → `SidebarLayout`)

| Path | Komponen | Guard | Keterangan |
|---|---|---|---|
| `/admin` | `DashboardPage` | login + peran LPM | Alias dashboard |
| `/admin/dashboard` | `DashboardPage` | login + peran LPM | Dashboard metrik SPMI/AMI |
| `/admin/standar` | `StandarPage` | login + peran LPM | Daftar Standar SPMI (PPEPP) |
| `/admin/standar/tambah` | `StandarFormPage` | login + peran LPM | Form tambah standar |
| `/admin/standar/edit/:id` | `StandarFormPage` | login + peran LPM | Form edit standar |
| `/admin/dokumen` | `DokumenPage` | login + peran LPM | Bank dokumen mutu & SOP |
| `/admin/dokumen/tambah` | `DokumenFormPage` | login + peran LPM | Form unggah dokumen |
| `/admin/dokumen/edit/:id` | `DokumenFormPage` | login + peran LPM | Form edit dokumen |
| `/admin/ami` | `AmiPage` | login + peran LPM | Temuan Audit Mutu Internal |
| `/admin/ami/tambah` | `AmiFormPage` | login + peran LPM | Form catat temuan |
| `/admin/ami/edit/:id` | `AmiFormPage` | login + peran LPM | Form edit temuan |
| `/admin/pengguna` | `UsersPage` | **adminOnly** | Manajemen pengguna |
| `/admin/users` | `UsersPage` | **adminOnly** | Alias legacy |
| `/admin/peran` | `RolesPage` | **adminOnly** | Manajemen peran |
| `/admin/roles` | `RolesPage` | **adminOnly** | Alias legacy |
| `/admin/izin` | `PermissionsPage` | **adminOnly** | Matriks izin |
| `/admin/permissions` | `PermissionsPage` | **adminOnly** | Alias legacy |
| `*` | `Navigate → /` | — | Fallback wildcard |

## 3. Perilaku Guard (`ProtectedRoute`)

```
loading                → tampilan "Memuat sesi penjaminan mutu..."
belum login            → Navigate /login (state.from disimpan)
appAccess.allowed=false→ Navigate /akses-ditolak
adminOnly && !isAppAdmin → Navigate /admin/dashboard
selain itu            → <SidebarLayout>{children}</SidebarLayout>
```

- `accessDenied` berasal dari `useAuth()` (hasil `GET /api/auth/me`, bukan localStorage).
- `isAppAdmin` hanya `true` untuk `ADMIN_LPM` / `SUPERADMIN`.

## 4. Sinkronisasi Sidebar (`components/SidebarLayout.tsx`)

| Grup | Item | Path aktif | Visibilitas |
|---|---|---|---|
| Menu Tata Kelola Mutu | Dashboard | `/admin`, `/admin/dashboard` | semua peran LPM |
| Menu Tata Kelola Mutu | Standar SPMI | `/admin/standar*` | semua peran LPM |
| Menu Tata Kelola Mutu | Dokumen Mutu & SOP | `/admin/dokumen*` | semua peran LPM |
| Menu Tata Kelola Mutu | Audit Mutu Internal (AMI) | `/admin/ami*` | semua peran LPM |
| Kontrol Akses & RBAC | Pengguna | `/admin/pengguna`, `/admin/users` | **hanya admin LPM** |
| Kontrol Akses & RBAC | Peran | `/admin/peran`, `/admin/roles` | **hanya admin LPM** |
| Kontrol Akses & RBAC | Izin | `/admin/izin`, `/admin/permissions` | **hanya admin LPM** |
| Navigasi | Halaman Depan | `/` | semua |

## 5. Checklist Menambah Rute

1. Tambahkan `<Route>` di `src/client/App.tsx` di dalam `<Routes>`.
2. Bungkus `ProtectedRoute` (`adminOnly` bila khusus admin).
3. Daftarkan di tabel bagian 2 dokumen ini.
4. Bila tampil di sidebar: tambahkan item + aturan `isActive()` + label breadcrumb.
5. Bila butuh data baru: tambahkan fungsi di `services/api.ts` dan endpoint berguard di
   `src/server/index.ts`.
6. Catat di `docs/CHANGELOG.md`.
