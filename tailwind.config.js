/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        orbit: {
          lightBg: '#f9fafb',
          darkBg: '#0f172a',
          darkCard: '#1e293b',
          darkBorder: '#334155',
          darkText: '#f1f5f9',
          darkMuted: '#94a3b8',
        }
      }
    },
  },
  plugins: [],
}
