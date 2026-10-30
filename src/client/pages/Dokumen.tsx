import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchDokumenMutu, deleteDokumenMutu, DokumenMutuItem } from '../services/api';
import { AdminPanelTemplate } from '../components/AdminPanelTemplate';
import { CardContainer } from '../components/CardContainer';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import {
  BookOpenIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

export const DokumenPage: React.FC = () => {
  const [docs, setDocs] = useState<DokumenMutuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedJenis, setSelectedJenis] = useState('SEMUA');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadData = () => {
    setLoading(true);
    setError(null);
    fetchDokumenMutu()
      .then((res) => {
        setDocs(res.data.data);
      })
      .catch((err) => {
        console.error(err);
        setError(err.response?.data?.message || 'Gagal memuat data dokumen mutu.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: number, kode: string) => {
    if (!window.confirm(`Yakin ingin menghapus dokumen mutu ${kode}?`)) return;
    setDeletingId(id);
    try {
      await deleteDokumenMutu(id);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus dokumen mutu');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredDocs = docs.filter((d) => {
    const matchSearch =
      d.kodeDokumen.toLowerCase().includes(search.toLowerCase()) ||
      d.judul.toLowerCase().includes(search.toLowerCase());
    const matchJenis = selectedJenis === 'SEMUA' || d.jenis.toLowerCase() === selectedJenis.toLowerCase();
    return matchSearch && matchJenis;
  });

  // KPI calculations
  const totalDocs = docs.length;
  const countKebijakan = docs.filter((d) => d.jenis.toLowerCase() === 'kebijakan').length;
  const countManual = docs.filter((d) => d.jenis.toLowerCase() === 'manual').length;
  const countSop = docs.filter((d) => d.jenis.toLowerCase() === 'sop').length;

  return (
    <AdminPanelTemplate
      title="Bank Dokumen Mutu & SOP"
      description="Repositori resmi instrumen mutu SPMI: Buku Kebijakan Mutu, Manual Mutu PPEPP, Standar SPMI, serta Standar Operasional Prosedur (SOP)."
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
            to="/admin/dokumen/tambah"
            className="inline-flex items-center justify-center gap-2.5 px-5 py-2.5 h-[42px] rounded-[12px] bg-blue-900 hover:bg-blue-950 text-white text-sm font-bold transition-all shadow-md hover:shadow-lg active:scale-98 cursor-pointer"
          >
            <PlusIcon className="w-5 h-5 text-amber-400" />
            <span>Upload Dokumen Mutu</span>
          </Link>
        </div>
      }
    >
      {/* 1. KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 sm:p-5 rounded-[14px] border border-[#CBD5E1] shadow-2xs flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Arsip Dokumen</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{totalDocs}</p>
          </div>
          <div className="w-12 h-12 rounded-[12px] bg-blue-50 border border-blue-200 text-blue-900 flex items-center justify-center">
            <BookOpenIcon className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-[14px] border border-[#CBD5E1] shadow-2xs flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-slate-500">Buku Kebijakan</p>
            <p className="mt-1 text-2xl font-bold text-blue-900">{countKebijakan}</p>
          </div>
          <div className="w-12 h-12 rounded-[12px] bg-blue-50 border border-blue-200 text-blue-900 flex items-center justify-center">
            <DocumentTextIcon className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-[14px] border border-[#CBD5E1] shadow-2xs flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-slate-500">Manual Mutu PPEPP</p>
            <p className="mt-1 text-2xl font-bold text-amber-700">{countManual}</p>
          </div>
          <div className="w-12 h-12 rounded-[12px] bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center">
            <span className="font-bold text-xs">PPEPP</span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-[14px] border border-[#CBD5E1] shadow-2xs flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-slate-500">Standar Operasional (SOP)</p>
            <p className="mt-1 text-2xl font-bold text-emerald-800">{countSop}</p>
          </div>
          <div className="w-12 h-12 rounded-[12px] bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center">
            <span className="font-bold text-xs">SOP</span>
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
              placeholder="Cari kode dokumen atau judul dokumen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-[#CBD5E1] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 transition-all placeholder:text-slate-400"
            />
          </div>
          <select
            value={selectedJenis}
            onChange={(e) => setSelectedJenis(e.target.value)}
            className="text-xs bg-white border border-[#CBD5E1] rounded-[10px] px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 transition-all font-medium"
          >
            <option value="SEMUA">Semua Jenis Instrumen</option>
            <option value="Kebijakan">Buku Kebijakan SPMI</option>
            <option value="Manual">Manual Mutu PPEPP</option>
            <option value="Standar">Buku Standar SPMI</option>
            <option value="SOP">Standar Operasional Prosedur (SOP)</option>
            <option value="Formulir">Formulir / Instrumen</option>
          </select>
        </div>
      </CardContainer>

      {/* 3. Table Card Container */}
      <CardContainer
        title="Daftar Dokumen Mutu Terdaftar"
        subtitle={`Menampilkan ${filteredDocs.length} berkas resmi`}
      >
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500 font-medium">Memuat berkas dokumen...</div>
        ) : error ? (
          <ErrorState description={error} onRetry={loadData} />
        ) : filteredDocs.length === 0 ? (
          <EmptyState
            title="Belum Ada Dokumen Mutu"
            description="Tidak ditemukan dokumen resmi sesuai kata kunci atau jenis yang dipilih."
            action={
              <button
                onClick={() => {
                  setSearch('');
                  setSelectedJenis('SEMUA');
                }}
                className="text-xs text-blue-900 font-semibold hover:underline"
              >
                Reset Filter
              </button>
            }
          />
        ) : (
          <div className="w-full overflow-x-auto rounded-[12px] border border-[#CBD5E1] shadow-2xs">
            <table className="w-full min-w-[1140px] text-left text-xs table-fixed">
              <thead className="bg-[#EFF6FF] text-blue-900 font-bold border-b border-[#CBD5E1]">
                <tr>
                  <th className="py-3.5 px-4 w-[150px]">KODE BERKAS</th>
                  <th className="py-3.5 px-4 w-[260px]">JUDUL DOKUMEN</th>
                  <th className="py-3.5 px-4 w-[120px]">JENIS</th>
                  <th className="py-3.5 px-4 w-[190px]">STANDAR TERKAIT</th>
                  <th className="py-3.5 px-4 w-[65px] text-center">REVISI</th>
                  <th className="py-3.5 px-4 w-[65px] text-center">TAHUN</th>
                  <th className="py-3.5 px-4 w-[90px] text-center">BERKAS</th>
                  <th className="py-3.5 px-4 w-[160px]">JEJAK ARSIP</th>
                  <th className="py-3.5 px-4 w-[95px] text-center">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredDocs.map((item) => (
                  <tr key={item.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-900 align-top">
                      {item.kodeDokumen}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 align-top leading-snug">
                      {item.judul}
                    </td>
                    <td className="py-3.5 px-4 align-top font-semibold text-blue-900">
                      {item.jenis}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-normal align-top">
                      {item.standar ? (
                        <div className="leading-tight">
                          <span className="font-mono text-[11px] font-bold text-blue-800 block">
                            {item.standar.kode}
                          </span>
                          <span className="text-slate-600 line-clamp-2 mt-0.5">
                            {item.standar.nama}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-600 align-top">
                      v{item.revisi}
                    </td>
                    <td className="py-3.5 px-4 text-center font-medium text-slate-500 align-top">
                      {item.tahun}
                    </td>
                    <td className="py-3.5 px-4 text-center align-top">
                      {item.filePath ? (
                        <a
                          href={item.filePath}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-[8px] bg-emerald-50 text-emerald-800 hover:bg-emerald-700 hover:text-white border border-emerald-200 font-bold text-[11px] transition-all shadow-2xs"
                        >
                          <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                          <span>Unduh</span>
                        </a>
                      ) : (
                        <span className="text-slate-400 text-[11px] font-normal">-</span>
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
                          to={`/admin/dokumen/edit/${item.id}`}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-[8px] bg-blue-50 text-blue-900 hover:bg-blue-900 hover:text-white border border-blue-200 transition-all shadow-2xs"
                          title="Edit Dokumen Mutu"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(item.id, item.kodeDokumen)}
                          disabled={deletingId === item.id}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-[8px] bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white border border-rose-200 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                          title="Hapus Dokumen Mutu"
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
