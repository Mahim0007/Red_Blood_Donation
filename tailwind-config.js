/**
 * RedDrop - Central Tailwind CSS v3 Theme Configuration
 * Extends Tailwind defaults with custom fonts, brand gradients, and micro-animations.
 */

tailwind.config = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Outfit"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"Fira Code"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      colors: {
        blood: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
          950: '#4c0519',
        }
      },
      backgroundImage: {
        'blood-gradient': 'linear-gradient(135deg, #e11d48 0%, #be123c 50%, #9f1239 100%)',
        'blood-card': 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 40%, #881337 100%)',
        'gold-badge': 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      },
      keyframes: {
        'pulse-slow': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.1)', opacity: '0.85' },
        }
      },
      animation: {
        'pulse-slow': 'pulse-slow 3s infinite ease-in-out',
      }
    }
  }
};
