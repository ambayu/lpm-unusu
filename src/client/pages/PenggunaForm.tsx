import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FormPageTemplate } from '../components/FormPageTemplate';
import { CardContainer } from '../components/CardContainer';
import { TabelPilihPengguna } from '../components/TabelPilihPengguna';
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
 * Mode TAMBAH langsung menampilkan tabel direktori ONE UNUSU lengkap dengan
 * pencarian dan filter peran/fakultas/prodi. Admin mencentang beberapa orang
 * sekaligus, memilih peran bawaan, lalu menyimpan — server memverifikasi ulang
 * setiap id ke ONE UNUSU. Setelah berhasil, halaman berpindah ke daftar
 * pengguna agar peran tiap orang dapat disesuaikan lewat modal.
 *
 * Mode UBAH hanya mengatur peran dan status; biodata tetap milik ONE UNUSU.
 */
export const PenggunaFormPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const { bisa } = useAuth();
  const bolehSimpan = isEdit ? bisa('pengguna:update') : bisa('pengguna:create');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sukses, setSukses] = useState<string | null>(null);
  const [opsiPeran, setOpsiPeran] = useState<RbacPeran[]>([]);

  // Mode tambah: id yang dicentang pada tabel.
  const [terpilih, setTerpilih] = useState<number[]>([]);

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

  const isTargetSuperadmin =
    formData.ssoRole === 'SUPERADMIN' ||
    formData.peran.includes('SUPERADMIN') ||
    formData.username === 'admin';

  const togglePeran = (kode: string) => {
    // Guard: SUPERADMIN tidak boleh dilepas
    if (isTargetSuperadmin && kode === 'SUPERADMIN') return;

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
          status: isTargetSuperadmin ? 'Aktif' : formData.status,
          peran: isTargetSuperadmin && !formData.peran.includes('SUPERADMIN')
            ? [...formData.peran, 'SUPERADMIN']
            : formData.peran,
        });
        setSukses(`Perubahan data pengguna "${formData.nama}" berhasil disimpan.`);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Simpan hasil centang tabel.
   *
   * Peran TIDAK dikirim: pendaftaran dan penugasan peran dipisah. Pengguna
   * tersimpan tanpa peran, lalu Admin menetapkannya satu per satu lewat tombol
   * "Atur Peran" pada daftar pengguna.
   */
  const simpanDariTabel = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSukses(null);

    if (terpilih.length === 0) {
      setError('Centang minimal satu pengguna pada tabel direktori ONE UNUSU.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await createRbacPengguna({
        userIds: terpilih,
      });
      setTerpilih([]);
      // Pindah ke daftar pengguna; peran tiap orang disesuaikan lewat modal di sana.
      navigate('/admin/pengguna', {
        replace: true,
        state: { pesan: res.data?.message || 'Pengguna berhasil didaftarkan ke LPM.' },
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Gagal mendaftarkan pengguna.');
      setSubmitting(false);
    }
  };

  // ---------- Mode TAMBAH: tabel direktori bercentang ----------
  if (!isEdit) {
    return (
      <FormPageTemplate
        title="Tambah Pengguna LPM"
        description="Centang pengguna dari direktori ONE UNUSU. Peran ditetapkan setelah penyimpanan melalui tombol Atur Peran pada daftar pengguna."
        badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-lpm-blue-50 border border-lpm-blue-200 text-[10px] font-bold uppercase tracking-wider text-lpm-blue-900">
            <UserCircleIcon className="w-3.5 h-3.5" aria-hidden="true" />
            Tata Kelola
          </span>
        }
        backTo="/admin/pengguna"
        backLabel="Kembali"
        submitLabel={
          terpilih.length > 0 ? `Tambahkan ${terpilih.length} Pengguna` : 'Tambahkan Pengguna'
        }
        submitting={submitting}
        error={error}
        onSubmit={simpanDariTabel}
        accentClassName="bg-lpm-blue-900 hover:bg-lpm-blue-950"
      >
        {!bolehSimpan && (
          <div className="p-4 rounded-[12px] bg-lpm-yellow-400 border border-lpm-yellow-400 text-lpm-blue-900 text-xs font-semibold">
            Anda tidak memiliki izin untuk menambah pengguna LPM.
          </div>
        )}

        <CardContainer
          title="Direktori Pengguna ONE UNUSU"
          subtitle="Pilih satu atau beberapa orang sekaligus. Server memverifikasi ulang setiap pilihan ke ONE UNUSU sebelum menyimpan."
        >
          <TabelPilihPengguna terpilih={terpilih} onUbahTerpilih={setTerpilih} />
        </CardContainer>

      </FormPageTemplate>
    );
  }

  // ---------- Mode UBAH: biodata tetap baca-saja, peran & status bisa diubah ----------
  return (
    <FormPageTemplate
      title="Edit Pengguna LPM"
      description="Biodata civitas dikelola ONE UNUSU (baca-saja). Yang diubah di sini hanya peran LPM dan status keaktifan akun."
      badge={
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-lpm-blue-50 border border-lpm-blue-200 text-[10px] font-bold uppercase tracking-wider text-lpm-blue-900">
          <UserCircleIcon className="w-3.5 h-3.5" aria-hidden="true" />
          Tata Kelola
        </span>
      }
      backTo="/admin/pengguna"
      backLabel="Kembali"
      isEdit
      submitLabel="Simpan Perubahan"
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
          Anda tidak memiliki izin untuk mengubah pengguna LPM.
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-xs text-slate-500 font-medium">
          Memuat detail pengguna...
        </div>
      ) : (
        <>
          <CardContainer
            title="Identitas &amp; Biodata Civitas (ONE UNUSU SSO)"
            subtitle="Data identitas civitas disinkronkan secara otomatis dari SSO ONE UNUSU (Read-Only)."
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  NIDN / NIM
                </label>
                <input
                  type="text"
                  disabled
                  value={formData.username}
                  className="w-full px-4 py-3 min-h-[44px] text-xs font-mono rounded-[10px] border border-[#D8E5DC] bg-slate-100 text-slate-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  disabled
                  value={formData.nama}
                  className="w-full px-4 py-3 min-h-[44px] text-xs rounded-[10px] border border-[#D8E5DC] bg-slate-100 text-slate-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  disabled
                  value={formData.email || '—'}
                  className="w-full px-4 py-3 min-h-[44px] text-xs font-mono rounded-[10px] border border-[#D8E5DC] bg-slate-100 text-slate-600 cursor-not-allowed"
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Data biodata civitas dikelola terpusat di ONE UNUSU. Panel LPM hanya mengelola peran dan status keaktifan akun.
            </p>
          </CardContainer>

          <CardContainer
            title="Peran LPM &amp; Status"
            subtitle="Izin akses pengguna mengikuti peran yang dipilih. Satu pengguna boleh memiliki lebih dari satu peran."
          >
            <div className="space-y-3.5">
              <fieldset>
                <legend className="block text-xs font-semibold text-slate-700 mb-2">
                  Peran <span className="text-rose-500">*</span>
                </legend>
                {opsiPeran.length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic">
                    Daftar peran belum tersedia. Pastikan migrasi &amp; seeder RBAC sudah dijalankan.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {opsiPeran.map((p) => {
                      const dipilih = formData.peran.includes(p.kode);
                      const terkunci = isTargetSuperadmin && p.kode === 'SUPERADMIN';
                      return (
                        <label
                          key={p.kode}
                          className={`flex items-start gap-2.5 p-3 rounded-[10px] border transition ${
                            terkunci
                              ? 'border-[#D8E5DC] bg-slate-100 cursor-not-allowed'
                              : dipilih
                                ? 'border-[#166534] bg-[#F0FDF4] cursor-pointer'
                                : 'border-[#D8E5DC] bg-white hover:bg-slate-50 cursor-pointer'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={dipilih}
                            disabled={terkunci}
                            onChange={() => togglePeran(p.kode)}
                            className="mt-0.5 w-4 h-4 accent-[#166534]"
                          />
                          <span className="min-w-0">
                            <span className="block text-xs font-bold text-slate-900">
                              {p.nama || p.label}
                            </span>
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
                  <label htmlFor="pengguna-status" className="block text-xs font-semibold text-slate-700 mb-1">
                    Status Akun
                  </label>
                  <select
                    id="pengguna-status"
                    disabled={isTargetSuperadmin}
                    value={isTargetSuperadmin ? 'Aktif' : formData.status}
                    onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value }))}
                    className="w-full px-4 py-3 min-h-[44px] text-xs rounded-[10px] border border-[#D8E5DC] bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#166534] focus:border-[#166534] disabled:bg-slate-100 disabled:text-slate-600 disabled:cursor-not-allowed"
                  >
                    <option value="Aktif">Aktif</option>                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    {isTargetSuperadmin
                      ? 'Akun Superadmin selalu aktif dan tidak dapat dinonaktifkan.'
                      : 'Status dibaca ulang di setiap permintaan, jadi perubahan berlaku seketika.'}
                  </p>
                </div>
              </div>
            </div>
          </CardContainer>
        </>
      )}
    </FormPageTemplate>
  );
};
