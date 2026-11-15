import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchKategori, deleteKategori, KategoriItem } from '../services/api';
import { ListPageTemplate, ListActionButton } from '../components/ListPageTemplate';
import {
  FolderIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

export const KategoriPage: React.FC = () => {
  const { bisa } = useAuth();
  const bolehMenulis = bisa('dokumen:create');

  const [categories, setCategories] = useState<KategoriItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadData = () => {
    setLoading(true);
    setError(null);
    fetchKategori()
      .then((res) => {
        setCategories(res.data.data || []);
      })
      .catch((err) => {
        console.error(err);
        setError(err.response?.data?.message || 'Gagal memuat data kategori dokumen.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: number, nama: string) => {
    if (!window.confirm(`Yakin ingin menghapus kategori "${nama}"?`)) return;
    setDeletingId(id);
    try {
      await deleteKategori(id);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus kategori');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = categories.filter((c) =>
    c.nama.toLowerCase().includes(search.toLowerCase()) ||
    (c.deskripsi && c.deskripsi.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <ListPageTemplate<KategoriItem>
      title="Kategori Dokumen"
      description="Kelola kategori klasifikasi dokumen SPMI & penjaminan mutu. Kategori yang dibuat di sini otomatis tersedia pada formulir unggah dokumen."
      badge={
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-lpm-blue-50 border border-lpm-blue-200 text-[11px] font-bold text-lpm-blue-900">
          <FolderIcon className="w-3.5 h-3.5" aria-hidden="true" />
          Klasifikasi Dokumen
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
            <ListActionButton to="/admin/kategori/tambah" icon={<PlusIcon className="h-4 w-4" />}>
              Tambah Kategori
            </ListActionButton>
          )}
        </>
      }
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Cari nama atau deskripsi kategori..."
      tableTitle="Daftar Kategori Dokumen"
      tableSubtitle={`Menampilkan ${filtered.length} kategori aktif`}
      tableBadge={
        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-lpm-blue-50 border border-lpm-blue-200 text-[11px] font-bold text-lpm-blue-900">
          {filtered.length} data
        </span>
      }
      columns={[
        {
          key: 'no',
          header: 'NO',
          headerClassName: 'w-16 text-center',
          cellClassName: 'text-center font-semibold text-slate-500',
          render: (_, idx) => idx + 1,
        },
        {
          key: 'nama',
          header: 'NAMA KATEGORI',
          headerClassName: 'w-64',
          render: (item) => (
            <span className="font-semibold text-slate-900 text-sm">{item.nama}</span>
          ),
        },
        {
          key: 'deskripsi',
          header: 'DESKRIPSI',
          render: (item) => (
            <span className="text-xs text-slate-600 leading-relaxed">
              {item.deskripsi || <span className="text-slate-400 italic">-</span>}
            </span>
          ),
        },
        {
          key: 'status',
          header: 'STATUS',
          headerClassName: 'w-32 text-center',
          cellClassName: 'text-center',
          render: (item) => (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                item.isActive
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  : 'bg-slate-100 text-slate-800 border-slate-200'
              }`}
            >
              {item.isActive ? 'Aktif' : 'Nonaktif'}
            </span>
          ),
        },
        {
          key: 'aksi',
          header: 'AKSI',
          headerClassName: 'w-28 text-center',
          cellClassName: 'text-center',
          render: (item) =>
            bolehMenulis ? (
              <div className="inline-flex items-center gap-2">
                <Link
                  to={`/admin/kategori/edit/${item.id}`}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-[8px] bg-lpm-blue-50 text-lpm-blue-900 hover:bg-lpm-blue-900 hover:text-white border border-lpm-blue-200 transition-all shadow-2xs"
                  title="Sunting Kategori"
                >
                  <PencilSquareIcon className="w-4 h-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => handleDelete(item.id, item.nama)}
                  disabled={deletingId === item.id}
                  title="Hapus Kategori"
                  aria-label={`Hapus ${item.nama}`}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-[8px] bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white border border-rose-200 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <span className="text-xs text-slate-400">Hanya Baca</span>
            ),
        },
      ]}
      rows={filtered}
      rowKey={(item) => String(item.id)}
      loading={loading}
      error={error}
      onRetry={loadData}
      emptyMessage="Belum ada kategori dokumen."
      noResultMessage="Tidak ditemukan kategori dokumen yang cocok dengan pencarian."
      hasActiveFilter={Boolean(search)}
    />
  );
};

export default KategoriPage;
