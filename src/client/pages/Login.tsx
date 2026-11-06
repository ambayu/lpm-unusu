import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowRightIcon,
  ChevronLeftIcon,
  XMarkIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import { AnimatedFlatSsoLogo } from '../components/AnimatedFlatSsoLogo';
import { SsoLoadingScreen } from '../components/SsoLoadingScreen';
import { useAuth } from '../context/AuthContext';
import { assetUrl } from '../lib/assets';
import { SSO_ROLE_LABEL } from '../services/api';

const ONE_UNUSU_URL = import.meta.env.VITE_ONE_UNUSU_URL || 'https://unusu.bpp-developer.com/sso';
const SSO_CLIENT_ID = import.meta.env.VITE_SSO_CLIENT_ID || 'cli65a45bdb5b19c943';

/** Ditulis oleh halaman callback SSO ketika server menolak cakupan aplikasi. */
const DENIED_FLAG_KEY = 'lpm_sso_denied';

interface DeniedNotice {
  ssoRole?: string;
  reason?: string;
  app?: string;
}

export function LoginPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Penolakan lintas aplikasi dari percobaan login sebelumnya (mis. admin LPPM).
  const [deniedNotice, setDeniedNotice] = useState<DeniedNotice | null>(null);

  // True sejak tombol masuk ditekan hingga browser benar-benar berpindah ke
  // Portal ONE UNUSU. Dipakai untuk menampilkan layar tunggu penuh.
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DENIED_FLAG_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as DeniedNotice;
      if (parsed && (parsed.ssoRole || parsed.reason)) {
        setDeniedNotice(parsed);
      }
      // Sekali tampil, penanda dibersihkan agar tidak muncul lagi pada kunjungan berikutnya.
      sessionStorage.removeItem(DENIED_FLAG_KEY);
    } catch {
      /* sessionStorage dapat diblokir atau berisi data rusak — abaikan */
    }
  }, []);

  useEffect(() => {
    if (user) {
      const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/admin';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const deniedRoleLabel = deniedNotice?.ssoRole
    ? SSO_ROLE_LABEL[deniedNotice.ssoRole] || deniedNotice.ssoRole
    : 'Administrator aplikasi lain';
  const deniedIsForeignAdmin = deniedNotice?.reason === 'foreign_app_admin';

  const handleSsoLogin = () => {
    if (redirecting) return;
    // Hanya menyalakan layar tunggu. Perpindahan ke Portal ONE UNUSU baru
    // dijalankan oleh `onReady` setelah jeda animasi terlewati, sehingga logo
    // SSO sempat terlihat utuh alih-alih berkedip sepersekian detik.
    setRedirecting(true);
  };

  const goToPortal = () => {
  // Langsung ke /authorize, tanpa melewati halaman login portal.
  // Portal sendiri yang menentukan: bila sesi SSO masih aktif, tiket diterbitkan
  // dan pengguna mendarat di panel aplikasi ini; bila tidak, portal menampilkan
  // form login lalu melanjutkan ke /authorize secara otomatis. Dengan begitu
  // pengguna yang sudah login di ONE UNUSU tidak melihat form login dua kali.
    const target = `${ONE_UNUSU_URL}/authorize?client_id=${encodeURIComponent(SSO_CLIENT_ID)}`;
    window.location.href = target;
  };

  // Layar tunggu satu halaman penuh selama browser berpindah ke Portal ONE
  // UNUSU, supaya pengguna tidak menekan tombol masuk berulang kali.
  if (redirecting) {
    return (
      <SsoLoadingScreen
        title="Menghubungkan ke ONE UNUSU"
        description="Mengalihkan Anda ke Portal Single Sign-On kampus. Jangan tutup halaman ini."
        delayMs={1400}
        onReady={goToPortal}
      />
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white relative selection:bg-lpm-yellow-400 selection:text-slate-950">
      {/* ===== SISI KIRI: FORM LOGIN SSO ===== */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-12 lg:p-16 xl:p-20 z-10">
        {/* Nav Kembali */}
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-lpm-blue-900 transition-colors"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>

        {/* Konten Tengah */}
        <div className="max-w-md w-full mx-auto my-auto py-6 space-y-7 text-center sm:text-left">
          {/* Header */}
          <div className="space-y-2">
            {/* Eyebrow: bilah tegak, bukan pil rounded-full. */}
            <p className="inline-block border-l-2 border-lpm-blue-900 pl-3 text-xs font-semibold uppercase tracking-wider text-lpm-blue-900">
              Lembaga Penjaminan Mutu
            </p>

            <h1 className="text-3xl sm:text-4xl font-bold text-slate-950 tracking-normal">
              Masuk ke <span className="text-lpm-blue-900">LPM UNUSU</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-normal">
              Akses instrumen Standar SPMI, bank dokumen mutu, dan audit mutu internal melalui gerbang SSO terpadu.
            </p>
          </div>

          {/* Logo ONE UNUSU — Tetap Hijau UNUSU, Bisa Diklik */}
          <div className="flex flex-col items-center space-y-3">
            <AnimatedFlatSsoLogo
              size={210}
              onClick={handleSsoLogin}
            />
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center space-x-1.5">
                <span className="font-bold text-xl text-slate-950 tracking-normal">ONE</span>
                <span className="font-bold text-xl text-lpm-blue-800 tracking-normal">UNUSU</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Ekosistem Digital Terpadu Kampus
              </p>
              <p className="text-[10px] text-slate-400 font-normal">
                Universitas Nahdlatul Ulama Sumatera Utara
              </p>
            </div>
          </div>

          {/* Penolakan lintas aplikasi dari percobaan login sebelumnya */}
          {deniedNotice && (
            <div
              role="alert"
              className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-left shadow-2xs"
            >
              <div className="flex items-start gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-rose-100 border border-rose-200 text-rose-700 flex items-center justify-center flex-shrink-0">
                  <LockClosedIcon className="w-4 h-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-rose-900">
                    {deniedIsForeignAdmin
                      ? 'Akun ini bukan administrator LPM'
                      : 'Akses panel LPM ditolak'}
                  </p>
                  <p className="mt-1 text-[11px] text-rose-800 leading-relaxed">
                    {deniedIsForeignAdmin ? (
                      <>
                        Akun Anda terdaftar sebagai{' '}
                        <strong className="font-bold">{deniedRoleLabel}</strong>
                        {deniedNotice.app ? (
                          <>
                            {' '}
                            pada <strong className="font-bold">{deniedNotice.app}</strong>
                          </>
                        ) : null}
                        . Peran admin tidak berlaku lintas aplikasi, sehingga panel LPM UNUSU tidak
                        dapat diakses dengan akun tersebut.
                      </>
                    ) : (
                      <>
                        Peran{' '}
                        <strong className="font-bold">{deniedRoleLabel}</strong> tidak termasuk
                        cakupan aplikasi LPM UNUSU. Hubungi Administrator LPM untuk penyesuaian
                        peran.
                      </>
                    )}
                  </p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDeniedNotice(null)}
                      className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 rounded-xl text-[11px] font-semibold text-rose-800 hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-2 transition-colors cursor-pointer"
                      aria-label="Tutup pemberitahuan penolakan akses"
                    >
                      <XMarkIcon className="w-4 h-4" aria-hidden="true" />
                      <span>Tutup</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tombol Masuk — Royal Blue, Teks Saja */}
          <button
            type="button"
            onClick={handleSsoLogin}
            className="w-full flex items-center justify-center space-x-3 py-4 px-6 rounded-2xl bg-lpm-blue-900 hover:bg-lpm-blue-950 text-white font-semibold text-sm shadow-xl hover:shadow-2xl transition-all transform active:scale-98 cursor-pointer group"
            aria-label="Masuk dengan akun ONE UNUSU"
          >
            <span>Masuk dengan ONE UNUSU</span>
            <ArrowRightIcon className="w-4 h-4 text-lpm-yellow-400 group-hover:translate-x-1.5 transition-transform" />
          </button>
        </div>

        {/* Footer */}
        <div className="text-xs text-slate-500 text-center sm:text-left font-normal">
          &copy; {new Date().getFullYear()} LPM UNUSU — Universitas Nahdlatul Ulama Sumatera Utara
        </div>
      </div>

      {/* ===== SISI KANAN: WALLPAPER KAMPUS (OVERLAY BLUE) ===== */}
      <div className="w-full lg:w-1/2 relative flex flex-col justify-end p-8 sm:p-14 lg:p-16 overflow-hidden min-h-[420px] lg:min-h-screen text-white">
        <img
          src={assetUrl("/assets/campus-login.png")}
          alt="Gedung Kampus UNUSU Gaperta Medan"
          className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.82]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-lpm-blue-950/95 via-lpm-blue-950/40 to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-lg space-y-3">
          {/* Eyebrow di panel gelap: bilah tegak putih agar tetap terbaca. */}
          <p className="inline-block border-l-2 border-lpm-yellow-400 pl-3 text-xs font-semibold uppercase tracking-wider text-lpm-yellow-400">
            Siklus Mutu PPEPP &amp; Akreditasi
          </p>

          <h2 className="text-2xl sm:text-4xl font-bold tracking-normal text-white drop-shadow-md leading-tight">
            Penjaminan Mutu Menuju Akreditasi Unggul
          </h2>

          <p className="text-xs sm:text-sm text-slate-200 drop-shadow font-normal leading-relaxed">
            Terhubung langsung dengan ekosistem digital ONE UNUSU untuk mewujudkan tata kelola tridharma perguruan tinggi yang transparan, akuntabel, dan berkelanjutan.
          </p>
        </div>
      </div>
    </div>
  );
}
