import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheckIcon,
  AcademicCapIcon,
  BookOpenIcon,
  ClipboardDocumentCheckIcon,
  ArrowRightIcon,
  ArrowTopRightOnSquareIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { FullHeroSlider } from '../components/FullHeroSlider';

const ONE_UNUSU_URL = import.meta.env.VITE_ONE_UNUSU_URL || 'http://localhost:5173';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      {/* 1. TOP ANNOUNCEMENT STRIP (KUNING EMAS & ROYAL BLUE) */}
      <div className="bg-amber-400 text-slate-950 px-4 py-2 text-xs font-semibold border-b border-amber-500/30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2 truncate">
            <span className="bg-blue-950 text-amber-300 text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold">
              Portal Resmi
            </span>
            <span className="truncate">Lembaga Penjaminan Mutu — Universitas Nahdlatul Ulama Sumatera Utara</span>
          </div>
          <div className="hidden sm:flex items-center space-x-4 text-[11px] font-medium">
            <a
              href={`${ONE_UNUSU_URL}/dashboard`}
              className="flex items-center space-x-1 hover:text-blue-950 transition-colors"
            >
              <span>Portal Terpadu ONE UNUSU</span>
              <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* 2. NAVBAR BERSIH (ROYAL BLUE) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo Brand */}
          <Link to="/" className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-900 flex items-center justify-center text-white shadow-md ring-2 ring-blue-800">
              <ShieldCheckIcon className="w-7 h-7 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-xl text-slate-950 tracking-normal">LPM</span>
                <span className="font-bold text-xl text-blue-900 tracking-normal">UNUSU</span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium tracking-widest uppercase">
                Penjaminan Mutu Internal
              </p>
            </div>
          </Link>

          {/* Navigasi Utama */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/60" aria-label="Navigasi utama">
            <a
              href="#spmi"
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:text-blue-900 hover:bg-white rounded-xl transition-all"
            >
              Standar SPMI
            </a>
            <a
              href="#dokumen"
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:text-blue-900 hover:bg-white rounded-xl transition-all"
            >
              Buku Dokumen & SOP
            </a>
            <a
              href="#ami"
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:text-blue-900 hover:bg-white rounded-xl transition-all"
            >
              Audit AMI
            </a>
            <a
              href="#ppepp"
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:text-blue-900 hover:bg-white rounded-xl transition-all"
            >
              Siklus PPEPP
            </a>
          </nav>

          {/* Right Action */}
          <div className="hidden sm:flex items-center space-x-3">
            {user ? (
              <Link
                to="/admin"
                className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold shadow-md hover:shadow-lg transition-all"
              >
                <span>Panel Manajemen</span>
                <ArrowRightIcon className="w-3.5 h-3.5 text-amber-400" />
              </Link>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold shadow-md hover:shadow-lg transition-all"
              >
                <span>Masuk</span>
                <ArrowRightIcon className="w-3.5 h-3.5 text-amber-400" />
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100"
            aria-label={mobileMenuOpen ? 'Tutup menu' : 'Buka menu'}
          >
            {mobileMenuOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3">
            <a href="#spmi" onClick={() => setMobileMenuOpen(false)} className="block text-xs font-medium text-slate-700 py-1.5">Standar SPMI</a>
            <a href="#dokumen" onClick={() => setMobileMenuOpen(false)} className="block text-xs font-medium text-slate-700 py-1.5">Buku Dokumen & SOP</a>
            <a href="#ami" onClick={() => setMobileMenuOpen(false)} className="block text-xs font-medium text-slate-700 py-1.5">Audit AMI</a>
            <a href="#ppepp" onClick={() => setMobileMenuOpen(false)} className="block text-xs font-medium text-slate-700 py-1.5">Siklus PPEPP</a>
            <div className="pt-2 border-t border-slate-100">
              {user ? (
                <Link to="/admin" className="w-full text-center block px-4 py-2.5 rounded-xl bg-blue-900 text-white text-xs font-semibold">
                  Panel Manajemen
                </Link>
              ) : (
                <Link to="/login" className="w-full text-center block px-4 py-2.5 rounded-xl bg-blue-900 text-white text-xs font-semibold">
                  Masuk
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* 3. HERO FULL SLIDER */}
      <FullHeroSlider />

      {/* 3.5 TENTANG LPM UNUSU (DESAIN SEPERTI PROFIL ONE UNUSU) */}
      <section id="profil" aria-labelledby="profil-lpm-title" className="bg-white py-16 sm:py-24 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-6">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-900 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full inline-block">
                Tentang Lembaga
              </span>
              <h2 id="profil-lpm-title" className="text-2xl sm:text-4xl font-bold text-slate-950 tracking-tight pt-2">
                Mengenal LPM UNUSU
              </h2>
            </div>

            <div className="mt-6 space-y-4 text-sm sm:text-base leading-relaxed text-slate-600">
              <p>
                Lembaga Penjaminan Mutu (LPM) adalah unit pengawal standar mutu akademik dan tata kelola di lingkungan Universitas Nahdlatul Ulama Sumatera Utara, memastikan setiap program studi dan unit kerja bergerak selaras dengan visi institusi.
              </p>
              <p>
                Bukan sekadar pencatatan administratif, LPM UNUSU mengawal implementasi siklus PPEPP secara menyeluruh—mulai dari penetapan standar mutu, pelaksanaan SOP, audit mutu internal (AMI) berbasis data, hingga perumusan tindakan korektif dan peningkatan berkelanjutan.
              </p>
            </div>

            <ul className="mt-6 space-y-3">
              {[
                'Standar SPMI terintegrasi dengan 24 indikator mutu nasional',
                'Audit Mutu Internal (AMI) berkala dengan penugasan auditor tersertifikasi',
                'Repositori digital buku kebijakan, manual mutu, dan SOP resmi',
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-700">
                  <span className="mt-0.5 grid size-5 flex-shrink-0 place-items-center rounded-full bg-blue-900 text-amber-400">
                    <ShieldCheckIcon className="size-3.5" />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Visual Auditor Setengah Badan (Ukuran Lebih Besar & Menawan) */}
          <div className="lg:col-span-6">
            <div className="relative mx-auto flex max-w-lg items-end justify-center">
              <div className="absolute inset-x-2 bottom-0 h-[86%] rounded-[40px] bg-gradient-to-tr from-blue-100/90 via-amber-100/70 to-transparent border border-blue-100" />
              <img
                src="/assets/profil-auditor.png"
                alt="Auditor Penjaminan Mutu Internal LPM UNUSU"
                className="relative z-10 block w-full max-w-[480px] sm:max-w-[500px] h-auto object-contain drop-shadow-[0_25px_50px_rgba(30,58,138,0.22)] transition-transform duration-300 hover:scale-[1.02]"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

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
