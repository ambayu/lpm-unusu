import React from 'react';
import { Link } from 'react-router-dom';
import { MagnifyingGlassIcon, HomeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

/**
 * Halaman 404 — alamat yang dibuka tidak dikenal.
 *
 * Ditampilkan oleh catch-all `path="*"`. Sebelumnya catch-all mengalihkan ke
 * beranda sehingga pengguna tidak pernah tahu alamatnya salah.
 */
export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#F1F5F2] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl bg-white rounded-[14px] border border-[#CBD5E1] shadow-2xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#CBD5E1] bg-[#F8FAFC] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-[10px] bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center">
              <MagnifyingGlassIcon className="w-4 h-4" />
            </span>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-slate-900">Halaman Tidak Ditemukan</h1>
              <p className="text-xs text-slate-500">Alamat yang Anda buka tidak tersedia</p>
            </div>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-600">
            404
          </span>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Halaman mungkin sudah dipindahkan, tautannya salah ketik, atau memang tidak pernah ada di
            panel LPM UNUSU.
          </p>

          <div className="flex flex-wrap gap-2.5">
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-lpm-blue-900 hover:bg-lpm-blue-800 text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition shadow-xs"
            >
              <HomeIcon className="w-4 h-4" />
              Ke Beranda
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

export default NotFoundPage;
