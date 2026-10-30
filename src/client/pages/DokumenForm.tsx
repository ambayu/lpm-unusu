import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  fetchDokumenMutuDetail,
  fetchStandar,
  createDokumenMutu,
  updateDokumenMutu,
  StandarItem,
} from '../services/api';
import { AdminPanelTemplate } from '../components/AdminPanelTemplate';
import { CardContainer } from '../components/CardContainer';
import {
  ArrowLeftIcon,
  CheckIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

export const DokumenFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [standarList, setStandarList] = useState<StandarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    standarId: '',
    kodeDokumen: '',
    judul: '',
    jenis: 'Standar',
    revisi: 0,
    tahun: 2026,
    filePath: '',
  });

  useEffect(() => {
    const promises: Promise<any>[] = [fetchStandar()];
    if (isEdit && id) {
      promises.push(fetchDokumenMutuDetail(id));
    }

    Promise.all(promises)
      .then(([stdRes, docRes]) => {
        setStandarList(stdRes.data.data);
        if (docRes) {
          const doc = docRes.data.data;
          setFormData({
            standarId: doc.standarId ? String(doc.standarId) : '',
            kodeDokumen: doc.kodeDokumen || '',
            judul: doc.judul || '',
            jenis: doc.jenis || 'Standar',
            revisi: doc.revisi || 0,
            tahun: doc.tahun || 2026,
            filePath: doc.filePath || '',
          });
        }
      })
      .catch((err) => {
        console.error(err);
        setError(err.response?.data?.message || 'Gagal memuat data formulir dokumen mutu.');
      })
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        standarId: formData.standarId ? parseInt(formData.standarId) : undefined,
      };

      if (isEdit && id) {
        await updateDokumenMutu(id, payload);
      } else {
        await createDokumenMutu(payload);
      }
      navigate('/admin/dokumen');
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          `Gagal ${isEdit ? 'memperbarui' : 'menyimpan'} dokumen mutu.`
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminPanelTemplate
      title={isEdit ? 'Edit Dokumen Penjaminan Mutu' : 'Upload & Registrasi Dokumen Mutu'}
      description={
        isEdit
          ? `Perbarui metadata instrumen resmi, revisi, atau tautan berkas untuk ${formData.kodeDokumen || ''}.`
          : 'Daftarkan instrumen Buku Kebijakan, Manual Mutu PPEPP, Standar SPMI, atau SOP ke repositori resmi.'
      }
      actions={
        <Link
          to="/admin/dokumen"
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
            Memuat data formulir dokumen mutu...
          </div>
        </CardContainer>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 rounded-[12px] bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Form Section 1: Klasifikasi & Keterkaitan */}
          <CardContainer
            title="Klasifikasi & Keterkaitan Standar SPMI"
            subtitle="Kategori instrumen mutu dan relasinya terhadap butir standar PPEPP"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">
                  Jenis Instrumen Dokumen <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.jenis}
                  onChange={(e) => setFormData({ ...formData, jenis: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-[10px] border border-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 font-medium text-slate-800"
                >
                  <option value="Kebijakan">Buku Kebijakan SPMI</option>
                  <option value="Manual">Manual Mutu Siklus PPEPP</option>
                  <option value="Standar">Buku Standar SPMI</option>
                  <option value="SOP">Standar Operasional Prosedur (SOP)</option>
                  <option value="Formulir">Formulir / Instrumen Penilaian</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1 font-normal">
                  Pilih salah satu dari 5 rumpun instrumen mutu Dikti / BAN-PT.
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">
                  Standar SPMI Rujukan (Opsional)
                </label>
                <select
                  value={formData.standarId}
                  onChange={(e) => setFormData({ ...formData, standarId: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-[10px] border border-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 font-medium text-slate-800"
                >
                  <option value="">-- Tidak Terikat Butir Standar Tertentu --</option>
                  {standarList.map((s) => (
                    <option key={s.id} value={s.id}>
                      [{s.kode}] {s.nama} ({s.kategori})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1 font-normal">
                  Tautkan jika dokumen ini merupakan turunan langsung dari butir standar tertentu.
                </p>
              </div>
            </div>
          </CardContainer>

          {/* Form Section 2: Metadata Dokumen */}
          <CardContainer
            title="Metadata Berkas & Pengesahan"
            subtitle="Nomor kode arsip, judul lengkap, nomor revisi, dan berkas rujukan"
          >
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">
                    Kode Berkas Dokumen <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: DOC-SOP-001"
                    value={formData.kodeDokumen}
                    onChange={(e) => setFormData({ ...formData, kodeDokumen: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 rounded-[10px] border border-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 font-mono font-bold text-blue-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">
                    Nomor Revisi
                  </label>
                  <input
                    type="number"
                    value={formData.revisi}
                    onChange={(e) =>
                      setFormData({ ...formData, revisi: parseInt(e.target.value) || 0 })
                    }
                    className="w-full text-xs px-3.5 py-2.5 rounded-[10px] border border-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 font-mono text-slate-800"
                  />
                  <p className="text-[11px] text-slate-400 mt-1 font-normal">
                    0 untuk edisi perdana, bertambah sesuai revisi pengesahan.
                  </p>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">
                    Tahun Pengesahan
                  </label>
                  <input
                    type="number"
                    value={formData.tahun}
                    onChange={(e) =>
                      setFormData({ ...formData, tahun: parseInt(e.target.value) || 2026 })
                    }
                    className="w-full text-xs px-3.5 py-2.5 rounded-[10px] border border-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 text-slate-800 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">
                  Judul Dokumen Mutu Resmi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Standar Operasional Prosedur Pelaksanaan Audit Mutu Internal (SOP AMI)"
                  value={formData.judul}
                  onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-[10px] border border-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">
                  Tautan Berkas Digital (URL Dokumen / Cloud Storage PDF)
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/... atau https://unusu.ac.id/dokumen/sop-ami.pdf"
                  value={formData.filePath}
                  onChange={(e) => setFormData({ ...formData, filePath: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-[10px] border border-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 font-normal text-slate-800"
                />
                <p className="text-[11px] text-slate-400 mt-1 font-normal">
                  Sertakan URL publik atau repository cloud agar sivitas dapat langsung mengunduh berkas.
                </p>
              </div>
            </div>
          </CardContainer>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-2">
            <Link
              to="/admin/dokumen"
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
              <span>{submitting ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Daftarkan Dokumen'}</span>
            </button>
          </div>
        </form>
      )}
    </AdminPanelTemplate>
  );
};
