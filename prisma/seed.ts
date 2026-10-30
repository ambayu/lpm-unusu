import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding LPM UNUSU database...');

  // 1. Periode AMI Aktif
  const periode = await prisma.periodeAmi.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      nama: 'Siklus AMI UNUSU Tahun Akademik 2025/2026',
      tahun: 2026,
      status: 'Berjalan',
    },
  });
  console.log('Periode AMI seeded:', periode.nama);

  // 2. Standar SPMI Utama
  const standarPendidikan = await prisma.standarSpmi.upsert({
    where: { kode: 'STD-PEND-01' },
    update: {},
    create: {
      kode: 'STD-PEND-01',
      nama: 'Standar Kompetensi Lulusan & Capaian Pembelajaran',
      kategori: 'Pendidikan',
      pernyataan: 'Setiap program studi di lingkungan UNUSU wajib menetapkan profil lulusan dan Capaian Pembelajaran Lulusan (CPL) yang selaras dengan Kerangka Kualifikasi Nasional Indonesia (KKNI) level 6 untuk Sarjana serta memuat nilai-nilai Aswaja An-Nahdliyah.',
      indikator: '100% kurikulum prodi memiliki dokumen pemetaan CPL ke CPMK dan bahan ajar.',
      target: '100% Prodi terakreditasi Baik Sekali / Unggul',
      tahun: 2026,
    },
  });

  const standarDosen = await prisma.standarSpmi.upsert({
    where: { kode: 'STD-PEND-02' },
    update: {},
    create: {
      kode: 'STD-PEND-02',
      nama: 'Standar Dosen dan Tenaga Kependidikan',
      kategori: 'Pendidikan',
      pernyataan: 'Dosen tetap program studi wajib berkualifikasi akademik minimum Magister (S2), memiliki NIDN, dan minimal 20% berkualifikasi Doktor (S3) serta memiliki jabatan fungsional minimum Lektor.',
      indikator: 'Rasio dosen berkualifikasi S3 dan Lektor Kepala meningkat setiap tahun.',
      target: '>= 25% Dosen Bergelar Doktor',
      tahun: 2026,
    },
  });

  const standarPenelitian = await prisma.standarSpmi.upsert({
    where: { kode: 'STD-PENEL-01' },
    update: {},
    create: {
      kode: 'STD-PENEL-01',
      nama: 'Standar Hasil & Publikasi Penelitian Dosen',
      kategori: 'Penelitian',
      pernyataan: 'Setiap dosen tetap wajib mempublikasikan minimal 1 artikel ilmiah bereputasi per tahun akademik pada jurnal nasional terakreditasi SINTA atau jurnal internasional bereputasi.',
      indikator: 'Jumlah publikasi per dosen per tahun >= 1.',
      target: '100% Dosen Memiliki Publikasi Ilmiah',
      tahun: 2026,
    },
  });

  const standarPkm = await prisma.standarSpmi.upsert({
    where: { kode: 'STD-PKM-01' },
    update: {},
    create: {
      kode: 'STD-PKM-01',
      nama: 'Standar Pengabdian kepada Masyarakat (PKM)',
      kategori: 'Pengabdian',
      pernyataan: 'Pelaksanaan PKM dosen wajib melibatkan mahasiswa aktif dan menghasilkan dampak nyata bagi pemberdayaan masyarakat berbasis kearifan lokal Sumatera Utara.',
      indikator: '100% kegiatan PKM melibatkan minimal 2 mahasiswa aktif.',
      target: 'Keterlibatan Mahasiswa 100%',
      tahun: 2026,
    },
  });

  const standarTataKelola = await prisma.standarSpmi.upsert({
    where: { kode: 'STD-TATA-01' },
    update: {},
    create: {
      kode: 'STD-TATA-01',
      nama: 'Standar Sistem Penjaminan Mutu & Audit Tata Kelola',
      kategori: 'Tata Kelola',
      pernyataan: 'Lembaga Penjaminan Mutu melaksanakan Audit Mutu Internal (AMI) secara berkala minimal 1 kali setiap tahun akademik untuk memantau implementasi siklus PPEPP di seluruh unit kerja.',
      indikator: 'Keterlaksanaan siklus AMI 100% tepat waktu sebelum RTM.',
      target: '100% Unit Kerja Terdokumentasi AMI',
      tahun: 2026,
    },
  });

  console.log('Standar SPMI seeded successfully.');

  // 3. Dokumen Mutu
  await prisma.dokumenMutu.upsert({
    where: { kodeDokumen: 'DOC-SPMI-KEBIJAKAN-2026' },
    update: {},
    create: {
      kodeDokumen: 'DOC-SPMI-KEBIJAKAN-2026',
      judul: 'Buku Kebijakan Sistem Penjaminan Mutu Internal UNUSU',
      jenis: 'Kebijakan',
      revisi: 2,
      tahun: 2026,
      filePath: 'https://unusu.ac.id/dokumen/kebijakan-spmi-2026.pdf',
    },
  });

  await prisma.dokumenMutu.upsert({
    where: { kodeDokumen: 'DOC-MANUAL-PPEPP-2026' },
    update: {},
    create: {
      kodeDokumen: 'DOC-MANUAL-PPEPP-2026',
      judul: 'Manual Mutu Penetapan, Pelaksanaan, Evaluasi, Pengendalian, dan Peningkatan (PPEPP)',
      jenis: 'Manual',
      revisi: 1,
      tahun: 2026,
      standarId: standarTataKelola.id,
      filePath: 'https://unusu.ac.id/dokumen/manual-ppepp-2026.pdf',
    },
  });

  await prisma.dokumenMutu.upsert({
    where: { kodeDokumen: 'DOC-STD-PEND-01-2026' },
    update: {},
    create: {
      kodeDokumen: 'DOC-STD-PEND-01-2026',
      judul: 'Buku Standar Mutu Pendidikan dan Pengajaran UNUSU',
      jenis: 'Standar',
      revisi: 3,
      tahun: 2026,
      standarId: standarPendidikan.id,
      filePath: 'https://unusu.ac.id/dokumen/standar-pendidikan-2026.pdf',
    },
  });

  await prisma.dokumenMutu.upsert({
    where: { kodeDokumen: 'SOP-AMI-01' },
    update: {},
    create: {
      kodeDokumen: 'SOP-AMI-01',
      judul: 'Standar Operasional Prosedur (SOP) Pelaksanaan Audit Mutu Internal Program Studi',
      jenis: 'Formulir / SOP',
      revisi: 1,
      tahun: 2026,
      standarId: standarTataKelola.id,
      filePath: 'https://unusu.ac.id/dokumen/sop-ami-unusu.pdf',
    },
  });

  console.log('Dokumen Mutu seeded.');

  // 4. Sample Temuan AMI
  const countAudit = await prisma.auditButir.count();
  if (countAudit === 0) {
    await prisma.auditButir.createMany({
      data: [
        {
          periodeId: periode.id,
          standarId: standarPendidikan.id,
          auditee: 'Program Studi Sistem Informasi',
          auditor: 'Dr. H. Ahmad Fauzi, M.Kom.',
          hasil: 'Sesuai',
          deskripsi: 'CPL telah dipetakan secara komprehensif ke dalam Rencana Pembelajaran Semester (RPS) berbasis Outcome-Based Education (OBE).',
          rekomendasi: 'Pertahankan dan lengkapi rubrik penilaian portofolio tugas mahasiswa.',
        },
        {
          periodeId: periode.id,
          standarId: standarDosen.id,
          auditee: 'Program Studi Manajemen Bisnis Syariah',
          auditor: 'Prof. Dr. Ir. M. Syahrial, M.Si.',
          hasil: 'Temuan Minor',
          deskripsi: 'Persentase dosen tetap berpendidikan S3 pada prodi masih di angka 15% dari target standar 25%.',
          rekomendasi: 'Pimpinan fakultas memfasilitasi dan mendorong percepatan studi lanjut Doktoral dosen muda.',
        },
        {
          periodeId: periode.id,
          standarId: standarPenelitian.id,
          auditee: 'Fakultas Sains dan Teknologi',
          auditor: 'Dr. Nurul Hidayati, M.Pd.',
          hasil: 'Terlampaui',
          deskripsi: 'Rata-rata publikasi artikel ilmiah bereputasi internasional Scopus/WOS mencapai 1.4 per dosen dalam satu tahun akademik.',
          rekomendasi: 'Diusulkan pemberian reward insentif publikasi ilmiah berprestasi oleh universitas.',
        },
      ],
    });
    console.log('Sample Audit Butir seeded.');
  }

  console.log('LPM UNUSU Seeder complete! ✨');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
