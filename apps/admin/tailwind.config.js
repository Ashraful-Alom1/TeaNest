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
        admin: {
          bg: '#0f1311',
          surface: '#151b18',
          card: '#1b231f',
          border: '#26332d',
          muted: '#8e9d95',
          accent: '#c5a059',
          gold: '#dfc07b',
          emerald: '#22c55e',
          forest: '#1b3b27',
          danger: '#ef4444',
          warning: '#f59e0b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Cinzel', 'Playfair Display', 'serif'],
      },
    },
  },
  plugins: [forms, typography],
};
