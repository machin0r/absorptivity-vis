/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary:   '#FFFFFF',
          secondary: '#FAFAF8',
          tertiary:  '#F5F0EB',
          hover:     '#EDE8E2',
        },
        border: {
          subtle: '#E0D8D0',
          active: '#C0B8B0',
        },
        accent: {
          primary: '#C05030',
        },
        text: {
          primary:   '#333333',
          secondary: '#666666',
          muted:     '#999999',
        },
      },
      fontFamily: {
        mono:  ['"JetBrains Mono"', '"IBM Plex Mono"', 'monospace'],
        sans:  ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.4s ease both',
      },
      keyframes: {
        fadeInUp: {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
