import React, { useState, useEffect, useRef } from 'react';
import {
  PhotoIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
  XCircleIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import {
  LpmBannerSliderItem,
  fetchAdminSliders,
  createAdminSlider,
  updateAdminSlider,
  deleteAdminSlider,
} from '../services/api';

export const ManajemenSliderLpm: React.FC = () => {
  const [sliders, setSliders] = useState<LpmBannerSliderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [judul, setJudul] = useState('');
  const [subjudul, setSubjudul] = useState('');
  const [gambarUrl, setGambarUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [urutan, setUrutan] = useState(0);
  const [active, setActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete State
  const [itemToDelete, setItemToDelete] = useState<LpmBannerSliderItem | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadSliders = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchAdminSliders();
      if (res.data.success) {
        setSliders(res.data.data);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal memuat daftar foto slider.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSliders();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setJudul('');
    setSubjudul('');
    setGambarUrl('');
    setLinkUrl('');
    setUrutan(0);
    setActive(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (item: LpmBannerSliderItem) => {
    setEditingId(item.id);
    setJudul(item.judul);
    setSubjudul(item.subjudul || '');
    setGambarUrl(item.gambarUrl);
    setLinkUrl(item.linkUrl || '');
    setUrutan(item.urutan);
    setActive(item.active);
    setIsModalOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Mohon pilih file gambar yang valid (JPG, PNG, atau WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file maksimal 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setGambarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!judul.trim()) {
      alert('Judul slider wajib diisi.');
      return;
    }

    if (!gambarUrl.trim()) {
      alert('Silakan unggah foto banner slider terlebih dahulu.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: Partial<LpmBannerSliderItem> = {
        judul: judul.trim(),
        subjudul: subjudul.trim() || null,
        gambarUrl,
        linkUrl: linkUrl.trim() || null,
        urutan: Number(urutan) || 0,
        active,
      };

      if (editingId) {
        await updateAdminSlider(editingId, payload);
      } else {
        await createAdminSlider(payload);
      }

      setIsModalOpen(false);
      resetForm();
      await loadSliders();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Gagal menyimpan foto slider.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (item: LpmBannerSliderItem) => {
    try {
      await updateAdminSlider(item.id, { active: !item.active });
      await loadSliders();
    } catch {
      alert('Gagal memperbarui status slider.');
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteAdminSlider(itemToDelete.id);
      setItemToDelete(null);
      await loadSliders();
    } catch {
      alert('Gagal menghapus foto slider.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[#CBD5E1] bg-white p-6 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <PhotoIcon className="w-7 h-7 text-[#166534]" />
            <span>Manajemen Slider Hero</span>
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Kelola foto banner, judul slide, dan urutan rotasi tampilan pada halaman depan publik LPM UNUSU.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-[#166534] hover:bg-[#14532D] text-white px-4 py-2.5 text-xs sm:text-sm font-bold shadow-md transition-all self-start sm:self-auto"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Tambah Foto Slider</span>
        </button>
      </div>

      {/* Konten Utama */}
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-xs text-slate-400">
          Memuat data foto slider hero...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-xs text-rose-700">
          {error}
        </div>
      ) : sliders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-3">
          <PhotoIcon className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900">Belum Ada Foto Slider Custom</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Halaman depan saat ini menampilkan foto banner bawaan sistem. Klik tombol di atas untuk mengunggah foto kegiatan penjaminan mutu kampus.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sliders.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-[#CBD5E1] bg-white overflow-hidden shadow-2xs flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                {/* Gambar Pratinjau */}
                <div className="relative aspect-[16/9] bg-slate-100 overflow-hidden border-b border-slate-100">
                  <img
                    src={item.gambarUrl}
                    alt={item.judul}
                    className="w-full h-full object-cover"
                  />
                  <span
                    className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      item.active
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-700 text-slate-200'
                    }`}
                  >
                    {item.active ? 'Aktif' : 'Nonaktif'}
                  </span>
                  <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded bg-black/60 text-white text-[10px] font-mono">
                    Urutan: {item.urutan}
                  </span>
                </div>

                {/* Deskripsi Teks */}
                <div className="p-4 space-y-1.5">
                  <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{item.judul}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2">{item.subjudul || 'Tidak ada subjudul.'}</p>
                  {item.linkUrl && (
                    <p className="text-[11px] font-mono text-emerald-800 truncate pt-1">
                      Tautan: {item.linkUrl}
                    </p>
                  )}
                </div>
              </div>

              {/* Tombol Aksi */}
              <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleStatus(item)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                    item.active
                      ? 'text-amber-800 bg-amber-50 hover:bg-amber-100'
                      : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100'
                  }`}
                >
                  {item.active ? <XCircleIcon className="w-3.5 h-3.5" /> : <CheckCircleIcon className="w-3.5 h-3.5" />}
                  <span>{item.active ? 'Nonaktifkan' : 'Aktifkan'}</span>
                </button>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEditModal(item)}
                    className="p-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                    title="Edit Slider"
                  >
                    <PencilSquareIcon className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setItemToDelete(item)}
                    className="p-1.5 rounded-lg border border-rose-200 bg-white text-rose-600 hover:bg-rose-50"
                    title="Hapus Slider"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form Tambah / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingId ? 'Edit Foto Slider Hero' : 'Tambah Foto Slider Hero'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Judul Banner <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Rapat Koordinasi Audit Mutu Internal"
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-[#166534] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Subjudul / Keterangan Singkat
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Menjamin siklus PPEPP berjalan optimal di seluruh fakultas"
                  value={subjudul}
                  onChange={(e) => setSubjudul(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-[#166534] focus:outline-none"
                />
              </div>

              {/* Area Upload File Gambar Langsung */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Unggah Berkas Gambar <span className="text-rose-500">*</span>
                </label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors">
                      <ArrowUpTrayIcon className="w-4 h-4 text-emerald-800" />
                      <span>Pilih Berkas Foto</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[11px] text-slate-400">Format: JPG, PNG, atau WebP (Maks 5 MB)</span>
                  </div>

                  {gambarUrl && (
                    <div className="relative mt-2 aspect-[16/9] w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                      <img src={gambarUrl} alt="Pratinjau" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setGambarUrl('');
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="absolute top-2 right-2 rounded-full bg-rose-600 p-1 text-white shadow-md hover:bg-rose-700"
                        title="Hapus Pratinjau"
                      >
                        <XMarkIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tautan / URL Tujuan
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: /dokumen atau /ami"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-[#166534] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor Urutan
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={urutan}
                    onChange={(e) => setUrutan(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-[#166534] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="slider-active-check"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="rounded border-slate-300 text-[#166534] focus:ring-[#166534]"
                />
                <label htmlFor="slider-active-check" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Tampilkan pada slider hero halaman depan
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-[#166534] hover:bg-[#14532D] px-5 py-2 text-xs font-bold text-white shadow-md transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Foto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dialog Konfirmasi Hapus */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 text-center">
            <ExclamationTriangleIcon className="w-12 h-12 text-rose-500 mx-auto" />
            <h4 className="font-bold text-sm text-slate-900">Hapus Foto Slider Ini?</h4>
            <p className="text-xs text-slate-500">
              Foto "{itemToDelete.judul}" akan dihapus permanen dari rotasi hero slider halaman depan.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-bold text-white shadow-md"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManajemenSliderLpm;
