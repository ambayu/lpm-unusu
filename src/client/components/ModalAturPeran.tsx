import React, { useEffect, useState } from 'react';
import { XMarkIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { SSO_ROLE_LABEL, type RbacPengguna, type RbacPeran } from '../services/api';

/**
 * ModalAturPeran — menetapkan peran LPM seorang pengguna.
 *
 * Sebelumnya peran diubah lewat dropdown di dalam baris tabel. Dropdown itu
 * hanya muat satu pilihan, sulit dibaca, dan rawan salah klik karena jaraknya
 * berdekatan dengan tombol hapus. Modal memberi ruang untuk melihat izin tiap
 * peran sebelum memutuskan.
 *
 * Satu pengguna memegang SATU peran LPM pada satu waktu, konsisten dengan
 * dropdown yang digantikannya. Mengosongkan pilihan berarti mencabut peran
 * (pengguna tetap terdaftar tetapi tidak dapat memakai panel).
 */
export interface ModalAturPeranProps {
  terbuka: boolean;
  pengguna: RbacPengguna | null;
  opsiPeran: RbacPeran[];
  sedangMenyimpan: boolean;
  pesanGalat?: string | null;
  onTutup: () => void;
  onSimpan: (kodePeran: string) => void;
}

export const ModalAturPeran: React.FC<ModalAturPeranProps> = ({
  terbuka,
  pengguna,
  opsiPeran,
  sedangMenyimpan,
  pesanGalat,
  onTutup,
  onSimpan,
}) => {
  const [dipilih, setDipilih] = useState<string>('');

  // Samakan pilihan dengan peran yang sedang dipegang setiap kali modal dibuka.
  useEffect(() => {
    if (terbuka && pengguna) setDipilih(pengguna.peran[0] ?? '');
  }, [terbuka, pengguna]);

  // Tutup dengan tombol Escape — kebiasaan modal yang lazim.
  useEffect(() => {
    if (!terbuka) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !sedangMenyimpan) onTutup();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [terbuka, sedangMenyimpan, onTutup]);

  if (!terbuka || !pengguna) return null;

  const isSuperadmin =
    pengguna.ssoRole === 'SUPERADMIN' ||
    pengguna.peran.includes('SUPERADMIN') ||
    pengguna.username === 'admin';

  const berubah = dipilih !== (pengguna.peran[0] ?? '');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="judul-modal-peran"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !sedangMenyimpan) onTutup();
      }}
    >
      <div className="w-full max-w-lg bg-white rounded-[16px] shadow-xl overflow-hidden">
        {/* Kepala */}
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-[#D8E5DC]">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-[10px] bg-[#F0FDF4] text-[#166534] flex items-center justify-center flex-shrink-0">
              <ShieldCheckIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 id="judul-modal-peran" className="text-sm font-bold text-slate-900">
                Atur Peran LPM
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                {pengguna.nama} · {pengguna.username}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onTutup}
            disabled={sedangMenyimpan}
            className="p-1.5 rounded-[8px] text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition disabled:opacity-50"
            aria-label="Tutup"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Isi */}
        <div className="px-5 py-4 space-y-3 max-h-[60vh] overflow-y-auto">
          {isSuperadmin && (
            <div className="px-3.5 py-3 rounded-[10px] bg-amber-50 border border-amber-200">
              <p className="text-[11px] font-semibold text-amber-800 leading-relaxed">
                Akun ini Superadmin ekosistem. Perannya selalu Superadmin dan tidak dapat diubah
                dari panel LPM.
              </p>
            </div>
          )}

          {pesanGalat && (
            <div
              role="alert"
              className="px-3.5 py-3 rounded-[10px] bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-semibold"
            >
              {pesanGalat}
            </div>
          )}

          <fieldset disabled={isSuperadmin || sedangMenyimpan}>
            <legend className="block text-xs font-semibold text-slate-700 mb-2">Peran</legend>
            {opsiPeran.length === 0 ? (
              <p className="text-[11px] text-slate-500 italic">
                Daftar peran belum tersedia. Pastikan migrasi &amp; seeder RBAC sudah dijalankan.
              </p>
            ) : (
              <div className="space-y-2">
                <label
                  className={`flex items-start gap-2.5 p-3 rounded-[10px] border transition ${
                    dipilih === ''
                      ? 'border-[#166534] bg-[#F0FDF4] cursor-pointer'
                      : 'border-[#D8E5DC] bg-white hover:bg-slate-50 cursor-pointer'
                  } ${isSuperadmin ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="radio"
                    name="peran-lpm"
                    value=""
                    checked={dipilih === ''}
                    onChange={() => setDipilih('')}
                    className="mt-0.5 w-4 h-4 accent-[#166534]"
                  />
                  <span className="min-w-0">
                    <span className="block text-xs font-bold text-slate-900">Tanpa peran</span>
                    <span className="block text-[11px] text-slate-500 leading-snug">
                      Tetap terdaftar, tetapi tidak bisa membuka panel LPM.
                    </span>
                  </span>
                </label>

                {opsiPeran.map((p) => {
                  const aktif = dipilih === p.kode;
                  return (
                    <label
                      key={p.kode}
                      className={`flex items-start gap-2.5 p-3 rounded-[10px] border transition ${
                        aktif
                          ? 'border-[#166534] bg-[#F0FDF4] cursor-pointer'
                          : 'border-[#D8E5DC] bg-white hover:bg-slate-50 cursor-pointer'
                      } ${isSuperadmin ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      <input
                        type="radio"
                        name="peran-lpm"
                        value={p.kode}
                        checked={aktif}
                        onChange={() => setDipilih(p.kode)}
                        className="mt-0.5 w-4 h-4 accent-[#166534]"
                      />
                      <span className="min-w-0">
                        <span className="block text-xs font-bold text-slate-900">
                          {p.nama || p.label || SSO_ROLE_LABEL[p.kode.toUpperCase()] || p.kode}
                        </span>
                        <span className="block text-[11px] text-slate-500 leading-snug">
                          {p.permissionsCount} izin
                          {p.deskripsi || p.description ? ` · ${p.deskripsi || p.description}` : ''}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </fieldset>
        </div>

        {/* Kaki */}
        <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-[#D8E5DC] bg-[#FAFCFB]">
          <button
            type="button"
            onClick={onTutup}
            disabled={sedangMenyimpan}
            className="px-4 py-2.5 rounded-[8px] border border-[#D8E5DC] bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => onSimpan(dipilih)}
            disabled={sedangMenyimpan || isSuperadmin || !berubah}
            className="px-4 py-2.5 rounded-[8px] bg-[#166534] hover:bg-[#14532d] text-white text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sedangMenyimpan ? 'Menyimpan...' : 'Simpan Peran'}
          </button>
        </div>
      </div>
    </div>
  );
};
