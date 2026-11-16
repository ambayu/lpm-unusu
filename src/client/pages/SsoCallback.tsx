import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ssoLogin } from '../services/api';
import type { AppAccessInfo } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { SsoLoadingScreen } from '../components/SsoLoadingScreen';
import { SsoProblemScreen } from '../components/SsoProblemScreen';

type SsoExchangeResult = Awaited<ReturnType<typeof ssoLogin>>;

const exchangeRequests = new Map<string, Promise<SsoExchangeResult>>();

/** Kunci sesi lokal, sama dengan yang dibaca AuthProvider. */
const TOKEN_KEY_CALLBACK = 'lpm_unusu_token';
const USER_KEY_CALLBACK = 'lpm_unusu_user';

/**
 * Tiket terakhir yang terbaca dari address bar. Dipakai agar pemasangan ulang
 * komponen setelah `replaceState` tidak kehilangan tiket dan salah menampilkan
 * layar "permintaan belum selesai".
 */
let TIKET_TERAKHIR: string | null = null;

/** Penanda sesi ditolak karena peran milik aplikasi lain, dibaca halaman Login. */
const DENIED_FLAG_KEY = 'lpm_sso_denied';

/** Alamat bantuan yang ditampilkan pada layar kegagalan masuk. */
const ALAMAT_BANTUAN = import.meta.env.VITE_BANTUAN_EMAIL || 'lpm@unusu.ac.id';

type Masalah = {
  jenis: 'kosong' | 'token' | 'jaringan' | 'umum';
  judul: string;
  penjelasan: string;
  langkah: string[];
  catatan?: string;
};

/**
 * Pesan kegagalan yang dibaca pengguna.
 *
 * Server mengirim keterangan berbahasa mesin, misalnya "Client ID tidak cocok
 * dengan aplikasi ini" atau "Verifikasi token SSO gagal". Kalimat seperti itu
 * tidak memberi tahu pembaca apa yang harus dilakukan, dan justru membuatnya
 * mengira akunnya bermasalah. Fungsi ini menerjemahkannya menjadi penjelasan
 * yang menjawab tiga pertanyaan: apa yang terjadi, mengapa, dan apa langkah
 * berikutnya. Tidak ada nama parameter atau kode internal yang ikut tampil.
 */
export function terjemahkanGagalSso(err: any, payload: any): Masalah {
  const status = err?.response?.status;
  const pesanServer = String(payload?.message || '').toLowerCase();

  if (status === 401 || pesanServer.includes('token')) {
    return {
      jenis: 'token',
      judul: 'Waktu masuk Anda sudah berakhir',
      penjelasan:
        'Tautan masuk yang dipakai hanya berlaku sekali dan dalam waktu singkat. Tautan yang sudah terpakai, terbuka di dua tab, atau didiamkan terlalu lama tidak bisa dipakai lagi.',
      langkah: [
        'Tutup tab ini, lalu buka kembali halaman masuk LPM.',
        'Masuk ulang dari awal agar Anda menerima tautan yang baru.',
        'Hindari membuka tautan masuk di beberapa tab sekaligus.',
      ],
      catatan: 'Akun Anda tidak terkunci. Yang berakhir hanya tautan masuknya.',
    };
  }

  if (!err?.response) {
    return {
      jenis: 'jaringan',
      judul: 'Koneksi ke portal kampus terputus',
      penjelasan:
        'Perangkat Anda tidak berhasil menghubungi layanan masuk kampus. Ini biasanya terjadi karena jaringan yang tidak stabil atau halaman yang dibuka terlalu lama tanpa aktivitas.',
      langkah: [
        'Periksa apakah perangkat Anda masih terhubung ke internet.',
        'Muat ulang halaman ini, lalu coba masuk kembali.',
        'Bila memakai jaringan kampus, coba jaringan lain untuk memastikan.',
      ],
    };
  }

  return {
    jenis: 'umum',
    judul: 'Proses masuk belum berhasil diselesaikan',
    penjelasan:
      'Portal kampus tidak mengembalikan konfirmasi yang dibutuhkan aplikasi, sehingga sesi Anda belum dapat dibuka. Kejadian seperti ini umumnya bersifat sementara dan tidak berkaitan dengan isi akun Anda.',
    langkah: [
      'Tutup tab ini, lalu buka kembali halaman masuk LPM.',
      'Masuk ulang dengan akun ONE UNUSU Anda.',
      'Bila masih terhenti, hubungi administrator LPM dengan menyebutkan waktu kejadiannya.',
    ],
    catatan: 'Tidak ada data yang berubah selama proses ini.',
  };
}

function exchangeSsoToken(token: string): Promise<SsoExchangeResult> {
  const key = token;
  const pending = exchangeRequests.get(key);

  if (pending) {
    return pending;
  }

  const request = ssoLogin(token);
  exchangeRequests.set(key, request);

  request.catch(() => {
    exchangeRequests.delete(key);
  });

  return request;
}

