import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ssoLogin } from '../services/api';
import type { AppAccessInfo } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { SsoLoadingScreen } from '../components/SsoLoadingScreen';
import { SsoProblemScreen } from '../components/SsoProblemScreen';

type SsoExchangeResult = Awaited<ReturnType<typeof ssoLogin>>;

const exchangeRequests = new Map<string, Promise<SsoExchangeResult>>();

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

function exchangeSsoToken(clientId: string, token: string): Promise<SsoExchangeResult> {
  const key = `${clientId}:${token}`;
  const pending = exchangeRequests.get(key);

  if (pending) {
    return pending;
  }

  const request = ssoLogin(clientId, token);
  exchangeRequests.set(key, request);

  request.catch(() => {
    exchangeRequests.delete(key);
  });

  return request;
}

export function SsoCallbackPage() {
  const [params] = useSearchParams();
  const { saveSession } = useAuth();
  const [masalah, setMasalah] = useState<Masalah | null>(null);
  const [denial, setDenial] = useState<AppAccessInfo | null>(null);

  useEffect(() => {
    const clientId = params.get('client_id');
    const token = params.get('token');

    // Portal mengirim balik pengguna tanpa tiket bila permintaan izin tidak
    // selesai. Ini keadaan normal, bukan kerusakan, jadi penjelasannya dibuat
    // ringan dan tidak menuduh pengguna melakukan kesalahan.
    if (!clientId || !token) {
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
        const response = await exchangeSsoToken(clientId, token);
        if (!response.data?.success) {
          throw new Error('Respons masuk tidak dapat dibaca');
        }

        saveSession(response.data.token, response.data.user, response.data.appAccess);

        if (!cancelled) {
          // Setelah login sukses SELALU mendarat di panel, bukan halaman publik.
          // BASE_URL dipertahankan untuk deploy di subfolder.
          const dashboardPath = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/admin`;
          window.location.replace(dashboardPath);
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
  }, [params, saveSession]);

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
