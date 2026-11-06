import React from 'react';
import {
  ShieldCheckIcon,
  AcademicCapIcon,
  BookOpenIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';
import { Navbar } from '../components/Navbar';
import { FullHeroSlider } from '../components/FullHeroSlider';
import { TentangPlatform } from '../components/TentangPlatform';
import { Reveal } from '../components/Reveal';

export const LandingPage: React.FC = () => {
  const ppeppSteps = [
    {
      num: 'P1',
      title: 'Penetapan Standar',
      desc: 'Penyusunan dan penetapan standar mutu pendidikan, kualifikasi dosen, riset, dan tata kelola oleh Senat Universitas.',
      badge: 'Buku Standar SPMI',
    },
    {
      num: 'P2',
      title: 'Pelaksanaan Standar',
      desc: 'Implementasi indikator mutu pada seluruh prodi dan unit kerja berbasis kurikulum OBE dan SOP resmi.',
      badge: 'Manual & SOP Mutu',
    },
    {
      num: 'E',
      title: 'Evaluasi Pelaksanaan',
      desc: 'Audit Mutu Internal (AMI) berkala guna memverifikasi ketercapaian target mutu di tingkat program studi.',
      badge: 'Siklus Audit AMI',
    },
    {
      num: 'P3',
      title: 'Pengendalian Standar',
      desc: 'Analisis akar masalah temuan KTS Mayor/Minor dan perumusan Rekomendasi Tindak Lanjut (RTL) pada forum RTM.',
      badge: 'RTM & Pengendalian',
    },
    {
      num: 'P4',
      title: 'Peningkatan Standar',
      desc: 'Peningkatan standar secara berkelanjutan (Kaizen continuous improvement) menuju akreditasi perguruan tinggi Unggul.',
      badge: 'Continuous Growth',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans selection:bg-lpm-yellow-400 selection:text-slate-950">
      {/* 1. TOP ANNOUNCEMENT STRIP — identitas aplikasi LPM UNUSU saja
          (tanpa emblem "Portal Resmi" & tanpa tautan portal lain). */}
      <div className="bg-lpm-yellow-400 text-slate-950 px-4 py-2 text-xs font-semibold border-b border-lpm-yellow-400/30">
        <div className="max-w-7xl mx-auto flex items-center justify-center sm:justify-start">
          <p className="truncate text-center sm:text-left">
            <span className="font-bold">LPM UNUSU</span>
            <span className="mx-1.5 text-lpm-blue-900" aria-hidden="true">
              &middot;
            </span>
            <span>Sistem Penjaminan Mutu Internal</span>
            <span className="hidden sm:inline">
              <span className="mx-1.5 text-lpm-blue-900" aria-hidden="true">
                &middot;
              </span>
              Universitas Nahdlatul Ulama Sumatera Utara
            </span>
          </p>
        </div>
      </div>

      {/* 2. NAVBAR PUBLIK (komponen baku: brand kiri · menu tengah · aksi kanan)
          Navbar lama di dalam file ini sudah dihapus agar tidak tampil ganda. */}
      <Navbar />

      {/* 3. HERO FULL SLIDER */}
      <FullHeroSlider />

      {/* 3.5 TENTANG PLATFORM (teks kiri, foto kanan — pola baku ONE UNUSU) */}
      <TentangPlatform
        title="Mengenal LPM UNUSU"
        paragraphs={[
          'Lembaga Penjaminan Mutu (LPM) adalah unit pengawal standar mutu akademik dan tata kelola di lingkungan Universitas Nahdlatul Ulama Sumatera Utara, memastikan setiap program studi dan unit kerja bergerak selaras dengan visi institusi.',
          'Bukan sekadar pencatatan administratif, LPM UNUSU mengawal implementasi siklus PPEPP secara menyeluruh—mulai dari penetapan standar mutu, pelaksanaan SOP, audit mutu internal (AMI) berbasis data, hingga perumusan tindakan korektif dan peningkatan berkelanjutan.',
        ]}
        bullets={[
          'Standar SPMI terintegrasi dengan 24 indikator mutu nasional',
          'Audit Mutu Internal (AMI) berkala dengan penugasan auditor tersertifikasi',
          'Repositori digital buku kebijakan, manual mutu, dan SOP resmi',
        ]}
        portraitSrc="/assets/profil-auditor.png"
        fallbackSrc="/assets/hero/lpm-hero-1.png"
        imageAlt="Auditor Penjaminan Mutu Internal LPM UNUSU"
        accentBg="from-lpm-blue-100/90 via-lpm-yellow-400/70 to-transparent"
        accentBorder="border-lpm-blue-100"
        bulletBg="bg-lpm-blue-900 text-lpm-yellow-400"
        eyebrowClass="text-lpm-blue-900 border-lpm-blue-900"
      />

      {/* 4. TIGA PILAR UTAMA */}
      <section id="spmi" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <Reveal animasiAwal={false} className="max-w-2xl mx-auto mb-14 space-y-2 text-center">
          {/* Eyebrow: bilah tegak, bukan pil rounded-full (pola baku seragam). */}
          <p className="inline-block border-l-2 border-lpm-blue-900 pl-3 text-xs font-semibold uppercase tracking-widest text-lpm-blue-900">
            Infrastruktur Tata Kelola Mutu
          </p>
          <h2 className="text-2xl sm:text-4xl font-bold text-slate-950 tracking-normal">
            Tiga Pilar Penjaminan Mutu UNUSU
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
            Menyatukan perencanaan standar, repositori instrumen operasional, dan evaluasi kepatuhan lapangan secara real-time.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Standar SPMI */}
          <Reveal delay={0} className="bg-white rounded-3xl border-t-4 border-lpm-blue-900 border-x border-b border-x-slate-200 border-b-slate-200 shadow-md p-8 space-y-5 hover:border-lpm-blue-700 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-lpm-blue-900 text-white flex items-center justify-center">
                <AcademicCapIcon className="w-8 h-8 text-lpm-yellow-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-950">Pangkalan Standar SPMI</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                Pangkalan butir komitmen mutu pada 4 aspek utama: Standar Pendidikan (Kurikulum &amp; OBE), Standar Dosen &amp; Tendik, Standar Riset, dan Standar PKM.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-lpm-blue-900">
              <span>24 Indikator Mutu</span>
              <span className="text-lpm-blue-700 font-semibold">Terstandarisasi</span>
            </div>
          </Reveal>

          {/* Card 2: Dokumen Mutu. Latar biru tua supaya grid tidak seluruhnya
              putih; teks memakai putih/kuning yang aman di atas biru. */}
          <Reveal id="dokumen" delay={90} className="scroll-mt-24 bg-lpm-blue-900 rounded-3xl border border-lpm-blue-700 shadow-md p-8 space-y-5 hover:border-lpm-yellow-400 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-lpm-yellow-400 text-lpm-blue-900 flex items-center justify-center">
                <BookOpenIcon className="w-8 h-8 text-lpm-blue-900" />
              </div>
              <h3 className="text-lg font-bold text-white">Buku Kebijakan &amp; SOP</h3>
              <p className="text-xs text-lpm-blue-100 leading-relaxed font-normal">
                Bank arsip digital seluruh instrumen resmi: Buku Kebijakan SPMI, Manual Mutu PPEPP, Standar Operasional Prosedur (SOP), dan Formulir Instrumen Audit.
              </p>
            </div>
            <div className="pt-4 border-t border-lpm-blue-700 flex items-center justify-between text-xs font-medium text-white">
              <span>Legalitas SK Rektor</span>
              <span className="text-lpm-yellow-400 font-semibold">Arsip Lengkap</span>
            </div>
          </Reveal>

          {/* Card 3: Audit AMI */}
          <Reveal id="ami" delay={180} className="scroll-mt-24 bg-white rounded-3xl border-t-4 border-lpm-yellow-400 border-x border-b border-x-slate-200 border-b-slate-200 shadow-md p-8 space-y-5 hover:border-lpm-yellow-500 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-lpm-yellow-400 text-lpm-blue-900 flex items-center justify-center">
                <ClipboardDocumentCheckIcon className="w-8 h-8 text-lpm-blue-900" />
              </div>
              <h3 className="text-lg font-bold text-slate-950">Audit Mutu Internal (AMI)</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                Pelaksanaan audit kepatuhan tahunan di tingkat program studi dan unit kerja. Kategorisasi temuan (KTS Mayor/Minor, Observasi) dan perumusan Rekomendasi Tindak Lanjut (RTL).
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-lpm-blue-900">
              <span>Pelaporan Terstruktur</span>
              <span className="text-lpm-blue-700 font-semibold">Siap RTM</span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 5. TAHAPAN SIKLUS MUTU PPEPP
          Seksi berlatar biru tua penuh supaya biru menjadi bidang besar, bukan
          cuma aksen. Kartu di dalamnya berlatar biru lebih terang, nomor
          tahapan memakai kuning sebagai bidang yang paling menonjol. */}
      <section id="ppepp" className="bg-lpm-blue-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="max-w-2xl mb-14 space-y-2">
            {/* Eyebrow: bilah tegak, bukan pil rounded-full. */}
            <p className="inline-block border-l-2 border-lpm-yellow-400 pl-3 text-xs font-semibold uppercase tracking-widest text-lpm-yellow-400">
              Siklus Mutu Berkelanjutan
            </p>
            <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-normal">
              5 Tahapan Siklus PPEPP
            </h2>
            <p className="text-xs sm:text-sm text-lpm-blue-100 leading-relaxed font-normal">
              Kerangka kerja penjaminan mutu nasional untuk memastikan continuous improvement (Kaizen).
            </p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {ppeppSteps.map((s, idx) => (
              <Reveal
                key={idx}
                delay={idx * 80}
                className="bg-lpm-blue-800 rounded-2xl p-6 border border-lpm-blue-700 space-y-3 hover:border-lpm-yellow-400 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-lpm-yellow-400 text-lpm-blue-900 font-mono font-bold text-base flex items-center justify-center">
                  {s.num}
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">{s.title}</h4>
                  <span className="inline-block text-[10px] font-semibold text-lpm-yellow-400 bg-lpm-yellow-400/15 px-2 py-0.5 rounded-md mt-1 border border-lpm-yellow-400/40">
                    {s.badge}
                  </span>
                </div>
                <p className="text-xs text-lpm-blue-100 leading-relaxed font-normal">{s.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 6. FOOTER RESMI */}
      <footer className="bg-lpm-blue-950 border-t-4 border-lpm-yellow-400 py-12 px-4 sm:px-6 lg:px-8 text-xs text-lpm-blue-100">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-lpm-yellow-400 text-lpm-blue-900 flex items-center justify-center font-bold">
              <ShieldCheckIcon className="w-5 h-5 text-lpm-blue-900" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">Lembaga Penjaminan Mutu (LPM)</div>
              <div className="text-[11px] text-lpm-blue-200 font-normal">Universitas Nahdlatul Ulama Sumatera Utara</div>
            </div>
          </div>
          <div className="text-center sm:text-right text-[11px] text-lpm-blue-200 space-y-1 font-normal">
            <p>© {new Date().getFullYear()} LPM UNUSU. Terintegrasi ONE UNUSU Digital Campus.</p>
            <p>Standar Siklus PPEPP, Standar SPMI & Audit Mutu Internal (AMI).</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
