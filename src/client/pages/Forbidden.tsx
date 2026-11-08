import React from 'react';
import { Link } from 'react-router-dom';
import { LockClosedIcon, ArrowLeftIcon, HomeIcon } from '@heroicons/react/24/outline';

/**
 * Halaman 403 — pengguna sudah masuk panel tetapi tidak memiliki izin fitur
 * yang dibutuhkan untuk membuka halaman ini.
 *
 * Berbeda dari `AccessDeniedPage` (403 tanpa izin masuk), halaman ini muncul
 * ketika izin masuk sudah ada namun izin sub-menu belum diberikan.
 */
export function ForbiddenPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl bg-white rounded-[14px] border border-[#CBD5E1] shadow-2xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#CBD5E1] bg-[#F8FAFC] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-[10px] bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
              <LockClosedIcon className="w-4 h-4" />
            </span>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-slate-900">Izin Fitur Belum Diberikan</h1>
              <p className="text-xs text-slate-500">Akses sub-menu dibatasi</p>
            </div>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-700">
            403
          </span>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Anda berhasil masuk ke panel LPM, tetapi peran Anda belum memiliki izin untuk membuka
            halaman ini. Izin diberikan per sub-menu oleh Administrator LPM melalui menu{' '}
            <strong>Peran</strong>.
          </p>

          <div className="flex flex-wrap gap-2.5">
            <Link
              to="/admin/dashboard"
              className="inline-flex items-center gap-2 bg-lpm-blue-900 hover:bg-lpm-blue-800 text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition shadow-xs"
            >
              <HomeIcon className="w-4 h-4" />
              Ke Dashboard
            </Link>
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 border border-[#CBD5E1] bg-white hover:bg-slate-50 text-slate-700 font-semibold px-4 py-2.5 rounded-xl text-xs transition"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Kembali
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForbiddenPage;
