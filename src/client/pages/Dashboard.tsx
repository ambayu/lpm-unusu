import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AcademicCapIcon,
  BookOpenIcon,
  ClipboardDocumentCheckIcon,
  UsersIcon,
  ShieldCheckIcon,
  KeyIcon,
  ArrowRightIcon,
  PlusIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import { CardContainer } from '../components/CardContainer';
import { ErrorState } from '../components/ErrorState';
import { useAuth } from '../context/AuthContext';

interface StatsOverview {
  totalStandar: number;
  totalDokumen: number;
  totalAudit: number;
  totalUsers: number;
  totalRoles: number;
  totalPermissions: number;
  auditMayor: number;
  auditMinor: number;
  auditSesuai: number;
}

export const DashboardPage: React.FC = () => {
  const { user, roleLabel } = useAuth();
  const [stats, setStats] = useState<StatsOverview>({
    totalStandar: 0,
    totalDokumen: 0,
    totalAudit: 0,
    totalUsers: 0,
    totalRoles: 0,
    totalPermissions: 0,
    auditMayor: 0,
    auditMinor: 0,
    auditSesuai: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentAudits, setRecentAudits] = useState<any[]>([]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('lpm_unusu_token') || localStorage.getItem('lpm_token');
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch('/api/dashboard/stats', { credentials: 'include', headers });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setStats(json.data.stats);
          setRecentAudits(json.data.recentAudits || []);
        }
      } else {
        throw new Error('Gagal memuat statistik dashboard LPM.');
      }
    } catch (err: any) {
      console.error('Failed to load dashboard data', err);
      setError(err.message || 'Terjadi kesalahan saat memuat data dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-semibold uppercase tracking-wider mb-2">
            <ShieldCheckIcon className="w-4 h-4 text-amber-400" />
            Portal Ekosistem LPM UNUSU
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Selamat Datang, {user?.nama || 'Pengguna LPM'}!
          </h1>
          <p className="text-blue-200 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            Sistem Informasi Penjaminan Mutu Internal (SPMI) dan Pengendalian Audit Mutu Internal (AMI) Universitas Nahdlatul Ulama Sumatera Utara.
          </p>
          {/* Cakupan akses aplikasi — memperjelas pemisahan admin per aplikasi */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-semibold text-white">
              <LockClosedIcon className="w-3.5 h-3.5 text-amber-300" />
              {roleLabel}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-400/15 border border-emerald-300/30 text-[11px] font-semibold text-emerald-100">
              Akses panel: LPM UNUSU
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Link
            to="/admin/standar/tambah"
            className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs transition shadow-sm"
          >
            <PlusIcon className="w-4 h-4" />
            Tambah Standar
          </Link>
          <Link
            to="/admin/ami/tambah"
            className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white font-semibold px-4 py-2.5 rounded-xl text-xs border border-white/20 transition"
          >
            <ClipboardDocumentCheckIcon className="w-4 h-4" />
            Catat Temuan AMI
          </Link>
        </div>
      </div>

      {/* Grid Kartu Metrik Tata Kelola */}
      {error ? (
        <ErrorState description={error} onRetry={fetchDashboard} />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Standar SPMI */}
            <div className="bg-white rounded-[14px] border border-[#CBD5E1] p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Standar SPMI</span>
                <div className="w-8 h-8 rounded-[10px] bg-blue-50 text-blue-800 flex items-center justify-center">
                  <AcademicCapIcon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2">{loading ? '...' : stats.totalStandar}</p>
              <Link to="/admin/standar" className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1 mt-2">
                Kelola Butir <ArrowRightIcon className="w-3 h-3" />
              </Link>
            </div>

            {/* Dokumen Mutu */}
            <div className="bg-white rounded-[14px] border border-[#CBD5E1] p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Dokumen Mutu</span>
                <div className="w-8 h-8 rounded-[10px] bg-emerald-50 text-emerald-800 flex items-center justify-center">
                  <BookOpenIcon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2">{loading ? '...' : stats.totalDokumen}</p>
              <Link to="/admin/dokumen" className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1 mt-2">
                Buku & SOP <ArrowRightIcon className="w-3 h-3" />
              </Link>
            </div>

            {/* Temuan AMI */}
            <div className="bg-white rounded-[14px] border border-[#CBD5E1] p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Audit Temuan</span>
                <div className="w-8 h-8 rounded-[10px] bg-indigo-50 text-indigo-800 flex items-center justify-center">
                  <ClipboardDocumentCheckIcon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2">{loading ? '...' : stats.totalAudit}</p>
              <Link to="/admin/ami" className="text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 inline-flex items-center gap-1 mt-2">
                Evaluasi Mutu <ArrowRightIcon className="w-3 h-3" />
              </Link>
            </div>

            {/* Pengguna */}
            <div className="bg-white rounded-[14px] border border-[#CBD5E1] p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Pengguna</span>
                <div className="w-8 h-8 rounded-[10px] bg-purple-50 text-purple-800 flex items-center justify-center">
                  <UsersIcon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2">{loading ? '...' : stats.totalUsers}</p>
              <Link to="/admin/pengguna" className="text-[11px] font-semibold text-purple-700 hover:text-purple-900 inline-flex items-center gap-1 mt-2">
                Kelola User <ArrowRightIcon className="w-3 h-3" />
              </Link>
            </div>

            {/* Peran / Roles */}
            <div className="bg-white rounded-[14px] border border-[#CBD5E1] p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Peran</span>
                <div className="w-8 h-8 rounded-[10px] bg-amber-50 text-amber-800 flex items-center justify-center">
                  <ShieldCheckIcon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2">{loading ? '...' : stats.totalRoles}</p>
              <Link to="/admin/peran" className="text-[11px] font-semibold text-amber-700 hover:text-amber-900 inline-flex items-center gap-1 mt-2">
                Struktur Peran <ArrowRightIcon className="w-3 h-3" />
              </Link>
            </div>

            {/* Hak Izin */}
            <div className="bg-white rounded-[14px] border border-[#CBD5E1] p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Izin</span>
                <div className="w-8 h-8 rounded-[10px] bg-rose-50 text-rose-800 flex items-center justify-center">
                  <KeyIcon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2">{loading ? '...' : stats.totalPermissions}</p>
              <Link to="/admin/izin" className="text-[11px] font-semibold text-rose-700 hover:text-rose-900 inline-flex items-center gap-1 mt-2">
                Matriks Izin <ArrowRightIcon className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Ringkasan Status Evaluasi & Temuan Audit */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Kolom Kiri: Status Kepatuhan AMI */}
            <CardContainer title="Sebaran Hasil Audit Mutu" subtitle="Proporsi kepatuhan butir standar terhadap temuan KTS">
              <div className="space-y-3.5">
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="flex items-center gap-1.5 text-emerald-700">
                      <CheckCircleIcon className="w-4 h-4" /> Sesuai Standar
                    </span>
                    <span className="font-bold text-slate-800">{stats.auditSesuai} Butir</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${stats.totalAudit ? (stats.auditSesuai / stats.totalAudit) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="flex items-center gap-1.5 text-amber-700">
                      <ExclamationTriangleIcon className="w-4 h-4" /> Temuan Minor (KTS Minor)
                    </span>
                    <span className="font-bold text-slate-800">{stats.auditMinor} Butir</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${stats.totalAudit ? (stats.auditMinor / stats.totalAudit) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="flex items-center gap-1.5 text-rose-700">
                      <ExclamationTriangleIcon className="w-4 h-4" /> Temuan Mayor (KTS Mayor)
                    </span>
                    <span className="font-bold text-slate-800">{stats.auditMayor} Butir</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-rose-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${stats.totalAudit ? (stats.auditMayor / stats.totalAudit) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 bg-slate-50 -mx-5 -mb-5 p-4">
                <div className="text-[11px] text-slate-500 leading-relaxed">
                  Catatan: Status audit dihitung dari siklus AMI aktif. Evaluasi dan Rekomendasi perbaikan wajib diselesaikan sesuai timeline PPEPP.
                </div>
              </div>
            </CardContainer>

            {/* Kolom Kanan: Temuan Audit Terkini */}
            <div className="lg:col-span-2">
              <CardContainer
                title="Catatan Temuan Audit Terakhir"
                subtitle="Butir evaluasi terbaru yang dilaporkan oleh tim auditor LPM"
                actions={
                  <Link to="/admin/ami" className="text-xs font-semibold text-blue-700 hover:text-blue-900">
                    Lihat Semua Temuan &rarr;
                  </Link>
                }
              >
                {loading ? (
                  <div className="text-center py-8 text-xs text-slate-400">Memuat catatan audit...</div>
                ) : recentAudits.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">Belum ada temuan audit tercatat.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-slate-400 border-b border-slate-100">
                          <th className="pb-2 font-semibold">Auditee (Unit)</th>
                          <th className="pb-2 font-semibold">Standar</th>
                          <th className="pb-2 font-semibold">Hasil</th>
                          <th className="pb-2 font-semibold">Auditor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {recentAudits.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 font-medium text-slate-800 pr-3">{item.auditee}</td>
                            <td className="py-2.5 text-slate-600 pr-3">{item.standar?.nama || item.standar?.kode || '-'}</td>
                            <td className="py-2.5 pr-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  item.hasil === 'Sesuai'
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : item.hasil === 'Temuan Mayor'
                                    ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                                }`}
                              >
                                {item.hasil}
                              </span>
                            </td>
                            <td className="py-2.5 text-slate-500">{item.auditor}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
