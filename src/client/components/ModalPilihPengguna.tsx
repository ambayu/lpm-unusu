import React, { useEffect, useMemo, useState } from 'react';
import { MagnifyingGlassIcon, XMarkIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { cariKandidatPengguna, type KandidatPenggunaOne, type RbacPeran } from '../services/api';

/**
 * ModalPilihPengguna — memilih pengguna dari direktori ONE UNUSU.
 *
 * Panel LPM tidak menyimpan daftar civitas sendiri dan Admin LPM tidak boleh
 * mengetik pengguna secara manual: seluruh akun harus berasal dari direktori
 * kampus. Modal ini:
 *   1. mencari lewat `GET /api/users/kandidat` (diteruskan server ke ONE UNUSU),
 *   2. menandai pengguna yang sudah terdaftar agar tidak dipilih ulang,
 *   3. meminta peran LPM untuk semua pengguna yang dicentang.
 *
 * Pencarian dilakukan saat pengguna berhenti mengetik (debounce 350 ms), jadi
 * tidak ada satu permintaan per huruf.
 */
interface Props {
  terbuka: boolean;
  opsiPeran: RbacPeran[];
  sedangMenyimpan: boolean;
  pesanGalat?: string | null;
  onTutup: () => void;
  onSimpan: (params: {
    pengguna: KandidatPenggunaOne[];
    peran: string[];
  }) => void;
}

const kelasInput =
  'w-full px-4 py-3 text-sm rounded-[10px] border border-[#D8E5DC] bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#166534] focus:border-[#166534] transition';

export const ModalPilihPengguna: React.FC<Props> = ({
  terbuka,
  opsiPeran,
  sedangMenyimpan,
  pesanGalat,
  onTutup,
  onSimpan,
}) => {
  const [kataKunci, setKataKunci] = useState('');
  const [hasil, setHasil] = useState<KandidatPenggunaOne[]>([]);
  const [mencari, setMencari] = useState(false);
  const [galatCari, setGalatCari] = useState<string | null>(null);
  const [dipilih, setDipilih] = useState<number[]>([]);
  const [peran, setPeran] = useState<string[]>([]);
  const [galatLokal, setGalatLokal] = useState<string | null>(null);

  // Setiap kali modal dibuka, mulai dari keadaan bersih.
  useEffect(() => {
    if (!terbuka) return;
    setKataKunci('');
    setHasil([]);
    setDipilih([]);
    setPeran([]);
    setGalatCari(null);
    setGalatLokal(null);
  }, [terbuka]);

  // Pencarian dengan jeda agar tidak memanggil API tiap ketukan tombol.
  useEffect(() => {
    if (!terbuka) return;
    const kata = kataKunci.trim();
    if (kata.length < 2) {
      setHasil([]);
      setGalatCari(null);
      setMencari(false);
      return;
    }

    let batal = false;
    setMencari(true);
    const timer = setTimeout(async () => {
      try {
        const res = await cariKandidatPengguna(kata);
        if (batal) return;
        if (!res.data?.success) {
          setGalatCari('Pencarian gagal. Coba lagi.');
          setHasil([]);
          return;
        }
        setGalatCari(null);
        setHasil(res.data.data ?? []);
      } catch (err: any) {
        if (batal) return;
        setGalatCari(
          err?.response?.data?.message || 'Gagal menghubungi direktori ONE UNUSU. Coba lagi.'
        );
        setHasil([]);
      } finally {
        if (!batal) setMencari(false);
      }
    }, 350);

    return () => {
      batal = true;
      clearTimeout(timer);
      setMencari(false);
    };
  }, [kataKunci, terbuka]);

  const petaDipilih = useMemo(() => new Set(dipilih), [dipilih]);

  const alihkanPilih = (u: KandidatPenggunaOne) => {
    if (u.sudahTerdaftar) return;
    setGalatLokal(null);
    setDipilih((prev) =>
      prev.includes(u.id) ? prev.filter((n) => n !== u.id) : [...prev, u.id]
    );
  };

  const alihkanPeran = (kode: string) => {
    setGalatLokal(null);
    setPeran((prev) => (prev.includes(kode) ? prev.filter((k) => k !== kode) : [...prev, kode]));
  };

  const simpan = () => {
    if (dipilih.length === 0) {
      setGalatLokal('Centang minimal satu pengguna dari direktori ONE UNUSU.');
      return;
    }
    if (peran.length === 0) {
      setGalatLokal('Pilih minimal satu peran. Izin pengguna diturunkan dari peran tersebut.');
      return;
    }
    onSimpan({
      pengguna: hasil.filter((u) => petaDipilih.has(u.id)),
      peran,
    });
  };

  if (!terbuka) return null;

  const galat = pesanGalat || galatLokal;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 bg-slate-900/50 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="judul-modal-pengguna"
    >
      <div className="w-full max-w-3xl bg-white rounded-[14px] border border-[#D8E5DC] shadow-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Kepala modal */}
        <div className="px-5 py-4 border-b border-[#D8E5DC] flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id="judul-modal-pengguna" className="text-sm sm:text-base font-bold text-slate-900">
              Tambah Pengguna LPM
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih pengguna dari direktori ONE UNUSU, lalu tetapkan perannya.
            </p>
          </div>
          <button
            type="button"
            onClick={onTutup}
            disabled={sedangMenyimpan}
            className="p-2 rounded-[10px] text-slate-500 hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
            aria-label="Tutup"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-4 overflow-y-auto space-y-4">
          {galat && (
            <div
              role="alert"
              className="px-4 py-3 rounded-[10px] border border-rose-300 bg-rose-50 text-rose-800 text-xs font-semibold"
            >
              {galat}
            </div>
          )}

          {/* Pencarian */}
          <div>
            <label htmlFor="cari-pengguna" className="block text-xs font-semibold text-slate-700 mb-1">
              Cari pengguna
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="cari-pengguna"
                type="text"
                autoFocus
                value={kataKunci}
                onChange={(e) => setKataKunci(e.target.value)}
                placeholder="Ketik nama, NIDN, NIP, atau NIM (minimal 2 karakter)"
                className={`${kelasInput} pl-10`}
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Pencarian memakai API Hub ONE UNUSU. Pengguna yang sudah terdaftar ditandai dan tidak dapat dipilih lagi.
            </p>
          </div>

          {/* Hasil pencarian */}
          <div className="rounded-[10px] border border-[#D8E5DC] overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-[#F8FAFC] text-slate-600">
                <tr>
                  <th className="px-3 py-2.5 text-left font-bold w-12">No</th>
                  <th className="px-3 py-2.5 text-left font-bold w-12">Pilih</th>
                  <th className="px-3 py-2.5 text-left font-bold">Nama</th>
                  <th className="px-3 py-2.5 text-left font-bold">NIDN / NIP / NIM</th>
                  <th className="px-3 py-2.5 text-left font-bold">Prodi</th>
                  <th className="px-3 py-2.5 text-left font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {mencari ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-slate-500 font-medium">
                      Mencari di direktori ONE UNUSU...
                    </td>
                  </tr>
                ) : galatCari ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-rose-700 font-medium">
                      {galatCari}
                    </td>
                  </tr>
                ) : kataKunci.trim().length < 2 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-slate-500 font-medium">
                      Ketik minimal 2 karakter untuk mulai mencari.
                    </td>
                  </tr>
                ) : hasil.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-slate-500 font-medium">
                      Tidak ada pengguna ONE UNUSU yang cocok dengan pencarian itu.
                    </td>
                  </tr>
                ) : (
                  hasil.map((u, i) => {
                    const terpilih = petaDipilih.has(u.id);
                    return (
                      <tr
                        key={u.id}
                        onClick={() => alihkanPilih(u)}
                        className={
                          u.sudahTerdaftar
                            ? 'bg-slate-50 text-slate-400'
                            : `cursor-pointer hover:bg-[#F0FDF4] ${terpilih ? 'bg-[#F0FDF4]' : ''}`
                        }
                      >
                        <td className="px-3 py-2 tabular-nums text-slate-500">{i + 1}</td>
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={terpilih}
                            disabled={u.sudahTerdaftar}
                            onChange={() => alihkanPilih(u)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 accent-[#166534]"
                            aria-label={`Pilih ${u.nama}`}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            {u.avatar ? (
                              <img
                                src={u.avatar}
                                alt=""
                                className="w-7 h-7 rounded-full object-cover border border-[#D8E5DC]"
                              />
                            ) : (
                              <UserCircleIcon className="w-7 h-7 text-slate-300" />
                            )}
                            <span className="font-semibold text-slate-900">{u.nama}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 font-mono text-[11px] text-slate-600">
                          {u.nidn || u.nip || u.nim || u.username}
                        </td>
                        <td className="px-3 py-2 text-slate-600">{u.prodi || '—'}</td>
                        <td className="px-3 py-2">
                          {u.sudahTerdaftar ? (
                            <span className="font-semibold text-slate-500">Sudah terdaftar</span>
                          ) : (
                            <span className="font-semibold text-[#166534]">Belum terdaftar</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Peran untuk pengguna terpilih */}
          <div>
            <p className="text-xs font-semibold text-slate-700 mb-1.5">
              Peran untuk {dipilih.length} pengguna terpilih <span className="text-rose-500">*</span>
            </p>
            {opsiPeran.length === 0 ? (
              <p className="text-[11px] text-slate-500 italic">
                Daftar peran belum tersedia. Pastikan RBAC LPM sudah diinisialisasi.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {opsiPeran.map((p) => {
                  const aktif = peran.includes(p.kode);
                  return (
                    <label
                      key={p.kode}
                      className={`flex items-start gap-2.5 p-3 rounded-[10px] border cursor-pointer transition ${
                        aktif
                          ? 'border-[#166534] bg-[#F0FDF4]'
                          : 'border-[#D8E5DC] bg-white hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={aktif}
                        onChange={() => alihkanPeran(p.kode)}
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
          </div>
        </div>

        {/* Kaki modal */}
        <div className="px-5 py-3.5 border-t border-[#D8E5DC] bg-[#F8FAFC] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-[11px] text-slate-500">
            {dipilih.length === 0
              ? 'Belum ada pengguna dipilih.'
              : `${dipilih.length} pengguna dipilih${peran.length ? ` • peran: ${peran.join(', ')}` : ''}.`}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onTutup}
              disabled={sedangMenyimpan}
              className="px-4 py-2.5 rounded-[10px] border border-[#D8E5DC] bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={simpan}
              disabled={sedangMenyimpan}
              className="px-4 py-2.5 rounded-[10px] bg-[#166534] hover:bg-[#14532D] text-white text-xs font-semibold disabled:opacity-60 cursor-pointer"
            >
              {sedangMenyimpan ? 'Menyimpan...' : 'Daftarkan Pengguna'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
