/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff9ff',
          100: '#daf2ff',
          500: '#0f9ed5',
          600: '#0c7fab',
          700: '#0a6488'
        },
        emergency: {
          500: '#e11d2e',
          600: '#c8102e'
        }
      }
    }
  },
  plugins: []
};
