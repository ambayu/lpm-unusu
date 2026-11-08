import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FormPageTemplate } from '../components/FormPageTemplate';
import { CardContainer } from '../components/CardContainer';
import { ShieldCheckIcon, KeyIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import {
  fetchRbacPeran,
  fetchRbacIzin,
  createRbacPeran,
  updateRbacPeran,
  type RbacIzin,
} from '../services/api';

/** Label grup izin agar matriks mudah dibaca. */
const LABEL_GRUP: Record<string, string> = {
  'izin-masuk': 'Izin Masuk Panel',
  utama: 'Dashboard',
  standar: 'Standar SPMI',
  dokumen: 'Dokumen Mutu',
  audit: 'Audit Mutu Internal',
  ppepp: 'Siklus PPEPP & Indikator',
  'tindak-lanjut': 'Tindak Lanjut',
  'tata-kelola': 'Tata Kelola',
};

/**
 * PeranFormPage — halaman penuh tambah/ubah peran RBAC LPM.
 *
 * Rute: `/admin/peran/tambah` dan `/admin/peran/edit/:id`.
 *
 * Formulir kini memuat MATRIKS IZIN: administrator memilih izin mana yang
 * melekat pada peran. Peran tidak lagi sekadar label — ia menentukan akses.
 */
export const PeranFormPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sukses, setSukses] = useState<string | null>(null);
  const [kodeTerkunci, setKodeTerkunci] = useState(false);
  const [daftarIzin, setDaftarIzin] = useState<RbacIzin[]>([]);
  const [izinDipilih, setIzinDipilih] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    kode: '',
    nama: '',
    deskripsi: '',
  });

  // Muat katalog izin.
  useEffect(() => {
    let aktif = true;
    fetchRbacIzin()
      .then((res) => {
        if (!aktif || !res.data?.success) return;
        setDaftarIzin(res.data.data);
      })
      .catch(() => {
        /* dibiarkan — peringatan ditampilkan bila katalog kosong */
      });
    return () => {
      aktif = false;
    };
  }, []);

  // Mode ubah: muat detail peran + izin yang sudah melekat.
  useEffect(() => {
    let aktif = true;
    setLoading(true);

    const muat = async () => {
      if (!isEdit || !id) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetchRbacPeran();
        if (!aktif) return;
        const daftar = res.data?.data ?? [];
        const peran = daftar.find((r) => String(r.kode) === String(id) || String(r.id) === String(id));
        if (!peran) {
          setError('Peran tidak ditemukan. Mungkin sudah dihapus.');
          return;
        }
        setFormData({
          kode: peran.kode || peran.name,
          nama: peran.nama || peran.label,
          deskripsi: peran.deskripsi || peran.description || '',
        });
        setIzinDipilih(peran.izin ?? []);
        setKodeTerkunci(Boolean(peran.isSystem));
      } catch (err: any) {
        if (aktif) {
          setError(err?.response?.data?.message || err.message || 'Gagal memuat detail peran.');
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

  /** Kelompokkan izin per grup agar matriks rapi. */
  const izinPerGrup = useMemo(() => {
    const map = new Map<string, RbacIzin[]>();
    daftarIzin.forEach((izin) => {
      const grup = izin.grup || 'umum';
      if (!map.has(grup)) map.set(grup, []);
      map.get(grup)!.push(izin);
    });
    return Array.from(map.entries());
  }, [daftarIzin]);

  const toggleIzin = (kunci: string) => {
    setIzinDipilih((prev) =>
      prev.includes(kunci) ? prev.filter((k) => k !== kunci) : [...prev, kunci]
    );
  };

  const toggleGrup = (izinGrup: RbacIzin[]) => {
    const semuaKunci = izinGrup.map((i) => i.kunci);
    const semuaDipilih = semuaKunci.every((k) => izinDipilih.includes(k));
    setIzinDipilih((prev) =>
      semuaDipilih
        ? prev.filter((k) => !semuaKunci.includes(k))
        : Array.from(new Set([...prev, ...semuaKunci]))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSukses(null);
    setError(null);
    setSubmitting(true);

    try {
      if (isEdit && id) {
        await updateRbacPeran(id, {
          nama: formData.nama,
          deskripsi: formData.deskripsi,
          izin: izinDipilih,
        });
        setSukses(`Perubahan peran "${formData.nama}" berhasil disimpan.`);
      } else {
        await createRbacPeran({
          kode: formData.kode,
          nama: formData.nama,
          deskripsi: formData.deskripsi,
          izin: izinDipilih,
        });
        setSukses(`Peran "${formData.nama}" berhasil dibuat.`);
        setFormData({ kode: '', nama: '', deskripsi: '' });
        setIzinDipilih([]);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormPageTemplate
      title={isEdit ? 'Edit Peran RBAC' : 'Buat Peran Baru'}
      description="Peran menentukan izin apa saja yang dimiliki penggunanya. Kode peran dipakai sistem, label dipakai antarmuka."
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
        <>
          <CardContainer
            title="Identitas Peran"
            subtitle="Kode peran tidak dapat diubah setelah dibuat."
          >
            <div className="space-y-3.5">
              <div>
                <label htmlFor="peran-kode" className="block text-xs font-semibold text-slate-700 mb-1">
                  Kode / Identifier Peran <span className="text-rose-500">*</span>
                </label>
                <input
                  id="peran-kode"
                  type="text"
                  required
                  disabled={kodeTerkunci || isEdit}
                  value={formData.kode}
                  onChange={(e) => setFormData({ ...formData, kode: e.target.value })}
                  placeholder="Contoh: auditor_fakultas"
                  className="w-full px-3 py-2 min-h-[44px] text-xs rounded-[10px] border border-[#CBD5E1] font-mono disabled:bg-slate-100 disabled:text-slate-500 focus:outline-none focus:ring-2 focus:ring-lpm-blue-900/20 focus:border-lpm-blue-900"
                />
                {(kodeTerkunci || isEdit) && (
                  <p className="text-[11px] text-slate-400 mt-1">
                    {kodeTerkunci
                      ? 'Peran sistem bawaan — kode tidak dapat diubah.'
                      : 'Kode peran tidak dapat diubah setelah dibuat.'}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="peran-nama" className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Tampilan Label <span className="text-rose-500">*</span>
                </label>
                <input
                  id="peran-nama"
                  type="text"
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Contoh: Auditor Mutu Fakultas"
                  className="w-full px-3 py-2 min-h-[44px] text-xs rounded-[10px] border border-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-lpm-blue-900/20 focus:border-lpm-blue-900"
                />
              </div>

              <div>
                <label htmlFor="peran-deskripsi" className="block text-xs font-semibold text-slate-700 mb-1">
                  Deskripsi &amp; Cakupan Tugas
                </label>
                <textarea
                  id="peran-deskripsi"
                  rows={3}
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  placeholder="Jelaskan batas wewenang pengguna yang memegang peran ini..."
                  className="w-full px-3 py-2 text-xs rounded-[10px] border border-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-lpm-blue-900/20 focus:border-lpm-blue-900"
                />
              </div>
            </div>
          </CardContainer>

          <CardContainer
            title="Matriks Izin"
            subtitle="Centang izin yang melekat pada peran ini. Izin masuk panel wajib dipilih agar pengguna dapat membuka panel LPM."
            badge={
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-700">
                <KeyIcon className="w-3.5 h-3.5" />
                {izinDipilih.length} dipilih
              </span>
            }
          >
            {daftarIzin.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic">
                Katalog izin belum tersedia. Pastikan seeder RBAC sudah dijalankan.
              </p>
            ) : (
              <div className="space-y-4">
                {izinPerGrup.map(([grup, items]) => {
                  const semuaDipilih = items.every((i) => izinDipilih.includes(i.kunci));
                  const adalahIzinMasuk = grup === 'izin-masuk';
                  return (
                    <div
                      key={grup}
                      className={`rounded-[12px] border p-3.5 ${
                        adalahIzinMasuk
                          ? 'border-lpm-yellow-400 bg-lpm-yellow-400/20'
                          : 'border-[#CBD5E1] bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                          {adalahIzinMasuk && <LockClosedIcon className="w-3.5 h-3.5" />}
                          {LABEL_GRUP[grup] || grup}
                        </h4>
                        <button
                          type="button"
                          onClick={() => toggleGrup(items)}
                          className="text-[10px] font-bold text-lpm-blue-800 hover:text-lpm-blue-950 underline cursor-pointer"
                        >
                          {semuaDipilih ? 'Kosongkan' : 'Pilih semua'}
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {items.map((izin) => {
                          const dipilih = izinDipilih.includes(izin.kunci);
                          return (
                            <label
                              key={izin.kunci}
                              className={`flex items-start gap-2 p-2 rounded-[8px] border cursor-pointer transition text-[11px] ${
                                dipilih
                                  ? 'border-lpm-blue-900 bg-lpm-blue-50'
                                  : 'border-transparent hover:bg-slate-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={dipilih}
                                onChange={() => toggleIzin(izin.kunci)}
                                className="mt-0.5 w-3.5 h-3.5 accent-lpm-blue-900"
                              />
                              <span>
                                <span className="block font-semibold text-slate-800">{izin.nama}</span>
                                <code className="block text-[10px] text-slate-400 font-mono">
                                  {izin.kunci}
                                </code>
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContainer>
        </>
      )}
    </FormPageTemplate>
  );
};

export default PeranFormPage;
