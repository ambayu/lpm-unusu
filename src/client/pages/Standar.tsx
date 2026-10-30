import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchStandar, deleteStandar, StandarItem } from '../services/api';
import { AdminPanelTemplate } from '../components/AdminPanelTemplate';
import { CardContainer } from '../components/CardContainer';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import {
  AcademicCapIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

export const StandarPage: React.FC = () => {
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
    <AdminPanelTemplate
      title="Pangkalan Standar SPMI UNUSU"
      description="Kelola butir komitmen mutu dan siklus PPEPP (Penetapan, Pelaksanaan, Evaluasi, Pengendalian, Peningkatan) seluruh program studi."
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
            to="/admin/standar/tambah"
            className="inline-flex items-center justify-center gap-2.5 px-5 py-2.5 h-[42px] rounded-[12px] bg-blue-900 hover:bg-blue-950 text-white text-sm font-bold transition-all shadow-md hover:shadow-lg active:scale-98 cursor-pointer"
          >
            <PlusIcon className="w-5 h-5 text-amber-400" />
            <span>Tambah Standar</span>
          </Link>
        </div>
      }
    >
      {/* 1. KPI Cards Row (Part 10.8 standard) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 sm:p-5 rounded-[14px] border border-[#CBD5E1] shadow-2xs flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Butir Standar</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{totalStandar}</p>
          </div>
          <div className="w-12 h-12 rounded-[12px] bg-blue-50 border border-blue-200 text-blue-900 flex items-center justify-center">
            <AcademicCapIcon className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-[14px] border border-[#CBD5E1] shadow-2xs flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-slate-500">Standar Pendidikan</p>
            <p className="mt-1 text-2xl font-bold text-blue-900">{countPendidikan}</p>
          </div>
          <div className="w-12 h-12 rounded-[12px] bg-blue-50 border border-blue-200 text-blue-900 flex items-center justify-center">
            <span className="font-bold text-xs">OBE</span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-[14px] border border-[#CBD5E1] shadow-2xs flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-slate-500">Standar Riset</p>
            <p className="mt-1 text-2xl font-bold text-amber-700">{countRiset}</p>
          </div>
          <div className="w-12 h-12 rounded-[12px] bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center">
            <span className="font-bold text-xs">LPPM</span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-[14px] border border-[#CBD5E1] shadow-2xs flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-slate-500">Standar PKM</p>
            <p className="mt-1 text-2xl font-bold text-emerald-800">{countPkm}</p>
          </div>
          <div className="w-12 h-12 rounded-[12px] bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center">
            <span className="font-bold text-xs">PKM</span>
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
              placeholder="Cari kode, nama standar, atau butir pernyataan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-[#CBD5E1] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 transition-all placeholder:text-slate-400"
            />
          </div>
          <div className="flex items-center space-x-2">
            <AdjustmentsHorizontalIcon className="w-4 h-4 text-slate-400" />
            <select
              value={selectedKategori}
              onChange={(e) => setSelectedKategori(e.target.value)}
              className="text-xs bg-white border border-[#CBD5E1] rounded-[10px] px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 transition-all font-medium"
            >
              <option value="SEMUA">Semua Kategori</option>
              <option value="Pendidikan">Pendidikan</option>
              <option value="Penelitian">Penelitian</option>
              <option value="Pengabdian">Pengabdian</option>
              <option value="Tata Kelola">Tata Kelola</option>
            </select>
          </div>
        </div>
      </CardContainer>

      {/* 3. Table Card Container */}
      <CardContainer
        title="Daftar Butir Standar SPMI Aktif"
        subtitle={`Menampilkan ${filteredList.length} butir standar terdaftar`}
      >
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500 font-medium">Memuat standar SPMI...</div>
        ) : error ? (
          <ErrorState description={error} onRetry={loadData} />
        ) : filteredList.length === 0 ? (
          <EmptyState
            title="Belum Ada Standar SPMI"
            description="Tidak ditemukan standar penjaminan mutu sesuai kriteria filter yang dipilih."
            action={
              <button
                onClick={() => {
                  setSearch('');
                  setSelectedKategori('SEMUA');
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
                  <th className="py-3.5 px-4 w-[130px]">KODE</th>
                  <th className="py-3.5 px-4 w-[210px]">NAMA STANDAR</th>
                  <th className="py-3.5 px-4 w-[120px]">KATEGORI</th>
                  <th className="py-3.5 px-4 w-[260px]">PERNYATAAN STANDAR</th>
                  <th className="py-3.5 px-4 w-[180px]">TARGET CAPAIAN</th>
                  <th className="py-3.5 px-4 w-[65px] text-center">TAHUN</th>
                  <th className="py-3.5 px-4 w-[170px]">JEJAK ARSIP</th>
                  <th className="py-3.5 px-4 w-[95px] text-center">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredList.map((item) => (
                  <tr key={item.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-900 align-top">
                      {item.kode}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 align-top leading-snug">
                      {item.nama}
                    </td>
                    <td className="py-3.5 px-4 align-top font-semibold text-blue-900">
                      {item.kategori}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 leading-relaxed font-normal align-top">
                      <p className="line-clamp-3" title={item.pernyataan}>
                        {item.pernyataan}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium align-top">
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
                    </td>
                    <td className="py-3.5 px-4 text-center font-medium text-slate-500 align-top">
                      {item.tahun}
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
                          to={`/admin/standar/edit/${item.id}`}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-[8px] bg-blue-50 text-blue-900 hover:bg-blue-900 hover:text-white border border-blue-200 transition-all shadow-2xs"
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
