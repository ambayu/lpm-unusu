/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        lpm: {
          green: {
            DEFAULT: '#0A5C36',
            dark: '#064226',
            light: '#117A4A',
          },
          gold: '#D4AF37'
        }
      }
    },
  },
  plugins: [],
}
