import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  fetchStandarDetail,
  createStandar,
  updateStandar,
} from '../services/api';
import { AdminPanelTemplate } from '../components/AdminPanelTemplate';
import { CardContainer } from '../components/CardContainer';
import {
  AcademicCapIcon,
  ArrowLeftIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

export const StandarFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    kode: '',
    nama: '',
    kategori: 'Pendidikan',
    pernyataan: '',
    indikator: '',
    target: '',
    tahun: 2026,
  });

  useEffect(() => {
    if (isEdit && id) {
      setLoading(true);
      fetchStandarDetail(id)
        .then((res) => {
          const item = res.data.data;
          setFormData({
            kode: item.kode || '',
            nama: item.nama || '',
            kategori: item.kategori || 'Pendidikan',
            pernyataan: item.pernyataan || '',
            indikator: item.indikator || '',
            target: item.target || '',
            tahun: item.tahun || 2026,
          });
        })
        .catch((err) => {
          console.error(err);
          setError(err.response?.data?.message || 'Gagal memuat detail standar SPMI.');
        })
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (isEdit && id) {
        await updateStandar(id, formData);
      } else {
        await createStandar(formData);
      }
      navigate('/admin/standar');
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          `Gagal ${isEdit ? 'memperbarui' : 'menyimpan'} standar SPMI.`
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminPanelTemplate
      title={isEdit ? 'Edit Butir Standar SPMI' : 'Tambah Standar SPMI Baru'}
      description={
        isEdit
          ? `Perbarui formulasi butir komitmen mutu dan kriteria penilaian untuk kode ${formData.kode || ''}.`
          : 'Formulir penetapan butir standar penjaminan mutu baru pada siklus mutu PPEPP UNUSU.'
      }
      actions={
        <Link
          to="/admin/standar"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 h-[42px] rounded-[12px] border border-[#CBD5E1] bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold shadow-2xs transition-all active:scale-98"
        >
          <ArrowLeftIcon className="w-4 h-4 text-slate-500" />
          <span>Kembali</span>
        </Link>
      }
    >
      {loading ? (
        <CardContainer>
          <div className="py-16 text-center text-xs text-slate-500 font-medium">
            Memuat detail data standar SPMI...
          </div>
        </CardContainer>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 rounded-[12px] bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Form Section 1: Identitas Standar */}
          <CardContainer
            title="Identitas & Klasifikasi Standar"
            subtitle="Kode unik dan rumpun kriteria standar penjaminan mutu SPMI"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">
                  Kode Standar <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: STD-PEND-01"
                  value={formData.kode}
                  onChange={(e) => setFormData({ ...formData, kode: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-[10px] border border-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 font-mono font-bold text-blue-900"
                />
                <p className="text-[11px] text-slate-400 mt-1 font-normal">
                  Gunakan format standar instrumen, misal STD-PEND, STD-PENEL, STD-PKM.
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">
                  Kategori Standar <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.kategori}
                  onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-[10px] border border-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 font-medium text-slate-800"
                >
                  <option value="Pendidikan">Pendidikan (Tridharma)</option>
                  <option value="Penelitian">Penelitian (Tridharma)</option>
                  <option value="Pengabdian">Pengabdian Kepada Masyarakat (PKM)</option>
                  <option value="Tata Kelola">Tata Kelola & Kelembagaan</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1 font-normal">
                  Rumpun aspek standar penjaminan mutu internal.
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">
                  Tahun Siklus Mutu
                </label>
                <input
                  type="number"
                  value={formData.tahun}
                  onChange={(e) =>
                    setFormData({ ...formData, tahun: parseInt(e.target.value) || 2026 })
                  }
                  className="w-full text-xs px-3.5 py-2.5 rounded-[10px] border border-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 font-medium text-slate-800"
                />
                <p className="text-[11px] text-slate-400 mt-1 font-normal">
                  Tahun berlakunya siklus penetapan PPEPP.
                </p>
              </div>

              <div className="md:col-span-3">
                <label className="block text-slate-700 font-semibold mb-1.5">
                  Nama Standar <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Standar Kompetensi Lulusan & Capaian Pembelajaran Lulusan (CPL)"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-[10px] border border-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 font-semibold text-slate-900"
                />
              </div>
            </div>
          </CardContainer>

          {/* Form Section 2: Butir Komitmen & Indikator */}
          <CardContainer
            title="Pernyataan Komitmen & Tolok Ukur"
            subtitle="Uraian komitmen mutu yang harus dicapai beserta target indikator ketercapaian"
          >
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">
                  Pernyataan Butir Standar <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Deskripsikan pernyataan standar mutu SPMI secara eksplisit dan terukur..."
                  value={formData.pernyataan}
                  onChange={(e) => setFormData({ ...formData, pernyataan: e.target.value })}
                  className="w-full text-xs p-3.5 rounded-[10px] border border-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 font-normal leading-relaxed text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">
                    Target Capaian Mutu
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 100% Lulusan Tepat Waktu (<= 8 Semester)"
                    value={formData.target}
                    onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 rounded-[10px] border border-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 font-medium text-slate-800"
                  />
                  <p className="text-[11px] text-slate-400 mt-1 font-normal">
                    Kuantifikasi capaian yang diharapkan universitas / program studi.
                  </p>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">
                    Indikator Ketercapaian
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Persentase kelulusan tepat waktu terverifikasi di SIAKAD"
                    value={formData.indikator}
                    onChange={(e) => setFormData({ ...formData, indikator: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 rounded-[10px] border border-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 font-medium text-slate-800"
                  />
                  <p className="text-[11px] text-slate-400 mt-1 font-normal">
                    Tolok ukur bukti verifikasi pada saat pelaksanaan AMI.
                  </p>
                </div>
              </div>
            </div>
          </CardContainer>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-2">
            <Link
              to="/admin/standar"
              className="inline-flex items-center justify-center px-5 py-2.5 h-[42px] rounded-[12px] border border-[#CBD5E1] bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold transition-all shadow-2xs active:scale-98"
            >
              Batal
            </Link>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2.5 px-6 py-2.5 h-[42px] rounded-[12px] bg-blue-900 hover:bg-blue-950 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer active:scale-98"
            >
              <CheckIcon className="w-5 h-5 text-amber-400" />
              <span>{submitting ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Buat Standar SPMI'}</span>
            </button>
          </div>
        </form>
      )}
    </AdminPanelTemplate>
  );
};
