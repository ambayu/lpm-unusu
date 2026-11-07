import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldExclamationIcon,
  ArrowPathIcon,
  HomeIcon,
  EnvelopeIcon,
  ArrowTopRightOnSquareIcon,
  UserCircleIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import type { AppAccessInfo } from '../services/api';

/**
 * SsoProblemScreen - halaman penuh untuk kegagalan masuk lewat SSO.
 *
 * Kenapa satu halaman penuh, bukan kartu melayang di tengah layar:
 * ketika proses masuk gagal, tidak ada satu pun isi lain di halaman yang masih
 * berguna. Kartu kecil di tengah latar hanya menyisakan ruang kosong di
 * sekelilingnya dan terasa seperti kotak galat yang muncul tiba-tiba. Satu
 * halaman penuh memberi ruang untuk menjelaskan apa yang terjadi dan apa yang
 * bisa dilakukan pembaca.
 *
 * Kenapa bahasanya tidak menyebut nama teknis:
 * orang yang membaca layar ini adalah pengguna kampus, bukan pengembang. Pesan
 * seperti "Client ID tidak cocok" tidak memberitahu apa pun yang bisa mereka
 * lakukan, dan membuat mereka mengira akunnya rusak. Yang ditampilkan di sini
 * hanya tiga hal: apa yang terjadi, apa artinya bagi mereka, dan langkah
 * berikutnya.
 *
 * Dua keadaan dibedakan:
 *  1. Penolakan peran (`denial` terisi). Akun dikenali, tetapi perannya bukan
 *     milik LPM. Ditampilkan sebagai rincian peran, sebab satu akun boleh
 *     memiliki peran di banyak aplikasi.
 *  2. Kegagalan proses masuk (`masalah` terisi). Tiket tidak dapat ditukar.
 *
 * Palet memakai `lpm-blue` sebagai warna aksi sesuai AGENTS.md LPM UNUSU, dengan
 * `lpm-yellow` sebagai aksen. Kuning LPM hanya dipakai di atas latar biru tua
 * atau di dalam blok pemberitahuan, karena sebagai teks di atas putih rasio
 * kontrasnya tidak memadai.
 */

const ONE_UNUSU_URL = import.meta.env.VITE_ONE_UNUSU_URL || 'http://localhost:5173';

type Masalah = {
  judul: string;
  penjelasan: string;
  langkah: string[];
  catatan?: string;
};

type Props = {
  masalah?: Masalah | null;
  denial?: AppAccessInfo | null;
  onCobaLagi?: () => void;
  alamatBantuan?: string;
  tahun?: number;
};

