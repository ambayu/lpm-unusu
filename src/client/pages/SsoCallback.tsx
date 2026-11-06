import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  LockClosedIcon,
  ArrowTopRightOnSquareIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { ssoLogin } from '../services/api';
import type { AppAccessInfo } from '../services/api';
import { useAuth } from '../context/AuthContext';

type SsoExchangeResult = Awaited<ReturnType<typeof ssoLogin>>;

const exchangeRequests = new Map<string, Promise<SsoExchangeResult>>();

const ONE_UNUSU_URL = import.meta.env.VITE_ONE_UNUSU_URL || 'http://localhost:5173';

/** Penanda sesi ditolak karena peran milik aplikasi lain — dibaca halaman Login. */
const DENIED_FLAG_KEY = 'lpm_sso_denied';

function exchangeSsoToken(clientId: string, token: string): Promise<SsoExchangeResult> {
  const key = `${clientId}:${token}`;
  const pending = exchangeRequests.get(key);

  if (pending) {
    return pending;
  }

  const request = ssoLogin(clientId, token);
  exchangeRequests.set(key, request);

  request.catch(() => {
    exchangeRequests.delete(key);
  });

  return request;
}

export function SsoCallbackPage() {
  const [params] = useSearchParams();
  const { saveSession } = useAuth();
  const [error, setError] = useState('');
  const [denial, setDenial] = useState<AppAccessInfo | null>(null);

  useEffect(() => {
    const clientId = params.get('client_id');
    const token = params.get('token');

    if (!clientId || !token) {
      setError('Parameter SSO tidak lengkap. Silakan login ulang dari Portal ONE UNUSU.');
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const response = await exchangeSsoToken(clientId, token);
        if (!response.data?.success) {
          throw new Error(response.data?.message || 'Login SSO gagal');
        }

        saveSession(response.data.token, response.data.user, response.data.appAccess);

        if (!cancelled) {
          // Setelah login sukses SELALU mendarat di dashboard panel, bukan
          // halaman publik. BASE_URL dipertahankan untuk deploy di subfolder.
          const dashboardPath = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/admin`;
          window.location.replace(dashboardPath);
        }
      } catch (err: any) {
        if (cancelled) return;

        const payload = err.response?.data;
        const access: AppAccessInfo | undefined = payload?.appAccess;

        // Token sah di ekosistem, tetapi peran bukan milik aplikasi LPM
        // (mis. ADMIN_LPPM). Tampilkan penolakan terstruktur, bukan error generik.
        if (access && access.allowed === false) {
          setDenial(access);
          try {
            sessionStorage.setItem(
              DENIED_FLAG_KEY,
              JSON.stringify({ ssoRole: access.ssoRole, reason: access.reason, app: access.appName })
            );
          } catch {
            /* sessionStorage dapat diblokir; alur utama tetap berjalan */
          }
          return;
        }

        setError(
          payload?.message ||
            err.message ||
            'Gagal memverifikasi token SSO. Token mungkin sudah kedaluwarsa atau telah digunakan.'
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [params, saveSession]);

  const isForeignAdmin = denial?.reason === 'foreign_app_admin';

  return (
    <div className="min-h-screen bg-[#F1F5F2] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl">
        <div className="bg-white rounded-[14px] border border-[#CBD5E1] shadow-2xs overflow-hidden">
          {/* Header card — pola CardContainer Part 10.8 */}
          <div className="px-5 py-3.5 border-b border-[#CBD5E1] bg-[#F8FAFC] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span
                className={`w-8 h-8 rounded-[10px] border flex items-center justify-center ${
                  denial
                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                    : 'bg-lpm-blue-50 border-lpm-blue-200 text-lpm-blue-800'
                }`}
              >
                {denial ? (
                  <LockClosedIcon className="w-4 h-4" />
                ) : (
                  <ShieldCheckIcon className="w-4 h-4" />
                )}
              </span>
              <div>
                <h1 className="text-sm sm:text-base font-bold text-slate-900">
                  {denial ? 'Akses Panel Ditolak' : error ? 'Login SSO Gagal' : 'Memverifikasi Sesi SSO'}
                </h1>
                <p className="text-xs text-slate-500">
                  {denial ? 'Pemisahan administrator per aplikasi' : 'Portal ONE UNUSU ke LPM UNUSU'}
                </p>
              </div>
            </div>
            {denial && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-[11px] font-bold text-rose-700">
                403
              </span>
            )}
          </div>

          <div className="p-5 sm:p-6 space-y-4">
            {denial ? (
              <>
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-[12px] bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center flex-shrink-0">
                    <ExclamationTriangleIcon className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base font-bold text-slate-900 leading-snug">
                      {isForeignAdmin
                        ? 'Akun Anda adalah administrator aplikasi lain'
                        : 'Peran Anda tidak memiliki akses ke LPM UNUSU'}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-1.5">
                      {denial.message}
                    </p>
                  </div>
                </div>

                <div className="rounded-[12px] border border-[#CBD5E1] bg-[#F8FAFC] divide-y divide-[#E2E8F0]">
                  <div className="px-4 py-3 flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <UserCircleIcon className="w-4 h-4" /> Peran SSO
                    </span>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-[11px] font-bold text-rose-700">
                      {denial.ssoRole || '—'}
                    </span>
                  </div>
                  <div className="px-4 py-3 flex items-center justify-between gap-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Panel Tujuan
                    </span>
                    <span className="text-xs font-semibold text-slate-900">{denial.appName}</span>
                  </div>
                  <div className="px-4 py-3 flex items-center justify-between gap-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Peran Milik
                    </span>
                    <span className="text-xs font-semibold text-slate-900">
                      {denial.foreignApp?.name || 'Aplikasi lain di ekosistem ONE UNUSU'}
                    </span>
                  </div>
                </div>

                <div className="rounded-[12px] border border-lpm-yellow-400 bg-lpm-yellow-400 px-4 py-3">
                  <p className="text-[11px] sm:text-xs text-lpm-yellow-400 leading-relaxed">
                    Satu akun ONE UNUSU boleh memiliki peran di banyak aplikasi, tetapi setiap panel
                    hanya menerima peran miliknya sendiri. Bila Anda memang bertugas di LPM, minta
                    Superadmin ONE UNUSU menambahkan peran <strong>ADMIN_LPM</strong> pada akun Anda.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                  <a
                    href={ONE_UNUSU_URL}
                    className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-[12px] bg-lpm-blue-900 hover:bg-lpm-blue-800 text-white text-xs font-bold shadow-xs transition-colors"
                  >
                    <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                    Buka Portal ONE UNUSU
                  </a>
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-[12px] bg-white border border-[#CBD5E1] hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-colors"
                  >
                    Kembali ke Halaman Login
                  </Link>
                </div>
              </>
            ) : error ? (
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 mb-4 ring-4 ring-rose-100">
                  <ExclamationTriangleIcon className="w-7 h-7" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 mb-2">Login SSO Gagal</h2>
                <p className="text-xs text-slate-600 mb-6 leading-relaxed" role="alert">
                  {error}
                </p>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-lpm-blue-900 text-white text-xs font-bold hover:bg-lpm-blue-800 transition-all shadow-xs"
                >
                  Kembali ke Halaman Login
                </Link>
              </div>
            ) : (
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-lpm-blue-50 text-lpm-blue-800 mb-4 ring-4 ring-lpm-blue-100">
                  <ArrowPathIcon className="w-7 h-7 animate-spin" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 mb-2">Memverifikasi Sesi SSO</h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Mohon tunggu, sistem sedang memverifikasi tiket autentikasi dari Portal ONE
                  UNUSU...
                </p>
                <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-lpm-blue-800 font-semibold bg-lpm-blue-50/80 py-1.5 px-3 rounded-full border border-lpm-blue-200/60 w-fit mx-auto">
                  <ShieldCheckIcon className="w-4 h-4 text-lpm-blue-700" />
                  <span>Tiket single-use aman, berlaku 5 menit</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-500 mt-4">
          LPM UNUSU · Otorisasi berbasis cakupan aplikasi (app-scoped role)
        </p>
      </div>
    </div>
  );
}
