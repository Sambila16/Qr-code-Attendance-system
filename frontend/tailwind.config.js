/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#111116',
        panel: '#1B2140',
        panel2: '#232A4D',
        accent: '#3DDC97',
        accent2: '#F2B84B',
        danger: '#FF6B6B',
        mist: '#8892B0',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
