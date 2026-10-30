import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  fetchAuditDetail,
  fetchStandar,
  createAudit,
  updateAudit,
  StandarItem,
} from '../services/api';
import { AdminPanelTemplate } from '../components/AdminPanelTemplate';
import { CardContainer } from '../components/CardContainer';
import {
  ArrowLeftIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

export const AmiFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [standarList, setStandarList] = useState<StandarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    periodeId: 1,
    standarId: '',
    auditee: '',
    auditor: '',
    hasil: 'SESUAI',
    deskripsi: '',
    rekomendasi: '',
  });

  useEffect(() => {
    const promises: Promise<any>[] = [fetchStandar()];
    if (isEdit && id) {
      promises.push(fetchAuditDetail(id));
    }

    Promise.all(promises)
      .then(([stdRes, auditRes]) => {
        setStandarList(stdRes.data.data);
        if (auditRes) {
          const audit = auditRes.data.data;
          setFormData({
            periodeId: audit.periodeId || 1,
            standarId: audit.standarId ? String(audit.standarId) : '',
            auditee: audit.auditee || '',
            auditor: audit.auditor || '',
            hasil: audit.hasil || 'SESUAI',
            deskripsi: audit.deskripsi || '',
            rekomendasi: audit.rekomendasi || '',
          });
        }
      })
      .catch((err) => {
        console.error(err);
        setError(err.response?.data?.message || 'Gagal memuat data evaluasi audit AMI.');
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
        periodeId: Number(formData.periodeId),
        standarId: Number(formData.standarId),
      };

      if (isEdit && id) {
        await updateAudit(id, payload);
      } else {
        await createAudit(payload);
      }
      navigate('/admin/ami');
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          `Gagal ${isEdit ? 'memperbarui' : 'menyimpan'} temuan audit AMI.`
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminPanelTemplate
      title={isEdit ? 'Edit Catatan Temuan Audit AMI' : 'Catat Temuan Audit AMI Baru'}
      description={
        isEdit
          ? 'Perbarui evaluasi kepatuhan, uraian bukti lapangan, atau rekomendasi tindak lanjut (RTL).'
          : 'Formulir pencatatan hasil verifikasi lapangan audit mutu internal per program studi atau unit kerja.'
      }
      actions={
        <Link
          to="/admin/ami"
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
            Memuat data formulir audit AMI...
          </div>
        </CardContainer>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 rounded-[12px] bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Form Section 1: Konfigurasi Penugasan Audit */}
          <CardContainer
            title="Konfigurasi Penugasan & Standar yang Diuji"
            subtitle="Unit auditee, auditor pemeriksa, dan butir standar rujukan evaluasi"
          >
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">
                  Standar SPMI yang Diverifikasi <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.standarId}
                  onChange={(e) => setFormData({ ...formData, standarId: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-[10px] border border-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 font-medium text-slate-800"
                >
                  <option value="">-- Pilih Butir Standar SPMI --</option>
                  {standarList.map((s) => (
                    <option key={s.id} value={s.id}>
                      [{s.kode}] {s.nama} ({s.kategori})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">
                    Auditee (Unit Kerja / Program Studi) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: S1 Sistem Informasi / Fakultas Sains"
                    value={formData.auditee}
                    onChange={(e) => setFormData({ ...formData, auditee: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 rounded-[10px] border border-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 font-semibold text-slate-800"
                  />
                  <p className="text-[11px] text-slate-400 mt-1 font-normal">
                    Nama unit kerja atau program studi yang diaudit.
                  </p>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">
                    Nama Auditor Penjamin Mutu <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nama lengkap dan gelar tim auditor..."
                    value={formData.auditor}
                    onChange={(e) => setFormData({ ...formData, auditor: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 rounded-[10px] border border-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 font-semibold text-slate-800"
                  />
                  <p className="text-[11px] text-slate-400 mt-1 font-normal">
                    Auditor internal bersertifikat yang ditugaskan LPM.
                  </p>
                </div>
              </div>
            </div>
          </CardContainer>

          {/* Form Section 2: Hasil Evaluasi & Bukti Lapangan */}
          <CardContainer
            title="Hasil Verifikasi Lapangan & Rekomendasi"
            subtitle="Tingkat ketercapaian mutu, temuan fakta, dan rekomendasi tindak lanjut"
          >
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">
                  Tingkat Kepatuhan / Hasil Verifikasi Mutu <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.hasil}
                  onChange={(e) => setFormData({ ...formData, hasil: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-[10px] border border-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 font-bold text-blue-900"
                >
                  <option value="TERLAMPAUI">TERLAMPAUI — Melampaui Standar Nasional (Peningkatan Kaizen)</option>
                  <option value="SESUAI">SESUAI — Memenuhi 100% Tolok Ukur Standar SPMI</option>
                  <option value="OBSERVASI">OBSERVASI — Catatan Potensi Peningkatan Tanpa Pelanggaran</option>
                  <option value="KTS_MINOR">KTS MINOR — Ketidaksesuaian Administratif / Prosedural Ringan</option>
                  <option value="KTS_MAYOR">KTS MAYOR — Ketidaksesuaian Sistemik / Substansi Tridharma</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">
                  Uraian Temuan / Bukti Lapangan <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Deskripsikan fakta lapangan, data instrumen yang diverifikasi, atau bukti fisik dokumen..."
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  className="w-full text-xs p-3.5 rounded-[10px] border border-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 leading-relaxed font-normal text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">
                  Rekomendasi Tindak Lanjut (RTL) / Rencana Perbaikan
                </label>
                <textarea
                  rows={3}
                  placeholder="Rekomendasi langkah koreksi yang harus dieksekusi auditee untuk dibahas pada forum Rapat Tinjauan Manajemen (RTM)..."
                  value={formData.rekomendasi}
                  onChange={(e) => setFormData({ ...formData, rekomendasi: e.target.value })}
                  className="w-full text-xs p-3.5 rounded-[10px] border border-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 leading-relaxed font-normal text-slate-800"
                />
              </div>
            </div>
          </CardContainer>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-2">
            <Link
              to="/admin/ami"
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
              <span>{submitting ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Catat Temuan AMI'}</span>
            </button>
          </div>
        </form>
      )}
    </AdminPanelTemplate>
  );
};
