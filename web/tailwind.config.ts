import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          yellow: '#F5CC00',
          'yellow-muted': 'rgba(245, 204, 0, 0.35)',
          black: '#050505',
          blue: '#1E90FF',
          red: '#FF4444',
          dark: '#050505',
          surface: '#0f0f12',
          border: '#2a2a30',
        },
      },
    },
  },
  plugins: [],
}

export default config
