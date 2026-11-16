import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  MagnifyingGlassIcon,
  UserCircleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import {
  cariKandidatPengguna,
  type KandidatPenggunaOne,
  type KriteriaKandidat,
} from '../services/api';

/**
 * TabelPilihPengguna — direktori ONE UNUSU dalam bentuk tabel bercentang.
 *
 * Menggantikan modal cari-satu-per-satu. Begitu dibuka tabel langsung terisi
 * (server mengembalikan 20 pengguna aktif pertama), lalu admin mempersempitnya
 * lewat kotak pencarian dan tiga filter: peran, fakultas, dan program studi.
 * Beberapa orang boleh dicentang sekaligus.
 *
 * Pengguna yang sudah menjadi anggota LPM tetap ditampilkan agar admin sadar
 * orangnya ada, tetapi barisnya tidak dapat dicentang dan diberi label
 * "Terdaftar" — supaya tidak ada pilihan yang pasti ditolak server.
 *
 * Daftar pilihan fakultas dan prodi diturunkan dari hasil yang sedang tampil,
 * bukan dari tabel master, sehingga tidak pernah menawarkan filter yang
 * hasilnya pasti kosong.
 */

const LABEL_PERAN: Record<string, string> = {
  SUPERADMIN: 'Superadmin',
  ADMIN: 'Administrator',
  DOSEN: 'Dosen',
  MAHASISWA: 'Mahasiswa',
  TENDIK: 'Tendik',
};

function labelPeran(kode: string | null | undefined): string {
  if (!kode) return '—';
  return LABEL_PERAN[kode.toUpperCase()] ?? kode;
}

/** Dua huruf pertama nama untuk avatar cadangan. */
function inisial(nama: string): string {
  const bagian = nama.trim().split(/\s+/).filter(Boolean);
  if (bagian.length === 0) return '?';
  if (bagian.length === 1) return bagian[0].slice(0, 2).toUpperCase();
  return (bagian[0][0] + bagian[bagian.length - 1][0]).toUpperCase();
}

export interface TabelPilihPenggunaProps {
  /** Id pengguna yang sedang dicentang. Dikendalikan induk agar bisa dikirim bersama peran. */
  terpilih: number[];
  onUbahTerpilih: (ids: number[]) => void;
  /** Pengguna yang sudah menjadi anggota — barisnya tidak dapat dicentang. */
  idTerdaftar?: number[];
}

