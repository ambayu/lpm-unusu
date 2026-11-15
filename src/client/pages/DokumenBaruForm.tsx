import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  fetchDokumenDetail,
  fetchKategori,
  fetchProdiList,
  createDokumen,
  updateDokumen,
  uploadBerkasDokumen,
  KategoriItem,
  ProdiOption,
} from '../services/api';
import { FormPageTemplate } from '../components/FormPageTemplate';
import { CardContainer } from '../components/CardContainer';
import { NotificationModal, NotificationDetail } from '../components/NotificationModal';
import { deskripsikanGalat, galatValidasi, DeskripsiGalat, BATAS_UKURAN_PDF_BYTE, BATAS_UKURAN_PDF_MB } from '../lib/galat';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

/** Label manusiawi untuk tiap field agar pesan galat menyebut nama kolomnya. */
const LABEL_FIELD: Record<string, string> = {
  judul: 'Judul Dokumen',
  nomor: 'Nomor Dokumen',
  kategoriId: 'Kategori',
  tahun: 'Tahun Dokumen',
  tujuanPublish: 'Tujuan Publikasi',
  prodiCode: 'Program Studi',
  tanggalDokumen: 'Tanggal Dokumen',
  tanggalMulaiBerlaku: 'Tanggal Mulai Berlaku',
  tanggalBerakhir: 'Tanggal Berakhir',
  status: 'Status',
  filePdfUrl: 'Berkas PDF',
};

