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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* 1. TOP ANNOUNCEMENT STRIP — identitas aplikasi LPM UNUSU saja
          (tanpa emblem "Portal Resmi" & tanpa tautan portal lain). */}
      <div className="bg-amber-400 text-slate-950 px-4 py-2 text-xs font-semibold border-b border-amber-500/30">
        <div className="max-w-7xl mx-auto flex items-center justify-center sm:justify-start">
          <p className="truncate text-center sm:text-left">
            <span className="font-bold">LPM UNUSU</span>
            <span className="mx-1.5 text-blue-900" aria-hidden="true">
              &middot;
            </span>
            <span>Sistem Penjaminan Mutu Internal</span>
            <span className="hidden sm:inline">
              <span className="mx-1.5 text-blue-900" aria-hidden="true">
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
        accentBg="from-blue-100/90 via-amber-100/70 to-transparent"
        accentBorder="border-blue-100"
        bulletBg="bg-blue-900 text-amber-400"
        eyebrowClass="text-blue-900 bg-blue-50 border-blue-200"
      />

      {/* 4. TIGA PILAR UTAMA */}
      <section id="spmi" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-blue-900 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
            Infrastruktur Tata Kelola Mutu
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold text-slate-950 tracking-normal">
            Tiga Pilar Penjaminan Mutu UNUSU
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
            Menyatukan perencanaan standar, repositori instrumen operasional, dan evaluasi kepatuhan lapangan secara real-time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Standar SPMI */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md p-8 space-y-5 hover:border-blue-400 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-900 flex items-center justify-center border border-blue-100">
                <AcademicCapIcon className="w-8 h-8 text-blue-900" />
              </div>
              <h3 className="text-lg font-bold text-slate-950">Pangkalan Standar SPMI</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                Pangkalan butir komitmen mutu pada 4 aspek utama: Standar Pendidikan (Kurikulum & OBE), Standar Dosen & Tendik, Standar Riset, dan Standar PKM.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-blue-900">
              <span>24 Indikator Mutu</span>
              <span className="text-amber-600 font-semibold">Terstandarisasi</span>
            </div>
          </div>

          {/* Card 2: Dokumen Mutu */}
          <div id="dokumen" className="bg-white rounded-3xl border border-slate-200/90 shadow-md p-8 space-y-5 hover:border-amber-400 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center border border-amber-100">
                <BookOpenIcon className="w-8 h-8 text-amber-700" />
              </div>
              <h3 className="text-lg font-bold text-slate-950">Buku Kebijakan & SOP</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                Bank arsip digital seluruh instrumen resmi: Buku Kebijakan SPMI, Manual Mutu PPEPP, Standar Operasional Prosedur (SOP), dan Formulir Instrumen Audit.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-amber-800">
              <span>Legalitas SK Rektor</span>
              <span className="text-blue-900 font-semibold">Arsip Lengkap</span>
            </div>
          </div>

          {/* Card 3: Audit AMI */}
          <div id="ami" className="bg-white rounded-3xl border border-slate-200/90 shadow-md p-8 space-y-5 hover:border-blue-400 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-900 text-white flex items-center justify-center shadow-xs">
                <ClipboardDocumentCheckIcon className="w-8 h-8 text-amber-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-950">Audit Mutu Internal (AMI)</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                Pelaksanaan audit kepatuhan tahunan di tingkat program studi dan unit kerja. Kategorisasi temuan (KTS Mayor/Minor, Observasi) dan perumusan Rekomendasi Tindak Lanjut (RTL).
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-blue-900">
              <span>Pelaporan Terstruktur</span>
              <span className="text-emerald-700 font-semibold">Siap RTM</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. TAHAPAN SIKLUS MUTU PPEPP */}
      <section id="ppepp" className="bg-slate-100/70 border-y border-slate-200/80 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-amber-800 bg-amber-100/80 border border-amber-200 px-3 py-1 rounded-full">
              Siklus Mutu Berkelanjutan
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold text-slate-950 tracking-normal">
              5 Tahapan Siklus PPEPP
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              Kerangka kerja penjaminan mutu nasional untuk memastikan continuous improvement (Kaizen).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {ppeppSteps.map((s, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-3 hover:border-blue-500 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-900 text-amber-400 font-mono font-bold text-base flex items-center justify-center">
                  {s.num}
                </div>
                <div>
                  <h4 className="font-bold text-slate-950 text-sm">{s.title}</h4>
                  <span className="inline-block text-[10px] font-medium text-blue-900 bg-blue-50 px-2 py-0.5 rounded-md mt-1 border border-blue-100">
                    {s.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed font-normal">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. FOOTER RESMI */}
      <footer className="border-t border-slate-200 bg-white py-12 px-4 sm:px-6 lg:px-8 text-xs text-slate-600">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-blue-900 text-white flex items-center justify-center font-bold">
              <ShieldCheckIcon className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm">Lembaga Penjaminan Mutu (LPM)</div>
              <div className="text-[11px] text-slate-500 font-normal">Universitas Nahdlatul Ulama Sumatera Utara</div>
            </div>
          </div>
          <div className="text-center sm:text-right text-[11px] text-slate-500 space-y-1 font-normal">
            <p>© {new Date().getFullYear()} LPM UNUSU. Terintegrasi ONE UNUSU Digital Campus.</p>
            <p>Standar Siklus PPEPP, Standar SPMI & Audit Mutu Internal (AMI).</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
