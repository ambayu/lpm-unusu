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
import { DataTable } from '../components/DataTable';
import { ErrorState } from '../components/ErrorState';
import { fetchAccessDenials, fetchRbacIzin } from '../services/api';
import type { AccessDenialItem, RbacIzin } from '../services/api';

export const PermissionsPage: React.FC = () => {
  const [permissions, setPermissions] = useState<RbacIzin[]>([]);
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

  const filtered = permissions.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.nama.toLowerCase().includes(q) ||
      p.kunci.toLowerCase().includes(q) ||
      (p.grup || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <CardContainer>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lpm-blue-50 text-lpm-blue-900 border border-lpm-blue-200 text-xs font-semibold uppercase tracking-wider mb-2">
              <ShieldCheckIcon className="w-4 h-4 text-lpm-yellow-400" />
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
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-lpm-blue-800 text-slate-700"
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
          <DataTable
            minTableWidth="min-w-[760px]"
            columns={[
              {
                key: 'kunci',
                header: 'Kunci Izin',
                render: (p) => (
                  <div className="flex items-center gap-2">
                    <KeyIcon className="w-4 h-4 text-lpm-blue-800 shrink-0" aria-hidden="true" />
                    <code className="font-mono font-semibold text-lpm-blue-900 bg-lpm-blue-50 px-2 py-0.5 rounded border border-lpm-blue-200">
                      {p.kunci}
                    </code>
                  </div>
                ),
              },
              {
                key: 'nama',
                header: 'Nama Izin',
                cellClassName: 'font-medium text-slate-800',
                render: (p) => p.nama,
              },
              {
                key: 'grup',
                header: 'Grup',
                headerClassName: 'w-48',
                render: (p) => (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold bg-lpm-blue-50 text-lpm-blue-800 border border-lpm-blue-200">
                    <CheckCircleIcon className="w-3.5 h-3.5 text-lpm-blue-700" aria-hidden="true" />
                    {p.grup}
                  </span>
                ),
              },
            ]}
            rows={filtered}
            rowKey={(p) => p.kunci}
            emptyMessage={`Tidak ada izin yang sesuai dengan pencarian "${search}".`}
          />
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
            <div className="w-11 h-11 rounded-[12px] bg-lpm-blue-50 border border-lpm-blue-200 text-lpm-blue-700 flex items-center justify-center mx-auto mb-3">
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

            <DataTable
              minTableWidth="min-w-[900px]"
              columns={[
                {
                  key: 'at',
                  header: 'Waktu',
                  cellClassName: 'whitespace-nowrap text-slate-600',
                  render: (d) => (
                    <span className="inline-flex items-center gap-1.5">
                      <ClockIcon className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                      {new Date(d.at).toLocaleString('id-ID', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </span>
                  ),
                },
                {
                  key: 'akun',
                  header: 'Akun',
                  render: (d) => (
                    <span className="font-semibold text-slate-900">
                      {d.nama || d.username || '-'}
                    </span>
                  ),
                },
                {
                  key: 'username',
                  header: 'Username',
                  headerClassName: 'w-44',
                  cellClassName: 'font-mono',
                  render: (d) => d.username || '-',
                },
                {
                  key: 'ssoRole',
                  header: 'Peran SSO',
                  render: (d) => (
                    <code className="font-mono font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      {d.ssoRole || '-'}
                    </code>
                  ),
                },
                {
                  key: 'foreignApp',
                  header: 'Aplikasi Pemilik',
                  cellClassName: 'text-slate-700',
                  render: (d) => d.foreignApp || 'Aplikasi lain',
                },
                {
                  key: 'source',
                  header: 'Sumber',
                  headerClassName: 'w-44',
                  render: (d) => (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {d.source === 'sso_exchange' ? 'Tukar Token SSO' : 'Permintaan API'}
                    </span>
                  ),
                },
              ]}
              rows={denials}
              rowKey={(d) => d.id}
            />
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