export const DokumenBaruFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [kategoriList, setKategoriList] = useState<KategoriItem[]>([]);
  const [prodiList, setProdiList] = useState<ProdiOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  /** Benar selama PDF sedang diunggah; menyimpan dokumen ditahan sampai selesai. */
  const [mengunggah, setMengunggah] = useState(false);
  /** Metadata berkas yang sudah diunggah — hanya untuk ditampilkan, tidak dikirim. */
  const [berkasTerunggah, setBerkasTerunggah] = useState<{ nama: string; ukuran: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** Modal galat — wajib dipakai untuk semua kegagalan aksi pada halaman ini. */
  const [galat, setGalat] = useState<DeskripsiGalat | null>(null);

  const [formData, setFormData] = useState({
    judul: '',
    nomor: '',
    kategoriId: '',
    /*
     * `tahun` disimpan sebagai STRING agar input bisa dikosongkan sementara
     * ketika pengguna menyunting (menghapus lalu mengetik ulang). Bila state
     * berupa number, `Number('')` menjadi 0 sehingga kolom langsung terisi "0"
     * dan nol itu tidak bisa dihapus. Konversi ke number hanya saat submit.
     */
    tahun: '',
    tanggalDokumen: '',
    tanggalMulaiBerlaku: '',
    tanggalBerakhir: '',
    status: 'Aktif',
    tujuanPublish: 'lpm',
    prodiCode: '',
    prodiName: '',
    keterangan: '',
    filePdfUrl: '',
    tampilkanDiWebsite: 'Ya',
    dokumenAkreditasi: 'Tidak',
  });

  useEffect(() => {
    const promises: Promise<any>[] = [fetchKategori(), fetchProdiList()];
    if (isEdit && id) {
      promises.push(fetchDokumenDetail(id));
    }

    Promise.all(promises)
      .then(([catRes, prodiRes, docRes]) => {
        setKategoriList(catRes.data.data || []);
        setProdiList(prodiRes?.data?.data || []);
        if (docRes) {
          const doc = docRes.data.data;
          setFormData({
            judul: doc.judul || '',
            nomor: doc.nomor || '',
            kategoriId: doc.kategoriId ? String(doc.kategoriId) : '',
            tahun: doc.tahun ? String(doc.tahun) : '',
            tanggalDokumen: doc.tanggalDokumen ? doc.tanggalDokumen.slice(0, 10) : '',
            tanggalMulaiBerlaku: doc.tanggalMulaiBerlaku ? doc.tanggalMulaiBerlaku.slice(0, 10) : '',
            tanggalBerakhir: doc.tanggalBerakhir ? doc.tanggalBerakhir.slice(0, 10) : '',
            status: doc.status || 'Aktif',
            tujuanPublish: doc.tujuanPublish === 'prodi' ? 'prodi' : 'lpm',
            prodiCode: doc.prodiCode || '',
            prodiName: doc.prodiName || '',
            keterangan: doc.keterangan || '',
            filePdfUrl: doc.filePdfUrl || '',
            tampilkanDiWebsite: 'Ya',
            dokumenAkreditasi: 'Tidak',
          });
        }
      })
      .catch((err) => {
        console.error(err);
        setError(err.response?.data?.message || 'Gagal memuat formulir dokumen.');
        setGalat(
          deskripsikanGalat(
            err,
            'Memuat Data Formulir',
            'halaman formulir dokumen (kategori, program studi, dan detail dokumen)',
            LABEL_FIELD,
          ),
        );
      })
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  /**
   * Mengunggah berkas PDF yang dipilih ke penyimpanan arsip server.
   *
   * Yang disimpan pada state hanya URL berkas hasil unggahan, bukan isi PDF.
   * Dengan begitu isi formulir tetap ringan dan tidak ada PDF base64 yang
   * ikut terkirim saat menyimpan dokumen.
   */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setGalat(
        galatValidasi('Mengunggah Berkas', 'berkas yang Anda pilih', [
          {
            field: 'Jenis Berkas',
            message: `${file.name} bukan berkas PDF. Hanya berkas PDF yang dapat diarsipkan.`,
          },
        ]),
      );
      e.target.value = '';
      return;
    }

    if (file.size > BATAS_UKURAN_PDF_BYTE) {
      setGalat(
        galatValidasi('Mengunggah Berkas', `berkas "${file.name}"`, [
          {
            field: 'Ukuran Berkas',
            message: `Ukuran berkas ${(file.size / (1024 * 1024)).toFixed(1)} MB melebihi batas maksimal ${BATAS_UKURAN_PDF_MB} MB.`,
          },
        ]),
      );
      e.target.value = '';
      return;
    }

    setMengunggah(true);
    try {
      const res = await uploadBerkasDokumen(file);
      setFormData((prev) => ({ ...prev, filePdfUrl: res.data.data.url }));
      // Metadata berkas disimpan terpisah hanya untuk ditampilkan di formulir.
      // Tidak ikut dikirim ke server; nilainya tidak diperlukan di database.
      setBerkasTerunggah({ nama: file.name, ukuran: res.data.data.ukuran });
    } catch (err: any) {
      setGalat(
        deskripsikanGalat(
          err,
          'Mengunggah Berkas',
          `berkas "${file.name}"`,
          LABEL_FIELD,
        ),
      );
    } finally {
      setMengunggah(false);
      // Reset agar memilih berkas yang sama tetap memicu perubahan.
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setGalat(null);

    // Menyimpan dokumen sebelum unggahan selesai akan menyimpan URL kosong.
    if (mengunggah) {
      setGalat(
        galatValidasi('Menyimpan Dokumen', 'berkas PDF yang masih diunggah', [
          {
            field: LABEL_FIELD.filePdfUrl,
            message: 'Berkas PDF masih diunggah ke penyimpanan arsip. Tunggu hingga selesai, lalu simpan dokumen.',
          },
        ]),
      );
      return;
    }

    // Validasi klien — sebut field mana yang belum memenuhi syarat.
    const masalah: NotificationDetail[] = [];
    if (!formData.judul.trim()) {
      masalah.push({ field: LABEL_FIELD.judul, message: 'Judul dokumen belum diisi.' });
    }
    if (!formData.kategoriId) {
      masalah.push({
        field: LABEL_FIELD.kategoriId,
        message: 'Kategori dokumen belum dipilih. Tambah kategori terlebih dahulu di menu Kategori bila daftar kosong.',
      });
    }
    // `tahun` berupa string; nilai kosong atau bukan angka harus dilaporkan
    // sebagai isian yang belum benar, bukan diam-diam dikirim sebagai 0.
    const tahunAngka = Number(formData.tahun);
    if (!formData.tahun.trim()) {
      masalah.push({ field: LABEL_FIELD.tahun, message: 'Tahun dokumen belum diisi.' });
    } else if (!Number.isInteger(tahunAngka)) {
      masalah.push({ field: LABEL_FIELD.tahun, message: 'Tahun dokumen harus berupa angka bulat.' });
    } else if (tahunAngka < 2000 || tahunAngka > 2100) {
      masalah.push({
        field: LABEL_FIELD.tahun,
        message: `Tahun dokumen ${tahunAngka} di luar rentang yang diterima (2000–2100).`,
      });
    }
    if (formData.tujuanPublish === 'prodi' && !formData.prodiCode) {
      masalah.push({
        field: LABEL_FIELD.prodiCode,
        message: 'Tujuan publikasi "Program Studi" dipilih, tetapi program studi tujuannya belum ditentukan.',
      });
    }
    if (formData.tanggalMulaiBerlaku && formData.tanggalBerakhir && formData.tanggalBerakhir < formData.tanggalMulaiBerlaku) {
      masalah.push({
        field: LABEL_FIELD.tanggalBerakhir,
        message: 'Tanggal berakhir lebih awal daripada tanggal mulai berlaku.',
      });
    }
    if (masalah.length > 0) {
      setGalat(galatValidasi(isEdit ? 'Menyimpan Perubahan' : 'Menyimpan Dokumen Baru', 'formulir dokumen', masalah));
      return;
    }

    const namaDokumen = `«${formData.judul.trim()}»`;
    setSubmitting(true);

    try {
      const payload = {
        judul: formData.judul,
        nomor: formData.nomor || null,
        kategoriId: Number(formData.kategoriId),
        tahun: tahunAngka,
        tanggalDokumen: formData.tanggalDokumen ? new Date(formData.tanggalDokumen).toISOString() : null,
        tanggalMulaiBerlaku: formData.tanggalMulaiBerlaku ? new Date(formData.tanggalMulaiBerlaku).toISOString() : null,
        tanggalBerakhir: formData.tanggalBerakhir ? new Date(formData.tanggalBerakhir).toISOString() : null,
        status: formData.status,
        tujuanPublish: formData.tujuanPublish,
        prodiCode: formData.tujuanPublish === 'prodi' ? formData.prodiCode : null,
        prodiName: formData.tujuanPublish === 'prodi' ? formData.prodiName : null,
        keterangan: formData.keterangan || null,
        filePdfUrl: formData.filePdfUrl || null,
      };

      if (isEdit && id) {
        await updateDokumen(id, payload);
      } else {
        await createDokumen(payload);
      }
      navigate('/admin/arsip-dokumen');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Gagal menyimpan dokumen.');
      setGalat(
        deskripsikanGalat(
          err,
          isEdit ? 'Menyimpan Perubahan' : 'Menyimpan Dokumen Baru',
          `dokumen ${namaDokumen}`,
          LABEL_FIELD,
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <FormPageTemplate
      title={isEdit ? 'Sunting Dokumen' : 'Tambah Dokumen Baru'}
      description="Lengkapi informasi metadata berkas, nomor registrasi, serta unggah arsip dokumen pendukung."
      badge={
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-lpm-blue-50 border border-lpm-blue-200 text-[11px] font-bold text-lpm-blue-900">
          <DocumentTextIcon className="w-3.5 h-3.5" aria-hidden="true" />
          Formulir Dokumen
        </span>
      }
      backTo="/admin/arsip-dokumen"
      isEdit={isEdit}
      submitting={submitting || loading || mengunggah}
      error={error}
      onSubmit={handleSubmit}
    >
      <div className="space-y-6">
        <CardContainer
          title="Informasi Dasar Dokumen"
          description="Identitas resmi berkas dan klasifikasi kategori dokumen."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="judul" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Judul Dokumen <span className="text-red-500">*</span>
              </label>
              <input
                id="judul"
                type="text"
                required
                value={formData.judul}
                onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                placeholder="Masukkan judul dokumen lengkap"
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-lpm-blue-600 focus:border-transparent transition"
              />
            </div>

            <div>
              <label htmlFor="nomor" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Nomor Dokumen
              </label>
              <input
                id="nomor"
                type="text"
                value={formData.nomor}
                onChange={(e) => setFormData({ ...formData, nomor: e.target.value })}
                placeholder="Contoh: UNUSU/LPM/SK/2026/001"
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-lpm-blue-600 focus:border-transparent transition"
              />
            </div>

            <div>
              <label htmlFor="kategoriId" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Kategori <span className="text-red-500">*</span>
              </label>
              <select
                id="kategoriId"
                required
                value={formData.kategoriId}
                onChange={(e) => setFormData({ ...formData, kategoriId: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-lpm-blue-600 focus:border-transparent transition"
              >
                <option value="">Pilih Kategori</option>
                {kategoriList.map((kat) => (
                  <option key={kat.id} value={kat.id}>
                    {kat.nama}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="tahun" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Tahun Dokumen <span className="text-red-500">*</span>
              </label>
              <input
                id="tahun"
                type="number"
                required
                inputMode="numeric"
                min={2000}
                max={2100}
                placeholder="Contoh: 2026"
                value={formData.tahun}
                onChange={(e) => setFormData({ ...formData, tahun: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-lpm-blue-600 focus:border-transparent transition"
              />
            </div>

            <div>
              <label htmlFor="tujuanPublish" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Tujuan Publikasi <span className="text-red-500">*</span>
              </label>
              <select
                id="tujuanPublish"
                value={formData.tujuanPublish}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    tujuanPublish: val,
                    prodiCode: val === 'prodi' ? prev.prodiCode : '',
                    prodiName: val === 'prodi' ? prev.prodiName : '',
                  }));
                }}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-lpm-blue-600 focus:border-transparent transition"
              >
                <option value="lpm">LPM (Internal Lembaga)</option>
                <option value="prodi">Program Studi (Prodi)</option>
              </select>
            </div>

            {formData.tujuanPublish === 'prodi' && (
              <div>
                <label htmlFor="prodiCode" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Pilih Program Studi <span className="text-red-500">*</span>
                </label>
                <select
                  id="prodiCode"
                  required
                  value={formData.prodiCode}
                  onChange={(e) => {
                    const selected = prodiList.find((p) => p.code === e.target.value);
                    setFormData((prev) => ({
                      ...prev,
                      prodiCode: e.target.value,
                      prodiName: selected ? `${selected.name}${selected.degree ? ` (${selected.degree})` : ''}` : '',
                    }));
                  }}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-lpm-blue-600 focus:border-transparent transition"
                >
                  <option value="">Pilih Program Studi Tujuan</option>
                  {prodiList.map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.name} {p.degree ? `(${p.degree})` : ''} — {p.facultyName || p.code}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-gray-500 mt-1">
                  Data prodi disinkronkan secara langsung dari API Hub ONE UNUSU.
                </p>
              </div>
            )}
          </div>
        </CardContainer>

        <CardContainer
          title="Masa Berlaku & Status"
          description="Rentang tanggal keabsahan serta penetapan status keaktifan dokumen."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="tanggalDokumen" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Tanggal Dokumen
              </label>
              <input
                id="tanggalDokumen"
                type="date"
                value={formData.tanggalDokumen}
                onChange={(e) => setFormData({ ...formData, tanggalDokumen: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-lpm-blue-600 focus:border-transparent transition"
              />
            </div>

            <div>
              <label htmlFor="tanggalMulaiBerlaku" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Tanggal Mulai Berlaku
              </label>
              <input
                id="tanggalMulaiBerlaku"
                type="date"
                value={formData.tanggalMulaiBerlaku}
                onChange={(e) => setFormData({ ...formData, tanggalMulaiBerlaku: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-lpm-blue-600 focus:border-transparent transition"
              />
            </div>

            <div>
              <label htmlFor="tanggalBerakhir" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Tanggal Berakhir
              </label>
              <input
                id="tanggalBerakhir"
                type="date"
                value={formData.tanggalBerakhir}
                onChange={(e) => setFormData({ ...formData, tanggalBerakhir: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-lpm-blue-600 focus:border-transparent transition"
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Status
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-lpm-blue-600 focus:border-transparent transition"
              >
                <option value="Aktif">Aktif</option>
                <option value="Draft">Draft</option>
                <option value="Arsip">Arsip</option>
              </select>
            </div>
          </div>
        </CardContainer>

        <CardContainer
          title="Keterangan & Berkas Dokumen"
          description="Catatan tambahan serta unggah lampiran berkas resmi."
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="keterangan" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Keterangan
              </label>
              <textarea
                id="keterangan"
                rows={4}
                value={formData.keterangan}
                onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                placeholder="Tuliskan ringkasan pokok isi dokumen atau catatan penting..."
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-lpm-blue-600 focus:border-transparent transition"
              />
            </div>

            <div>
              <label htmlFor="uploadFile" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Upload File PDF {isEdit ? '(Opsional - Biarkan kosong jika tidak diganti)' : ''}
              </label>
              <input
                id="uploadFile"
                type="file"
                accept=".pdf,application/pdf"
                disabled={mengunggah}
                onChange={handleFileUpload}
                className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-lpm-blue-50 file:text-lpm-blue-900 hover:file:bg-lpm-blue-100 transition disabled:opacity-60"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Format berkas wajib PDF. Maksimal {BATAS_UKURAN_PDF_MB} MB.
              </p>

              {mengunggah && (
                <p className="text-[11px] font-medium text-lpm-blue-900 mt-2">
                  Mengunggah berkas ke penyimpanan arsip…
                </p>
              )}

              {!mengunggah && formData.filePdfUrl && (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-gray-600">
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-green-50 border border-green-200 text-green-800 font-semibold">
                    Berkas tersimpan
                  </span>
                  <span className="font-medium text-gray-700">
                    {berkasTerunggah ? berkasTerunggah.nama : 'Berkas PDF dokumen ini'}
                  </span>
                  {berkasTerunggah && (
                    <span>({(berkasTerunggah.ukuran / (1024 * 1024)).toFixed(2)} MB)</span>
                  )}
                  <a
                    href={formData.filePdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lpm-blue-700 underline hover:text-lpm-blue-900"
                  >
                    Lihat berkas
                  </a>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              <div>
                <label htmlFor="tampilkanDiWebsite" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Tampilkan di Website
                </label>
                <select
                  id="tampilkanDiWebsite"
                  value={formData.tampilkanDiWebsite}
                  onChange={(e) => setFormData({ ...formData, tampilkanDiWebsite: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-lpm-blue-600 focus:border-transparent transition"
                >
                  <option value="Ya">Ya</option>
                  <option value="Tidak">Tidak</option>
                </select>
              </div>

              <div>
                <label htmlFor="dokumenAkreditasi" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Dokumen Akreditasi
                </label>
                <select
                  id="dokumenAkreditasi"
                  value={formData.dokumenAkreditasi}
                  onChange={(e) => setFormData({ ...formData, dokumenAkreditasi: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-lpm-blue-600 focus:border-transparent transition"
                >
                  <option value="Tidak">Tidak</option>
                  <option value="Ya">Ya</option>
                </select>
              </div>
            </div>
          </div>
        </CardContainer>
      </div>
      </FormPageTemplate>

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

export default DokumenBaruFormPage;
