// tailwind.config.js
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ctf: {
          dark: '#1e293b',
          primary: '#2563eb',
          danger: '#dc2626',
        }
      }
    },
  },
  fontFamily: {
    'mono': ['"Fira Code"', 'monospace'],
  },
  plugins: [],
}