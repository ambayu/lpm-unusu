import React from 'react';
import { KeyRound, ArrowRight, ShieldCheck, Award } from 'lucide-react';

const ONE_UNUSU_URL = import.meta.env.VITE_ONE_UNUSU_URL || 'http://localhost:5173';

export function LoginPage() {
  const handleSsoLogin = () => {
    // Autentikasi dipusatkan di ONE UNUSU. Setelah login, pilih aplikasi
    // "LPM UNUSU" dari portal untuk masuk ke sini.
    window.location.href = `${ONE_UNUSU_URL}/login`;
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 mx-auto flex items-center justify-center">
            <Award className="w-8 h-8 text-emerald-700" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">LPM UNUSU</h1>
          <p className="text-xs text-slate-500 font-medium">
            Lembaga Penjaminan Mutu — Standar SPMI, Dokumen Mutu & Audit AMI
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100 text-emerald-800 text-xs flex items-start gap-2">
          <KeyRound className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Aplikasi ini memakai <strong>SSO ONE UNUSU</strong>. Satu akun untuk seluruh
            layanan kampus — tidak ada kata sandi terpisah di sini.
          </span>
        </div>

        <button
          type="button"
          onClick={handleSsoLogin}
          className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
        >
          <span>Masuk via ONE UNUSU</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <div className="flex items-center justify-center gap-2 text-xs text-emerald-700 font-medium">
          <ShieldCheck className="w-4 h-4" />
          Autentikasi terpusat ONE UNUSU
        </div>
      </div>
    </div>
  );
}
