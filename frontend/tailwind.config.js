/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ops: {
          bg: '#f8fafc',
          surface: '#ffffff',
          panel: '#ffffff',
          card: '#ffffff',
          cardHover: '#f1f5f9',
          border: '#e2e8f0',
          borderLight: '#cbd5e1',
          text: '#0f172a',
          muted: '#64748b',
          dim: '#94a3b8',
          accent: '#ea580c',
          accentHover: '#c2410c',
          orange: '#ea580c',
          green: '#16a34a',
          emerald: '#059669',
          cyan: '#0284c7',
          blue: '#2563eb',
          rose: '#e11d48',
          amber: '#d97706',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Space Mono"', 'monospace'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'modal': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
}
