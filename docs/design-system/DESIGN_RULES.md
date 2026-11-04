# Design Rules — LPM UNUSU

## 1. Prinsip Utama
- **Build Once, Reuse Everywhere**: Hindari duplikasi markup dan layout antar halaman. Gunakan shared component dan page template.
- **Card Container Pattern (Part 10.8)**: Seluruh tabel, formulir, panel filter, dan kartu metrik wajib dibungkus dalam Card Container putih dengan heading section yang jelas. Tidak boleh meletakkan elemen input/data mengambang langsung di atas background halaman.
- **Warna Identitas Kampus**: Nuansa Hijau Modern UNUSU (`#14532D`, `#166534`, `#15803D`) dengan background halaman lembut `#F1F5F2` (soft neutral green).
- **Icon Library**: Heroicons (`@heroicons/react/24/outline` dan `@heroicons/react/24/solid`).
- **Anti-Sparkles Rule**: Dilarang menggunakan icon bintang/sparkles. Gunakan icon representatif sesuai konteks mutu akademik (AcademicCap, DocumentCheck, ShieldCheck, ClipboardDocumentCheck, Funnel, ArrowPath).
- **Semua Status Wajib Memiliki Feedback Visual**: Menyediakan state Loading, Empty, dan Error yang jelas dan informatif.

## 2. Layout & Container (Part 10.8)

- **Struktur halaman admin**: `SidebarLayout` (sidebar 256px + topbar 88px) → `main`
  dengan padding `p-5 sm:p-7` → konten `space-y-6`.
- **Card Container standar**: `bg-white rounded-[14px] border border-[#CBD5E1]
  shadow-2xs overflow-hidden`; header `px-5 py-3.5 border-b border-[#CBD5E1] bg-[#F8FAFC]`
  berisi judul + badge + aksi; body `p-5`.
- **Dilarang**: menaruh `<table>`, panel filter, atau `<form>` langsung di atas
  background halaman tanpa Card Container.
- **Grid metrik**: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4`,
  setiap sel adalah card dengan ikon 32–40px, label `text-xs`, angka `text-2xl font-bold`.
- **Tabel**: selalu `overflow-x-auto` + `min-w` wajar; header `bg-slate-50`, baris
  `divide-y divide-slate-100`, hover `hover:bg-slate-50/80`.

## 3. Aksesibilitas (WCAG AA)

1. Kontras teks ≥ 4.5:1 (teks besar ≥ 3:1). `text-slate-400` hanya untuk helper.
2. Tap target minimal **44×44px** (`min-h-[44px]`, `min-w-[44px]`) untuk tombol, ikon
   aksi, dan link navigasi — terutama di breakpoint mobile.
3. Setiap tombol ikon wajib punya `aria-label` atau `title` deskriptif.
4. Gunakan elemen semantik (`<nav aria-label>`, `<main>`, `<header>`, `<table>`,
   `<label for>`); status aktif nav memakai `aria-current="page"`.
5. State error memakai `role="alert"`, badge status memakai `role="status"`.
6. Fokus terlihat: jangan menghapus `focus:ring`; gunakan `focus:ring-2`.
7. Animasi wajib menghormati `prefers-reduced-motion` (lihat `AnimatedFlatSsoLogo`).
8. Jangan menyampaikan informasi **hanya** lewat warna.

## 4. Otorisasi Tampil di UI (App-Scoped)

- UI hanya **mencerminkan** keputusan server (`useAuth().appAccess`), tidak pernah
  memutuskan akses sendiri.
- Menu & aksi mutasi hanya dirender untuk `isAppAdmin` (Administrator LPM / Superadmin);
  peran lain mendapat label *read-only*.
- Peran di luar cakupan aplikasi diarahkan ke `/akses-ditolak` — halaman tersebut wajib
  menjelaskan **peran**, **cakupan aplikasi**, dan **langkah perbaikan**.
- Label peran memakai `roleLabel` (mis. "Administrator LPM"), bukan string mentah
  (`admin`, `ADMIN_LPM`).

## 5. State, Umpan Balik, dan Ketahanan Data

| State | Komponen | Catatan |
|---|---|---|
| Loading | teks `text-xs text-slate-500` atau skeleton | Jangan biarkan area kosong tanpa keterangan |
| Empty | `EmptyState` | Sertakan aksi opsional (mis. "Tambah Standar") |
| Error | `ErrorState` (`role="alert"`) | Sediakan `onRetry` |
| Sukses | toast/alert ringkas | Bahasa Indonesia, spesifik |

Akses data wajib defensif: `item?.field ?? '—'`, agregasi `Number(x) || 0`, tanggal
memakai `new Date(value).toLocaleDateString('id-ID')` dengan fallback `—`.

## 6. Ikon & Copywriting

- Heroicons 24/outline untuk navigasi & aksi, 24/solid untuk status terpilih.
- Ukuran ikon konsisten: 16px (`w-4 h-4`) di tombol, 20px (`w-5 h-5`) di header,
  32px (`w-8 h-8`) di kotak ikon nav.
- Copywriting: kalimat aktif, tanpa hiperbola, tanpa emoji, tanpa "AI-isms"
  ("seamless", "revolutionize", "unlock"). Gunakan istilah mutu yang tepat:
  PPEPP, Standar SPMI, Temuan (KTS Mayor/Minor), Auditee, Auditor.
- Judul halaman menjelaskan konteks modul, bukan mengulang nama menu.
