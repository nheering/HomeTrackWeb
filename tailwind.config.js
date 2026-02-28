/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base:    '#0b0f14',
          surface: '#141a22',
          card:    '#1a2232',
          hover:   '#1f2a3a',
          border:  '#243044',
        },
        accent: {
          DEFAULT: '#f97316',
          dark:    '#ea6500',
          light:   '#fb923c',
          glow:    'rgba(249,115,22,0.15)',
        },
        tx: {
          primary:   '#e8edf5',
          secondary: '#8b9ab5',
          muted:     '#4a5568',
        },
        status: {
          active:   '#22c55e',
          inactive: '#ef4444',
          warning:  '#f59e0b',
        },
        chart: {
          gas:    '#f97316',
          strom:  '#eab308',
          wasser: '#38bdf8',
          heizung:'#f43f5e',
          one:    '#a78bfa',
          two:    '#34d399',
        },
      },
      fontFamily: {
        sans:  ['var(--font-outfit)', 'system-ui', 'sans-serif'],
        mono:  ['var(--font-dm-mono)', 'monospace'],
      },
      boxShadow: {
        card:   '0 0 0 1px rgba(36,48,68,0.8), 0 4px 24px rgba(0,0,0,0.4)',
        accent: '0 0 20px rgba(249,115,22,0.25)',
        glow:   '0 0 40px rgba(249,115,22,0.1)',
      },
      animation: {
        'fade-in':    'fadeIn 0.3s ease-out',
        'slide-up':   'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
      },
      keyframes: {
        fadeIn:  { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        slideUp: { '0%': { opacity: 0, transform: 'translateY(12px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};
