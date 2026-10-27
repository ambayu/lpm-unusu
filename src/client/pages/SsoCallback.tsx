import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Loader2, ShieldAlert, ShieldCheck } from 'lucide-react';
import { ssoLogin } from '../services/api';
import { useAuth } from '../context/AuthContext';

/**
 * Callback SSO ONE UNUSU.
 * URL: /sso/callback?client_id=..&token=..
 * Token diverifikasi backend aplikasi ini (server-to-server).
 */
export function SsoCallbackPage() {
  const [params] = useSearchParams();
  const { saveSession } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const clientId = params.get('client_id');
    const token = params.get('token');

    if (!clientId || !token) {
      setError('Parameter SSO tidak lengkap. Silakan login ulang dari ONE UNUSU.');
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const response = await ssoLogin(clientId, token);
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
            'Gagal memverifikasi token SSO. Token mungkin sudah kedaluwarsa.'
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [params, saveSession]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 text-center">
        {error ? (
          <>
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 mb-4">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h1 className="text-lg font-bold text-slate-900 mb-2">Login SSO Gagal</h1>
            <p className="text-sm text-slate-600 mb-6">{error}</p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-700 text-white text-sm font-bold hover:bg-emerald-800 transition-all"
            >
              Kembali ke Halaman Login
            </Link>
          </>
        ) : (
          <>
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 mb-4">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
            <h1 className="text-lg font-bold text-slate-900 mb-2">Memverifikasi Sesi SSO</h1>
            <p className="text-sm text-slate-600">
              Mohon tunggu, Malin sedang menghubungkan akun ONE UNUSU Sanak...
            </p>
            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-emerald-700 font-medium">
              <ShieldCheck className="w-4 h-4" />
              Token sekali pakai • berlaku 5 menit
            </div>
          </>
        )}
      </div>
    </div>
  );
}
