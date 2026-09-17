import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../../packages/*/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        charcoal: {
          950: '#090b0a',
          900: '#111412',
          800: '#1a1f1c',
          700: '#272e2a',
          600: '#38423d',
        },
        forest: {
          950: '#0b1910',
          900: '#13281a',
          800: '#1b3b27',
          700: '#244e34',
          600: '#2e6342',
          500: '#3c7e55',
        },
        olive: {
          700: '#3f5233',
          600: '#526b42',
          500: '#698855',
        },
        gold: {
          600: '#a3813c',
          500: '#c5a059',
          400: '#dfc07b',
          300: '#ebd6a4',
          200: '#f5eacc',
        },
        cream: {
          50: '#fdfcf9',
          100: '#fcfbf7',
          200: '#f7f4ed',
          300: '#ede7db',
          400: '#ded4c1',
        },
      },
      fontFamily: {
        editorial: ['"Playfair Display"', 'Georgia', 'serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        display: ['Outfit', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        cinzel: ['Cinzel', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'float-slow': 'float 6s ease-in-out infinite',
        'float-reverse': 'float-reverse 7s ease-in-out infinite',
        'pulse-subtle': 'pulse-subtle 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-12px) rotate(4deg)' },
        },
        'float-reverse': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(10px) rotate(-4deg)' },
        },
        'pulse-subtle': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.85 },
        },
      },
    },
  },
  plugins: [forms, typography],
};
