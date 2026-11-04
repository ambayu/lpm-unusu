import React, { useEffect, useState } from 'react';
import {
  KeyIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  ShieldExclamationIcon,
  ArrowPathIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { CardContainer } from '../components/CardContainer';
import { ErrorState } from '../components/ErrorState';
import { fetchAccessDenials } from '../services/api';
import type { AccessDenialItem } from '../services/api';

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

  // Jejak penolakan akses lintas aplikasi (admin LPPM, dll.)
  const [denials, setDenials] = useState<AccessDenialItem[]>([]);
  const [denialTotal, setDenialTotal] = useState(0);
  const [denialForeign, setDenialForeign] = useState(0);
  const [denialLoading, setDenialLoading] = useState(true);
  const [denialError, setDenialError] = useState<string | null>(null);

  const fetchDenials = async () => {
    try {
      setDenialLoading(true);
      setDenialError(null);
      const res = await fetchAccessDenials(10);
      if (res.data?.success) {
        setDenials(res.data.data);
        setDenialTotal(res.data.total);
        setDenialForeign(res.data.summary?.foreignAdmin ?? 0);
      }
    } catch (err: any) {
      setDenialError(
        err.response?.data?.message || 'Gagal memuat jejak penolakan akses lintas aplikasi.'
      );
    } finally {
      setDenialLoading(false);
    }
  };

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
    fetchDenials();
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

      {/* Jejak penolakan akses lintas aplikasi — admin LPPM tidak boleh masuk panel LPM */}
      <CardContainer
        title="Jejak Penolakan Akses Lintas Aplikasi"
        subtitle="Percobaan masuk memakai peran milik aplikasi lain (mis. Administrator LPPM). Hanya Administrator LPM yang dapat melihat catatan ini."
        badge={
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-[11px] font-bold text-rose-700">
            <ShieldExclamationIcon className="w-3.5 h-3.5" />
            {denialTotal} percobaan
          </span>
        }
        actions={
          <button
            onClick={fetchDenials}
            className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-[12px] border border-[#CBD5E1] bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            aria-label="Muat ulang jejak penolakan akses"
          >
            <ArrowPathIcon className={`w-4 h-4 ${denialLoading ? 'animate-spin' : ''}`} />
            Muat Ulang
          </button>
        }
      >
        {denialLoading ? (
          <div className="py-10 text-center text-xs font-semibold text-slate-500">
            Memuat jejak penolakan akses...
          </div>
        ) : denialError ? (
          <ErrorState description={denialError} onRetry={fetchDenials} />
        ) : denials.length === 0 ? (
          <div className="py-10 text-center">
            <div className="w-11 h-11 rounded-[12px] bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto mb-3">
              <ShieldCheckIcon className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-slate-800">
              Belum ada percobaan lintas aplikasi
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Semua sesi yang masuk sejauh ini berasal dari peran milik aplikasi LPM.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-[12px] border border-rose-200 bg-rose-50 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
                  Admin aplikasi lain
                </p>
                <p className="text-2xl font-bold text-rose-800 mt-0.5">{denialForeign}</p>
              </div>
              <div className="rounded-[12px] border border-[#CBD5E1] bg-[#F8FAFC] px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Peran tidak dikenal
                </p>
                <p className="text-2xl font-bold text-slate-800 mt-0.5">{denialTotal - denialForeign}</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[720px]">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Waktu</th>
                    <th className="px-4 py-3">Akun</th>
                    <th className="px-4 py-3">Peran SSO</th>
                    <th className="px-4 py-3">Peran Milik</th>
                    <th className="px-4 py-3">Sumber</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {denials.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-slate-600">
                          <ClockIcon className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(d.at).toLocaleString('id-ID', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{d.nama || d.username || '—'}</div>
                        <div className="text-[11px] text-slate-400">{d.username || '—'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <code className="font-mono text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          {d.ssoRole || '—'}
                        </code>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{d.foreignApp || 'Aplikasi lain'}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {d.source === 'sso_exchange' ? 'Tukar Token SSO' : 'Permintaan API'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-slate-500 mt-3">
              Menampilkan {denials.length} percobaan terakhir dari total {denialTotal}. Catatan
              disimpan di memori server dan terhapus saat layanan dimulai ulang.
            </p>
          </>
        )}
      </CardContainer>
    </div>
  );
};
export default PermissionsPage;
