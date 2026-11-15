import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  fetchDokumen,
  deleteDokumen,
  fetchKategori,
  DokumenRecord,
  KategoriItem,
} from '../services/api';
import { ListPageTemplate, ListActionButton } from '../components/ListPageTemplate';
import { NotificationModal } from '../components/NotificationModal';
import { deskripsikanGalat, DeskripsiGalat } from '../lib/galat';
import {
  DocumentTextIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

export const DokumenBaruPage: React.FC = () => {
  const { bisa } = useAuth();
  const bolehMenulis = bisa('dokumen:create');

  const [documents, setDocuments] = useState<DokumenRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('SEMUA');
  /** Filter kategori yang dipilih; `0` berarti semua kategori. */
  const [selectedKategori, setSelectedKategori] = useState<number | 0>(0);
  const [kategoriList, setKategoriList] = useState<KategoriItem[]>([]);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  /** Dokumen yang menunggu konfirmasi hapus. */
  const [akanDihapus, setAkanDihapus] = useState<DokumenRecord | null>(null);
  /** Modal galat untuk kegagalan memuat maupun menghapus. */
  const [galat, setGalat] = useState<DeskripsiGalat | null>(null);

  const loadData = () => {
    setLoading(true);
    setError(null);
    fetchDokumen()
      .then((res) => {
        setDocuments(res.data.data || []);
      })
      .catch((err) => {
        console.error(err);
        setError(err.response?.data?.message || 'Gagal memuat arsip dokumen.');
        setGalat(
          deskripsikanGalat(err, 'Memuat Arsip Dokumen', 'daftar arsip dokumen LPM'),
        );
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  // Muat daftar kategori untuk filter. Kegagalan diabaikan diam-diam karena
  // filter tetap bisa diturunkan dari dokumen yang sudah dimuat.
  useEffect(() => {
    fetchKategori()
      .then((res) => setKategoriList(res.data.data || []))
      .catch((err) => console.error('Gagal memuat daftar kategori:', err));
  }, []);

  /**
   * Pilihan filter kategori. Sumber utamanya endpoint `/kategori`; bila
   * endpoint gagal atau kosong, daftar diturunkan dari dokumen yang sudah
   * dimuat agar filter tetap bisa dipakai. Hasil digabung dan diurutkan
   * menurut nama, lalu dibuang duplikatnya berdasarkan `id`.
   */
  const opsiKategori = useMemo<KategoriItem[]>(() => {
    const dariDokumen = documents
      .map((d) => d.kategori)
      .filter((k): k is KategoriItem => Boolean(k?.id));

    const gabungan = new Map<number, KategoriItem>();
    [...kategoriList, ...dariDokumen].forEach((k) => {
      if (!gabungan.has(k.id)) gabungan.set(k.id, k);
    });

    return Array.from(gabungan.values()).sort((a, b) =>
      a.nama.localeCompare(b.nama, 'id-ID'),
    );
  }, [kategoriList, documents]);

  const jalankanHapus = async () => {
    if (!akanDihapus) return;
    const target = akanDihapus;
    setDeletingId(target.id);
    try {
      await deleteDokumen(target.id);
      setAkanDihapus(null);
      loadData();
    } catch (err: any) {
      console.error(err);
      setAkanDihapus(null);
      setGalat(
        deskripsikanGalat(err, 'Menghapus Dokumen', `dokumen «${target.judul}»`),
      );
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = documents.filter((doc) => {
    const matchSearch =
      doc.judul.toLowerCase().includes(search.toLowerCase()) ||
      (doc.nomor && doc.nomor.toLowerCase().includes(search.toLowerCase())) ||
      (doc.kategori?.nama && doc.kategori.nama.toLowerCase().includes(search.toLowerCase())) ||
      (doc.prodiName && doc.prodiName.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = selectedStatus === 'SEMUA' || doc.status === selectedStatus;
    const matchKategori = selectedKategori === 0 || doc.kategoriId === selectedKategori;
    return matchSearch && matchStatus && matchKategori;
  });

  /** Ada filter aktif — dipakai untuk memilih pesan "tanpa hasil". */
  const adaFilterAktif =
    Boolean(search.trim()) || selectedStatus !== 'SEMUA' || selectedKategori !== 0;

  /** Jumlah filter yang sedang menyala (untuk lencana "Reset"). */
  const jumlahFilter = [selectedStatus !== 'SEMUA', selectedKategori !== 0].filter(Boolean).length;

  return (
    <>
      <ListPageTemplate<DokumenRecord>
      title="Manajemen Dokumen"
      description="Pangkalan arsip dokumen penjaminan mutu, instrumen evaluasi, dan surat keputusan dengan klasifikasi kategori mandiri."
      badge={
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-lpm-blue-50 border border-lpm-blue-200 text-[11px] font-bold text-lpm-blue-900">
          <DocumentTextIcon className="w-3.5 h-3.5" aria-hidden="true" />
          Pangkalan Dokumen
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
            <ListActionButton to="/admin/arsip-dokumen/tambah" icon={<PlusIcon className="h-4 w-4" />}>
              Tambah Dokumen
            </ListActionButton>
          )}
        </>
      }
      stats={
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-white p-4 sm:p-5 rounded-[14px] border border-[#CBD5E1] shadow-2xs flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Arsip Dokumen</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{documents.length}</p>
            </div>
            <div className="w-12 h-12 rounded-[12px] bg-lpm-blue-50 border border-lpm-blue-200 text-lpm-blue-900 flex items-center justify-center">
              <DocumentTextIcon className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-[14px] border border-[#CBD5E1] shadow-2xs flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-500">Dokumen Aktif</p>
              <p className="mt-1 text-2xl font-bold text-emerald-700">
                {documents.filter((d) => d.status === 'Aktif').length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-[12px] bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center">
              <span className="font-bold text-xs">AKTIF</span>
            </div>
          </div>
        </div>
      }
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Cari judul, nomor dokumen, atau kategori..."
      filters={
        <>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            aria-label="Filter status dokumen"
            className="text-xs bg-white border border-[#CBD5E1] rounded-[10px] px-3 py-2 min-h-[44px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-lpm-blue-900/20 focus:border-lpm-blue-900 transition-all font-medium"
          >
            <option value="SEMUA">Semua Status</option>
            <option value="Aktif">Aktif</option>
            <option value="Draft">Draft</option>
            <option value="Arsip">Arsip</option>
          </select>

          <select
            value={selectedKategori}
            onChange={(e) => setSelectedKategori(Number(e.target.value))}
            aria-label="Filter kategori dokumen"
            className="text-xs bg-white border border-[#CBD5E1] rounded-[10px] px-3 py-2 min-h-[44px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-lpm-blue-900/20 focus:border-lpm-blue-900 transition-all font-medium max-w-[220px]"
          >
            <option value={0}>Semua Kategori</option>
            {opsiKategori.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama}
              </option>
            ))}
          </select>

          {jumlahFilter > 0 && (
            <button
              type="button"
              onClick={() => {
                setSelectedStatus('SEMUA');
                setSelectedKategori(0);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-[10px] border border-[#CBD5E1] bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-all cursor-pointer"
              aria-label="Atur ulang semua filter"
            >
              <XMarkIcon className="w-4 h-4" aria-hidden="true" />
              Reset Filter ({jumlahFilter})
            </button>
          )}
        </>
      }
      tableTitle="Daftar Dokumen Arsip"
      tableSubtitle={`Menampilkan ${filtered.length} berkas`}
      tableBadge={
        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-lpm-blue-50 border border-lpm-blue-200 text-[11px] font-bold text-lpm-blue-900">
          {filtered.length} data
        </span>
      }
      columns={[
        {
          key: 'no',
          header: 'NO',
          headerClassName: 'w-14',
          cellClassName: 'text-center',
          render: (_, idx) => idx + 1,
        },
        {
          key: 'judul',
          header: 'JUDUL DOKUMEN',
          headerClassName: 'min-w-[260px]',
          render: (item) => (
            <span className="font-semibold leading-snug break-words">{item.judul}</span>
          ),
        },
        {
          key: 'nomor',
          header: 'NOMOR DOKUMEN',
          headerClassName: 'w-44',
          render: (item) =>
            item.nomor ? <span className="font-mono break-all">{item.nomor}</span> : '-',
        },
        {
          key: 'tahun',
          header: 'TAHUN',
          headerClassName: 'w-24',
          cellClassName: 'text-center',
          render: (item) => <span className="font-mono">{item.tahun}</span>,
        },
        {
          key: 'kategori',
          header: 'KATEGORI',
          headerClassName: 'w-40',
          render: (item) =>
            item.kategori?.nama ? (
              <span className="inline-flex items-center px-2.5 py-1 rounded-md font-medium bg-blue-50 text-blue-800 border border-blue-200">
                {item.kategori.nama}
              </span>
            ) : (
              '-'
            ),
        },
        {
          key: 'tujuanPublish',
          header: 'TUJUAN PUBLIKASI',
          headerClassName: 'w-40',
          render: (item) => (
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-md font-medium border ${
                item.tujuanPublish === 'prodi'
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {item.tujuanPublish === 'prodi' ? 'Program Studi' : 'LPM Internal'}
            </span>
          ),
        },
        {
          key: 'prodi',
          header: 'PROGRAM STUDI',
          headerClassName: 'min-w-[200px]',
          render: (item) =>
            item.tujuanPublish === 'prodi' && item.prodiName ? (
              <span className="break-words">{item.prodiName}</span>
            ) : (
              '-'
            ),
        },
        {
          key: 'tanggalMulaiBerlaku',
          header: 'MULAI BERLAKU',
          headerClassName: 'w-36',
          cellClassName: 'whitespace-nowrap',
          render: (item) =>
            item.tanggalMulaiBerlaku ? (
              <span>{new Date(item.tanggalMulaiBerlaku).toLocaleDateString('id-ID')}</span>
            ) : (
              '-'
            ),
        },
        {
          key: 'tanggalBerakhir',
          header: 'BERAKHIR',
          headerClassName: 'w-36',
          cellClassName: 'whitespace-nowrap',
          render: (item) =>
            item.tanggalBerakhir ? (
              <span>{new Date(item.tanggalBerakhir).toLocaleDateString('id-ID')}</span>
            ) : (
              '-'
            ),
        },
        {
          key: 'status',
          header: 'STATUS',
          headerClassName: 'w-28',
          cellClassName: 'text-center',
          render: (item) => {
            const warna =
              item.status === 'Aktif'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : item.status === 'Draft'
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-slate-100 text-slate-700 border-slate-200';
            return (
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full font-medium border ${warna}`}>
                {item.status}
              </span>
            );
          },
        },
        {
          key: 'berkas',
          header: 'BERKAS',
          headerClassName: 'w-28',
          cellClassName: 'text-center',
          render: (item) =>
            item.filePdfUrl ? (
              <a
                href={item.filePdfUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-lpm-blue-50 text-lpm-blue-800 hover:bg-lpm-blue-700 hover:text-white border border-lpm-blue-200 font-medium transition-all"
              >
                <ArrowDownTrayIcon className="w-4 h-4" aria-hidden="true" />
                Unduh
              </a>
            ) : (
              '-'
            ),
        },
        {
          key: 'aksi',
          header: 'AKSI',
          headerClassName: 'w-28',
          cellClassName: 'text-center',
          render: (item) =>
            bolehMenulis ? (
              <div className="inline-flex items-center gap-2">
                <Link
                  to={`/admin/arsip-dokumen/edit/${item.id}`}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-[8px] bg-lpm-blue-50 text-lpm-blue-900 hover:bg-lpm-blue-900 hover:text-white border border-lpm-blue-200 transition-all shadow-2xs"
                  title="Sunting Dokumen"
                  aria-label={`Sunting ${item.judul}`}
                >
                  <PencilSquareIcon className="w-4 h-4" aria-hidden="true" />
                </Link>
                <button
                  type="button"
                  onClick={() => setAkanDihapus(item)}
                  disabled={deletingId === item.id}
                  title="Hapus Dokumen"
                  aria-label={`Hapus ${item.judul}`}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-[8px] bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white border border-rose-200 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  <TrashIcon className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            ) : (
              'Hanya Baca'
            ),
        },
      ]}
      rows={filtered}
      rowKey={(item) => String(item.id)}
      minTableWidth="min-w-[1560px]"
      loading={loading}
      error={error}
      onRetry={loadData}
      emptyMessage="Belum ada dokumen yang diunggah."
      noResultMessage="Tidak ditemukan dokumen yang cocok dengan filter atau kata kunci."
      hasActiveFilter={adaFilterAktif}
      />

      <NotificationModal
        isOpen={Boolean(akanDihapus)}
        type="confirm"
        title="Hapus Dokumen?"
        message={`Dokumen «${akanDihapus?.judul ?? ''}» akan dihapus permanen dari arsip LPM. Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Ya, Hapus Dokumen"
        cancelLabel="Batal"
        onConfirm={jalankanHapus}
        onClose={() => setAkanDihapus(null)}
        loading={deletingId !== null}
      />

      <NotificationModal
        isOpen={Boolean(galat)}
        type="error"
        title={galat?.title}
        message={galat?.message ?? ''}
        details={galat?.details}
        code={galat?.code}
        onClose={() => setGalat(null)}
      />
    </>
  );
};

export default DokumenBaruPage;
