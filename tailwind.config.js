/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './App.tsx',
    './index.tsx',
    './web/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#2563eb',
          blueDark: '#1d4ed8',
          green: '#10b981',
          greenInk: '#047857',
          ink: '#111827',
          paper: '#ffffff',
          canvas: '#f8fafc',
          danger: '#dc2626',
          warning: '#facc15',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        neo: '8px 8px 0 0 #000',
        neoSm: '4px 4px 0 0 #000',
      },
    },
  },
  plugins: [],
};
