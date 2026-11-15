import axios from 'axios';
import type { NotificationDetail } from '../components/NotificationModal';

/** Ringkasan kegagalan siap tampil pada `NotificationModal`. */
export interface DeskripsiGalat {
  /** Judul modal, mis. "Gagal Menyimpan Dokumen". */
  title: string;
  /** Kalimat utama — apa yang gagal dan objeknya. */
  message: string;
  /** Daftar penyebab (pesan server / nama field). */
  details: NotificationDetail[];
  /** Status HTTP atau kode kesalahan server (mis. "HTTP 500", "KATEGORI_TIDAK_DITEMUKAN"). */
  code: string | null;
}

/** Field formulir yang boleh disebut dengan nama manusiawi. */
export type FieldLabel = Record<string, string>;

/** Batas ukuran berkas PDF yang boleh diunggah (5 MB). Dipakai klien & teks bantuan. */
export const BATAS_UKURAN_PDF_MB = 5;
export const BATAS_UKURAN_PDF_BYTE = BATAS_UKURAN_PDF_MB * 1024 * 1024;

const STATUS_LABEL: Record<number, string> = {
  400: 'Data yang dikirim tidak valid',
  401: 'Sesi login telah berakhir',
  403: 'Akun Anda tidak memiliki izin untuk tindakan ini',
  404: 'Data yang dituju tidak ditemukan di server',
  413: 'Berkas yang diunggah melebihi batas ukuran server',
  422: 'Data ditolak oleh validasi server',
  500: 'Server gagal memproses permintaan',
  502: 'Layanan terkait tidak dapat dihubungi',
  503: 'Server sedang tidak tersedia',
};

/** Ubah "tanggalMulaiBerlaku" → "Tanggal Mulai Berlaku". */
const humanize = (key: string) =>
  key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * Susun deskripsi galat yang MENJELASKAN APA YANG GAGAL.
 *
 * Sumber pesan, berurutan:
 *  1. `errors[]` dari server (`{ field, message }`) → dirinci per field.
 *  2. `message` dari server (mis. "Kategori tidak ditemukan").
 *  3. Status HTTP + saran tindakan bila server tidak mengirim pesan.
 *  4. Untuk kegagalan jaringan/timeout: sebab teknisnya disebut eksplisit.
 */
export const deskripsikanGalat = (
  err: unknown,
  aksi: string,
  objek: string,
  fieldLabel: FieldLabel = {},
): DeskripsiGalat => {
  const title = `Gagal ${aksi}`;
  const message = `Tindakan "${aksi}" pada ${objek} tidak dapat diselesaikan oleh server.`;
  const details: NotificationDetail[] = [];
  let code: string | null = null;

  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const data = err.response?.data as
      | { message?: string; code?: string; errors?: Array<{ field?: string; message?: string }> }
      | undefined;

    if (status) code = `HTTP ${status}`;
    if (data?.code) code = data.code;

    if (Array.isArray(data?.errors)) {
      data.errors.forEach((item) => {
        if (!item) return;
        const field = item.field ? fieldLabel[item.field] || humanize(item.field) : undefined;
        if (item.message) details.push({ field, message: item.message });
      });
    }

    if (data?.message) {
      details.unshift({ message: data.message });
    }

    if (details.length === 0) {
      const label = status ? STATUS_LABEL[status] : undefined;
      details.push({
        message:
          label ||
          (status
            ? `Server menolak permintaan tanpa penjelasan tambahan.`
            : 'Server tidak mengirimkan penjelasan kegagalan.'),
      });
      if (status === 500) {
        details.push({
          message:
            'Periksa log server aplikasi untuk detail teknis, lalu coba simpan ulang setelah masalah diperbaiki.',
        });
      }
    }
  } else if (err instanceof Error) {
    details.push({ message: err.message || 'Terjadi kesalahan tak terduga di peramban.' });
  } else {
    details.push({ message: 'Terjadi kesalahan tak terduga tanpa keterangan.' });
  }

  return { title, message, details, code };
};

/** Deskripsi galat untuk validasi klien (tanpa request server). */
export const galatValidasi = (
  aksi: string,
  objek: string,
  detail: NotificationDetail[],
): DeskripsiGalat => ({
  title: `Gagal ${aksi}`,
  message: `Tindakan "${aksi}" pada ${objek} dibatalkan karena data belum lengkap atau tidak sesuai.`,
  details: detail,
  code: null,
});
