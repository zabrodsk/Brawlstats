import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          yellow: '#F5CC00',
          'yellow-muted': 'rgba(245, 204, 0, 0.35)',
          black: '#060608',
          blue: '#1E90FF',
          red: '#FF4444',
          dark: '#060608',
          surface: '#0d0d10',
          'surface-2': '#141418',
          border: '#1e1e26',
          'border-bright': '#2e2e3a',
        },
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.32, 0.72, 0, 1)',
        'spring-out': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
        '800': '800ms',
      },
      boxShadow: {
        'glow-yellow': '0 0 20px rgba(245, 204, 0, 0.15)',
        'glow-yellow-sm': '0 0 8px rgba(245, 204, 0, 0.12)',
        'inner-highlight': 'inset 0 1px 1px rgba(255, 255, 255, 0.06)',
        'card': '0 1px 3px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.2)',
      },
    },
  },
  plugins: [],
}

export default config
