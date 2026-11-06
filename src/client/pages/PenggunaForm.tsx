import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FormPageTemplate } from '../components/FormPageTemplate';
import { CardContainer } from '../components/CardContainer';
import { useAuth } from '../context/AuthContext';
import { SSO_ROLE_LABEL, LPM_APP_ROLES, fetchAppRoles } from '../services/api';
import { UserCircleIcon } from '@heroicons/react/24/outline';

interface UserDetail {
  id: number | string;
  username: string;
  nama: string;
  email?: string;
  role: string;
  ssoRole?: string;
  fakultas?: string;
  prodi?: string;
  status?: string;
}

/**
 * PenggunaFormPage — halaman penuh tambah/ubah pengguna LPM.
 *
 * Menggantikan modal `Modal Add / Edit User` pada `Users.tsx`.
 * Rute: `/admin/pengguna/tambah` dan `/admin/pengguna/edit/:id`.
 * Setelah berhasil menyimpan, pengguna tetap di halaman formulir.
 */
export const PenggunaFormPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const { user: currentUser } = useAuth();

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sukses, setSukses] = useState<string | null>(null);

  // Peran sah versi server; fallback konstanta lokal bila endpoint tak tersedia.
  const [roleOptions, setRoleOptions] = useState<{ code: string; label: string }[]>(
    LPM_APP_ROLES.map((code) => ({ code, label: SSO_ROLE_LABEL[code] || code }))
  );

  const [formData, setFormData] = useState({
    username: '',
    nama: '',
    email: '',
    role: 'dosen',
    ssoRole: 'DOSEN',
    fakultas: 'Fakultas Sains dan Teknologi',
    prodi: 'Sistem Informasi',
    status: 'Aktif',
  });

  const authHeaders = (): HeadersInit => {
    const token =
      localStorage.getItem('lpm_unusu_token') || localStorage.getItem('lpm_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Cakupan peran dari server.
  useEffect(() => {
    let aktif = true;
    fetchAppRoles()
      .then((res) => {
        if (!aktif || !res.data?.success) return;
        const allowed = res.data.data ?? [];
        if (allowed.length > 0) {
          setRoleOptions(allowed.map((item) => ({ code: item.code, label: item.label })));
        }
      })
      .catch(() => {
        /* fallback konstanta lokal sudah terpasang */
      });
    return () => {
      aktif = false;
    };
  }, []);

  // Mode ubah: muat detail pengguna.
  useEffect(() => {
    if (!isEdit || !id) return;
    let aktif = true;
    setLoading(true);
    fetch('/api/users', { credentials: 'include', headers: authHeaders() })
      .then((res) => {
        if (!res.ok) throw new Error('Gagal memuat daftar pengguna.');
        return res.json();
      })
      .then((json) => {
        if (!aktif) return;
        const daftar: UserDetail[] = json.data || [];
        const pengguna = daftar.find((u) => String(u.id) === String(id));
        if (!pengguna) {
          setError('Pengguna tidak ditemukan. Mungkin sudah dihapus.');
          return;
        }
        setFormData({
          username: pengguna.username,
          nama: pengguna.nama,
          email: pengguna.email || '',
          role: pengguna.role,
          ssoRole: pengguna.ssoRole || 'DOSEN',
          fakultas: pengguna.fakultas || '',
          prodi: pengguna.prodi || '',
          status: pengguna.status || 'Aktif',
        });
      })
      .catch((err: any) => {
        if (aktif) setError(err.message || 'Gagal memuat detail pengguna.');
      })
      .finally(() => {
        if (aktif) setLoading(false);
      });
    return () => {
      aktif = false;
    };
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSukses(null);
    setSubmitting(true);
    setError(null);

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...authHeaders(),
      };

      const url = isEdit && id ? `/api/users/${id}` : '/api/users';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers,
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Gagal menyimpan pengguna.');
      }

      if (isEdit) {
        setSukses(`Perubahan data pengguna "${formData.nama}" berhasil disimpan.`);
      } else {
        setSukses(`Pengguna "${formData.nama}" berhasil ditambahkan.`);
        setFormData({
          username: '',
          nama: '',
          email: '',
          role: 'dosen',
          ssoRole: 'DOSEN',
          fakultas: 'Fakultas Sains dan Teknologi',
          prodi: 'Sistem Informasi',
          status: 'Aktif',
        });
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setSubmitting(false);
    }
  };

  const isAdmin =
    currentUser?.ssoRole === 'SUPERADMIN' ||
    currentUser?.ssoRole === 'ADMIN_LPM';

  return (
    <FormPageTemplate
      title={isEdit ? 'Edit Pengguna LPM' : 'Tambah Pengguna Baru'}
      description="Akun pengguna LPM UNUSU terhubung langsung dengan ONE UNUSU SSO. Peran menentukan cakupan modul yang dapat diakses."
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

      {!isAdmin && (
        <div className="p-4 rounded-[12px] bg-lpm-yellow-400 border border-lpm-yellow-400 text-lpm-blue-900 text-xs font-semibold">
          Hanya Administrator LPM yang boleh menambah atau mengubah pengguna.
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
            subtitle="Username biasanya berupa NIDN atau NIM yang dipakai pada SSO kampus."
          >
            <div className="space-y-3.5">
              <div>
                <label htmlFor="pengguna-username" className="block text-xs font-semibold text-slate-700 mb-1">
                  Username / NIDN / NIM <span className="text-rose-500">*</span>
                </label>
                <input
                  id="pengguna-username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Contoh: 0102030405"
                  className="w-full px-3 py-2 min-h-[44px] text-xs rounded-[10px] border border-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-lpm-blue-900/20 focus:border-lpm-blue-900"
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
            title="Peran & Status"
            subtitle="Peran menentukan modul LPM yang dapat diakses pengguna ini."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="pengguna-sso-role" className="block text-xs font-semibold text-slate-700 mb-1">
                  Peran SSO (Cakupan LPM)
                </label>
                <select
                  id="pengguna-sso-role"
                  value={formData.ssoRole}
                  onChange={(e) => {
                    const ssoRole = e.target.value;
                    setFormData({
                      ...formData,
                      ssoRole,
                      role: ssoRole === 'DOSEN' ? 'dosen' : 'admin',
                    });
                  }}
                  className="w-full px-3 py-2 min-h-[44px] text-xs border border-[#CBD5E1] rounded-[10px] bg-white focus:outline-none focus:ring-2 focus:ring-lpm-blue-900/20 focus:border-lpm-blue-900"
                >
                  {roleOptions.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.label}
                    </option>
                  ))}
                </select>
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

              <div>
                <label htmlFor="pengguna-fakultas" className="block text-xs font-semibold text-slate-700 mb-1">
                  Fakultas
                </label>
                <input
                  id="pengguna-fakultas"
                  type="text"
                  value={formData.fakultas}
                  onChange={(e) => setFormData({ ...formData, fakultas: e.target.value })}
                  placeholder="Fakultas Sains dan Teknologi"
                  className="w-full px-3 py-2 min-h-[44px] text-xs rounded-[10px] border border-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-lpm-blue-900/20 focus:border-lpm-blue-900"
                />
              </div>

              <div>
                <label htmlFor="pengguna-prodi" className="block text-xs font-semibold text-slate-700 mb-1">
                  Program Studi
                </label>
                <input
                  id="pengguna-prodi"
                  type="text"
                  value={formData.prodi}
                  onChange={(e) => setFormData({ ...formData, prodi: e.target.value })}
                  placeholder="Sistem Informasi"
                  className="w-full px-3 py-2 min-h-[44px] text-xs rounded-[10px] border border-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-lpm-blue-900/20 focus:border-lpm-blue-900"
                />
              </div>
            </div>
          </CardContainer>
        </>
      )}
    </FormPageTemplate>
  );
};

export default PenggunaFormPage;
