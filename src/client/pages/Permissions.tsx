import React, { useEffect, useState } from 'react';
import {
  KeyIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { CardContainer } from '../components/CardContainer';
import { ErrorState } from '../components/ErrorState';

interface PermissionItem {
  id: string;
  name: string;
  action: string;
  resource: string;
  guard: string;
}

export const PermissionsPage: React.FC = () => {
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('lpm_unusu_token') || localStorage.getItem('lpm_token');
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch('/api/permissions', { credentials: 'include', headers });
      if (!res.ok) throw new Error('Gagal memuat matriks hak akses');
      const json = await res.json();
      if (json.success) {
        setPermissions(json.data);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan saat memuat izin.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const filtered = permissions.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.action.toLowerCase().includes(search.toLowerCase()) ||
      p.resource.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <CardContainer>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-900 border border-blue-200 text-xs font-semibold uppercase tracking-wider mb-2">
              <ShieldCheckIcon className="w-4 h-4 text-amber-500" />
              Kontrol Hak Akses RBAC
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Matriks Izin & Hak Akses LPM
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Daftar izin operasional, aksi sistem, dan guard batas wewenang modul penjaminan mutu.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700">
              Total {permissions.length} Izin Terdaftar
            </span>
          </div>
        </div>
      </CardContainer>

      {/* Filter / Search Bar */}
      <CardContainer>
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama izin, aksi, atau resource..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-800 text-slate-700"
            />
          </div>
          <div className="text-xs text-slate-500">
            Menampilkan <span className="font-semibold text-slate-800">{filtered.length}</span> dari {permissions.length} izin
          </div>
        </div>
      </CardContainer>

      {/* Content Table Card */}
      {loading ? (
        <CardContainer>
          <div className="text-center py-12 text-xs font-semibold text-slate-500">
            Memuat matriks izin hak akses...
          </div>
        </CardContainer>
      ) : error ? (
        <ErrorState description={error} onRetry={fetchPermissions} />
      ) : (
        <CardContainer title="Daftar Hak Akses Sistem (Permissions)">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Nama Izin (Key)</th>
                  <th className="px-5 py-3.5">Aksi (Action)</th>
                  <th className="px-5 py-3.5">Lingkup Resource</th>
                  <th className="px-5 py-3.5">Status Guard</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <KeyIcon className="w-4 h-4 text-blue-800 shrink-0" />
                        <code className="font-mono font-semibold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-[11px]">
                          {p.name}
                        </code>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-semibold px-2.5 py-1 rounded-md text-[11px] bg-slate-100 text-slate-700 border border-slate-200">
                        {p.action}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-800">{p.resource}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600" />
                        {p.guard}
                      </span>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-slate-400">
                      Tidak ada izin yang sesuai dengan pencarian "{search}".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContainer>
      )}
    </div>
  );
};
export default PermissionsPage;
