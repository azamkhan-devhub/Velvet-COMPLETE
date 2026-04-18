/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        black:        '#0a0a0a',
        white:        '#fafaf8',
        cream:        '#f5f0e8',
        sand:         '#e8ddd0',
        gold:         '#c9a96e',
        'gold-light': '#e8c98a',
        muted:        '#8a8278',
        border:       '#e0d8ce',
        admin: {
          bg:      '#0f1117',
          surface: '#1a1d27',
          border:  '#2a2d3a',
          text:    '#e2e8f0',
          muted:   '#64748b',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        body:    ['var(--font-body)', 'system-ui', 'sans-serif'],
        mono:    ['var(--font-mono)', 'monospace'],
      },
      animation: {
        'fade-up':   'fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards',
        'fade-in':   'fadeIn 0.4s ease forwards',
        'slide-in':  'slideIn 0.4s cubic-bezier(0.16,1,0.3,1) forwards',
        'marquee':   'marquee 32s linear infinite',
        'spin-slow': 'spin 3s linear infinite',
        'shimmer':   'shimmer 1.6s infinite',
      },
      keyframes: {
        fadeUp:   { from: { opacity:'0', transform:'translateY(20px)' }, to: { opacity:'1', transform:'translateY(0)' }},
        fadeIn:   { from: { opacity:'0' }, to: { opacity:'1' }},
        slideIn:  { from: { transform:'translateX(100%)' }, to: { transform:'translateX(0)' }},
        marquee:  { from: { transform:'translateX(0)' }, to: { transform:'translateX(-50%)' }},
        shimmer:  { from: { backgroundPosition:'-200% 0' }, to: { backgroundPosition:'200% 0' }},
      },
    },
  },
  plugins: [],
};
