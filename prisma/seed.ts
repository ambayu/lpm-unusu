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

  // 6. Indikator & target capaian mutu (modul PPEPP)
  //    Idempoten via composite unique (standarId, kode).
  const indikatorSeed = [
    {
      standarId: standarPendidikan.id,
      kode: 'IND-PEND-01-1',
      nama: 'Persentase prodi dengan dokumen pemetaan CPL ke CPMK',
      satuan: '%',
      target: 100,
      capaian: 85,
      tahun: 2026,
      status: 'Belum Tercapai',
      catatan: 'Menunggu penyelesaian pemetaan CPMK pada 3 prodi baru.',
    },
    {
      standarId: standarPendidikan.id,
      kode: 'IND-PEND-01-2',
      nama: 'Jumlah prodi terakreditasi Baik Sekali / Unggul',
      satuan: 'prodi',
      target: 12,
      capaian: 9,
      tahun: 2026,
      status: 'Belum Tercapai',
    },
    {
      standarId: standarDosen.id,
      kode: 'IND-PEND-02-1',
      nama: 'Persentase dosen tetap berpendidikan S3',
      satuan: '%',
      target: 25,
      capaian: 15,
      tahun: 2026,
      status: 'Belum Tercapai',
      catatan: 'Perlu percepatan studi lanjut melalui program beasiswa internal.',
    },
    {
      standarId: standarPenelitian.id,
      kode: 'IND-PENEL-01-1',
      nama: 'Rata-rata publikasi ilmiah bereputasi per dosen per tahun',
      satuan: 'artikel',
      target: 1,
      capaian: 1.4,
      tahun: 2026,
      status: 'Melebihi Target',
    },
  ];

  for (const indikator of indikatorSeed) {
    await prisma.indikatorSpmi.upsert({
      where: { standarId_kode: { standarId: indikator.standarId, kode: indikator.kode } },
      update: {},
      create: indikator,
    });
  }
  console.log(`Indikator SPMI seeded: ${indikatorSeed.length} butir.`);

  // 7. Siklus PPEPP untuk standar pendidikan (5 tahap)
  //    Idempoten via composite unique (standarId, tahun, tahap).
  const tahapPpepp = [
    { tahap: 'Penetapan', status: 'Selesai', mulai: '2025-08-01', selesai: '2025-09-15' },
    { tahap: 'Pelaksanaan', status: 'Selesai', mulai: '2025-09-16', selesai: '2026-01-31' },
    { tahap: 'Evaluasi', status: 'Berjalan', mulai: '2026-02-01', selesai: null },
    { tahap: 'Pengendalian', status: 'Belum Mulai', mulai: null, selesai: null },
    { tahap: 'Peningkatan', status: 'Belum Mulai', mulai: null, selesai: null },
  ];

  for (const item of tahapPpepp) {
    await prisma.siklusPpepp.upsert({
      where: {
        standarId_tahun_tahap: {
          standarId: standarPendidikan.id,
          tahun: 2026,
          tahap: item.tahap,
        },
      },
      update: {},
      create: {
        standarId: standarPendidikan.id,
        periodeId: periode.id,
        tahun: 2026,
        tahap: item.tahap,
        status: item.status,
        tanggalMulai: item.mulai ? new Date(item.mulai) : null,
        tanggalSelesai: item.selesai ? new Date(item.selesai) : null,
        penanggungJawab: 'Ketua LPM UNUSU',
      },
    });
  }
  console.log(`Siklus PPEPP seeded: ${tahapPpepp.length} tahap.`);

  console.log('LPM UNUSU Seeder complete!');

  await seedRbacLpm();
}

// ===========================================================================
// RBAC PANEL LPM — izin masuk + izin fitur, melekat pada peran ONE UNUSU
//
// Panel LPM TIDAK memeriksa peran mentah. Yang diperiksa adalah IZIN:
//   1. Izin masuk  -> <clientId>:masuk_admin | masuk_dosen | masuk_mahasiswa
//   2. Izin fitur  -> <resource>:<action>, mis. standar:create
// Keduanya melekat pada peran (lpm_role_permissions), dan peran melekat pada
// pengguna (lpm_user_roles). Sumber pemetaan peran ONE UNUSU -> izin adalah
// tabel role_permissions di database ONE UNUSU.
// ===========================================================================

const CLIENT_ID = 'lpm-unusu';

