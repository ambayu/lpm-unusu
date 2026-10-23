# LPM UNUSU - Lembaga Penjaminan Mutu

Sistem Informasi Penjaminan Mutu Internal (SPMI) dan Audit Mutu Internal (AMI) Universitas Nahdlatul Ulama Sumatera Utara berbasis **Single Package Fullstack Monolith (Vite React + Node.js Express + Prisma MySQL)**.

---

## 🚀 Fitur Utama
1. **Standar SPMI**: Siklus PPEPP, standar pendidikan, dosen, sarpras, dan CPL kurikulum.
2. **Dokumen Mutu**: Buku Kebijakan Mutu, Manual PPEPP, dan SOP / Formulir instrumen mutu.
3. **Audit Mutu Internal (AMI)**: Pencatatan temuan audit kepatuhan prodi, hasil visitasi auditor, dan rekomendasi perbaikan.

---

## 🛠️ Konfigurasi
* **Fullstack Monolith**: 1 Port (`5004`), 1 File `.env` di root.
* **Database**: MySQL (`lpm_unusu_db`).

---

## ⚡ Cara Menjalankan
1. Instal dependensi: `npm install`
2. Migrasi & Seed:
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init_lpm
   npm run prisma:seed
   ```
3. Jalankan: `npm run dev`
