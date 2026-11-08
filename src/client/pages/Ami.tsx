import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchAudit, deleteAudit, AuditItem } from '../services/api';
import { ListPageTemplate, ListActionButton } from '../components/ListPageTemplate';
import {
  ClipboardDocumentCheckIcon,
  PlusIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

export const AmiPage: React.FC = () => {
  const { bisa } = useAuth();
  // Tombol aksi ditentukan oleh IZIN, bukan nama peran.
  const bolehMenulis = bisa('audit:create');
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
    <ListPageTemplate<AuditItem>
      title="Audit Mutu Internal (AMI) & Temuan Lapangan"
      description="Evaluasi kepatuhan butir standar mutu SPMI pada seluruh Program Studi dan Unit Kerja, verifikasi KTS (Ketidaksesuaian), dan penetapan Rekomendasi Tindak Lanjut (RTL)."
      badge={
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-lpm-blue-50 border border-lpm-blue-200 text-[11px] font-bold text-lpm-blue-900">
          <ClipboardDocumentCheckIcon className="w-3.5 h-3.5" aria-hidden="true" />
          Siklus AMI
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
          {bolehMenulis && (
            <ListActionButton to="/admin/ami/tambah" icon={<PlusIcon className="h-4 w-4" />}>
              Catat Temuan Audit AMI
            </ListActionButton>
          )}
        </>
      }
      stats={
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-white p-4 sm:p-5 rounded-[14px] border border-[#CBD5E1] shadow-2xs flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Butir Diaudit</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{totalAudits}</p>
            </div>
            <div className="w-12 h-12 rounded-[12px] bg-lpm-blue-50 border border-lpm-blue-200 text-lpm-blue-900 flex items-center justify-center">
              <ClipboardDocumentCheckIcon className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-[14px] border border-[#CBD5E1] shadow-2xs flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-500">Terlampaui (Unggul)</p>
              <p className="mt-1 text-2xl font-bold text-lpm-blue-800">{statTerlampaui}</p>
            </div>
            <div className="w-12 h-12 rounded-[12px] bg-lpm-blue-50 border border-lpm-blue-200 text-lpm-blue-800 flex items-center justify-center">
              <CheckCircleIcon className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-[14px] border border-[#CBD5E1] shadow-2xs flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-500">Sesuai Target</p>
              <p className="mt-1 text-2xl font-bold text-lpm-blue-900">{statSesuai}</p>
            </div>
            <div className="w-12 h-12 rounded-[12px] bg-lpm-blue-50 border border-lpm-blue-200 text-lpm-blue-900 flex items-center justify-center">
              <span className="font-bold text-xs">SESUAI</span>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-[14px] border border-[#CBD5E1] shadow-2xs flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-500">Temuan KTS / Observasi</p>
              <p className="mt-1 text-2xl font-bold text-lpm-yellow-400">{statKts}</p>
            </div>
            <div className="w-12 h-12 rounded-[12px] bg-lpm-yellow-400 border border-lpm-yellow-400 text-lpm-blue-900 flex items-center justify-center">
              <ExclamationTriangleIcon className="w-6 h-6" />
            </div>
          </div>
        </div>
      }
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Cari auditee (prodi), nama auditor, atau uraian temuan..."
      filters={
        <select
          value={selectedHasil}
          onChange={(e) => setSelectedHasil(e.target.value)}
          aria-label="Filter status hasil audit mutu internal"
          className="text-xs bg-white border border-[#CBD5E1] rounded-[10px] px-3 py-2 min-h-[44px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-lpm-blue-900/20 focus:border-lpm-blue-900 transition-all font-medium"
        >
          <option value="SEMUA">Semua Status Hasil AMI</option>
          <option value="TERLAMPAUI">Terlampaui (Kaizen)</option>
          <option value="SESUAI">Sesuai Standar</option>
          <option value="OBSERVASI">Observasi</option>
          <option value="KTS_MINOR">KTS Minor</option>
          <option value="KTS_MAYOR">KTS Mayor</option>
        </select>
      }
      tableTitle="Daftar Temuan Lapangan & Evaluasi Mutu"
      tableSubtitle={`Menampilkan ${filteredAudits.length} catatan audit`}
      tableBadge={
        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-lpm-blue-50 border border-lpm-blue-200 text-[11px] font-bold text-lpm-blue-900">
          {filteredAudits.length} data
        </span>
      }
      columns={[
        {
          key: 'hasil',
          header: 'HASIL TEMUAN',
          headerClassName: 'w-[120px]',
          render: (item) => <span className="font-bold text-xs uppercase text-lpm-blue-900">{item.hasil}</span>,
        },
        {
          key: 'standar',
          header: 'STANDAR MUTU',
          headerClassName: 'w-[210px]',
          render: (item) => (
            <>
              <span className="font-mono text-[11px] font-bold text-slate-700 block">
                {item.standar ? item.standar.kode : `STD-#${item.standarId}`}
              </span>
              <span className="font-semibold text-slate-900 line-clamp-2 mt-0.5 leading-snug">
                {item.standar ? item.standar.nama : 'Standar SPMI'}
              </span>
            </>
          ),
        },
        {
          key: 'auditee',
          header: 'AUDITEE',
          headerClassName: 'w-[160px]',
          render: (item) => (
            <span className="font-semibold text-slate-800 leading-snug">{item.auditee}</span>
          ),
        },
        {
          key: 'auditor',
          header: 'AUDITOR',
          headerClassName: 'w-[150px]',
          cellClassName: 'text-slate-700 font-medium',
          render: (item) => <span className="leading-snug">{item.auditor}</span>,
        },
        {
          key: 'uraian',
          header: 'URAIAN & RTL',
          headerClassName: 'w-[240px]',
          cellClassName: 'text-slate-600 space-y-1.5 leading-relaxed font-normal',
          render: (item) => (
            <>
              {item.deskripsi && (
                <p className="line-clamp-2" title={item.deskripsi}>
                  {item.deskripsi}
                </p>
              )}
              {item.rekomendasi && (
                <div className="text-[11px] text-lpm-blue-900 font-medium line-clamp-2 border-l-2 border-lpm-blue-400 pl-2 mt-1">
                  RTL: {item.rekomendasi}
                </div>
              )}
            </>
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
                <div className="text-[10.5px] text-lpm-blue-800/80 font-mono">
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
            bolehMenulis ? (
              <div className="inline-flex items-center gap-2">
                <Link
                  to={`/admin/ami/edit/${item.id}`}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-[8px] bg-lpm-blue-50 text-lpm-blue-900 hover:bg-lpm-blue-900 hover:text-white border border-lpm-blue-200 transition-all shadow-2xs"
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
            ) : (
              <span className="text-[11px] text-slate-400 font-medium italic">Hanya Baca</span>
            ),
        },
      ]}
      rows={filteredAudits}
      rowKey={(item) => item.id}
      loading={loading}
      error={error}
      onRetry={loadData}
      emptyMessage="Belum ada catatan audit AMI terdaftar."
      noResultMessage="Tidak ada catatan audit yang cocok dengan kriteria filter."
      hasActiveFilter={search.trim() !== '' || selectedHasil !== 'SEMUA'}
      minTableWidth="min-w-[1180px]"
    />
  );
};