/** Tiga tingkat izin masuk panel LPM. */
const IZIN_MASUK = [
  { kunci: `${CLIENT_ID}:masuk_admin`, nama: 'Masuk Panel sebagai Administrator LPM' },
  { kunci: `${CLIENT_ID}:masuk_dosen`, nama: 'Masuk Panel sebagai Dosen / Auditor Mutu' },
  { kunci: `${CLIENT_ID}:masuk_mahasiswa`, nama: 'Masuk Panel sebagai Mahasiswa / Observer' },
] as const;

/** Izin fitur per sub-menu panel LPM. */
const IZIN_FITUR = [
  { kunci: 'lpm:dashboard', nama: 'Melihat Dashboard Mutu', grup: 'utama' },
  { kunci: 'standar:view', nama: 'Melihat Pangkalan Standar SPMI', grup: 'standar' },
  { kunci: 'standar:create', nama: 'Menambah Standar SPMI', grup: 'standar' },
  { kunci: 'standar:update', nama: 'Mengubah Standar SPMI', grup: 'standar' },
  { kunci: 'standar:delete', nama: 'Menghapus Standar SPMI', grup: 'standar' },
  { kunci: 'dokumen:view', nama: 'Melihat Bank Dokumen & SOP', grup: 'dokumen' },
  { kunci: 'dokumen:create', nama: 'Mengunggah Dokumen Mutu', grup: 'dokumen' },
  { kunci: 'dokumen:update', nama: 'Mengubah Dokumen Mutu', grup: 'dokumen' },
  { kunci: 'dokumen:delete', nama: 'Menghapus Dokumen Mutu', grup: 'dokumen' },
  { kunci: 'audit:view', nama: 'Melihat Instrumen & Temuan AMI', grup: 'audit' },
  { kunci: 'audit:create', nama: 'Mencatat Butir Audit AMI', grup: 'audit' },
  { kunci: 'audit:update', nama: 'Mengevaluasi Butir Audit AMI', grup: 'audit' },
  { kunci: 'audit:delete', nama: 'Menghapus Butir Audit AMI', grup: 'audit' },
  { kunci: 'indikator:view', nama: 'Melihat Indikator SPMI', grup: 'ppepp' },
  { kunci: 'indikator:create', nama: 'Menambah Indikator SPMI', grup: 'ppepp' },
  { kunci: 'indikator:update', nama: 'Mengubah Indikator SPMI', grup: 'ppepp' },
  { kunci: 'indikator:delete', nama: 'Menghapus Indikator SPMI', grup: 'ppepp' },
  { kunci: 'ppepp:view', nama: 'Melihat Siklus PPEPP', grup: 'ppepp' },
  { kunci: 'ppepp:create', nama: 'Menambah Tahap PPEPP', grup: 'ppepp' },
  { kunci: 'ppepp:update', nama: 'Mengubah Tahap PPEPP', grup: 'ppepp' },
  { kunci: 'tindaklanjut:view', nama: 'Melihat Tindak Lanjut', grup: 'tindak-lanjut' },
  { kunci: 'tindaklanjut:create', nama: 'Menambah Tindak Lanjut', grup: 'tindak-lanjut' },
  { kunci: 'tindaklanjut:update', nama: 'Memperbarui Tindak Lanjut', grup: 'tindak-lanjut' },
  { kunci: 'pengguna:view', nama: 'Melihat Daftar Pengguna LPM', grup: 'tata-kelola' },
  { kunci: 'pengguna:create', nama: 'Menambah Pengguna LPM', grup: 'tata-kelola' },
  { kunci: 'pengguna:update', nama: 'Mengubah Pengguna LPM', grup: 'tata-kelola' },
  { kunci: 'pengguna:delete', nama: 'Menghapus Pengguna LPM', grup: 'tata-kelola' },
  { kunci: 'peran:view', nama: 'Melihat Peran & Wewenang', grup: 'tata-kelola' },
  { kunci: 'peran:create', nama: 'Membuat Peran Baru', grup: 'tata-kelola' },
  { kunci: 'peran:update', nama: 'Mengubah Peran', grup: 'tata-kelola' },
  { kunci: 'peran:delete', nama: 'Menghapus Peran', grup: 'tata-kelola' },
  { kunci: 'izin:view', nama: 'Melihat Matriks Izin Akses', grup: 'tata-kelola' },
  { kunci: 'izin:update', nama: 'Mengubah Matriks Izin Akses', grup: 'tata-kelola' },
  { kunci: 'keamanan:view', nama: 'Melihat Jejak Penolakan Akses', grup: 'tata-kelola' },
] as const;

