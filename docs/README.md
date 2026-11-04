# Dokumentasi LPM UNUSU

Pusat tata kelola dokumentasi (docs governance) untuk aplikasi **LPM UNUSU — Lembaga
Penjaminan Mutu Internal, Universitas Nahdlatul Ulama Sumatera Utara**.

Dokumen di folder ini adalah **sumber kebenaran** untuk aturan engineering, design system,
peta rute, dan riwayat perubahan. Setiap agen AI (maupun manusia) **wajib membaca**
dokumen yang relevan **sebelum** mengubah kode, dan **memperbaruinya setelah** mengubah kode.

---

## 1. Urutan Baca Wajib (Pre-Coding Audit)

| Urutan | Dokumen | Kapan dibaca |
|---|---|---|
| 1 | [`/AGENTS.md`](../AGENTS.md) | Selalu. Aturan tertinggi proyek (stack, modul, boundary). |
| 2 | [`PROJECT_RULES.md`](./PROJECT_RULES.md) | Selalu. Hierarki aturan, konvensi kode, guardrail, definisi selesai. |
| 3 | [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Saat menyentuh alur data, SSO, API, atau skema DB. |
| 4 | [`API_ENDPOINTS.md`](./API_ENDPOINTS.md) | Saat menambah/mengubah endpoint atau guard otorisasi. |
| 5 | [`design-system/DESIGN_RULES.md`](./design-system/DESIGN_RULES.md) | Saat membuat/mengubah UI apa pun. |
| 6 | [`design-system/COLORS.md`](./design-system/COLORS.md), [`TYPOGRAPHY.md`](./design-system/TYPOGRAPHY.md) | Saat menyentuh warna, tipografi, badge, kontras. |
| 7 | [`design-system/COMPONENTS.md`](./design-system/COMPONENTS.md) | Sebelum membuat komponen baru — cek yang sudah ada. |
| 8 | [`design-system/PAGE_TEMPLATES.md`](./design-system/PAGE_TEMPLATES.md) | Sebelum membuat halaman baru. |
| 9 | [`routes/ROUTE_MANIFEST.md`](./routes/ROUTE_MANIFEST.md) | Sebelum menambah/mengubah rute atau menu sidebar. |
| 10 | [`database/SCHEMA_MIGRATION_PLAN.md`](./database/SCHEMA_MIGRATION_PLAN.md) | Saat menyentuh Prisma/migrasi. |
| 11 | [`adr/`](./adr/) | Saat mengambil keputusan arsitektural baru. |

Setelah selesai bekerja: perbarui [`CHANGELOG.md`](./CHANGELOG.md) dan, bila mengubah
kontrak/struktur, perbarui dokumen terkait + tambahkan ADR.

---

## 2. Peta Dokumen

```
docs/
├── README.md                     ← indeks & aturan baca (file ini)
├── PROJECT_RULES.md              ← hierarki aturan + konvensi engineering
├── ARCHITECTURE.md               ← arsitektur fullstack monolith + alur SSO
├── API_ENDPOINTS.md              ← referensi endpoint /api + guard otorisasi
├── CHANGELOG.md                  ← riwayat perubahan (format ISO date)
├── design-system/
│   ├── DESIGN_RULES.md           ← prinsip desain, aksesibilitas, anti-slop
│   ├── COLORS.md                 ← token warna brand & netral (aktual repo)
│   ├── TYPOGRAPHY.md             ← font & type scale efektif
│   ├── COMPONENTS.md             ← registry shared components
│   └── PAGE_TEMPLATES.md         ← template halaman wajib
├── routes/
│   ├── ROUTE_MANIFEST.md         ← daftar rute aktual dari App.tsx
│   ├── standar/                  ← RULES.md (aturan rute) + README.md (peta implementasi)
│   ├── dokumen/                  ← RULES.md + README.md modul Dokumen Mutu & SOP
│   └── ami/                      ← RULES.md + README.md modul Audit Mutu Internal
├── database/
│   └── SCHEMA_MIGRATION_PLAN.md  ← rencana skema & migrasi
└── adr/
    ├── README.md                 ← cara menulis ADR + indeks
    └── ADR-0001-app-scoped-admin.md
```

---

## 3. Ringkasan Proyek (struktur repo aktual)

| Aspek | Nilai |
|---|---|
| Nama paket | `lpm-unusu` v1.0.0 (`"type": "module"`) |
| Frontend | Vite 6 + React 18 + TypeScript + Tailwind 3 (`src/client`) |
| Backend | Express 4 + TypeScript, entry `src/server/index.ts`, port `5004` |
| ORM / DB | Prisma 5 + MySQL (`prisma/schema.prisma`, prefix tabel `lpm_`) |
| Auth | SSO ONE UNUSU `verify-token` v2 → JWT lokal 7 hari (`JWT_SECRET` wajib) |
| Ikon | `@heroicons/react` 2 (`24/outline`, `24/solid`) |
| Router | `react-router-dom` 7, manifest tunggal di `src/client/App.tsx` |

Struktur frontend:

```
src/client/
├── App.tsx              ← manifest rute + ProtectedRoute (gate akses)
├── main.tsx
├── index.css            ← import font & base layer Tailwind
├── components/          ← shared components (CardContainer, SidebarLayout, dst.)
├── context/             ← AuthContext (sesi + cakupan aplikasi)
├── lib/                 ← helper aset (assetUrl)
├── pages/               ← halaman per modul + form + AccessDenied
└── services/            ← axios client & tipe data API
```

Model Prisma aktif: `StandarSpmi`, `DokumenMutu`, `PeriodeAmi`, `AuditButir`.

Modul fungsional: **Standar SPMI (PPEPP)**, **Dokumen Mutu & SOP**, **Audit Mutu
Internal (AMI)**, serta **RBAC** (Pengguna, Peran, Izin) dan **Dashboard**.

---

## 4. Perintah Operasional

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Jalankan server (tsx watch) + Vite client bersamaan |
| `npm run dev:server` / `npm run dev:client` | Menjalankan salah satu proses saja |
| `npm run build` | `build:client` (Vite) lalu `build:server` (tsc) — **wewenang QA/build pipeline** |
| `npm start` | Menjalankan hasil build `dist/server/index.js` |
| `npm run prisma:generate` / `prisma:migrate` / `prisma:seed` | Prisma generate / migrasi / seeder |

> **Agen AI (Programmer) dilarang menjalankan build/test/tsc.** Cukup selesaikan perubahan
> berkas dan laporkan; verifikasi build & pengujian adalah wewenang QA.

Environment wajib: `JWT_SECRET` (server berhenti bila kosong), `SSO_BASE_URL`,
`SSO_CLIENT_ID` (default `lpm-unusu`), `SSO_CLIENT_KEY`. Frontend: `VITE_API_URL`,
`VITE_ONE_UNUSU_URL`, `VITE_SSO_CLIENT_ID`.

---

## 5. Aturan Pemeliharaan Dokumen

1. **Satu perubahan kode = satu entri changelog.** Tambahkan di bagian `Added` /
   `Changed` / `Fixed` dengan tanggal ISO.
2. **Kontrak berubah → dokumen berubah.** Endpoint baru, rute baru, komponen baru, atau
   aturan akses baru wajib tercermin di dokumen terkait pada commit yang sama.
3. **Keputusan arsitektural → ADR.** Bila keputusan mengikat lintas modul (mis. pemisahan
   admin per aplikasi), tulis ADR di `docs/adr/` dengan format `ADR-XXXX-judul.md`.
4. **Jangan mendokumentasikan yang tidak ada.** Dokumen harus mencerminkan kode aktual;
   rencana ke depan ditandai eksplisit sebagai *planned*.
5. **Bahasa**: Indonesia untuk narasi, Inggris untuk nama kode/API/tipe.
