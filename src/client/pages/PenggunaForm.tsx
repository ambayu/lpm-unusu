import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FormPageTemplate } from '../components/FormPageTemplate';
import { CardContainer } from '../components/CardContainer';
import { useAuth } from '../context/AuthContext';
import {
  fetchRbacPengguna,
  fetchRbacPeran,
  createRbacPengguna,
  updateRbacPengguna,
  type RbacPeran,
} from '../services/api';
import { UserCircleIcon } from '@heroicons/react/24/outline';

/**
 * PenggunaFormPage — halaman penuh tambah/ubah pengguna LPM.
 *
 * Rute: `/admin/pengguna/tambah` dan `/admin/pengguna/edit/:id`.
 *
 * Peran yang dipilih di sini adalah PERAN LPM (admin / dosen / mahasiswa),
 * bukan peran SSO mentah. Izin pengguna diturunkan dari peran tersebut —
 * itulah sebabnya formulir memakai `peran: string[]`, bukan `ssoRole`.
 */
export const PenggunaFormPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const { bisa } = useAuth();
  const bolehSimpan = isEdit ? bisa('pengguna:update') : bisa('pengguna:create');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sukses, setSukses] = useState<string | null>(null);
  const [opsiPeran, setOpsiPeran] = useState<RbacPeran[]>([]);

  const [formData, setFormData] = useState({
    userId: '' as string,
    username: '',
    nama: '',
    email: '',
    ssoRole: '',
    status: 'Aktif',
    peran: [] as string[],
  });

  // Muat daftar peran (sumber: tabel lpm_roles via API).
  useEffect(() => {
    let aktif = true;
    fetchRbacPeran()
      .then((res) => {
        if (!aktif || !res.data?.success) return;
        setOpsiPeran(res.data.data);
      })
      .catch(() => {
        /* dibiarkan kosong — peringatan ditampilkan bila tidak ada peran */
      });
    return () => {
      aktif = false;
    };
  }, []);

  // Mode ubah: muat detail pengguna dari API RBAC.
  useEffect(() => {
    let aktif = true;
    setLoading(true);

    const muat = async () => {
      if (!isEdit || !id) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetchRbacPengguna();
        if (!aktif) return;
        const daftar = res.data?.data ?? [];
        const pengguna = daftar.find((u) => String(u.id) === String(id));
        if (!pengguna) {
          setError('Pengguna tidak ditemukan. Mungkin sudah dihapus.');
          return;
        }
        setFormData({
          userId: String(pengguna.userId ?? ''),
          username: pengguna.username,
          nama: pengguna.nama,
          email: pengguna.email || '',
          ssoRole: pengguna.ssoRole || '',
          status: pengguna.status || 'Aktif',
          peran: pengguna.peran,
        });
      } catch (err: any) {
        if (aktif) {
          setError(err?.response?.data?.message || err.message || 'Gagal memuat detail pengguna.');
        }
      } finally {
        if (aktif) setLoading(false);
      }
    };

    muat();
    return () => {
      aktif = false;
    };
  }, [id, isEdit]);

  const togglePeran = (kode: string) => {
    setFormData((prev) => ({
      ...prev,
      peran: prev.peran.includes(kode)
        ? prev.peran.filter((p) => p !== kode)
        : [...prev.peran, kode],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSukses(null);
    setError(null);

    if (formData.peran.length === 0) {
      setError('Pilih minimal satu peran. Izin pengguna diturunkan dari peran yang diberikan.');
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit && id) {
        await updateRbacPengguna(id, {
          nama: formData.nama,
          email: formData.email || null,
          ssoRole: formData.ssoRole || null,
          status: formData.status,
          peran: formData.peran,
        });
        setSukses(`Perubahan data pengguna "${formData.nama}" berhasil disimpan.`);
      } else {
        const userIdNum = Number(formData.userId);
        if (!Number.isFinite(userIdNum) || userIdNum <= 0) {
          throw new Error('ID pengguna ONE UNUSU wajib berupa angka positif.');
        }
        await createRbacPengguna({
          userId: userIdNum,
          username: formData.username,
          nama: formData.nama,
          email: formData.email || null,
          ssoRole: formData.ssoRole || null,
          status: formData.status,
          peran: formData.peran,
        });
        setSukses(`Pengguna "${formData.nama}" berhasil ditambahkan.`);
        setFormData({
          userId: '',
          username: '',
          nama: '',
          email: '',
          ssoRole: '',
          status: 'Aktif',
          peran: [],
        });
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormPageTemplate
      title={isEdit ? 'Edit Pengguna LPM' : 'Tambah Pengguna Baru'}
      description="Akun pengguna LPM UNUSU terhubung langsung dengan ONE UNUSU SSO. Izin akses diturunkan dari peran yang dipilih."
      badge={
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-lpm-blue-50 border border-lpm-blue-200 text-[10px] font-bold uppercase tracking-wider text-lpm-blue-900">
          <UserCircleIcon className="w-3.5 h-3.5" aria-hidden="true" />
          Tata Kelola
        </span>
      }
      backTo="/admin/pengguna"
      backLabel="Kembali"
      isEdit={isEdit}
      submitLabel={isEdit ? 'Simpan Perubahan' : 'Buat Pengguna'}
      submitting={submitting}
      error={error}
      onSubmit={handleSubmit}
      accentClassName="bg-lpm-blue-900 hover:bg-lpm-blue-950"
    >
      {sukses && (
        <div
          role="status"
          className="p-4 rounded-[12px] bg-lpm-blue-50 border border-lpm-blue-200 text-lpm-blue-800 text-xs font-semibold"
        >
          {sukses}
        </div>
      )}

      {!bolehSimpan && (
        <div className="p-4 rounded-[12px] bg-lpm-yellow-400 border border-lpm-yellow-400 text-lpm-blue-900 text-xs font-semibold">
          Anda tidak memiliki izin untuk menambah atau mengubah pengguna LPM.
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-xs text-slate-500 font-medium">
          Memuat detail pengguna...
        </div>
      ) : (
        <>
          <CardContainer
            title="Identitas Pengguna"
            subtitle="Data ini mengikuti akun ONE UNUSU — username biasanya NIDN atau NIM."
          >
            <div className="space-y-3.5">
              <div>
                <label htmlFor="pengguna-userid" className="block text-xs font-semibold text-slate-700 mb-1">
                  ID Pengguna ONE UNUSU {!isEdit && <span className="text-rose-500">*</span>}
                </label>
                <input
                  id="pengguna-userid"
                  type="number"
                  required={!isEdit}
                  disabled={isEdit}
                  min={1}
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  placeholder="Contoh: 12"
                  className="w-full px-3 py-2 min-h-[44px] text-xs rounded-[10px] border border-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-lpm-blue-900/20 focus:border-lpm-blue-900 disabled:bg-slate-100 disabled:text-slate-500"
                />
              </div>

              <div>
                <label htmlFor="pengguna-username" className="block text-xs font-semibold text-slate-700 mb-1">
                  Username / NIDN / NIM {!isEdit && <span className="text-rose-500">*</span>}
                </label>
                <input
                  id="pengguna-username"
                  type="text"
                  required={!isEdit}
                  disabled={isEdit}
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Contoh: 0102030405"
                  className="w-full px-3 py-2 min-h-[44px] text-xs rounded-[10px] border border-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-lpm-blue-900/20 focus:border-lpm-blue-900 disabled:bg-slate-100 disabled:text-slate-500"
                />
              </div>

              <div>
                <label htmlFor="pengguna-nama" className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap &amp; Gelar <span className="text-rose-500">*</span>
                </label>
                <input
                  id="pengguna-nama"
                  type="text"
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Contoh: Dr. H. Ahmad Farhan, M.Kom."
                  className="w-full px-3 py-2 min-h-[44px] text-xs rounded-[10px] border border-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-lpm-blue-900/20 focus:border-lpm-blue-900"
                />
              </div>

              <div>
                <label htmlFor="pengguna-email" className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Institusi
                </label>
                <input
                  id="pengguna-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Contoh: dosen@unusu.ac.id"
                  className="w-full px-3 py-2 min-h-[44px] text-xs rounded-[10px] border border-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-lpm-blue-900/20 focus:border-lpm-blue-900"
                />
              </div>
            </div>
          </CardContainer>

          <CardContainer
            title="Peran LPM & Status"
            subtitle="Izin akses pengguna mengikuti peran yang dipilih. Satu pengguna boleh memiliki lebih dari satu peran."
          >
            <div className="space-y-3.5">
              <fieldset>
                <legend className="block text-xs font-semibold text-slate-700 mb-2">
                  Peran <span className="text-rose-500">*</span>
                </legend>
                {opsiPeran.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">
                    Daftar peran belum tersedia. Pastikan migrasi & seeder RBAC sudah dijalankan.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {opsiPeran.map((p) => {
                      const dipilih = formData.peran.includes(p.kode);
                      return (
                        <label
                          key={p.kode}
                          className={`flex items-start gap-2.5 p-3 rounded-[10px] border cursor-pointer transition ${
                            dipilih
                              ? 'border-lpm-blue-900 bg-lpm-blue-50'
                              : 'border-[#CBD5E1] bg-white hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={dipilih}
                            onChange={() => togglePeran(p.kode)}
                            className="mt-0.5 w-4 h-4 accent-lpm-blue-900"
                          />
                          <span>
                            <span className="block text-xs font-bold text-slate-900">{p.nama || p.label}</span>
                            <span className="block text-[11px] text-slate-500 leading-snug">
                              {p.deskripsi || p.description || `${p.permissionsCount} izin`}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </fieldset>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="pengguna-sso-role" className="block text-xs font-semibold text-slate-700 mb-1">
                    Peran SSO (metadata)
                  </label>
                  <input
                    id="pengguna-sso-role"
                    type="text"
                    value={formData.ssoRole}
                    onChange={(e) => setFormData({ ...formData, ssoRole: e.target.value.toUpperCase() })}
                    placeholder="SUPERADMIN / ADMIN_LPM / DOSEN / MAHASISWA"
                    className="w-full px-3 py-2 min-h-[44px] text-xs rounded-[10px] border border-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-lpm-blue-900/20 focus:border-lpm-blue-900"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Hanya untuk pencocokan otomatis. Otorisasi tetap memakai izin.
                  </p>
                </div>

                <div>
                  <label htmlFor="pengguna-status" className="block text-xs font-semibold text-slate-700 mb-1">
                    Status Akun
                  </label>
                  <select
                    id="pengguna-status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 min-h-[44px] text-xs border border-[#CBD5E1] rounded-[10px] bg-white focus:outline-none focus:ring-2 focus:ring-lpm-blue-900/20 focus:border-lpm-blue-900"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>
            </div>
          </CardContainer>
        </>
      )}
    </FormPageTemplate>
  );
};

export default PenggunaFormPage;
