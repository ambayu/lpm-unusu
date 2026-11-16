# Modul Slider Hero Beranda

Catatan modul untuk halaman `/admin/slider` (panel) dan hero beranda publik.

## Berkas

| Lapisan | Berkas |
|---|---|
| Halaman panel | `src/client/pages/ManajemenSliderLpm.tsx` |
| Hero publik | `src/client/components/FullHeroSlider.tsx` |
| Service API | `src/client/services/api.ts` (`fetchAdminSliders`, `createAdminSlider`, `updateAdminSlider`, `deleteAdminSlider`, `fetchPublicSliders`) |
| Utilitas klien | `src/client/lib/mediaSlider.ts` (`jenisMedia`, `validasiBerkasMedia`, `labelJenisMedia`) |
| Modul server | `src/server/sliderMedia.ts` (`periksaUkuranMediaSlider`, `urlMediaSlider`, `hapusMediaSliderFisik`, `namaBerkasMediaDariUrl`) |
| Endpoint | `src/server/index.ts` (`/api/admin/sliders`, `/api/public/sliders`) dan penyajian `express.static` pada `PREFIX_MEDIA_SLIDER` |
| Model Prisma | `prisma/schema.prisma` → `LpmBannerSlider` |

## Alur Data

1. `GET /api/public/sliders` mengembalikan baris aktif terurut menaik; `gambarUrl`
   hanya berisi path (`/storage/slider/<berkas>`), bukan base64.
2. Panel membaca `GET /api/admin/sliders`, menampilkan pratinjau berdasarkan jenis
   media, lalu mengirim `POST`/`PUT` sebagai `multipart/form-data` dengan field
   `berkas` (dan `berkasMobile` bila ada).
3. Server menulis berkas ke disk dengan nama acak, memeriksa ukuran, menyimpan path
   ke baris, lalu menghapus berkas lama setelah pembaruan berhasil.
4. `FullHeroSlider` merender `<video>` untuk slide video dan `<img>` untuk slide
   gambar; slide video berpindah setelah peristiwa `ended`.

## Aturan

- Media **tidak** boleh disimpan sebagai base64; dilarang memakai `FileReader` pada
  unggahan slider. Pratinjau memakai `URL.createObjectURL` dan URL `blob:` wajib
  dicabut saat komponen dilepas.
- Batas ukuran: **gambar 5 MB**, **video 50 MB**. Angka di klien harus sama dengan
  yang ada di `src/server/sliderMedia.ts`.
- Jenis media ditentukan dari ekstensi/data URL (`mp4`, `webm`, `ogg`, `ogv`, `mov`,
  `m4v`), bukan dari kolom database baru. Skema tidak berubah.
- Slide video tidak memakai timer; slide gambar berotasi tiap 6 detik.
- Elemen video wajib `muted` dan `playsInline` agar autoplay diizinkan peramban.
- Path media wajib ditempel `import.meta.env.BASE_URL` (atau resolver setara) saat
  ditampilkan, karena aplikasi dipasang di balik sub-path.
- Penghapusan hanya menyentuh path berawalan `/storage/slider/` dengan nama berkas
  yang sah; URL luar dan data URL lama dilewati.

Detail lengkap dan daftar hal yang tidak boleh diubah tanpa keputusan formal:
`unusu-lms/docs/routes/slider/RULES.md` (modul sejenis, acuan lintas aplikasi).