export function SsoCallbackPage() {
  const { saveSession } = useAuth();
  const navigate = useNavigate();
  const [masalah, setMasalah] = useState<Masalah | null>(null);
  const [denial, setDenial] = useState<AppAccessInfo | null>(null);

  /*
   * Tiket dapat sampai ke tab ini lewat dua jalan: query `/sso/callback?token=`
   * pada permintaan pertama, atau sesi lokal yang sudah tersimpan. Kasus kedua
   * bukan kegagalan — pengguna hanya perlu diarahkan ke panel, bukan diberi
   * layar "permintaan belum selesai".
   */
  useEffect(() => {
    const adaTiketDiUrl = new URLSearchParams(window.location.search).has('token');
    if (
      !adaTiketDiUrl &&
      localStorage.getItem(TOKEN_KEY_CALLBACK) &&
      localStorage.getItem(USER_KEY_CALLBACK)
    ) {
      navigate('/admin', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    /*
     * Tiket dibaca sekali dari URL lalu disimpan di memori modul. Penyimpanan
     * ini penting karena `replaceState` sudah membersihkan address bar: bila
     * komponen terpasang ulang (React StrictMode memulangkan efek, atau halaman
     * dimuat ulang), tiket tetap tersedia dan proses tidak dianggap batal.
     */
    const tokenDariUrl = new URLSearchParams(window.location.search).get('token');
    if (tokenDariUrl && tokenDariUrl.length <= 256) {
      TIKET_TERAKHIR = tokenDariUrl;
    }

    // Tiket sekali pakai tidak perlu tertinggal di address bar/history/referrer.
    window.history.replaceState(null, '', `${window.location.pathname}`);

    /*
     * Tanpa tiket di URL: bila sesi lokal sudah ada, pengguna kemungkinan
     * membuka ulang tab callback setelah berhasil masuk. Arahkan ke panel
     * alih-alih menampilkan galat.
     */
    if (!tokenDariUrl && localStorage.getItem(TOKEN_KEY_CALLBACK)) {
      navigate('/admin', { replace: true });
      return;
    }

    const token = tokenDariUrl || TIKET_TERAKHIR;

    // Portal mengirim balik pengguna tanpa tiket bila permintaan izin memang
    // tidak selesai. Ini keadaan normal, bukan kerusakan, jadi penjelasannya
    // dibuat ringan dan tidak menuduh pengguna melakukan kesalahan.
    if (!token) {
      setMasalah({
        jenis: 'kosong',
        judul: 'Permintaan masuk belum selesai',
        penjelasan:
          'Halaman ini terbuka tanpa menyelesaikan langkah persetujuan di portal kampus. Biasanya ini terjadi karena proses sebelumnya dibatalkan atau halaman dimuat ulang di tengah jalan.',
        langkah: [
          'Buka halaman masuk LPM dan tekan tombol masuk.',
          'Selesaikan seluruh langkah di portal kampus tanpa menutup tab.',
          'Anda akan kembali ke sini secara otomatis setelah persetujuan selesai.',
        ],
      });
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const response = await exchangeSsoToken(token);
        if (!response.data?.success) {
          throw new Error('Respons masuk tidak dapat dibaca');
        }

        saveSession(response.data.token, response.data.user, response.data.appAccess);
        TIKET_TERAKHIR = null;

        if (!cancelled) {
          // Setelah login sukses SELALU mendarat di panel, bukan halaman publik.
          window.location.replace('/admin');
        }
      } catch (err: any) {
        if (cancelled) return;

        const payload = err.response?.data;
        const access: AppAccessInfo | undefined = payload?.appAccess;

        // Token sah di ekosistem, tetapi peran bukan milik aplikasi LPM
        // (mis. ADMIN_LPPM). Penolakan ditampilkan sebagai rincian peran,
        // bukan pesan galat umum, karena akunnya sendiri tidak bermasalah.
        if (access && access.allowed === false) {
          setDenial(access);
          try {
            sessionStorage.setItem(
              DENIED_FLAG_KEY,
              JSON.stringify({ ssoRole: access.ssoRole, reason: access.reason, app: access.appName })
            );
          } catch {
            /* sessionStorage dapat diblokir; alur utama tetap berjalan */
          }
          return;
        }

        setMasalah(terjemahkanGagalSso(err, payload));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [saveSession, navigate]);

  // Verifikasi tiket menunggu request jaringan nyata (server-to-server), jadi
  // layar tunggu penuh memang pantas ditampilkan. Gayanya disamakan dengan
  // layar tunggu di halaman login supaya seluruh rangkaian masuk terasa satu
  // alur, bukan beberapa halaman berbeda.
  if (!masalah && !denial) {
    return (
      <SsoLoadingScreen
        title="Memverifikasi tiket masuk"
        description="Aplikasi sedang memvalidasi token sekali pakai Anda. Jangan tutup halaman ini."
      />
    );
  }

  // Penolakan peran tidak diulang lewat tombol, karena menukar ulang tiket pasti
  // berakhir sama. Yang ditawarkan adalah membuka portal agar peran diperbaiki.
  const bolehUlangi =
    !denial &&
    masalah !== null &&
    (masalah.jenis === 'token' || masalah.jenis === 'jaringan' || masalah.jenis === 'umum');

  return (
    <SsoProblemScreen
      masalah={masalah}
      denial={denial}
      alamatBantuan={ALAMAT_BANTUAN}
      onCobaLagi={bolehUlangi ? () => window.location.reload() : undefined}
    />
  );
}