export const TabelPilihPengguna: React.FC<TabelPilihPenggunaProps> = ({
  terpilih,
  onUbahTerpilih,
  idTerdaftar = [],
}) => {
  const [baris, setBaris] = useState<KandidatPenggunaOne[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState<string | null>(null);

  const [kataKunci, setKataKunci] = useState('');
  const [filterPeran, setFilterPeran] = useState('');
  const [filterFakultas, setFilterFakultas] = useState('');
  const [filterProdi, setFilterProdi] = useState('');

  // Daftar opsi filter diambil dari hasil terakhir yang belum disaring, supaya
  // pilihannya tidak menyusut sendiri saat filter lain dipakai.
  const [opsiFakultas, setOpsiFakultas] = useState<string[]>([]);
  const [opsiProdi, setOpsiProdi] = useState<string[]>([]);

  const sudahTerdaftar = useMemo(() => new Set(idTerdaftar), [idTerdaftar]);

  // Penanda agar jawaban lama tidak menimpa jawaban baru saat admin mengetik cepat.
  const permintaanTerakhir = useRef(0);

  const muat = useCallback(async (kriteria: KriteriaKandidat) => {
    const nomor = ++permintaanTerakhir.current;
    setMemuat(true);
    setGalat(null);
    try {
      const res = await cariKandidatPengguna(kriteria);
      if (nomor !== permintaanTerakhir.current) return;

      const data = res.data?.data ?? [];
      setBaris(data);

      // Kumpulkan opsi filter hanya dari hasil tanpa filter, agar daftar
      // pilihannya lengkap dan tidak berubah-ubah saat penyaringan berjalan.
      const tanpaFilter = !kriteria.role && !kriteria.fakultas && !kriteria.prodi && !kriteria.search;
      if (tanpaFilter) {
        const fakultas = Array.from(
          new Set(data.map((u) => (u.fakultas ?? '').trim()).filter(Boolean))
        ).sort((a, b) => a.localeCompare(b, 'id'));
        const prodi = Array.from(
          new Set(data.map((u) => (u.prodi ?? '').trim()).filter(Boolean))
        ).sort((a, b) => a.localeCompare(b, 'id'));
        setOpsiFakultas(fakultas);
        setOpsiProdi(prodi);
      }
    } catch (err: any) {
      if (nomor !== permintaanTerakhir.current) return;
      setBaris([]);
      setGalat(
        err?.response?.data?.message || err?.message || 'Gagal memuat direktori ONE UNUSU.'
      );
    } finally {
      if (nomor === permintaanTerakhir.current) setMemuat(false);
    }
  }, []);

  // Muat pertama kali: tabel langsung terisi tanpa admin mengetik apa pun.
  useEffect(() => {
    void muat({});
  }, [muat]);

  // Gabungan kriteria; dipakai tombol Terapkan dan saat menekan Enter.
  const kriteriaSekarang = useCallback(
    (): KriteriaKandidat => ({
      ...(kataKunci.trim().length >= 2 ? { search: kataKunci.trim() } : {}),
      ...(filterPeran ? { role: filterPeran } : {}),
      ...(filterFakultas ? { fakultas: filterFakultas } : {}),
      ...(filterProdi ? { prodi: filterProdi } : {}),
    }),
    [kataKunci, filterPeran, filterFakultas, filterProdi]
  );

  // Mengetik 2 karakter atau lebih langsung mencari (dengan jeda 400 ms).
  useEffect(() => {
    const kw = kataKunci.trim();
    if (kw.length < 2) return;
    const jeda = setTimeout(() => {
      void muat(kriteriaSekarang());
    }, 400);
    return () => clearTimeout(jeda);
  }, [kataKunci, kriteriaSekarang, muat]);

  const terapkanFilter = () => {
    const kw = kataKunci.trim();
    if (kw.length === 1) {
      setGalat('Ketik minimal 2 karakter untuk mencari, atau kosongkan kolom pencarian.');
      return;
    }
    void muat(kriteriaSekarang());
  };

  const aturUlang = () => {
    setKataKunci('');
    setFilterPeran('');
    setFilterFakultas('');
    setFilterProdi('');
    void muat({});
  };

  const bisaDipilih = (u: KandidatPenggunaOne) => !sudahTerdaftar.has(u.id);

  const semuaTerpilih =
    baris.length > 0 && baris.filter(bisaDipilih).every((u) => terpilih.includes(u.id));

  const toggleSatu = (u: KandidatPenggunaOne) => {
    if (!bisaDipilih(u)) return;
    onUbahTerpilih(
      terpilih.includes(u.id) ? terpilih.filter((x) => x !== u.id) : [...terpilih, u.id]
    );
  };

  const toggleSemua = () => {
    const idBoleh = baris.filter(bisaDipilih).map((u) => u.id);
    if (semuaTerpilih) {
      onUbahTerpilih(terpilih.filter((x) => !idBoleh.includes(x)));
    } else {
      onUbahTerpilih(Array.from(new Set([...terpilih, ...idBoleh])));
    }
  };

  const gayaKontrol =
    'w-full px-4 py-3 min-h-[44px] text-xs rounded-[10px] border border-[#D8E5DC] bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#166534] focus:border-[#166534]';

  return (
    <div className="space-y-3.5">
      {/* ---------- Pencarian & filter ---------- */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
        <div className="md:col-span-4">
          <label htmlFor="cari-kandidat" className="block text-xs font-semibold text-slate-700 mb-1">
            Cari nama / NIDN / NIM
          </label>
          <div className="relative">
            <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="cari-kandidat"
              type="search"
              value={kataKunci}
              onChange={(e) => setKataKunci(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  terapkanFilter();
                }
              }}
              placeholder="Minimal 2 karakter"
              className={`${gayaKontrol} pl-9`}
            />
          </div>
        </div>

        <div className="md:col-span-2">
          <label htmlFor="filter-peran" className="block text-xs font-semibold text-slate-700 mb-1">
            Peran
          </label>
          <select
            id="filter-peran"
            value={filterPeran}
            onChange={(e) => setFilterPeran(e.target.value)}
            className={gayaKontrol}
          >
            <option value="">Semua</option>
            <option value="DOSEN">Dosen</option>
            <option value="MAHASISWA">Mahasiswa</option>
            <option value="TENDIK">Tendik</option>
          </select>
        </div>

        <div className="md:col-span-3">
          <label htmlFor="filter-fakultas" className="block text-xs font-semibold text-slate-700 mb-1">
            Fakultas
          </label>
          <select
            id="filter-fakultas"
            value={filterFakultas}
            onChange={(e) => setFilterFakultas(e.target.value)}
            className={gayaKontrol}
          >
            <option value="">Semua</option>
            {opsiFakultas.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-3">
          <label htmlFor="filter-prodi" className="block text-xs font-semibold text-slate-700 mb-1">
            Program Studi
          </label>
          <select
            id="filter-prodi"
            value={filterProdi}
            onChange={(e) => setFilterProdi(e.target.value)}
            className={gayaKontrol}
          >
            <option value="">Semua</option>
            {opsiProdi.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={terapkanFilter}
          disabled={memuat}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] bg-[#166534] hover:bg-[#14532d] text-white text-xs font-semibold transition disabled:opacity-50"
        >
          <MagnifyingGlassIcon className="w-4 h-4" />
          Terapkan
        </button>
        <button
          type="button"
          onClick={aturUlang}
          disabled={memuat}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] border border-[#D8E5DC] bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition disabled:opacity-50"
        >
          <ArrowPathIcon className="w-4 h-4" />
          Atur ulang
        </button>
        <p className="text-[11px] text-slate-500 ml-auto">
          {memuat ? 'Memuat direktori...' : `${baris.length} pengguna ditampilkan`}
          {terpilih.length > 0 && (
            <span className="ml-2 font-bold text-[#166534]">{terpilih.length} dipilih</span>
          )}
        </p>
      </div>

      {galat && (
        <div
          role="alert"
          className="px-4 py-3 rounded-[10px] bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold"
        >
          {galat}
        </div>
      )}

      {/* ---------- Tabel ---------- */}
      <div className="overflow-x-auto rounded-[12px] border border-[#D8E5DC]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F0FDF4] border-b border-[#D8E5DC]">
              <th scope="col" className="w-12 px-3 py-3">
                <input
                  type="checkbox"
                  aria-label="Pilih semua pengguna pada halaman ini"
                  checked={semuaTerpilih}
                  onChange={toggleSemua}
                  disabled={memuat || baris.filter(bisaDipilih).length === 0}
                  className="w-4 h-4 accent-[#166534]"
                />
              </th>
              <th scope="col" className="w-12 px-2 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                No
              </th>
              <th scope="col" className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Nama
              </th>
              <th scope="col" className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Peran
              </th>
              <th scope="col" className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Fakultas
              </th>
              <th scope="col" className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Program Studi
              </th>
              <th scope="col" className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {memuat && baris.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-xs text-slate-500">
                  Memuat direktori ONE UNUSU...
                </td>
              </tr>
            )}

            {!memuat && baris.length === 0 && !galat && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-xs text-slate-500">
                  Tidak ada pengguna yang cocok. Coba ubah kata kunci atau filter.
                </td>
              </tr>
            )}

            {baris.map((u, idx) => {
              const terdaftar = sudahTerdaftar.has(u.id);
              const dipilih = terpilih.includes(u.id);
              const boleh = !terdaftar;

              return (
                <tr
                  key={u.id}
                  className={`border-b border-[#EEF4EF] last:border-0 transition ${
                    terdaftar
                      ? 'bg-slate-50'
                      : dipilih
                        ? 'bg-[#F0FDF4]'
                        : 'bg-white hover:bg-[#FAFCFB]'
                  }`}
                >
                  <td className="px-3 py-2.5">
                    <input
                      type="checkbox"
                      aria-label={`Pilih ${u.nama}`}
                      checked={dipilih}
                      disabled={!boleh}
                      onChange={() => toggleSatu(u)}
                      className="w-4 h-4 accent-[#166534] disabled:opacity-40 disabled:cursor-not-allowed"
                    />
                  </td>

                  <td className="px-2 py-2.5 text-[11px] font-mono text-slate-500">{idx + 1}</td>

                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      {u.avatar ? (
                        <img
                          src={u.avatar}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover border border-[#D8E5DC] flex-shrink-0"
                          loading="lazy"
                        />
                      ) : (
                        <span
                          aria-hidden="true"
                          className="w-8 h-8 rounded-full bg-[#DCFCE7] text-[#166534] text-[10px] font-bold flex items-center justify-center flex-shrink-0"
                        >
                          {inisial(u.nama)}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">{u.nama}</p>
                        <p className="text-[11px] text-slate-500 font-mono truncate">
                          {u.nidn || u.nim || u.username}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-3 py-2.5 text-[11px] text-slate-700">
                    {labelPeran(u.role)}
                  </td>

                  <td className="px-3 py-2.5 text-[11px] text-slate-600 max-w-[180px]">
                    <span className="line-clamp-2">{u.fakultas || '—'}</span>
                  </td>

                  <td className="px-3 py-2.5 text-[11px] text-slate-600 max-w-[180px]">
                    <span className="line-clamp-2">{u.prodi || '—'}</span>
                  </td>

                  <td className="px-3 py-2.5">
                    {terdaftar ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500">
                        <CheckCircleIcon className="w-3.5 h-3.5" />
                        Terdaftar
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#166534]">
                        <UserCircleIcon className="w-3.5 h-3.5" />
                        Bisa ditambahkan
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-slate-500 leading-relaxed">
        Direktori dibatasi maksimal 20 baris per pemuatan. Persempit dengan pencarian atau filter
        untuk menemukan orang lain. Pengguna bertanda <strong>Terdaftar</strong> sudah menjadi
        anggota LPM.
      </p>
    </div>
  );
};
