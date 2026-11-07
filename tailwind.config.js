/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#0B1020',
        surface: {
          DEFAULT: '#111827',
          light: '#1F2937',
          glass: 'rgba(17, 24, 39, 0.75)',
        },
        cyan: {
          accent: '#22D3EE',
          glow: 'rgba(34, 211, 238, 0.35)',
        },
        violet: {
          accent: '#8B5CF6',
          glow: 'rgba(139, 92, 246, 0.35)',
        },
      },
      fontFamily: {
        heading: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'glow-cyan': '0 0 25px -5px rgba(34, 211, 238, 0.4)',
        'glow-violet': '0 0 25px -5px rgba(139, 92, 246, 0.4)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}

