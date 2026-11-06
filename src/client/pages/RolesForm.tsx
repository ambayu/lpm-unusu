import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FormPageTemplate } from '../components/FormPageTemplate';
import { CardContainer } from '../components/CardContainer';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

interface RoleDetail {
  id: number | string;
  name: string;
  label: string;
  description?: string;
  isSystem?: boolean;
}

/**
 * PeranFormPage — halaman penuh tambah/ubah peran RBAC LPM.
 *
 * Menggantikan modal `Modal Add / Edit Role` pada `Roles.tsx`.
 * Rute: `/admin/peran/tambah` dan `/admin/peran/edit/:id`.
 * Setelah berhasil menyimpan, pengguna tetap di halaman formulir.
 */
export const PeranFormPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sukses, setSukses] = useState<string | null>(null);
  const [kodeTerkunci, setKodeTerkunci] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    label: '',
    description: '',
  });

  const authHeaders = (json = false): HeadersInit => {
    const token =
      localStorage.getItem('lpm_unusu_token') || localStorage.getItem('lpm_token');
    return {
      ...(json ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  // Mode ubah: muat detail peran.
  useEffect(() => {
    if (!isEdit || !id) return;
    let aktif = true;
    setLoading(true);
    fetch('/api/roles', { credentials: 'include', headers: authHeaders() })
      .then((res) => {
        if (!res.ok) throw new Error('Gagal memuat daftar peran.');
        return res.json();
      })
      .then((json) => {
        if (!aktif) return;
        const daftar: RoleDetail[] = json.data || [];
        const peran = daftar.find((r) => String(r.id) === String(id));
        if (!peran) {
          setError('Peran tidak ditemukan. Mungkin sudah dihapus.');
          return;
        }
        setFormData({
          name: peran.name,
          label: peran.label,
          description: peran.description || '',
        });
        setKodeTerkunci(Boolean(peran.isSystem));
      })
      .catch((err: any) => {
        if (aktif) setError(err.message || 'Gagal memuat detail peran.');
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
      const url = isEdit && id ? `/api/roles/${id}` : '/api/roles';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: authHeaders(true),
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Gagal menyimpan peran.');
      }

      if (isEdit) {
        setSukses(`Perubahan peran "${formData.label}" berhasil disimpan.`);
      } else {
        setSukses(`Peran "${formData.label}" berhasil ditambahkan.`);
        setFormData({ name: '', label: '', description: '' });
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormPageTemplate
      title={isEdit ? 'Edit Peran RBAC' : 'Buat Peran Baru'}
      description="Peran mengelompokkan hak akses pengguna LPM UNUSU. Kode peran dipakai sistem, label dipakai antarmuka."
      badge={
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-lpm-blue-50 border border-lpm-blue-200 text-[10px] font-bold uppercase tracking-wider text-lpm-blue-900">
          <ShieldCheckIcon className="w-3.5 h-3.5" aria-hidden="true" />
          Tata Kelola
        </span>
      }
      backTo="/admin/peran"
      backLabel="Kembali"
      isEdit={isEdit}
      submitLabel={isEdit ? 'Simpan Perubahan' : 'Simpan Peran'}
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

      {loading ? (
        <div className="py-16 text-center text-xs text-slate-500 font-medium">
          Memuat detail peran...
        </div>
      ) : (
        <CardContainer
          title="Identitas Peran"
          subtitle="Kode peran tidak dapat diubah setelah dibuat."
        >
          <div className="space-y-3.5">
            <div>
              <label htmlFor="peran-name" className="block text-xs font-semibold text-slate-700 mb-1">
                Kode / Identifier Peran <span className="text-rose-500">*</span>
              </label>
              <input
                id="peran-name"
                type="text"
                required
                disabled={kodeTerkunci}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contoh: auditor_fakultas"
                className="w-full px-3 py-2 min-h-[44px] text-xs rounded-[10px] border border-[#CBD5E1] font-mono disabled:bg-slate-100 disabled:text-slate-500 focus:outline-none focus:ring-2 focus:ring-lpm-blue-900/20 focus:border-lpm-blue-900"
              />
              {kodeTerkunci && (
                <p className="text-[11px] text-slate-400 mt-1">
                  Peran sistem bawaan — kode tidak dapat diubah.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="peran-label" className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Tampilan Label <span className="text-rose-500">*</span>
              </label>
              <input
                id="peran-label"
                type="text"
                required
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="Contoh: Auditor Mutu Fakultas"
                className="w-full px-3 py-2 min-h-[44px] text-xs rounded-[10px] border border-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-lpm-blue-900/20 focus:border-lpm-blue-900"
              />
            </div>

            <div>
              <label htmlFor="peran-description" className="block text-xs font-semibold text-slate-700 mb-1">
                Deskripsi &amp; Cakupan Tugas
              </label>
              <textarea
                id="peran-description"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Jelaskan batas wewenang pengguna yang memegang peran ini..."
                className="w-full px-3 py-2 text-xs rounded-[10px] border border-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-lpm-blue-900/20 focus:border-lpm-blue-900"
              />
            </div>
          </div>
        </CardContainer>
      )}
    </FormPageTemplate>
  );
};

export default PeranFormPage;
