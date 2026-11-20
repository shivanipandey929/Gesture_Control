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
        background: 'var(--background)',
        navbar: 'var(--navbar)',
        surface: {
          DEFAULT: 'var(--surface)',
          secondary: 'var(--surface-secondary)',
          lavender: 'var(--surface-lavender)',
        },
        foreground: 'var(--foreground)',
        text: {
          DEFAULT: 'var(--foreground)',
          foreground: 'var(--foreground)',
          muted: 'var(--muted)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted)',
        },
        border: {
          DEFAULT: 'var(--border)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          hover: 'var(--primary-hover)',
          light: 'var(--primary-light)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
        },
        success: 'var(--success)',
        warning: 'var(--warning)',
        error: 'var(--error)',
      },
      fontFamily: {
        heading: ['Inter', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'panel': '14px',
        'card': '16px',
      },
      boxShadow: {
        'soft': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        'elevated': '0 10px 15px -3px rgba(0, 0, 0, 0.07), 0 4px 6px -4px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
}
