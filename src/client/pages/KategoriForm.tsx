import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  fetchKategoriDetail,
  createKategori,
  updateKategori,
} from '../services/api';
import { FormPageTemplate } from '../components/FormPageTemplate';
import { CardContainer } from '../components/CardContainer';
import { FolderIcon } from '@heroicons/react/24/outline';

export const KategoriFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nama: '',
    deskripsi: '',
  });

  useEffect(() => {
    if (isEdit && id) {
      setLoading(true);
      fetchKategoriDetail(id)
        .then((res) => {
          const cat = res.data.data;
          setFormData({
            nama: cat.nama || '',
            deskripsi: cat.deskripsi || '',
          });
        })
        .catch((err) => {
          console.error(err);
          setError(err.response?.data?.message || 'Gagal memuat data kategori.');
        })
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (isEdit && id) {
        await updateKategori(id, formData);
      } else {
        await createKategori(formData);
      }
      navigate('/admin/kategori');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Gagal menyimpan kategori.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormPageTemplate
      title={isEdit ? 'Sunting Kategori Dokumen' : 'Tambah Kategori Dokumen'}
      description="Kategori dokumen memudahkan pemilahan dan pencarian dokumen mutu serta arsip institusi."
      badge={
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-lpm-blue-50 border border-lpm-blue-200 text-[11px] font-bold text-lpm-blue-900">
          <FolderIcon className="w-3.5 h-3.5" aria-hidden="true" />
          Formulir Kategori
        </span>
      }
      backTo="/admin/kategori"
      isEdit={isEdit}
      submitting={submitting || loading}
      error={error}
      onSubmit={handleSubmit}
    >
      <CardContainer
        title="Informasi Kategori"
        description="Nama kategori wajib unik dan ringkas untuk memudahkan pengelompokan."
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="nama" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Nama Kategori <span className="text-red-500">*</span>
            </label>
            <input
              id="nama"
              type="text"
              required
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              placeholder="Contoh: Dokumen Kebijakan, SK Rektor, Panduan Mutu"
              className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-lpm-blue-600 focus:border-transparent transition"
            />
          </div>

          <div>
            <label htmlFor="deskripsi" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Deskripsi
            </label>
            <textarea
              id="deskripsi"
              rows={3}
              value={formData.deskripsi}
              onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
              placeholder="Penjelasan singkat mengenai peruntukan kategori dokumen ini..."
              className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-lpm-blue-600 focus:border-transparent transition"
            />
          </div>
        </div>
      </CardContainer>
    </FormPageTemplate>
  );
};

export default KategoriFormPage;
