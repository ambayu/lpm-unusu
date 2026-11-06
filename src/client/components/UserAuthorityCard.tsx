import React from 'react';
import {
  UserCircleIcon,
  ShieldCheckIcon,
  BuildingOffice2Icon,
  CheckBadgeIcon,
} from '@heroicons/react/24/outline';

export interface AuthorityCardUser {
  nama?: string | null;
  username?: string | null;
  role?: string | null;
  roleLabel?: string | null;
  email?: string | null;
  prodi?: string | null;
  fakultas?: string | null;
  unitKerja?: string | null;
  statusAkun?: string | null;
}

interface UserAuthorityCardProps {
  user: AuthorityCardUser | null;
  /** Label hak akses terpetakan (mis. "Auditor Mutu Internal"). */
  roleLabel?: string;
  className?: string;
}

/**
 * UserAuthorityCard — kartu otoritas pengguna standar panel LPM UNUSU.
 *
 * Menampilkan USERNAME, HAK AKSES, UNIT KERJA, dan STATUS AKUN secara seragam
 * dengan aplikasi cabang UNUSU lain. Unit kerja diambil berurutan dari
 * `unitKerja` → `prodi` → `fakultas`.
 */
export const UserAuthorityCard: React.FC<UserAuthorityCardProps> = ({
  user,
  roleLabel,
  className = '',
}) => {
  const unitKerja =
    user?.unitKerja?.trim() || user?.prodi?.trim() || user?.fakultas?.trim() || 'Belum terhubung unit';

  const hakAkses = (roleLabel || user?.roleLabel || user?.role || 'Pengguna').toString();
  const isActive = (user?.statusAkun || 'Aktif').toLowerCase() !== 'nonaktif';

  const rows: { label: string; value: string; icon: React.ElementType; accent: boolean }[] = [
    { label: 'USERNAME', value: user?.username ? `@${user.username}` : '—', icon: UserCircleIcon, accent: false },
    { label: 'HAK AKSES', value: hakAkses, icon: ShieldCheckIcon, accent: false },
    { label: 'UNIT KERJA', value: unitKerja, icon: BuildingOffice2Icon, accent: false },
    { label: 'STATUS AKUN', value: isActive ? 'Aktif' : 'Nonaktif', icon: CheckBadgeIcon, accent: true },
  ];

  return (
    <div className={`bg-white border border-lpm-blue-200 rounded-[16px] overflow-hidden ${className}`}>
      <div className="flex items-center gap-3 px-5 py-4 border-b border-lpm-blue-200">
        <div className="w-10 h-10 rounded-[10px] bg-lpm-blue-50 text-lpm-blue flex items-center justify-center shrink-0">
          <UserCircleIcon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-slate-900 truncate">{user?.nama || 'Pengguna'}</h2>
          <p className="text-[11px] text-slate-500 truncate">{user?.email || 'Email belum terdaftar'}</p>
        </div>
      </div>

      <dl className="grid grid-cols-1 sm:grid-cols-2">
        {rows.map((row) => {
          const Icon = row.icon;
          return (
            <div key={row.label} className="flex items-start gap-3 px-5 py-3.5 border-b border-lpm-blue-200 last:border-b-0">
              <div
                className={`w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0 ${
                  row.accent ? 'bg-lpm-blue-100 text-lpm-blue' : 'bg-slate-100 text-slate-600'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{row.label}</dt>
                <dd className="text-xs font-semibold text-slate-800 truncate mt-0.5" title={row.value}>
                  {row.accent ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-lpm-blue-700' : 'bg-slate-400'}`}
                        aria-hidden="true"
                      />
                      {row.value}
                    </span>
                  ) : (
                    row.value
                  )}
                </dd>
              </div>
            </div>
          );
        })}
      </dl>
    </div>
  );
};
