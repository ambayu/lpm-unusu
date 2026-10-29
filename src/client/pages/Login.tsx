import React from 'react';
import { ArrowRight, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { OneUnusuMark } from '../components/OneUnusuMark';

const ONE_UNUSU_URL = import.meta.env.VITE_ONE_UNUSU_URL || 'http://localhost:5173';
const SSO_CLIENT_ID = import.meta.env.VITE_SSO_CLIENT_ID || 'lpm-unusu';

export function LoginPage() {
  const handleSsoLogin = () => {
    // Autentikasi dipusatkan di ONE UNUSU. Halaman otorisasi portal menerbitkan
    // tiket lalu mengembalikan pengguna ke aplikasi ini.
    const target = `${ONE_UNUSU_URL}/sso/authorize?client_id=${encodeURIComponent(SSO_CLIENT_ID)}`;
    window.location.href = target;
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl">

        <div className="text-center space-y-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">LPM UNUSU</h1>
          <p className="text-xs text-slate-500 font-medium">
            Lembaga Penjaminan Mutu — Standar SPMI, Dokumen Mutu & Audit AMI
          </p>
        </div>

        <div className="flex flex-col items-center text-center py-10">
          <OneUnusuMark size={132} />
          <p className="mt-7 text-sm text-slate-600 font-medium">
            Masuk cepat dengan akun ONE UNUSU Anda
          </p>
          <a
            href={`${ONE_UNUSU_URL}/login`}
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline transition-colors"
          >
            Kembali ke halaman SSO ONE UNUSU
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>

        <button
          type="button"
          onClick={handleSsoLogin}
          className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
        >
          <span>Masuk via ONE UNUSU</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-emerald-700 font-medium">
          <ShieldCheck className="w-4 h-4" />
          Autentikasi terpusat ONE UNUSU
        </div>

      </div>
    </div>
  );
}
