# Color Palette — LPM UNUSU

Seluruh warna sudah ditokenisasi di `tailwind.config.js` sebagai kelas Tailwind semantik.
Dilarang menulis hex arbitrary `bg-[#...]` di kode; gunakan token di bawah ini.

## Brand & Surface

| Token Tailwind | Nilai Hex | Penggunaan |
|---|---|---|
| `bg-lpm-green-surface` | `#F1F5F2` | Background global seluruh halaman (soft green-tinted) |
| `bg-white` | `#FFFFFF` | Background Card Container, Form Card, Data Table Card |
| `bg-lpm-green` / `text-lpm-green` | `#145A32` | Brand utama: logo, sidebar, tombol primary, aksen dominan |
| `bg-lpm-green-dark` | `#0A3D22` | Hover state tombol utama, gradien gelap |
| `bg-lpm-green-light` | `#1A7A45` | Aksen sekunder, active link |
| `bg-lpm-green-700` / `text-lpm-green-700` | `#166534` | Icon aktif sidebar, ring avatar |
| `bg-lpm-green-50` | `#EEF7EF` | Sidebar background, badge muted |
| `bg-lpm-green-100` | `#D8F0E1` | Nav item aktif background |
| `bg-lpm-green-200` | `#D3EAD9` | Icon container default sidebar |
| `bg-lpm-green-300` / `border-lpm-green-300` | `#C8DDD0` | Border sidebar, border badge |
| `text-lpm-green-500` | `#4D7A60` | Teks muted sidebar, label section |
| `text-lpm-green-600` | `#3A5544` | Teks nav item non-aktif |

## Aksen Emas (Gold)

| Token Tailwind | Nilai Hex | Penggunaan |
|---|---|---|
| `text-lpm-gold` / `bg-lpm-gold` | `#D4AF37` | Aksen emas: icon shield, border badge core |
| `text-lpm-gold-light` | `#FBBF24` | Aksen gold terang, selection highlight |
| `text-lpm-gold-dark` | `#B8941F` | Border announcement strip |

## Teks

| Token Tailwind | Nilai Hex | Penggunaan |
|---|---|---|
| `text-slate-900` / `text-slate-950` | `#0F172A` / `#020617` | Teks judul, label form, konten utama |
| `text-slate-600` | `#475569` | Deskripsi sub-header, helper text |
| `text-slate-400` / `text-slate-500` | `#94A3B8` / `#64748B` | Placeholder, tanggal sekunder, muted |
| `border-slate-200` | `#E2E8F0` | Border halus pada Card Container |

## Status Badge (AMI & Dokumen)

| Status | Teks | Background | Border |
|---|---|---|---|
| Terlampaui | `text-emerald-700` | `bg-emerald-50` | `border-emerald-200/80` |
| Sesuai | `text-teal-700` | `bg-teal-50` | `border-teal-200/80` |
| KTS Minor | `text-amber-700` | `bg-amber-50` | `border-amber-200/80` |
| KTS Mayor | `text-rose-700` | `bg-rose-50` | `border-rose-200/80` |
| Observasi | `text-indigo-700` | `bg-indigo-50` | `border-indigo-200/80` |
| SOP / Formulir | `text-amber-800` | `bg-amber-50` | `border-amber-200` |
| Kebijakan | `text-purple-700` | `bg-purple-50` | `border-purple-200` |
| Manual | `text-blue-700` | `bg-blue-50` | `border-blue-200` |
| Standar | `text-emerald-700` | `bg-emerald-50` | `border-emerald-200` |

## Aturan

1. **Semua warna brand** harus menggunakan token Tailwind dari `tailwind.config.js`, bukan arbitrary hex.
2. **Landing page dan admin panel** menggunakan palette hijau kampus yang sama (`lpm-green`).
3. **Warna status** menggunakan palette bawaan Tailwind (emerald, teal, amber, rose, indigo) yang tidak perlu ditokenisasi karena sudah semantik.
