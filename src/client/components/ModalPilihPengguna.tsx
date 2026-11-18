import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  UserPlusIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import {
  cariKandidatPengguna,
  type KandidatPenggunaOne,
  type KriteriaKandidat,
  type RbacPeran,
  SSO_ROLE_LABEL,
} from '../services/api';

export interface ModalPilihPenggunaProps {
  terbuka: boolean;
  opsiPeran: RbacPeran[];
  idTerdaftar?: (number | string)[];
  sedangMenyimpan: boolean;
  onTutup: () => void;
  onSimpan: (params: {
    pengguna: KandidatPenggunaOne[];
    peran: string;
  }) => Promise<void> | void;
}

export const ModalPilihPengguna: React.FC<ModalPilihPenggunaProps> = ({
  terbuka,
  opsiPeran,
  idTerdaftar = [],
  sedangMenyimpan,
  onTutup,
  onSimpan,
}) => {
  const [kataKunci, setKataKunci] = useState('');
  const [filterPeranSso, setFilterPeranSso] = useState('');
  const [baris, setBaris] = useState<KandidatPenggunaOne[]>([]);
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  const [terpilih, setTerpilih] = useState<number[]>([]);
  const [peranDipilih, setPeranDipilih] = useState<string>('');
  const [galatValidasi, setGalatValidasi] = useState<string | null>(null);

  const sudahTerdaftarSet = useMemo(
    () => new Set(idTerdaftar.map(String)),
    [idTerdaftar]
  );

  const requestId = useRef(0);

  const muatKandidat = useCallback(async (kriteria: KriteriaKandidat) => {
    const id = ++requestId.current;
    setMemuat(true);
    setGalat(null);
    try {
      const res = await cariKandidatPengguna(kriteria);
      if (id !== requestId.current) return;
      setBaris(res.data?.data ?? []);
    } catch (err: any) {
      if (id !== requestId.current) return;
      setGalat(err?.response?.data?.message || err?.message || 'Gagal memuat pengguna dari direktori ONE UNUSU.');
      setBaris([]);
    } finally {
      if (id === requestId.current) {
        setMemuat(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!terbuka) return;
    setKataKunci('');
    setFilterPeranSso('');
    setTerpilih([]);
    setGalatValidasi(null);
    if (opsiPeran.length > 0) {
      const defaultRole = opsiPeran.find((r) => r.kode !== 'SUPERADMIN')?.kode || opsiPeran[0].kode;
      setPeranDipilih(defaultRole);
    }
    void muatKandidat({});
  }, [terbuka, opsiPeran, muatKandidat]);

  useEffect(() => {
    if (!terbuka) return;
    const timer = setTimeout(() => {
      void muatKandidat({
        search: kataKunci.trim(),
        role: filterPeranSso,
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [kataKunci, filterPeranSso, terbuka, muatKandidat]);

  if (!terbuka) return null;

  const togglePilih = (id: number) => {
    setGalatValidasi(null);
    setTerpilih((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const kandidatTersedia = baris.filter(
    (u) => !u.sudahTerdaftar && !sudahTerdaftarSet.has(String(u.id))
  );

  const togglePilihSemua = () => {
    setGalatValidasi(null);
    if (terpilih.length >= kandidatTersedia.length && kandidatTersedia.length > 0) {
      setTerpilih([]);
    } else {
      setTerpilih(kandidatTersedia.map((u) => u.id));
    }
  };

  const handleSimpan = () => {
    if (terpilih.length === 0) {
      setGalatValidasi('Pilih minimal satu pengguna dari tabel untuk dijadikan pegawai.');
      return;
    }
    if (!peranDipilih) {
      setGalatValidasi('Tentukan peran aplikasi LPM untuk pengguna terpilih.');
      return;
    }

    const penggunaTerpilih = baris.filter((u) => terpilih.includes(u.id));
    void onSimpan({
      pengguna: penggunaTerpilih,
      peran: peranDipilih,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-pilih-pengguna-lpm-title"
    >
      <div className="w-full max-w-4xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-lpm-blue-50 text-lpm-blue-900 flex items-center justify-center">
              <UserPlusIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 id="modal-pilih-pengguna-lpm-title" className="text-base font-bold text-slate-900">
                Tambah Pengguna & Auditor dari ONE UNUSU
              </h2>
              <p className="text-xs text-slate-500">
                Pilih civitas dari direktori kampus, tetapkan perannya, lalu simpan sebagai pegawai penjaminan mutu LPM.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onTutup}
            disabled={sedangMenyimpan}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition cursor-pointer"
            aria-label="Tutup modal"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Search & Filter Peran SSO */}
        <div className="p-4 border-b border-slate-200 bg-white grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-8 relative">
            <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={kataKunci}
              onChange={(e) => setKataKunci(e.target.value)}
              placeholder="Cari berdasarkan nama lengkap, NIDN, NIP, atau NIM..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-lpm-blue-700/30 focus:border-lpm-blue-700 transition"
              autoFocus
            />
          </div>
          <div className="md:col-span-4">
            <select
              value={filterPeranSso}
              onChange={(e) => setFilterPeranSso(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-lpm-blue-700/30 focus:border-lpm-blue-700"
            >
              <option value="">Semua Civitas Kampus</option>
              <option value="DOSEN">Dosen</option>
              <option value="TENDIK">Tenaga Kependidikan</option>
              <option value="MAHASISWA">Mahasiswa</option>
            </select>
          </div>
        </div>

        {/* Body Tabel Kandidat */}
        <div className="overflow-y-auto flex-1 p-4">
          {galatValidasi && (
            <div className="mb-3 px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-semibold">
              {galatValidasi}
            </div>
          )}

          {galat && (
            <div className="mb-3 px-4 py-2.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-xs font-semibold">
              {galat}
            </div>
          )}

          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2.5 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={
                        kandidatTersedia.length > 0 &&
                        terpilih.length === kandidatTersedia.length
                      }
                      onChange={togglePilihSemua}
                      disabled={kandidatTersedia.length === 0}
                      className="rounded border-slate-300 text-lpm-blue-900 focus:ring-lpm-blue-900 cursor-pointer"
                      title="Pilih semua yang tersedia"
                    />
                  </th>
                  <th className="px-3 py-2.5 w-12 text-center">NO</th>
                  <th className="px-3 py-2.5">IDENTITAS & NAMA</th>
                  <th className="px-3 py-2.5">NIDN / NIM / USERNAME</th>
                  <th className="px-3 py-2.5">STATUS KAMPUS</th>
                  <th className="px-3 py-2.5 w-32 text-center">STATUS AKSES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {memuat ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500 font-medium">
                      Menghubungi direktori ONE UNUSU...
                    </td>
                  </tr>
                ) : baris.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      Tidak ada data pengguna yang sesuai dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  baris.map((u, idx) => {
                    const sudahAda = u.sudahTerdaftar || sudahTerdaftarSet.has(String(u.id));
                    const isChecked = terpilih.includes(u.id);

                    return (
                      <tr
                        key={u.id}
                        onClick={() => !sudahAda && togglePilih(u.id)}
                        className={`transition cursor-pointer ${
                          sudahAda
                            ? 'bg-slate-50/70 opacity-60 cursor-not-allowed'
                            : isChecked
                            ? 'bg-lpm-blue-50/70'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="px-3 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={sudahAda}
                            onChange={() => togglePilih(u.id)}
                            className="rounded border-slate-300 text-lpm-blue-900 focus:ring-lpm-blue-900 cursor-pointer"
                          />
                        </td>
                        <td className="px-3 py-2 text-center font-mono text-slate-400 text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="px-3 py-2">
                          <div className="font-bold text-slate-900">{u.nama}</div>
                          {u.email && <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>}
                        </td>
                        <td className="px-3 py-2 font-mono font-semibold text-slate-800">
                          {u.username}
                        </td>
                        <td className="px-3 py-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            {SSO_ROLE_LABEL[u.role?.toUpperCase() || ''] || u.role || 'Civitas'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          {sudahAda ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-lpm-blue-800 bg-lpm-blue-50 px-2 py-0.5 rounded-full border border-lpm-blue-200">
                              <CheckCircleIcon className="w-3.5 h-3.5" /> Sudah Ada
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">Belum Terdaftar</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Modal: Penetapan Peran & Tombol Simpan */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 font-medium">
              Dipilih: <strong className="text-lpm-blue-900">{terpilih.length}</strong> civitas
            </span>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1.5">
              <label htmlFor="peran-tetap-lpm" className="text-xs font-semibold text-slate-700">
                Tentukan Peran:
              </label>
              <select
                id="peran-tetap-lpm"
                value={peranDipilih}
                onChange={(e) => setPeranDipilih(e.target.value)}
                className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-lpm-blue-700/30 cursor-pointer"
              >
                {opsiPeran.map((r) => (
                  <option key={r.id} value={r.kode}>
                    {r.nama} ({r.kode})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              disabled={sedangMenyimpan}
              onClick={onTutup}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={sedangMenyimpan || terpilih.length === 0}
              onClick={handleSimpan}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-lpm-blue-900 hover:bg-lpm-blue-800 text-white shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              <UserPlusIcon className="w-4 h-4" />
              {sedangMenyimpan ? 'Menyimpan...' : 'Jadikan Pegawai'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
