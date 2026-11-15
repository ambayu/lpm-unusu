import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { Request, Response, NextFunction } from "express";

/**
 * Penyimpanan berkas PDF arsip dokumen.
 *
 * Berkas TIDAK lagi disimpan sebagai data URL base64 di kolom database.
 * Alasannya:
 *  - baris database membengkak (PDF 5 MB menjadi ~6,7 MB teks base64),
 *  - setiap daftar dokumen ikut menarik seluruh isi PDF,
 *  - tidak ada cache/CDN dan tidak ada dukungan HTTP Range untuk pratinjau.
 *
 * Sebagai gantinya berkas ditulis ke `uploads/dokumen` dan kolom `filePdfUrl`
 * hanya berisi URL pendek yang ditandatangani. Tanda tangan membuat URL tidak
 * dapat ditebak: hanya pemegang URL hasil penerbitan server yang bisa membaca
 * berkas, dan URL itu tidak dapat dipakai untuk membaca berkas dokumen lain.
 */

const APP_MARK = "arsip-dokumen";

/** Folder fisik penyimpanan berkas arsip. */
export const ARSIP_DIR = path.resolve(process.cwd(), "uploads", "dokumen");

/** Batas ukuran berkas yang diterima. */
export const ARSIP_MAX_BYTES = 10 * 1024 * 1024;

/** Rahasia tanda tangan URL. Wajib sama di LPM dan LPPM. */
function ambilSecret(): string {
  const secret = process.env.ARSIP_FILE_URL_SECRET || "";
  if (!secret) {
    throw new Error(
      "ARSIP_FILE_URL_SECRET belum diset. Berkas arsip tidak dapat disimpan maupun dibaca."
    );
  }
  return secret;
}

