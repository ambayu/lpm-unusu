import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchDokumenMutu, deleteDokumenMutu, DokumenMutuItem } from '../services/api';
import { ListPageTemplate, ListActionButton } from '../components/ListPageTemplate';
import {
  BookOpenIcon,
  PlusIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

export const DokumenPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin' || currentUser?.ssoRole === 'SUPERADMIN' || currentUser?.ssoRole === 'ADMIN_LPM';
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
    <ListPageTemplate<DokumenMutuItem>
      title="Bank Dokumen Mutu & SOP"
      description="Repositori resmi instrumen mutu SPMI: Buku Kebijakan Mutu, Manual Mutu PPEPP, Standar SPMI, serta Standar Operasional Prosedur (SOP)."
      badge={
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-[11px] font-bold text-blue-900">
          <BookOpenIcon className="w-3.5 h-3.5" aria-hidden="true" />
          Repositori Mutu
        </span>
      }
      actions={
        <>
          <ListActionButton
            variant="secondary"
            icon={<ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />}
            onClick={loadData}
            disabled={loading}
          >
            Segarkan
          </ListActionButton>
          {isAdmin && (
            <ListActionButton to="/admin/dokumen/tambah" icon={<PlusIcon className="h-4 w-4" />}>
              Upload Dokumen Mutu
            </ListActionButton>
          )}
        </>
      }
      stats={
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
      }
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Cari kode dokumen atau judul dokumen..."
      filters={
        <select
          value={selectedJenis}
          onChange={(e) => setSelectedJenis(e.target.value)}
          aria-label="Filter jenis instrumen dokumen mutu"
          className="text-xs bg-white border border-[#CBD5E1] rounded-[10px] px-3 py-2 min-h-[44px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 transition-all font-medium"
        >
          <option value="SEMUA">Semua Jenis Instrumen</option>
          <option value="Kebijakan">Buku Kebijakan SPMI</option>
          <option value="Manual">Manual Mutu PPEPP</option>
          <option value="Standar">Buku Standar SPMI</option>
          <option value="SOP">Standar Operasional Prosedur (SOP)</option>
          <option value="Formulir">Formulir / Instrumen</option>
        </select>
      }
      tableTitle="Daftar Dokumen Mutu Terdaftar"
      tableSubtitle={`Menampilkan ${filteredDocs.length} berkas resmi`}
      tableBadge={
        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-[11px] font-bold text-blue-900">
          {filteredDocs.length} data
        </span>
      }
      columns={[
        {
          key: 'kodeDokumen',
          header: 'KODE BERKAS',
          headerClassName: 'w-[150px]',
          render: (item) => <span className="font-mono font-bold text-blue-900">{item.kodeDokumen}</span>,
        },
        {
          key: 'judul',
          header: 'JUDUL DOKUMEN',
          headerClassName: 'w-[260px]',
          render: (item) => (
            <span className="font-semibold text-slate-900 leading-snug">{item.judul}</span>
          ),
        },
        {
          key: 'jenis',
          header: 'JENIS',
          headerClassName: 'w-[120px]',
          render: (item) => <span className="font-semibold text-blue-900">{item.jenis}</span>,
        },
        {
          key: 'standar',
          header: 'STANDAR TERKAIT',
          headerClassName: 'w-[190px]',
          cellClassName: 'text-slate-600 font-normal',
          render: (item) =>
            item.standar ? (
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
            ),
        },
        {
          key: 'revisi',
          header: 'REVISI',
          headerClassName: 'w-[65px] text-center',
          cellClassName: 'text-center font-mono font-bold text-slate-600',
          render: (item) => `v${item.revisi}`,
        },
        {
          key: 'tahun',
          header: 'TAHUN',
          headerClassName: 'w-[65px] text-center',
          cellClassName: 'text-center font-medium text-slate-500',
          render: (item) => item.tahun,
        },
        {
          key: 'berkas',
          header: 'BERKAS',
          headerClassName: 'w-[90px] text-center',
          cellClassName: 'text-center',
          render: (item) =>
            item.filePath ? (
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
            ),
        },
        {
          key: 'jejakArsip',
          header: 'JEJAK ARSIP',
          headerClassName: 'w-[160px]',
          cellClassName: 'text-[11px] text-slate-500 space-y-1',
          render: (item) => (
            <>
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
            </>
          ),
        },
        {
          key: 'aksi',
          header: 'AKSI',
          headerClassName: 'w-[95px] text-center',
          cellClassName: 'text-center',
          render: (item) =>
            isAdmin ? (
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
            ) : (
              <span className="text-[11px] text-slate-400 font-medium italic">Hanya Baca</span>
            ),
        },
      ]}
      rows={filteredDocs}
      rowKey={(item) => item.id}
      loading={loading}
      error={error}
      onRetry={loadData}
      emptyMessage="Belum ada dokumen mutu terdaftar."
      noResultMessage="Tidak ada dokumen yang cocok dengan kriteria pencarian."
      hasActiveFilter={search.trim() !== '' || selectedJenis !== 'SEMUA'}
      minTableWidth="min-w-[1140px]"
    />
  );
};
