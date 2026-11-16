/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#FAF9F5',
          elevated: '#F3F1EC',
          muted: '#EAE7E0',
          contrast: '#FFFFFF',
        },
        ink: {
          DEFAULT: '#141413',
          muted: '#52514E',
          subtle: '#85837D',
        },
        rule: {
          DEFAULT: '#E5E2DC',
          subtle: '#EFECE6',
        },
        cobalt: {
          DEFAULT: '#1E40AF',
          hover: '#1D4ED8',
          subtle: '#EFF6FF',
        },
        'dark-code': '#141413',
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
