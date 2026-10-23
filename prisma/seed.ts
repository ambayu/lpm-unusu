import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding data LPM UNUSU...");

  // 1. Standar SPMI
  const std1 = await prisma.standarSpmi.upsert({
    where: { kode: "STD-PEND-01" },
    update: {},
    create: {
      kode: "STD-PEND-01",
      nama: "Standar Kompetensi Lulusan (CPL)",
      kategori: "Pendidikan",
      pernyataan: "Setiap program studi wajib merumuskan Capaian Pembelajaran Lulusan (CPL) yang selaras dengan KKNI dan nilai ke-Aswaja-an.",
      indikator: "Ketersediaan dokumen kurikulum berbasis OBE dan RPS terverifikasi.",
      target: "100% Prodi menerapkan kurikulum OBE",
      tahun: 2026,
    },
  });

  const std2 = await prisma.standarSpmi.upsert({
    where: { kode: "STD-DOSEN-01" },
    update: {},
    create: {
      kode: "STD-DOSEN-01",
      nama: "Standar Dosen dan Tenaga Kependidikan",
      kategori: "Sumber Daya",
      pernyataan: "Dosen tetap program studi wajib berkualifikasi minimal Magister (S2) dan memiliki NIDN aktif.",
      indikator: "Rasio dosen terhadap mahasiswa maksimal 1:30 untuk rumpun sains teknologi.",
      target: "Rasio ideal dan 80% Dosen tersertifikasi pendidik",
      tahun: 2026,
    },
  });

  // 2. Dokumen Mutu (Kebijakan, Manual, SOP)
  await prisma.dokumenMutu.createMany({
    data: [
      { standarId: std1.id, kodeDokumen: "DOK-SPMI-01", judul: "Buku Kebijakan Sistem Penjaminan Mutu Internal UNUSU", jenis: "Kebijakan", revisi: 1, tahun: 2026 },
      { standarId: std1.id, kodeDokumen: "DOK-SPMI-02", judul: "Manual Mutu PPEPP Penetapan dan Evaluasi", jenis: "Manual", revisi: 1, tahun: 2026 },
      { standarId: std1.id, kodeDokumen: "SOP-MUTU-01", judul: "SOP Pelaksanaan Audit Mutu Internal (AMI)", jenis: "Formulir / SOP", revisi: 2, tahun: 2026 },
    ]
  });

  // 3. Periode AMI & Hasil Audit
  const periode = await prisma.periodeAmi.create({
    data: {
      nama: "Siklus Audit Mutu Internal (AMI) 2026/2027",
      tahun: 2026,
      status: "Berjalan",
    },
  });

  await prisma.auditButir.create({
    data: {
      periodeId: periode.id,
      standarId: std1.id,
      auditee: "Program Studi S1 Sistem Informasi",
      auditor: "Dr. K.H. Ahmad Nawawi, M.A.",
      hasil: "Sesuai",
      deskripsi: "Seluruh RPS semester ganjil telah diunggah dan terverifikasi di portal akademik prodi.",
      rekomendasi: "Tingkatkan implementasi asesmen portofolio mata kuliah berbasis proyek (PBL).",
    },
  });

  console.log("Seeding data LPM UNUSU selesai!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
