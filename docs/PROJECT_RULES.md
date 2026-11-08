# Project Rules — LPM UNUSU

Aturan engineering yang mengikat seluruh kontributor (manusia maupun agen AI) pada
aplikasi **lpm-unusu**. Dokumen ini adalah turunan operasional dari `/AGENTS.md`.

---

## 1. Hierarki Aturan (Rule Hierarchy)

Bila terjadi konflik, aturan dengan urutan lebih kecil **menang**:

| Level | Sumber | Cakupan |
|---|---|---|
| 1 | Instruksi user pada sesi berjalan | Tugas spesifik, batasan sementara |
| 2 | `/AGENTS.md` | Stack, modul, boundary peran, larangan global |
| 3 | `docs/PROJECT_RULES.md` (file ini) | Konvensi kode, workflow, definisi selesai |
| 4 | `docs/ARCHITECTURE.md` | Kontrak arsitektur, alur SSO, skema data |
| 5 | `docs/design-system/*` | Aturan visual, komponen, template halaman |
| 6 | `docs/routes/ROUTE_MANIFEST.md` | Peta rute & navigasi |
| 7 | Preferensi lokal (gaya penulisan, urutan import) | Selama tidak melanggar level 1–6 |

Aturan level 5–7 **tidak boleh** dipakai untuk membenarkan pelanggaran level 2–4.

---

## 2. Boundary Peran (Role Boundary)

| Peran | Wilayah kerja | Dilarang |
|---|---|---|
| **FRONTEND** | `src/client/**` (`App.tsx`, `pages/`, `components/`, `context/`, `services/`), endpoint UI-related | Mengubah skema DB, menjalankan migrasi |
| **DATABASE** | `prisma/schema.prisma`, `prisma/migrations/**`, `prisma/seed.ts` | Mengubah komponen UI |
| **QA** | Verifikasi fungsional, build, test, laporan uji | Mengubah kode produksi tanpa persetujuan |

Mutasi database destruktif (`migrate reset`, `db push --force-reset`, `DROP`, seed yang
menghapus data) dan `git push` **wajib** persetujuan eksplisit user.

---

## 3. Larangan Eksekusi (Guardrails)

1. **Dilarang** menjalankan `npm run build`, `npm test`, `tsc`, atau `vite build` saat
   bertindak sebagai Programmer — itu wewenang QA.
2. **Dilarang** menebak kredensial atau mengetik password/token di form login.
3. **Dilarang** menaruh secret di kode; gunakan `.env` (`JWT_SECRET`, `SSO_CLIENT_KEY`).
4. **Dilarang** mem-bypass otorisasi server demi kenyamanan UI. Klien hanya
   *menampilkan* hasil keputusan server, bukan memutuskan akses.
5. **Dilarang** membuat struktur UI paralel yang menduplikasi komponen/template yang ada.

---

## 4. Konvensi Kode

### 4.1 Umum
- TypeScript `strict` aktif. Hindari `any` mentah; pakai tipe eksplisit atau `unknown` +
  penyempitan. `catch (error: any)` hanya untuk ekstraksi `message`.
- Import type memakai `import type { ... }` (proyek memakai `isolatedModules`).
- Nama file: komponen & halaman `PascalCase.tsx`, helper `camelCase.ts`.
- Komentar ditulis dalam Bahasa Indonesia, ringkas, menjelaskan **mengapa** bukan **apa**.

### 4.2 Frontend
- Semua akses HTTP lewat `src/client/services/api.ts` (instance axios + interceptor
  Bearer token & penanganan 401/403). Jangan menyebar `fetch('/api/...')` baru tanpa alasan.
