import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchStandar, deleteStandar, StandarItem } from '../services/api';
import { ListPageTemplate, ListActionButton } from '../components/ListPageTemplate';
import {
  AcademicCapIcon,
  PlusIcon,
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

export const StandarPage: React.FC = () => {
  const { bisa } = useAuth();
  // Tombol aksi ditentukan oleh IZIN, bukan nama peran.
  const bolehMenulis = bisa('standar:create');
  const [standarList, setStandarList] = useState<StandarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedKategori, setSelectedKategori] = useState('SEMUA');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadData = () => {
    setLoading(true);
    setError(null);
    fetchStandar()
      .then((res) => setStandarList(res.data.data))
      .catch((err) => {
        console.error(err);
        setError(err.response?.data?.message || 'Gagal memuat data standar SPMI.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: number, kode: string) => {
    if (!window.confirm(`Yakin ingin menghapus standar ${kode}?`)) return;
    setDeletingId(id);
    try {
      await deleteStandar(id);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus standar SPMI');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredList = standarList.filter((item) => {
    const matchSearch =
      item.kode.toLowerCase().includes(search.toLowerCase()) ||
      item.nama.toLowerCase().includes(search.toLowerCase()) ||
      item.pernyataan.toLowerCase().includes(search.toLowerCase());
    const matchKategori =
      selectedKategori === 'SEMUA' || item.kategori.toLowerCase() === selectedKategori.toLowerCase();
    return matchSearch && matchKategori;
  });

  // KPI calculations
  const totalStandar = standarList.length;
  const countPendidikan = standarList.filter((s) => s.kategori.toLowerCase() === 'pendidikan').length;
  const countRiset = standarList.filter((s) => s.kategori.toLowerCase() === 'penelitian').length;
  const countPkm = standarList.filter((s) => s.kategori.toLowerCase() === 'pengabdian').length;

  return (
    <ListPageTemplate<StandarItem>
      title="Pangkalan Standar SPMI UNUSU"
      description="Kelola butir komitmen mutu dan siklus PPEPP (Penetapan, Pelaksanaan, Evaluasi, Pengendalian, Peningkatan) seluruh program studi."
      badge={
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-lpm-blue-50 border border-lpm-blue-200 text-[11px] font-bold text-lpm-blue-900">
          <AcademicCapIcon className="w-3.5 h-3.5" aria-hidden="true" />
          Standar SPMI
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
            <ListActionButton to="/admin/standar/tambah" icon={<PlusIcon className="h-4 w-4" />}>
              Tambah Standar
            </ListActionButton>
          )}
        </>
      }
      stats={
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-white p-4 sm:p-5 rounded-[14px] border border-[#CBD5E1] shadow-2xs flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Butir Standar</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{totalStandar}</p>
            </div>
            <div className="w-12 h-12 rounded-[12px] bg-lpm-blue-50 border border-lpm-blue-200 text-lpm-blue-900 flex items-center justify-center">
              <AcademicCapIcon className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-[14px] border border-[#CBD5E1] shadow-2xs flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-500">Standar Pendidikan</p>
              <p className="mt-1 text-2xl font-bold text-lpm-blue-900">{countPendidikan}</p>
            </div>
            <div className="w-12 h-12 rounded-[12px] bg-lpm-blue-50 border border-lpm-blue-200 text-lpm-blue-900 flex items-center justify-center">
              <span className="font-bold text-xs">OBE</span>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-[14px] border border-[#CBD5E1] shadow-2xs flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-500">Standar Riset</p>
              <p className="mt-1 text-2xl font-bold text-lpm-yellow-400">{countRiset}</p>
            </div>
            <div className="w-12 h-12 rounded-[12px] bg-lpm-yellow-400 border border-lpm-yellow-400 text-lpm-blue-900 flex items-center justify-center">
              <span className="font-bold text-xs">LPPM</span>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-[14px] border border-[#CBD5E1] shadow-2xs flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-500">Standar PKM</p>
              <p className="mt-1 text-2xl font-bold text-lpm-blue-800">{countPkm}</p>
            </div>
            <div className="w-12 h-12 rounded-[12px] bg-lpm-blue-50 border border-lpm-blue-200 text-lpm-blue-800 flex items-center justify-center">
              <span className="font-bold text-xs">PKM</span>
            </div>
          </div>
        </div>
      }
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Cari kode, nama standar, atau butir pernyataan..."
      filters={
        <>
          <AdjustmentsHorizontalIcon className="w-4 h-4 text-slate-400" aria-hidden="true" />
          <select
            value={selectedKategori}
            onChange={(e) => setSelectedKategori(e.target.value)}
            aria-label="Filter kategori standar SPMI"
            className="text-xs bg-white border border-[#CBD5E1] rounded-[10px] px-3 py-2 min-h-[44px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-lpm-blue-900/20 focus:border-lpm-blue-900 transition-all font-medium"
          >
            <option value="SEMUA">Semua Kategori</option>
            <option value="Pendidikan">Pendidikan</option>
            <option value="Penelitian">Penelitian</option>
            <option value="Pengabdian">Pengabdian</option>
            <option value="Tata Kelola">Tata Kelola</option>
          </select>
        </>
      }
      tableTitle="Daftar Butir Standar SPMI Aktif"
      tableSubtitle={`Menampilkan ${filteredList.length} butir standar terdaftar`}
      tableBadge={
        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-lpm-blue-50 border border-lpm-blue-200 text-[11px] font-bold text-lpm-blue-900">
          {filteredList.length} data
        </span>
      }
      columns={[
        {
          key: 'kode',
          header: 'KODE',
          headerClassName: 'w-[130px]',
          render: (item) => <span className="font-mono font-bold text-lpm-blue-900">{item.kode}</span>,
        },
        {
          key: 'nama',
          header: 'NAMA STANDAR',
          headerClassName: 'w-[210px]',
          render: (item) => (
            <span className="font-semibold text-slate-900 leading-snug">{item.nama}</span>
          ),
        },
        {
          key: 'kategori',
          header: 'KATEGORI',
          headerClassName: 'w-[120px]',
          render: (item) => <span className="font-semibold text-lpm-blue-900">{item.kategori}</span>,
        },
        {
          key: 'pernyataan',
          header: 'PERNYATAAN STANDAR',
          headerClassName: 'w-[260px]',
          cellClassName: 'text-slate-600 leading-relaxed font-normal',
          render: (item) => (
            <p className="line-clamp-3" title={item.pernyataan}>
              {item.pernyataan}
            </p>
          ),
        },
        {
          key: 'target',
          header: 'TARGET CAPAIAN',
          headerClassName: 'w-[180px]',
          cellClassName: 'text-slate-600 font-medium',
          render: (item) => (
            <>
              {item.target ? (
                <div className="font-semibold text-slate-800 leading-tight">{item.target}</div>
              ) : (
                <span className="text-slate-400">-</span>
              )}
              {item.indikator && (
                <div className="text-[11px] text-slate-500 mt-1 font-normal line-clamp-2 leading-tight">
                  {item.indikator}
                </div>
              )}
            </>
          ),
        },
        {
          key: 'tahun',
          header: 'TAHUN',
          headerClassName: 'w-[65px] text-center',
          cellClassName: 'text-center font-medium text-slate-500',
          render: (item) => item.tahun,
        },
        {
          key: 'jejakArsip',
          header: 'JEJAK ARSIP',
          headerClassName: 'w-[170px]',
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
                  to={`/admin/standar/edit/${item.id}`}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-[8px] bg-lpm-blue-50 text-lpm-blue-900 hover:bg-lpm-blue-900 hover:text-white border border-lpm-blue-200 transition-all shadow-2xs"
                  title="Edit Butir Standar"
                >
                  <PencilSquareIcon className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => handleDelete(item.id, item.kode)}
                  disabled={deletingId === item.id}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-[8px] bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white border border-rose-200 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                  title="Hapus Butir Standar"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <span className="text-[11px] text-slate-400 font-medium italic">Hanya Baca</span>
            ),
        },
      ]}
      rows={filteredList}
      rowKey={(item) => item.id}
      loading={loading}
      error={error}
      onRetry={loadData}
      emptyMessage="Belum ada standar SPMI terdaftar."
      noResultMessage="Tidak ada standar yang cocok dengan kriteria filter."
      hasActiveFilter={search.trim() !== '' || selectedKategori !== 'SEMUA'}
      minTableWidth="min-w-[1140px]"
    />
  );
};
