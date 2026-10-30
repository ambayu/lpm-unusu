import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchAudit, deleteAudit, AuditItem } from '../services/api';
import { AdminPanelTemplate } from '../components/AdminPanelTemplate';
import { CardContainer } from '../components/CardContainer';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import {
  ClipboardDocumentCheckIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  UserIcon,
  BuildingOfficeIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

export const AmiPage: React.FC = () => {
  const [audits, setAudits] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedHasil, setSelectedHasil] = useState('SEMUA');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadData = () => {
    setLoading(true);
    setError(null);
    fetchAudit()
      .then((res) => {
        setAudits(res.data.data);
      })
      .catch((err) => {
        console.error(err);
        setError(err.response?.data?.message || 'Gagal memuat data audit mutu internal.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: number, auditee: string) => {
    if (!window.confirm(`Yakin ingin menghapus temuan audit untuk ${auditee}?`)) return;
    setDeletingId(id);
    try {
      await deleteAudit(id);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus catatan audit AMI');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredAudits = audits.filter((item) => {
    const matchSearch =
      (item.auditee?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (item.auditor?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (item.deskripsi?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (item.standar && item.standar.nama.toLowerCase().includes(search.toLowerCase()));
    const matchHasil = selectedHasil === 'SEMUA' || item.hasil.toUpperCase() === selectedHasil.toUpperCase();
    return matchSearch && matchHasil;
  });

  // KPI calculations
  const totalAudits = audits.length;
  const statTerlampaui = audits.filter((a) => a.hasil === 'TERLAMPAUI').length;
  const statSesuai = audits.filter((a) => a.hasil === 'SESUAI').length;
  const statKts = audits.filter((a) => a.hasil === 'KTS_MAYOR' || a.hasil === 'KTS_MINOR' || a.hasil === 'OBSERVASI').length;

  return (
    <AdminPanelTemplate
      title="Audit Mutu Internal (AMI) & Temuan Lapangan"
      description="Evaluasi kepatuhan butir standar mutu SPMI pada seluruh Program Studi dan Unit Kerja, verifikasi KTS (Ketidaksesuaian), dan penetapan Rekomendasi Tindak Lanjut (RTL)."
      actions={
        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center justify-center p-2.5 h-[42px] w-[42px] rounded-[12px] border border-[#CBD5E1] bg-white text-slate-600 hover:text-blue-900 hover:bg-[#E2EDFB] transition-colors cursor-pointer shadow-2xs"
            title="Segarkan Data"
          >
            <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to="/admin/ami/tambah"
            className="inline-flex items-center justify-center gap-2.5 px-5 py-2.5 h-[42px] rounded-[12px] bg-blue-900 hover:bg-blue-950 text-white text-sm font-bold transition-all shadow-md hover:shadow-lg active:scale-98 cursor-pointer"
          >
            <PlusIcon className="w-5 h-5 text-amber-400" />
            <span>Catat Temuan Audit AMI</span>
          </Link>
        </div>
      }
    >
      {/* 1. KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 sm:p-5 rounded-[14px] border border-[#CBD5E1] shadow-2xs flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Butir Diaudit</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{totalAudits}</p>
          </div>
          <div className="w-12 h-12 rounded-[12px] bg-blue-50 border border-blue-200 text-blue-900 flex items-center justify-center">
            <ClipboardDocumentCheckIcon className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-[14px] border border-[#CBD5E1] shadow-2xs flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-slate-500">Terlampaui (Unggul)</p>
            <p className="mt-1 text-2xl font-bold text-emerald-800">{statTerlampaui}</p>
          </div>
          <div className="w-12 h-12 rounded-[12px] bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center">
            <CheckCircleIcon className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-[14px] border border-[#CBD5E1] shadow-2xs flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-slate-500">Sesuai Target</p>
            <p className="mt-1 text-2xl font-bold text-blue-900">{statSesuai}</p>
          </div>
          <div className="w-12 h-12 rounded-[12px] bg-blue-50 border border-blue-200 text-blue-900 flex items-center justify-center">
            <span className="font-bold text-xs">SESUAI</span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-[14px] border border-[#CBD5E1] shadow-2xs flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-slate-500">Temuan KTS / Observasi</p>
            <p className="mt-1 text-2xl font-bold text-amber-700">{statKts}</p>
          </div>
          <div className="w-12 h-12 rounded-[12px] bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center">
            <ExclamationTriangleIcon className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 2. Filter & Search Toolbar */}
      <CardContainer>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari auditee (prodi), nama auditor, atau uraian temuan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-[#CBD5E1] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 transition-all placeholder:text-slate-400"
            />
          </div>
          <select
            value={selectedHasil}
            onChange={(e) => setSelectedHasil(e.target.value)}
            className="text-xs bg-white border border-[#CBD5E1] rounded-[10px] px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 transition-all font-medium"
          >
            <option value="SEMUA">Semua Status Hasil AMI</option>
            <option value="TERLAMPAUI">Terlampaui (Kaizen)</option>
            <option value="SESUAI">Sesuai Standar</option>
            <option value="OBSERVASI">Observasi</option>
            <option value="KTS_MINOR">KTS Minor</option>
            <option value="KTS_MAYOR">KTS Mayor</option>
          </select>
        </div>
      </CardContainer>

      {/* 3. Audit Items List Container */}
      <CardContainer
        title="Daftar Temuan Lapangan & Evaluasi Mutu"
        subtitle={`Menampilkan ${filteredAudits.length} catatan audit`}
      >
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500 font-medium">Memuat data audit AMI...</div>
        ) : error ? (
          <ErrorState description={error} onRetry={loadData} />
        ) : filteredAudits.length === 0 ? (
          <EmptyState
            title="Belum Ada Catatan Audit AMI"
            description="Tidak ditemukan rekaman evaluasi atau temuan audit internal sesuai kata kunci yang dicari."
            action={
              <button
                onClick={() => {
                  setSearch('');
                  setSelectedHasil('SEMUA');
                }}
                className="text-xs text-blue-900 font-semibold hover:underline"
              >
                Reset Filter
              </button>
            }
          />
        ) : (
          <div className="w-full overflow-x-auto rounded-[12px] border border-[#CBD5E1] shadow-2xs">
            <table className="w-full min-w-[1180px] text-left text-xs table-fixed">
              <thead className="bg-[#EFF6FF] text-blue-900 font-bold border-b border-[#CBD5E1]">
                <tr>
                  <th className="py-3.5 px-4 w-[120px]">HASIL TEMUAN</th>
                  <th className="py-3.5 px-4 w-[210px]">STANDAR MUTU</th>
                  <th className="py-3.5 px-4 w-[160px]">AUDITEE</th>
                  <th className="py-3.5 px-4 w-[150px]">AUDITOR</th>
                  <th className="py-3.5 px-4 w-[240px]">URAIAN & RTL</th>
                  <th className="py-3.5 px-4 w-[160px]">JEJAK ARSIP</th>
                  <th className="py-3.5 px-4 w-[95px] text-center">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredAudits.map((item) => (
                  <tr key={item.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3.5 px-4 align-top font-bold text-xs uppercase text-blue-900">
                      {item.hasil}
                    </td>
                    <td className="py-3.5 px-4 align-top">
                      <span className="font-mono text-[11px] font-bold text-slate-700 block">
                        {item.standar ? item.standar.kode : `STD-#${item.standarId}`}
                      </span>
                      <span className="font-semibold text-slate-900 line-clamp-2 mt-0.5 leading-snug">
                        {item.standar ? item.standar.nama : 'Standar SPMI'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800 align-top leading-snug">
                      {item.auditee}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium align-top leading-snug">
                      {item.auditor}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 align-top space-y-1.5 leading-relaxed font-normal">
                      {item.deskripsi && (
                        <p className="line-clamp-2" title={item.deskripsi}>
                          {item.deskripsi}
                        </p>
                      )}
                      {item.rekomendasi && (
                        <div className="text-[11px] text-blue-900 font-medium line-clamp-2 border-l-2 border-blue-400 pl-2 mt-1">
                          RTL: {item.rekomendasi}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 align-top text-[11px] text-slate-500 space-y-1">
                      <div className="truncate">
                        <span className="text-slate-400">Oleh: </span>
                        <strong className="text-slate-700 font-semibold">{item.author || 'Admin LPM'}</strong>
                      </div>
                      {item.createdAt && (
                        <div className="text-[10.5px] text-slate-400 font-mono">
                          Dibuat: {new Date(item.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                      )}
                      {item.updatedAt && (
                        <div className="text-[10.5px] text-blue-800/80 font-mono">
                          Update: {new Date(item.updatedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center align-top">
                      <div className="inline-flex items-center gap-2">
                        <Link
                          to={`/admin/ami/edit/${item.id}`}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-[8px] bg-blue-50 text-blue-900 hover:bg-blue-900 hover:text-white border border-blue-200 transition-all shadow-2xs"
                          title="Edit Catatan AMI"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(item.id, item.auditee)}
                          disabled={deletingId === item.id}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-[8px] bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white border border-rose-200 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                          title="Hapus Catatan AMI"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContainer>
    </AdminPanelTemplate>
  );
};