- Token dibaca dari `localStorage['lpm_unusu_token']` dengan fallback legacy
  `localStorage['lpm_token']` (aturan skill governance #12).
- Sesi & otorisasi dibaca dari `useAuth()` — jangan membaca `localStorage` langsung untuk
  keperluan guard UI.
- Setiap halaman admin wajib berada di bawah `ProtectedRoute`; rute khusus admin memakai
  prop `adminOnly`.
- State wajib menangani **Loading**, **Empty**, dan **Error** (pakai `EmptyState` /
  `ErrorState`), tidak boleh hanya `null`.
- Akses data defensif: `item?.field ?? fallback`, agregasi angka disanitasi (`Number(x) || 0`).

### 4.3 Backend
- Semua route `/api/*` (kecuali `/api/health` dan `/api/auth/sso`) berada di bawah
  middleware `authenticate`.
- Otorisasi memakai `requireRole(...)`, `requireLpmAdmin`, atau `resolveAppAccess()`.
- Respons API konsisten: `{ success: boolean, data?: T, message?: string, code?: string }`.
- Error 500 tidak boleh membocorkan stack trace ke klien.

### 4.4 Database
- Nama tabel/model berprefix domain LPM; relasi wajib punya `onDelete` eksplisit.
- Perubahan skema harus disertai catatan di `docs/database/SCHEMA_MIGRATION_PLAN.md`.
- Seeder harus idempoten (aman dijalankan berulang).

---

## 5. Aturan UI Wajib (ringkas dari design-system)

1. **Card Container Pattern (Part 10.8)** — tabel, filter, form, dan kartu metrik wajib
   berada di dalam `CardContainer` putih (`rounded-[14px]`, `border-[#CBD5E1]`,
   header `bg-[#F8FAFC]`). Tidak ada input/data mengambang di atas background halaman.
2. **Kontras WCAG AA** — teks utama minimal `slate-700/900` di atas putih; jangan memakai
   teks `slate-400` untuk konten penting (hanya helper/placeholder).
3. **Tap target ≥ 44px** — semua tombol/link aksi memakai `min-h-[44px]` (atau
   `py-2.5` + ikon 20px) terutama pada mobile.
4. **Tanpa horizontal overflow** — tabel dibungkus `overflow-x-auto`, grid memakai
   `grid-cols-1 sm:grid-cols-2 lg:grid-cols-*`, teks panjang `truncate`/`break-words`.
5. **Build Once, Reuse Everywhere** — komponen bersama di `src/client/components/`;
   halaman baru wajib mengikuti `docs/design-system/PAGE_TEMPLATES.md`.
6. **Anti-Sparkles** — dilarang ikon bintang/sparkles; gunakan ikon semantik mutu
   (`AcademicCap`, `DocumentCheck`, `ShieldCheck`, `ClipboardDocumentCheck`, `Funnel`).
7. **Bahasa UI** — Indonesia, ringkas, tanpa label berlebihan ("Menu Pengguna" ✗,
   "Pengguna" ✓).

---

## 6. Aturan SSO & Otorisasi Berbasis Permission

Ekosistem ONE UNUSU memakai **otorisasi berbasis permission (Permission-First)** yang diterbitkan dari portal pusat ONE UNUSU:

1. **Izin Masuk Aplikasi**: Akses ke panel LPM ditentukan oleh izin masuk SSO (`lpm-unusu:masuk_admin` atau `lpm-unusu:masuk_dosen`) yang diterima pada `data.access.allowed` saat verifikasi tiket.
2. **Peniadaan Peran Cabang Kaku**: Peran admin kaku per-aplikasi (`ADMIN_LPM`, `ADMIN_LPPM`, dll.) telah dihapus dari portal pusat. `SUPERADMIN` memegang seluruh izin masuk secara global dan dapat masuk ke semua aplikasi. Super Administrator membuat peran kustom dan menentukan izin fitur/masuk, lalu menautkannya ke pengguna di portal SSO.
3. **Pemeriksaan Fitur per Sub-Menu**: Operasi data dan fitur di LPM dilindungi oleh middleware berbasis permission key (bukan pengecekan raw role `role === '...'`).
4. **Verifikasi Sesi Server**: Klien wajib memverifikasi ulang sesi ke server saat boot; cache lokal tidak boleh dipercaya sebagai sumber tunggal otorisasi.
5. **Fail-Closed**: Pengguna tanpa izin masuk diarahkan ke `/akses-ditolak` (`AccessDenied.tsx`) dengan pesan yang jelas.
6. **Manajemen Pengguna Terpusat**: LPM tidak mengelola registri akun pengguna sendiri; pengelolaan akun dan penautan peran sepenuhnya dilakukan di portal ONE UNUSU.

---

## 7. Workflow Kerja (Definition of Done)

1. **Audit dokumen** (bagian 1 `docs/README.md`) → tentukan berkas target dari
   `src/client/App.tsx` atau `src/server/index.ts`, bukan dari tebakan.
2. **Cek komponen/template yang sudah ada** sebelum menulis markup baru.
3. **Implementasi** dengan `patch` bertarget; hindari menulis ulang berkas besar.
4. **Sinkronkan** rute (`App.tsx` + `docs/routes/ROUTE_MANIFEST.md`), menu sidebar, dan
   guard otorisasi dalam satu perubahan.
5. **Perbarui dokumentasi**: `docs/CHANGELOG.md` wajib; dokumen lain bila kontrak berubah.
6. **Lapor**: berkas yang diubah, perilaku baru, dan risiko/catatan QA. Tanpa klaim
   "build/test lulus" kecuali QA yang menjalankannya.

---

## 8. Definition of Broken (Anti-Pattern)

- Menambah rute tanpa mendaftarkannya di `App.tsx` → jatuh ke wildcard redirect.
- Menambah menu sidebar tanpa rute nyata (dead link).
- Menaruh logika `if (role === 'admin')` di klien sebagai satu-satunya guard mutasi.
- Menyalin blok `<table>`/form antar halaman alih-alih memakai `CardContainer`.
- Menyimpan keputusan akses hanya di `localStorage` tanpa verifikasi server.
- Menulis hex arbitrary baru saat token warna sudah tersedia.
