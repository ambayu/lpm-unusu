# LPM UNUSU - Engineering Instructions

## Project
LPM UNUSU - Lembaga Penjaminan Mutu Internal
Universitas Nahdlatul Ulama Sumatera Utara

## Technology Stack
- Frontend (`src/client/`): Vite + React 18, TypeScript, Tailwind CSS, Heroicons (`@heroicons/react`)
- Backend (`src/server/`): Node.js Express, TypeScript, Prisma ORM
- Database: MySQL (`lpm_unusu_db` / shared DB prefix `lpm_`)
- SSO Integration: Terhubung ke ONE UNUSU Gateway (`verify-token` v2)

## Modul Utama LPM UNUSU
1. **Standar SPMI**: Pengelolaan Siklus PPEPP (Penetapan, Pelaksanaan, Evaluasi, Pengendalian, Peningkatan) serta indikator & target capaian mutu.
2. **Buku Kebijakan & Dokumen Mutu**: Repositori Kebijakan SPMI, Manual Mutu, Standar Mutu, dan Formulir/SOP.
3. **Audit Mutu Internal (AMI)**: Manajemen periode siklus audit, penugasan auditor & auditee (Prodi/Fakultas/Unit), instrumen butir audit, serta temuan dan rekomendasi tindak lanjut (RTL).

## Icon & UI Standards
1. **Icon Library**: Wajib menggunakan Heroicons (`@heroicons/react/24/outline` atau solid). Hindari icon Lucide atau library icon lain.
2. **Anti-Sparkles Rule**: Dilarang keras menggunakan ikon sparkles. Gunakan ikon fungsional yang spesifik (AcademicCap, DocumentCheck, ClipboardDocumentList, ShieldCheck, dll).
3. **Card Container Layout (Part 10.8)**: Seluruh tabel data, filter, form input, dan metrik wajib dibungkus dalam card container yang rapi dengan heading section yang jelas di atas background lembut `#F1F5F2`.
4. **SSO Gateway Compliance**: Seluruh autentikasi wajib melewati ONE UNUSU SSO token exchange. Tidak ada pembuatan login lokal dengan kata sandi terpisah.
