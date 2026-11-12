export default {
  content: ['./index.html', './js/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        forge: {
          background: '#09090b',
          panel: '#18181b',
          border: 'rgba(255,255,255,.08)',
          accent: '#2563eb',
          cyan: '#67e8f9',
          muted: '#a1a1aa'
        }
      },
      fontFamily: {
        sans: ['Inter Variable', 'sans-serif'],
        display: ['Space Grotesk Variable', 'sans-serif'],
        mono: ['JetBrains Mono Variable', 'monospace']
      },
      boxShadow: {
        forge:
          '0 0 0 1px rgb(37 99 235 / .25), 0 12px 36px rgb(37 99 235 / .08)'
      }
    }
  },
  plugins: []
};
