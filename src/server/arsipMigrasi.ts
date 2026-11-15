import { simpanBerkasArsip, ARSIP_MAX_BYTES } from "./arsipBerkas.js";

/**
 * Migrasi sekali-jalan: dokumen lama yang menyimpan PDF sebagai data URL
 * base64 di kolom `filePdfUrl`.
 *
 * Versi sebelumnya menulis `data:application/pdf;base64,...` langsung ke
 * database. Akibatnya setiap daftar dokumen ikut menarik seluruh isi PDF,
 * pratinjau di peramban tidak mendukung HTTP Range, dan kolom membengkak
 * berkali-kali lipat. Migrasi ini memindahkan isinya menjadi berkas sungguhan
 * di `uploads/dokumen` dan mengganti kolom dengan URL bertanda tangan.
 *
 * Modul ini tidak menyentuh Prisma secara langsung: setiap aplikasi (LPM dan
 * LPPM) memiliki model dokumennya sendiri, sehingga operasi database diberikan
 * lewat parameter. Dengan begitu satu modul dapat dipakai keduanya.
 *
 * Sifatnya idempoten: dokumen yang kolomnya sudah berupa URL tidak disentuh,
 * sehingga aman dijalankan setiap server start.
 */

/** Baris dokumen yang perlu diperiksa migrasinya. */
export interface BarisDokumenLama {
  id: number;
  filePdfUrl: string | null;
}

/** Operasi database yang dibutuhkan migrasi, disediakan masing-masing aplikasi. */
export interface AdapterMigrasiArsip {
  /** Nama tabel untuk pesan log, mis. `lpm_documents`. */
  label: string;
  /** Mengambil dokumen yang kolom filePdfUrl-nya masih berupa data URI. */
  ambilBase64: () => Promise<BarisDokumenLama[]>;
  /** Menyimpan URL berkas hasil migrasi pada satu dokumen. */
  simpanUrl: (id: number, url: string, ukuran: number) => Promise<unknown>;
}

export interface HasilMigrasi {
  diperiksa: number;
  dimigrasi: number;
  gagal: number;
}

/** Apakah isi kolom masih berupa data URL base64. */
function apakahDataUri(nilai: string): boolean {
  return /^data:[^,]*;base64,/i.test(nilai);
}

/** Mengambil buffer PDF dari sebuah data URL base64. */
function bacaDataUri(nilai: string): Buffer {
  const koma = nilai.indexOf(",");
  return Buffer.from(nilai.slice(koma + 1), "base64");
}

/**
 * Menjalankan migrasi untuk satu tabel dokumen.
 *
 * Kegagalan pada satu dokumen tidak menghentikan migrasi dokumen lain: baris
 * yang gagal dibiarkan apa adanya agar isinya tidak hilang, lalu dicatat di log.
 */
export async function jalankanMigrasiArsip(adapter: AdapterMigrasiArsip): Promise<HasilMigrasi> {
  const hasil: HasilMigrasi = { diperiksa: 0, dimigrasi: 0, gagal: 0 };

  const baris = await adapter.ambilBase64();
  hasil.diperiksa = baris.length;
  if (baris.length === 0) {
    console.log(`[arsip-migrasi] ${adapter.label}: tidak ada dokumen base64, tidak ada yang perlu diubah.`);
    return hasil;
  }

  for (const dokumen of baris) {
    const nilai = dokumen.filePdfUrl;
    if (!nilai || !apakahDataUri(nilai)) continue;

    try {
      const buffer = bacaDataUri(nilai);
      if (buffer.length > ARSIP_MAX_BYTES) {
        throw new Error(
          `Ukuran ${(buffer.length / (1024 * 1024)).toFixed(1)} MB melebihi batas ` +
            `${Math.round(ARSIP_MAX_BYTES / (1024 * 1024))} MB.`,
        );
      }

      const { url, ukuran } = await simpanBerkasArsip(buffer);
      await adapter.simpanUrl(dokumen.id, url, ukuran);

      hasil.dimigrasi += 1;
      console.log(`[arsip-migrasi] ${adapter.label} id=${dokumen.id}: base64 → berkas (${ukuran} byte)`);
    } catch (error: any) {
      hasil.gagal += 1;
      console.error(
        `[arsip-migrasi] ${adapter.label} id=${dokumen.id} GAGAL: ${error?.message ?? error}. ` +
          `Baris dibiarkan sebagai base64 agar isinya tidak hilang.`,
      );
    }
  }

  console.log(
    `[arsip-migrasi] ${adapter.label}: ${hasil.dimigrasi} dokumen dimigrasi, ` +
      `${hasil.gagal} gagal, dari ${hasil.diperiksa} baris base64.`,
  );

  return hasil;
}
