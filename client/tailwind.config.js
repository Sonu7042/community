/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#171717',
        panel: '#232323',
        panelSoft: '#1f1f1f',
        stroke: '#323232',
        accent: '#ff8b1f',
        accentSoft: '#1c1308',
        info: '#2ea7ff',
        textSoft: '#9a9a9a',
      },
      boxShadow: {
        panel: '0 12px 40px rgba(0, 0, 0, 0.28)',
      },
      backgroundImage: {
        noise:
          'radial-gradient(circle at top, rgba(255,139,31,0.08), transparent 26%), radial-gradient(circle at bottom right, rgba(46,167,255,0.06), transparent 22%)',
      },
    },
  },
  plugins: [],
};
