/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#e8edf7',
          100: '#c5d0ea',
          200: '#9fb0da',
          300: '#7890ca',
          400: '#5a78be',
          500: '#3c60b2',
          600: '#2a4d9e',
          700: '#1a3a85',
          800: '#0d2a6b',
          900: '#001F5B',
          950: '#001040',
        },
        royal: {
          50: '#e6f0fb',
          100: '#bfd5f5',
          200: '#95b9ef',
          300: '#6a9de8',
          400: '#4888e4',
          500: '#0056B8',
          600: '#004da6',
          700: '#003f8a',
          800: '#003070',
          900: '#001f50',
        },
        accent: {
          50: '#e8f4ff',
          100: '#c4e2ff',
          200: '#9ccfff',
          300: '#74bcff',
          400: '#4DA3FF',
          500: '#2b8fff',
          600: '#1a7aee',
          700: '#0d65d4',
          800: '#0552b8',
          900: '#003d94',
        },
        cpecb: {
          bg: '#F7F5F0',
          border: '#D9D9D9',
          text: '#333333',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
      },
      boxShadow: {
        card: '0 2px 12px rgba(0, 31, 91, 0.08)',
        'card-hover': '0 8px 24px rgba(0, 31, 91, 0.14)',
        nav: '0 2px 8px rgba(0, 31, 91, 0.12)',
      },
    },
  },
  plugins: [],
};
