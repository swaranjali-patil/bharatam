/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF7D54', // The orange color from the image
          dark: '#E06540',
        },
        background: '#F8F9FE',
        backgroundDark: '#020617',
      },
      borderRadius: {
        '2xl': '1.5rem',
        '3xl': '2rem',
      }
    },
  },
  plugins: [],
}
