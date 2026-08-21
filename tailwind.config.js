/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Newsreader"', '"Playfair Display"', 'Georgia', 'serif'],
        handwriting: ['"Caveat"', '"Kalam"', 'cursive'],
        mono: ['"Space Mono"', '"JetBrains Mono"', 'monospace'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      },
      colors: {
        paper: {
          50: '#FCFAF6',
          100: '#FBF7F0',
          200: '#F5EFE4',
          300: '#ECE2D0',
          400: '#DECDB4',
          500: '#CFB897',
          dark: '#1C1B18',
          'dark-card': '#24231F',
          'dark-border': '#383630',
        },
        ink: {
          900: '#191C1A',
          800: '#2A302C',
          700: '#3D4641',
          600: '#546059',
          500: '#6E7D74',
          400: '#8E9C94',
          300: '#B2BEB7',
          200: '#D5DDD8',
          100: '#EBF0ED',
        },
        archival: {
          red: '#B83A3A',
          'red-light': '#FDF1F1',
          green: '#2A6F4E',
          'green-light': '#F0F8F4',
          ochre: '#C07D2B',
          'ochre-light': '#FEF7ED',
          blue: '#235789',
          'blue-light': '#F0F6FB',
          brass: '#8C6D37',
        }
      },
      boxShadow: {
        'ledger': '0 4px 20px -2px rgba(44, 34, 20, 0.08), 0 1px 3px 0 rgba(44, 34, 20, 0.04)',
        'ledger-lg': '0 12px 35px -4px rgba(44, 34, 20, 0.12), 0 4px 10px 0 rgba(44, 34, 20, 0.06)',
        'stamp': 'inset 0 0 0 2px currentColor, 0 2px 4px rgba(0,0,0,0.06)',
        'paper-edge': '2px 0 6px -1px rgba(0, 0, 0, 0.06)',
      }
    },
  },
  plugins: [],
}
