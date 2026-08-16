/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#F5F7FA',
        surface: '#FFFFFF',
        navy: {
          DEFAULT: '#0F1F3D',
          light: '#1B2E52',
          dark: '#0A1529',
        },
        accent: {
          DEFAULT: '#2563EB',
          light: '#3B82F6',
        },
        income: '#16A34A',
        expense: '#DC2626',
        warn: '#F59E0B',
        ink: {
          DEFAULT: '#1F2937',
          soft: '#6B7280',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px 0 rgba(15, 31, 61, 0.04), 0 1px 3px 0 rgba(15, 31, 61, 0.06)',
        card: '0 1px 3px 0 rgba(15, 31, 61, 0.05), 0 1px 2px -1px rgba(15, 31, 61, 0.05)',
      },
      borderRadius: {
        xl: '14px',
        '2xl': '18px',
      },
    },
  },
  plugins: [],
}
