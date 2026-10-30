import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ShieldCheckIcon, ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { ssoLogin } from '../services/api';
import { useAuth } from '../context/AuthContext';

type SsoExchangeResult = Awaited<ReturnType<typeof ssoLogin>>;

const exchangeRequests = new Map<string, Promise<SsoExchangeResult>>();

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

        saveSession(response.data.token, response.data.user);

        if (!cancelled) {
          window.location.replace(import.meta.env.BASE_URL);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
            err.message ||
            'Gagal memverifikasi token SSO. Token mungkin sudah kedaluwarsa atau telah digunakan.'
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [params, saveSession]);

  return (
    <div className="min-h-screen bg-[#F1F5F2] flex items-center justify-center px-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-xl border border-slate-200/80 p-8 text-center">
        {error ? (
          <>
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 mb-4 ring-4 ring-rose-100">
              <ExclamationTriangleIcon className="w-7 h-7" />
            </div>
            <h1 className="text-lg font-bold text-slate-900 mb-2">Login SSO Gagal</h1>
            <p className="text-xs text-slate-600 mb-6 leading-relaxed">{error}</p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-800 text-white text-xs font-bold hover:bg-emerald-900 transition-all shadow-xs"
            >
              Kembali ke Halaman Login
            </Link>
          </>
        ) : (
          <>
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-800 mb-4 ring-4 ring-emerald-100">
              <ArrowPathIcon className="w-7 h-7 animate-spin" />
            </div>
            <h1 className="text-lg font-bold text-slate-900 mb-2">Memverifikasi Sesi SSO</h1>
            <p className="text-xs text-slate-600 leading-relaxed">
              Mohon tunggu, sistem sedang memverifikasi tiket autentikasi dari Portal ONE UNUSU...
            </p>
            <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-emerald-800 font-semibold bg-emerald-50/80 py-1.5 px-3 rounded-full border border-emerald-200/60 w-fit mx-auto">
              <ShieldCheckIcon className="w-4 h-4 text-emerald-700" />
              <span>Tiket single-use aman • berlaku 5 menit</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
