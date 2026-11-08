import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldExclamationIcon,
  ShieldCheckIcon,
  ArrowRightOnRectangleIcon,
  ArrowTopRightOnSquareIcon,
  HomeIcon,
  UserCircleIcon,
  LockClosedIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';

const ONE_UNUSU_URL = import.meta.env.VITE_ONE_UNUSU_URL || 'http://localhost:5173';

/**
 * Halaman penolakan akses lintas aplikasi.
 * Muncul ketika peran SSO pengguna sah di ekosistem ONE UNUSU tetapi BUKAN milik
 * aplikasi LPM (contoh: ADMIN_LPPM). Keputusan tetap berasal dari server.
 */
export function AccessDeniedPage() {
  const { user, appAccess, logout } = useAuth();
  const navigate = useNavigate();

  const isForeignAdmin = appAccess?.reason === 'foreign_app_admin';
  const ssoRoleLabel = appAccess?.ssoRoleLabel || appAccess?.ssoRole || '';
  const alreadyAllowed = !!appAccess?.allowed;

  const handleSwitchAccount = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#F1F5F2] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl">
        {/* Card Container standar (Part 10.8) */}
        <div className="bg-white rounded-[14px] border border-[#CBD5E1] shadow-2xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#CBD5E1] bg-[#F8FAFC] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-[10px] bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center">
                <LockClosedIcon className="w-4 h-4" />
              </span>
              <div>
                <h1 className="text-sm sm:text-base font-bold text-slate-900">Akses Panel Ditolak</h1>
                <p className="text-xs text-slate-500">Pemisahan administrator per aplikasi</p>
              </div>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-[11px] font-bold text-rose-700">
              <ShieldExclamationIcon className="w-3.5 h-3.5" />
              403
            </span>
          </div>

          <div className="p-5 sm:p-6 space-y-5">
            <div className="flex items-start gap-3">
              <div
                className={`w-11 h-11 rounded-[12px] border flex items-center justify-center flex-shrink-0 ${
                  alreadyAllowed
                    ? 'bg-lpm-blue-50 border-lpm-blue-200 text-lpm-blue-700'
                    : 'bg-rose-50 border-rose-200 text-rose-600'
                }`}
              >
                {alreadyAllowed ? (
                  <ShieldCheckIcon className="w-6 h-6" />
                ) : (
                  <ShieldExclamationIcon className="w-6 h-6" />
                )}
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-slate-900 leading-snug">
                  {alreadyAllowed
                    ? 'Akun Anda sudah memiliki akses panel LPM'
                    : isForeignAdmin
                    ? 'Akun Anda adalah administrator aplikasi lain'
                    : 'Peran Anda tidak memiliki akses ke LPM UNUSU'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-1.5">
                  {alreadyAllowed
                    ? 'Tidak ada pembatasan pada sesi Anda saat ini. Silakan lanjutkan ke dashboard panel penjaminan mutu.'
                    : appAccess?.message ||
                      'Panel LPM UNUSU hanya dapat diakses Administrator LPM, Superadmin ekosistem, dan Dosen/Auditor Mutu.'}
                </p>
              </div>
            </div>

            {/* Ringkasan identitas & peran */}
            <div className="rounded-[12px] border border-[#CBD5E1] bg-[#F8FAFC] divide-y divide-[#E2E8F0]">
              <div className="px-4 py-3 flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <UserCircleIcon className="w-4 h-4" /> Akun
                </span>
                <span className="text-xs font-semibold text-slate-900 truncate text-right">
                  {user?.nama || user?.username || 'Tidak diketahui'}
                  {user?.email ? <span className="text-slate-500 font-normal"> · {user.email}</span> : null}
                </span>
              </div>
              <div className="px-4 py-3 flex items-center justify-between gap-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Peran SSO</span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-[11px] font-bold text-rose-700">
                  {appAccess?.ssoRole || user?.ssoRole || '—'}
                </span>
              </div>
              <div className="px-4 py-3 flex items-center justify-between gap-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Cakupan Aplikasi</span>
                <span className="text-xs font-semibold text-slate-900">
                  {appAccess?.appName || 'LPM UNUSU'}
                  {ssoRoleLabel ? <span className="text-slate-500 font-normal"> (peran {ssoRoleLabel})</span> : null}
                </span>
              </div>
            </div>

            <div className="rounded-[12px] border border-lpm-yellow-400 bg-lpm-yellow-400 px-4 py-3">
              <p className="text-[11px] sm:text-xs text-lpm-yellow-400 leading-relaxed">
                <strong>Kenapa ini terjadi?</strong> Satu akun ONE UNUSU dapat memiliki peran pada banyak
                aplikasi, tetapi setiap panel hanya menerima peran miliknya sendiri. Administrator LPPM tidak
                dapat membuka panel LPM — begitu pula sebaliknya. Bila Anda memang ditugaskan di LPM, minta
                Superadmin ONE UNUSU menambahkan peran <strong>ADMIN_LPM</strong> pada akun Anda.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              {alreadyAllowed && (
                <Link
                  to="/admin/dashboard"
                  className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-[12px] bg-lpm-blue-700 hover:bg-lpm-blue-800 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  <Squares2X2Icon className="w-4 h-4" />
                  Lanjut ke Dashboard LPM
                </Link>
              )}
              <button
                onClick={handleSwitchAccount}
                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-[12px] bg-lpm-blue-900 hover:bg-lpm-blue-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
                Keluar &amp; Ganti Akun
              </button>
              <a
                href={ONE_UNUSU_URL}
                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-[12px] bg-white border border-[#CBD5E1] hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-colors"
              >
                <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                Buka Portal ONE UNUSU
              </a>
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-[12px] bg-white border border-[#CBD5E1] hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-colors"
              >
                <HomeIcon className="w-4 h-4" />
                Beranda LPM
              </Link>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-500 mt-4">
          LPM UNUSU · Otorisasi berbasis cakupan aplikasi (app-scoped role)
        </p>
      </div>
    </div>
  );
}

export default AccessDeniedPage;
