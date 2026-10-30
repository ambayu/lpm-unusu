# Typography System — LPM UNUSU

## Font Family

Font utama didefinisikan di `tailwind.config.js` dan di-import melalui Google Fonts di `index.css`:

```
font-sans: "Plus Jakarta Sans", "Inter", ui-sans-serif, system-ui, sans-serif
```

Import CSS:
```css
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&family=Inter:wght@300..800&display=swap');
```

## Type Scale

| Level | Ukuran & Bobot | Tracking | Penggunaan |
|---|---|---|---|
| Page Title | `text-2xl` (`24px`), `font-extrabold` | `tracking-tight` | Judul utama halaman di header banner |
| Section Heading | `text-lg` (`18px`), `font-semibold` | Normal | Judul card container, form header |
| Card Title | `text-base` (`16px`), `font-bold` | `tracking-tight` | Judul CardContainer header |
| Card Subtitle | `text-xs` (`12px`), `font-medium` | Normal | Deskripsi konteks di bawah judul card |
| Form Label | `text-xs` (`12px`), `font-bold` | Normal | Label di atas input/select |
| Table Header | `text-xs` (`12px`), `font-bold` | Normal | Header kolom data table |
| Table Body | `text-xs` (`12px`), `font-normal` | Normal | Isi data baris tabel |
| Helper / Hint | `text-[11px]`, `font-normal` | Normal | Catatan bantuan, deskripsi sekunder |
| Badge Label | `text-[10px]` (sm) / `text-xs` (md), `font-medium` | Normal | Status pill (Sesuai, KTS, dll) |
| Sidebar Nav | `text-[13px]`, `font-semibold` | Normal | Label menu navigasi sidebar |
| Sidebar Section | `text-[11px]`, `font-bold` | `tracking-wider` | Label grup menu sidebar (uppercase) |

## Aturan

1. **Font family** wajib menggunakan `font-sans` bawaan Tailwind config. Jangan hardcode fontFamily di inline style atau SVG kecuali untuk elemen SVG `<text>` yang tidak bisa menerima class Tailwind.
2. **Hindari variasi font weight berlebihan**. Gunakan maksimal 3 weight dalam satu halaman: `font-normal`, `font-semibold`/`font-bold`, `font-extrabold`.
3. **Ukuran arbitrary** (`text-[10px]`, `text-[11px]`, `text-[13px]`) diperbolehkan hanya untuk badge kecil, label sidebar, dan helper text — bukan untuk konten utama.