export function SsoProblemScreen({
  masalah,
  denial,
  onCobaLagi,
  alamatBantuan,
  tahun = new Date().getFullYear(),
}: Props) {
  const isDenial = Boolean(denial);
  const isForeignAdmin = denial?.reason === 'foreign_app_admin';

  const judul = isDenial
    ? isForeignAdmin
      ? 'Akun ini terdaftar pada aplikasi lain'
      : 'Akun ini belum memiliki akses ke LPM'
    : masalah?.judul || '';

  const penjelasan = isDenial
    ? isForeignAdmin
      ? 'Akun ONE UNUSU Anda berhasil dikenali, tetapi perannya tercatat sebagai administrator aplikasi lain. Satu akun boleh memiliki peran di banyak aplikasi, namun setiap panel hanya menerima peran miliknya sendiri.'
      : 'Akun ONE UNUSU Anda berhasil dikenali, tetapi perannya belum mencakup panel LPM. Setiap aplikasi kampus memberi hak akses tersendiri, jadi akun yang biasa dipakai di aplikasi lain belum tentu bisa membuka panel ini.'
    : masalah?.penjelasan || '';

  const langkah = isDenial
    ? [
        isForeignAdmin
          ? `Akun Anda tercatat sebagai administrator ${denial?.foreignApp?.name || 'aplikasi lain di ekosistem ONE UNUSU'}.`
          : `Peran yang aktif pada akun Anda belum termasuk peran LPM.`,
        'Bila Anda memang bertugas di LPM, minta Superadmin ONE UNUSU menambahkan peran Administrator LPM pada akun Anda.',
        'Setelah peran ditambahkan, silakan masuk lagi dari halaman ini.',
      ]
    : masalah?.langkah || [];

  return (
    <div className="min-h-screen w-full bg-[#F1F5F2] text-slate-800 font-sans selection:bg-lpm-yellow-400 selection:text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        {/* Kepala halaman: hanya identitas, tanpa navigasi. */}
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="grid h-9 w-9 place-items-center rounded-xl bg-lpm-blue-900 text-lpm-yellow-400"
            >
              <ShieldExclamationIcon className="h-5 w-5" strokeWidth={2} />
            </span>
            <span className="text-sm font-extrabold tracking-tight text-slate-950">
              LPM <span className="text-lpm-blue-900">UNUSU</span>
            </span>
          </div>
          <Link
            to="/"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-200/60 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-lpm-blue-700 focus-visible:ring-offset-2"
          >
            <HomeIcon className="h-4 w-4" aria-hidden="true" />
            <span>Beranda</span>
          </Link>
        </header>

        {/* Isi: dua kolom di layar lebar, satu kolom di ponsel. */}
        <main
          role="alert"
          className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-12 lg:gap-16 lg:py-16"
        >
          <div className="lg:col-span-7">
            {/* Eyebrow berupa bilah tegak, mengikuti pola halaman lain. */}
            <p className="border-l-2 border-lpm-yellow-500 pl-3 text-xs font-semibold uppercase tracking-[0.2em] text-amber-800">
              {isDenial ? 'Akses panel ditolak' : 'Proses masuk terhenti'}
            </p>

            <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-slate-950 sm:text-4xl lg:text-[2.75rem]">
              {judul}
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
              {penjelasan}
            </p>

            {langkah.length > 0 && (
              <ol className="mt-8 max-w-xl space-y-4">
                {langkah.map((item, idx) => (
                  <li key={item} className="flex items-start gap-3.5">
                    <span
                      aria-hidden="true"
                      className="mt-0.5 grid h-7 w-7 flex-shrink-0 place-items-center rounded-lg bg-lpm-blue-900 text-[11px] font-bold tabular-nums text-lpm-yellow-400"
                    >
                      {idx + 1}
                    </span>
                    <span className="text-sm leading-relaxed text-slate-700">{item}</span>
                  </li>
                ))}
              </ol>
            )}

            <div className="mt-9 flex flex-wrap items-center gap-3">
              {isDenial ? (
                <a
                  href={ONE_UNUSU_URL}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[10px] bg-lpm-blue-900 px-5 text-sm font-bold text-white transition-colors hover:bg-lpm-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-lpm-blue-700 focus-visible:ring-offset-2"
                >
                  <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden="true" />
                  <span>Buka Portal ONE UNUSU</span>
                </a>
              ) : (
                onCobaLagi && (
                  <button
                    type="button"
                    onClick={onCobaLagi}
                    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[10px] bg-lpm-blue-900 px-5 text-sm font-bold text-white transition-colors hover:bg-lpm-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-lpm-blue-700 focus-visible:ring-offset-2"
                  >
                    <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
                    <span>Coba masuk lagi</span>
                  </button>
                )
              )}
              <Link
                to="/login"
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[10px] border border-[#CBD5E1] bg-white px-5 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-lpm-blue-700 focus-visible:ring-offset-2"
              >
                <HomeIcon className="h-4 w-4" aria-hidden="true" />
                <span>Kembali ke halaman masuk</span>
              </Link>
            </div>

            {alamatBantuan && (
              <p className="mt-6 flex items-center gap-2 text-xs text-slate-500">
                <EnvelopeIcon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                <span>
                  Bila masih terhenti, hubungi administrator LPM di{' '}
                  <a
                    href={`mailto:${alamatBantuan}`}
                    className="font-semibold text-lpm-blue-800 underline decoration-lpm-blue-300 underline-offset-2 hover:decoration-lpm-blue-700"
                  >
                    {alamatBantuan}
                  </a>
                  .
                </span>
              </p>
            )}
          </div>

          {/* Panel keterangan: rincian peran atau keadaan sistem, tanpa istilah teknis. */}
          <aside className="lg:col-span-5">
            <div className="rounded-3xl border border-lpm-blue-950 bg-lpm-blue-900 p-7 text-white sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lpm-yellow-400">
                {isDenial ? 'Rincian akun' : 'Yang perlu diketahui'}
              </p>

              {isDenial ? (
                <>
                  <dl className="mt-5 divide-y divide-white/15">
                    <div className="flex items-start justify-between gap-4 py-3 first:pt-0">
                      <dt className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-blue-200">
                        <UserCircleIcon className="h-4 w-4" aria-hidden="true" />
                        Peran akun
                      </dt>
                      <dd className="text-right text-xs font-semibold text-white">
                        {denial?.ssoRole || 'Belum terbaca'}
                      </dd>
                    </div>
                    <div className="flex items-start justify-between gap-4 py-3">
                      <dt className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-blue-200">
                        <LockClosedIcon className="h-4 w-4" aria-hidden="true" />
                        Panel tujuan
                      </dt>
                      <dd className="text-right text-xs font-semibold text-white">
                        {denial?.appName || 'LPM UNUSU'}
                      </dd>
                    </div>
                    <div className="flex items-start justify-between gap-4 py-3 last:pb-0">
                      <dt className="text-[11px] font-bold uppercase tracking-wider text-blue-200">
                        Peran milik
                      </dt>
                      <dd className="max-w-[52%] text-right text-xs font-semibold text-white">
                        {denial?.foreignApp?.name || 'Aplikasi lain di ekosistem ONE UNUSU'}
                      </dd>
                    </div>
                  </dl>

                  <p className="mt-6 rounded-xl border border-lpm-yellow-400 bg-lpm-yellow-400 px-4 py-3 text-[11px] leading-relaxed text-slate-900">
                    Satu akun ONE UNUSU boleh memiliki peran di banyak aplikasi, tetapi setiap panel
                    hanya menerima peran miliknya sendiri.
                  </p>
                </>
              ) : (
                <ul className="mt-5 space-y-4 text-sm leading-relaxed text-blue-50/90">
                  <li className="flex items-start gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-lpm-yellow-400"
                    />
                    <span>Akun dan kata sandi Anda tidak berubah. Tidak ada data yang hilang.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-lpm-yellow-400"
                    />
                    <span>
                      Halaman ini hanya mencatat bahwa proses masuk belum berhasil diselesaikan.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-lpm-yellow-400"
                    />
                    <span>
                      Beberapa aplikasi kampus memiliki hak akses tersendiri, jadi satu akun belum
                      tentu bisa membuka semua aplikasi.
                    </span>
                  </li>
                </ul>
              )}

              {!isDenial && masalah?.catatan && (
                <p className="mt-6 border-t border-white/20 pt-5 text-xs leading-relaxed text-blue-200">
                  {masalah.catatan}
                </p>
              )}
            </div>
          </aside>
        </main>

        <footer className="border-t border-slate-300/60 pt-6 pb-2">
          <p className="text-xs text-slate-500">
            &copy; {tahun} LPM UNUSU. Universitas Nahdlatul Ulama Sumatera Utara.
          </p>
        </footer>
      </div>
    </div>
  );
}

export default SsoProblemScreen;
