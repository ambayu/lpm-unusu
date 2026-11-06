import React from 'react';
import {
  UserCircleIcon,
  EnvelopeIcon,
  IdentificationIcon,
  BuildingOffice2Icon,
  AcademicCapIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { CardContainer } from '../components/CardContainer';

/**
 * Halaman Profil Pengguna LPM UNUSU.
 * Menampilkan data biodata pengguna aktif yang tersinkronisasi dari ONE UNUSU SSO.
 */
export const ProfilPage: React.FC = () => {
  const { user, roleLabel } = useAuth();

  const nama = user?.nama || 'Pengguna';
  const initial = (nama || '?').trim().charAt(0).toUpperCase();

  const rows = [
    { label: 'Nama Lengkap', value: nama, icon: UserCircleIcon },
    { label: 'Username', value: user?.username || '—', icon: IdentificationIcon },
    { label: 'Email', value: user?.email || '—', icon: EnvelopeIcon },
    { label: 'Peran & Akses', value: roleLabel || user?.role || '—', icon: ShieldCheckIcon },
    { label: 'NIM / NIDN', value: user?.nidn || user?.nim || '—', icon: IdentificationIcon },
    { label: 'Program Studi', value: user?.prodi || '—', icon: AcademicCapIcon },
    { label: 'Fakultas / Unit', value: user?.fakultas || 'LPM UNUSU', icon: BuildingOffice2Icon },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 sm:p-6 bg-white border border-[#CBD5E1] rounded-[16px] shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-normal text-slate-900">
              Profil Pengguna
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-900 border border-blue-200 uppercase tracking-wider">
              Akun Saya
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-2xl">
            Biodata pengguna yang sedang aktif di Lembaga Penjaminan Mutu (LPM) UNUSU. Data tersinkronisasi dari portal pusat ONE UNUSU.
          </p>
        </div>
      </div>

      <CardContainer>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 rounded-[14px] border border-[#CBD5E1] bg-slate-50/60">
            <div className="w-16 h-16 shrink-0 rounded-full overflow-hidden bg-blue-900 text-white flex items-center justify-center text-2xl font-bold border border-blue-800 ring-2 ring-blue-100">
              {initial}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-slate-900 truncate">{nama}</h2>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {user?.email || 'lpm@unusu.ac.id'} &middot; {roleLabel}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[10px] font-bold bg-blue-50 text-blue-900 border border-blue-200 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                  Sesi LPM Aktif
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-[14px] border border-[#CBD5E1] overflow-hidden">
            <div className="px-5 py-3 border-b border-[#CBD5E1] bg-slate-50/80">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Informasi Detail Akun
              </h3>
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-[#CBD5E1]">
              {rows.map((row) => {
                const Icon = row.icon;
                return (
                  <div key={row.label} className="bg-white p-4 flex items-start gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-[8px] bg-blue-50 text-blue-900 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <dt className="text-[11px] uppercase tracking-wider font-bold text-slate-500">
                        {row.label}
                      </dt>
                      <dd className="text-sm font-semibold text-slate-900 break-words mt-0.5">
                        {row.value}
                      </dd>
                    </div>
                  </div>
                );
              })}
            </dl>
          </div>
        </div>
      </CardContainer>
    </div>
  );
};

export default ProfilPage;