/** Matriks izin bawaan: peran lokal -> daftar kunci izin. */
const MATRIKS_IZIN: Record<string, string[]> = {
  // Admin LPM hanya memegang izin masuk TINGKAT ADMIN. Bila sebuah peran
  // memegang beberapa tingkat sekaligus, server selalu memilih tingkat
  // tertinggi — jadi menambahkan masuk_dosen/masuk_mahasiswa di sini hanya
  // akan menyamarkan arti peran tanpa menambah kemampuan apa pun.
  admin: [`${CLIENT_ID}:masuk_admin`, ...IZIN_FITUR.map((i) => i.kunci)],
  dosen: [
    `${CLIENT_ID}:masuk_dosen`,
    'lpm:dashboard',
    'standar:view',
    'dokumen:view',
    'audit:view',
    'audit:create',
    'audit:update',
    'indikator:view',
    'ppepp:view',
    'tindaklanjut:view',
    'tindaklanjut:create',
    'tindaklanjut:update',
  ],
  mahasiswa: [
    `${CLIENT_ID}:masuk_mahasiswa`,
    'lpm:dashboard',
    'standar:view',
    'dokumen:view',
    'audit:view',
    'indikator:view',
    'ppepp:view',
  ],
};

const PERAN_BAWAAN = [
  {
    kode: 'admin',
    nama: 'Administrator LPM',
    deskripsi:
      'Akses penuh konfigurasi standar SPMI, bank dokumen, periode AMI, serta manajemen pengguna dan peran LPM.',
  },
  {
    kode: 'dosen',
    nama: 'Auditor Mutu Internal (Dosen)',
    deskripsi:
      'Meninjau butir standar, mengisi instrumen audit lapangan, dan menindaklanjuti rekomendasi perbaikan mutu.',
  },
  {
    kode: 'mahasiswa',
    nama: 'Observer Mutu (Mahasiswa)',
    deskripsi: 'Melihat pangkalan data mutu, arsip dokumen, dan status capaian PPEPP.',
  },
];

async function seedRbacLpm() {
  for (const p of PERAN_BAWAAN) {
    await prisma.lpmRole.upsert({
      where: { kode: p.kode },
      update: { nama: p.nama, deskripsi: p.deskripsi },
      create: { ...p, sistem: true },
    });
  }

  const semuaIzin = [
    ...IZIN_MASUK.map((i) => ({ kunci: i.kunci, nama: i.nama, grup: 'izin-masuk' })),
    ...IZIN_FITUR.map((i) => ({ kunci: i.kunci, nama: i.nama, grup: i.grup })),
  ];
  for (const izin of semuaIzin) {
    await prisma.lpmPermission.upsert({
      where: { kunci: izin.kunci },
      update: { nama: izin.nama, grup: izin.grup },
      create: izin,
    });
  }

  for (const [kodePeran, daftarKunci] of Object.entries(MATRIKS_IZIN)) {
    const peran = await prisma.lpmRole.findUnique({ where: { kode: kodePeran } });
    if (!peran) continue;

    // Peran sistem mencerminkan MATRIKS_IZIN persis. Tanpa pembersihan ini,
    // izin yang dulu pernah ditanam (mis. admin memegang masuk_dosen) akan
    // terus menempel karena upsert hanya menambah, tidak pernah menghapus.
    // Peran buatan administrator tidak disentuh — perubahan manual mereka aman.
    if (PERAN_BAWAAN.some((p) => p.kode === kodePeran)) {
      const izinSah = await prisma.lpmPermission.findMany({
        where: { kunci: { in: daftarKunci } },
        select: { id: true },
      });
      await prisma.lpmRolePermission.deleteMany({
        where: { roleId: peran.id, permissionId: { notIn: izinSah.map((i) => i.id) } },
      });
    }

    for (const kunci of daftarKunci) {
      const izin = await prisma.lpmPermission.findUnique({ where: { kunci } });
      if (!izin) continue;
      await prisma.lpmRolePermission.upsert({
        where: { roleId_permissionId: { roleId: peran.id, permissionId: izin.id } },
        update: {},
        create: { roleId: peran.id, permissionId: izin.id },
      });
    }
  }

  console.log(
    `RBAC LPM seeded: ${PERAN_BAWAAN.length} peran, ${semuaIzin.length} izin (${IZIN_MASUK.length} izin masuk).`,
  );
  console.log('Petakan peran ONE UNUSU -> izin masuk lewat panel ONE UNUSU (role_permissions).');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
