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
