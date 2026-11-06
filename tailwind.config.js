/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Quicksand"', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        // Palet resmi LPM UNUSU: biru, kuning, putih, hitam.
        // `lpm-blue` menggantikan pemakaian `blue-*` mentah supaya identitas
        // warna punya satu sumber. `lpm-yellow` hanya dipakai sebagai aksen di
        // atas latar biru tua atau hitam: sebagai teks di atas putih rasionya
        // cuma 1.67 sehingga tidak terbaca.
        'lpm-blue': {
          DEFAULT: '#1E3A8A',
          dark: '#172554',
          light: '#1D4ED8',
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
          950: '#172554',
          surface: '#F8FAFC',
        },
        'lpm-yellow': {
          DEFAULT: '#FBBF24',
          light: '#FCD34D',
          dark: '#F59E0B',
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
        },
        // Hitam netral untuk teks dan panel gelap.
        'lpm-ink': {
          DEFAULT: '#0F172A',
          soft: '#1E293B',
          muted: '#475569',
        },
        lpm: {
          green: {
            DEFAULT: '#145A32',
            dark: '#0A3D22',
            light: '#1A7A45',
            50: '#EEF7EF',
            100: '#D8F0E1',
            200: '#D3EAD9',
            300: '#C8DDD0',
            400: '#8CBFA0',
            500: '#4D7A60',
            600: '#3A5544',
            700: '#166534',
            800: '#145A32',
            900: '#0A3D22',
            surface: '#F1F5F2',
          },
          gold: {
            DEFAULT: '#D4AF37',
            light: '#FBBF24',
            dark: '#B8941F',
          },
          // Warna admin panel
          nav: {
            bg: '#EEF7EF',
            border: '#C8DDD0',
            active: '#D8F0E1',
            hover: '#E4F2E9',
            muted: '#E5F3E7',
          },
          // Warna landing page & public (satukan ke hijau kampus)
          brand: {
            DEFAULT: '#145A32',
            dark: '#0A3D22',
            light: '#166534',
            accent: '#D4AF37',
          },
        },
      },
    },
  },
  plugins: [],
}
