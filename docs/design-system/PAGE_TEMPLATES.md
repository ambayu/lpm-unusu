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

Dashboard mengikuti pola baku yang sama dengan E-Surat UNUSU. Urutan blok dari atas ke bawah:

1. **Banner sambutan** — latar warna primer repo, badge kecil uppercase, `h1` berisi sapaan
   dinamis (`Selamat pagi/siang/sore/malam` + nama depan pengguna), satu paragraf penjelas
   modul, dan 2 tombol aksi ke modul inti (`min-h-[44px]`).
2. **Kartu ringkasan** — badge + judul `Ringkasan ...` + deskripsi; aksi `Segarkan`
   (ikon berputar saat `loading`) dan satu tautan ke halaman daftar data.
3. **Error state** — `ErrorState` + tombol coba lagi, ditampilkan bila pemuatan gagal.
4. **Skeleton** — grid 4 kartu `animate-pulse` selama `loading` dan data belum ada.
5. **Kartu metrik** — grid 4 kolom; label uppercase, ikon dalam kotak warna lembut, angka
   `text-3xl font-black`, subteks kecil, dan footer tautan `Daftar →` ke modul terkait.
6. **Laporan chart** — grid 2 kolom berisi `ReportCard` (DonutChart / BarChart / StackedBar /
   GaugeRing). Seluruh grafik digambar dengan SVG/CSS di `components/LaporanCharts.tsx` —
   **tanpa library chart dan tanpa dependency baru**.
7. **Daftar terbaru** — 2 kartu berdampingan, masing-masing 5 baris data terakhir
   (judul, status, tanggal).

**Aturan data (mengikat):**

- Setiap angka **wajib** berasal dari API nyata. Dilarang `Math.random()`, konstanta palsu,
  atau angka "kira-kira".
- **Jangan membuang field yang sudah dikirim server.** Bila endpoint dashboard menghitung
  sesuatu (mis. `indikatorTercapai`, `tindakLanjutTerbuka`) namun UI tidak menampilkannya,
  itu bug — tampilkan di kartu/chart yang sesuai.
- Bila sebuah angka belum tersedia, **tambahkan agregasi di server** (`count` / `groupBy` /
  `findMany` + `take`), jangan menghitung di klien dari data yang tidak lengkap.
- Bila sebuah chart tidak bisa diisi dari data nyata, **jangan buat chart itu**.

**Aturan fetch:** satu fungsi `loadData()` dipakai bersama oleh pemuatan awal, tombol
`Segarkan`, dan `onRetry`; `loading` selalu ditutup lewat `finally` agar tidak nyangkut
saat terjadi error.

**Larangan:** dashboard **tidak** menampilkan kartu informasi akun (`UserAuthorityCard`) —
identitas pengguna cukup di topbar/sidebar. Dashboard juga tidak memuat panel aksi cepat.

**Larangan tata letak:** jangan membungkus dashboard dengan `max-w-*`/`mx-auto`/padding luar;
`SidebarLayout` sudah memberi kanvas ber-padding (`<main className="flex-1 p-5 sm:p-7">`).

## Peta Halaman → Template

| Halaman | Berkas | Template |
|---|---|---|
| Landing | `pages/Landing.tsx` | Public landing (hero slider full-bleed) + `components/Navbar.tsx` |
| Login | `pages/Login.tsx` | Auth (4) |
| SSO Callback | `pages/SsoCallback.tsx` | Auth (4) |
| Akses Ditolak | `pages/AccessDenied.tsx` | Guard (5) |
| Dashboard | `pages/Dashboard.tsx` | Dashboard (6) |
| Standar / Dokumen / AMI (list) | `pages/{Standar,Dokumen,Ami}.tsx` | List (1) |
| Standar / Dokumen / AMI (form) | `pages/*Form.tsx` | Form (2) |
| Pengguna / Peran / Izin | `pages/{Users,Roles,Permissions}.tsx` | List (1) + guard `adminOnly` |

### Navbar Landing Page

Seluruh aplikasi memakai satu struktur navbar yang sama (acuan: `esurat-unusu/src/client/components/Navbar.tsx`):

- `<header className="sticky top-0 z-50 bg-white border-b border-[#CBD5E1]">` dengan baris `h-16`.
- **Kiri** — brand: kotak logo 36×36 (`w-9 h-9 rounded-[10px]`) berwarna primer repo, nama
  aplikasi, dan subteks kecil.
- **Tengah** — menu desktop (`hidden md:flex`), tiap item ikon 16px + label, `rounded-[8px]`,
  item aktif memakai warna primer repo dan ditandai `aria-current="page"`.
- **Kanan** — belum login: tautan "Website Kampus" + tombol "Masuk SSO" → `/login`
  (seluruh autentikasi lewat ONE UNUSU SSO). Sudah login: identitas + tombol `Keluar`.
  Tombol hamburger `md:hidden` (`min-h-[44px] min-w-[44px]`, `aria-label`, `aria-expanded`).
- Menu mobile menutup diri setelah tautan diklik.
- Navbar disembunyikan di rute panel (`if (pathname.startsWith('/admin')) return null`)
  karena panel sudah punya sidebar + topbar sendiri.


---

## Aturan Status Aktif Menu Sidebar (`isActive`)

Semua sidebar panel **wajib** memakai aturan kecocokan yang sama agar tidak pernah ada dua menu aktif sekaligus:

1. **Cocok persis** — `pathname === to` → aktif.
2. **Cocok batas segmen** — `pathname.startsWith(to + '/')` → kandidat aktif. Dilarang memakai `startsWith(to)` tanpa garis miring, karena `/peran` akan ikut menyala di `/perangkat`.
3. **Kecocokan terpanjang menang** — bila beberapa menu berbagi prefix yang sama (mis. `/admin` dan `/admin/pengguna`), hanya menu dengan path **terpanjang** yang dianggap aktif.
4. **Menu ber-`end`** — menu yang menunjuk rute akar (mis. `/` untuk "Kelas Saya") wajib ditandai `end: true` agar tidak menyala di semua halaman. Rute turunannya (mis. `/class/:id`) dipetakan manual ke menu induk.
5. **Reaktif** — status harus dihitung dari `useLocation()` (bukan `window.location.pathname`), supaya ikut berubah saat navigasi client-side.