/** Base URL publik aplikasi ini, dipakai saat menyusun URL berkas. */
function ambilBaseUrl(): string {
  return (process.env.ARSIP_PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 5004}`).replace(
    /\/$/,
    ""
  );
}

/** Membuat nama berkas acak yang aman dari path traversal. */
function namaBerkasBaru(): string {
  return `${Date.now().toString(36)}-${randomBytes(12).toString("hex")}.pdf`;
}

/** Menandatangani nama berkas agar URL tidak dapat dipalsukan. */
function tandaTangan(namaBerkas: string): string {
  return createHmac("sha256", ambilSecret())
    .update(`${APP_MARK}|${namaBerkas}`)
    .digest("hex")
    .slice(0, 32);
}

/** Memastikan nama berkas hanya berupa nama berkas, bukan path. */
function namaBerkasAman(namaBerkas: string): boolean {
  return /^[A-Za-z0-9._-]{1,120}\.pdf$/.test(namaBerkas);
}

/** Menyusun URL bertanda tangan untuk sebuah berkas. */
export function urlBerkasArsip(namaBerkas: string): string {
  return `${ambilBaseUrl()}/api/arsip-berkas/${namaBerkas}?t=${tandaTangan(namaBerkas)}`;
}

export interface HasilSimpan {
  url: string;
  ukuran: number;
}

/**
 * Menyimpan buffer PDF ke disk dan mengembalikan URL bertanda tangan.
 *
 * Berkas ditulis dengan nama acak sehingga nama asli (yang mungkin memuat
 * informasi pribadi) tidak pernah muncul di URL.
 */
export async function simpanBerkasArsip(buffer: Buffer): Promise<HasilSimpan> {
  if (buffer.length === 0) {
    throw new Error("Berkas kosong.");
  }
  if (buffer.length > ARSIP_MAX_BYTES) {
    throw new Error("Ukuran berkas melebihi batas 10 MB.");
  }
  // Pemeriksaan tanda tangan PDF: bukan sekadar percaya nama ekstensi.
  const pdfSign = buffer.subarray(0, 4).toString("latin1");
  if (pdfSign !== "%PDF") {
    throw new Error("Berkas bukan dokumen PDF yang sah.");
  }

  await fs.promises.mkdir(ARSIP_DIR, { recursive: true });
  const namaBerkas = namaBerkasBaru();
  await fs.promises.writeFile(path.join(ARSIP_DIR, namaBerkas), buffer);
  return { url: urlBerkasArsip(namaBerkas), ukuran: buffer.length };
}

/** Menghapus berkas lama yang sudah diganti; kegagalan diabaikan. */
export async function hapusBerkasArsip(url: string | null | undefined): Promise<void> {
  if (!url) return;
  try {
    const namaBerkas = new URL(url).pathname.split("/").pop() ?? "";
    if (!namaBerkasAman(namaBerkas)) return;
    await fs.promises.unlink(path.join(ARSIP_DIR, namaBerkas));
  } catch {
    // Berkas sudah tidak ada atau URL bukan milik arsip ini: tidak masalah.
  }
}

/**
 * Handler penyajian berkas arsip bertanda tangan.
 *
 * Hanya melayani berkas di dalam `upload/dokumen` dengan tanda tangan sah.
 * Mendukung `Range` agar PDF dapat dipratinjau bertahap di peramban.
 */
export function sajikanBerkasArsip(req: Request, res: Response): void {
  const namaBerkas = String(req.params.nama ?? "");
  const tanda = typeof req.query.t === "string" ? req.query.t : "";

  if (!namaBerkasAman(namaBerkas)) {
    res.status(404).json({ success: false, message: "Berkas tidak ditemukan." });
    return;
  }

  const diharapkan = tandaTangan(namaBerkas);
  const a = Buffer.from(tanda, "utf8");
  const b = Buffer.from(diharapkan, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    res.status(403).json({ success: false, message: "Tautan berkas tidak sah atau sudah tidak berlaku." });
    return;
  }

  const lokasi = path.join(ARSIP_DIR, namaBerkas);
  let stat: fs.Stats;
  try {
    stat = fs.statSync(lokasi);
  } catch {
    res.status(404).json({ success: false, message: "Berkas tidak ditemukan pada penyimpanan arsip." });
    return;
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("X-Content-Type-Options", "nosniff");
  // Berkas hanya boleh dibingkai oleh aplikasi keluarga UNUSU.
  res.setHeader("Content-Security-Policy", "frame-ancestors 'self' https://*.unusu.ac.id");
  res.setHeader("Cache-Control", "private, max-age=300");

  // Dukungan Range agar peramban dapat menampilkan halaman pertama lebih cepat.
  const rentang = req.headers.range;
  if (rentang) {
    const cocok = /bytes=(\d*)-(\d*)/.exec(rentang);
    if (cocok) {
      const mulai = cocok[1] ? Number(cocok[1]) : 0;
      const akhir = cocok[2] ? Number(cocok[2]) : stat.size - 1;
      if (mulai >= stat.size || akhir >= stat.size || mulai > akhir) {
        res.setHeader("Content-Range", `bytes */${stat.size}`);
        res.status(416).end();
        return;
      }
      res.status(206);
      res.setHeader("Content-Range", `bytes ${mulai}-${akhir}/${stat.size}`);
      res.setHeader("Accept-Ranges", "bytes");
      res.setHeader("Content-Length", String(akhir - mulai + 1));
      fs.createReadStream(lokasi, { start: mulai, end: akhir }).pipe(res);
      return;
    }
  }

  res.setHeader("Accept-Ranges", "bytes");
  res.setHeader("Content-Length", String(stat.size));
  fs.createReadStream(lokasi).pipe(res);
}

/**
 * Middleware opsional: melayani `/api/arsip-berkas/:nama` tanpa sesi.
 *
 * Ditempatkan SEBELUM middleware autentikasi karena berkas harus dapat dibaca
 * oleh server prodi (server-ke-server) yang tidak membawa sesi pengguna.
 * Keamanannya sepenuhnya berasal dari tanda tangan pada URL.
 */
export function pasangRuteBerkasArsip(app: {
  get: (path: string, handler: (req: Request, res: Response, next: NextFunction) => void) => unknown;
}): void {
  app.get("/api/arsip-berkas/:nama", (req, res) => sajikanBerkasArsip(req, res));
}
