/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontSize: {
        // The 13px floor from DESIGN.md. `xs` is the smallest step that exists;
        // re-basing it here lifts every existing `text-xs` call site at once
        // instead of leaving 264 of them at an unreadable 12px.
        'xs': ['13px', { lineHeight: '1.38', letterSpacing: '0' }],
        'sm': ['15px', { lineHeight: '1.47', letterSpacing: '-0.006em' }],
        'base': ['16px', { lineHeight: '1.5', letterSpacing: '-0.008em' }],
        'lg': ['17px', { lineHeight: '1.4', letterSpacing: '-0.01em' }],
        'xl': ['20px', { lineHeight: '1.25', letterSpacing: '-0.012em' }],
        '2xl': ['24px', { lineHeight: '1.2', letterSpacing: '-0.018em' }],
        '3xl': ['28px', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        '4xl': ['34px', { lineHeight: '1.12', letterSpacing: '-0.022em' }],
        '5xl': ['42px', { lineHeight: '1.06', letterSpacing: '-0.024em' }],
      },
      fontFamily: {
        mono: ['"Space Mono"', '"JetBrains Mono"', 'monospace'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        paper: {
          50: '#FFFFFF',
          100: '#FBFBFC',
          200: '#F2F2F7',
          300: '#E5E5EA',
          400: '#D1D1D6',
          500: '#8E8E93',
          dark: '#000000',
          'dark-card': '#1C1C1E',
          'dark-border': 'rgba(255, 255, 255, 0.08)',
        },
        ink: {
          900: '#191C1A',
          800: '#2A302C',
          700: '#3D4641',
          600: '#546059',
          500: '#6E7D74',
          400: '#5F6B65',
          450: '#9BA8A1',
          300: '#B2BEB7',
          200: '#D5DDD8',
          100: '#EBF0ED',
        },
        apple: {
          blue: '#007AFF',
          green: '#34C759',
          indigo: '#5856D6',
          orange: '#FF9500',
          pink: '#FF2D55',
          purple: '#AF52DE',
          red: '#FF3B30',
          teal: '#5AC8FA',
          yellow: '#FFCC00',
          gray: {
            1: '#8E8E93',
            2: '#AEAEB2',
            3: '#C7C7CC',
            4: '#D1D1D6',
            5: '#E5E5EA',
            6: '#F2F2F7',
          }
        }
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '22px',
        '4xl': '28px',
      },
      boxShadow: {
        'ledger': '0 4px 20px -2px rgba(44, 34, 20, 0.08), 0 1px 3px 0 rgba(44, 34, 20, 0.04)',
        'ledger-lg': '0 12px 35px -4px rgba(44, 34, 20, 0.12), 0 4px 10px 0 rgba(44, 34, 20, 0.06)',
        'apple-card': '0 2px 8px -1px rgba(0, 0, 0, 0.05), 0 1px 3px 0 rgba(0, 0, 0, 0.03)',
        'apple-float': '0 16px 36px -4px rgba(0, 0, 0, 0.12), 0 4px 12px 0 rgba(0, 0, 0, 0.04)',
        'stamp': 'inset 0 0 0 2px currentColor, 0 2px 4px rgba(0,0,0,0.06)',
        'paper-edge': '2px 0 6px -1px rgba(0, 0, 0, 0.06)',
      }
    },
  },
  plugins: [],
}
