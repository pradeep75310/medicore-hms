/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep clinical teal — the MediCore brand color, shared with the public site
        medicore: {
          50: '#f3f8f6',
          100: '#e4efec',
          200: '#c9dfd8',
          300: '#a3c9bf',
          400: '#6da395',
          500: '#3d8478',
          600: '#1f6360',
          700: '#164947',
          800: '#123e3c',
          900: '#0f3d3e',
        },
        primary: {
          50: '#f3f8f6',
          100: '#e4efec',
          200: '#c9dfd8',
          300: '#a3c9bf',
          400: '#6da395',
          500: '#3d8478',
          600: '#1f6360',
          700: '#164947',
          800: '#123e3c',
          900: '#0f3d3e',
        },
        // Warm amber accent — used sparingly for highlights and active states
        accent: {
          100: '#faf1de',
          500: '#d9a441',
          600: '#b9812a',
        },
        success: '#10b981',
        warning: '#d9a441',
        danger: '#ef4444',
        info: '#1f6360',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(15, 61, 62, 0.06), 0 8px 24px rgba(15, 61, 62, 0.06)',
        lift: '0 4px 10px rgba(15, 61, 62, 0.08), 0 20px 40px rgba(15, 61, 62, 0.1)',
      },
    },
  },
  plugins: [],
}