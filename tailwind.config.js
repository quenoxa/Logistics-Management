/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ops: {
          bg: '#080b11',          // Ultra-deep dark command shell
          surface: '#0f141d',     // Base surface panel
          panel: '#151c27',       // Elevated functional module
          panelHover: '#1c2534',  // Module hover state
          card: '#121822',        // Card background
          cardHover: '#18202d',   // Card hover
          border: '#1f2937',      // Crisp dark border
          borderLight: '#2d3748', // Subtle separator
          borderGlow: 'rgba(6, 182, 212, 0.3)',
          text: '#f3f4f6',        // Crisp primary text
          muted: '#94a3b8',       // Secondary readable text
          dim: '#64748b',         // Subdued metadata
          accent: '#06b6d4',      // Electric Cyan primary
          accentHover: '#0891b2',
          cyan: '#06b6d4',
          sky: '#0ea5e9',
          green: '#10b981',
          emerald: '#10b981',
          amber: '#f59e0b',
          rose: '#f43f5e',
          indigo: '#6366f1',
          slate: '#334155',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Space Mono"', 'monospace'],
      },
      boxShadow: {
        'command': '0 4px 20px -2px rgba(0, 0, 0, 0.5), 0 0 1px 1px rgba(255, 255, 255, 0.05)',
        'panel': '0 2px 10px 0 rgba(0, 0, 0, 0.4), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
        'modal': '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        'glow-cyan': '0 0 20px -3px rgba(6, 182, 212, 0.25)',
        'glow-emerald': '0 0 20px -3px rgba(16, 185, 129, 0.25)',
        'glow-amber': '0 0 20px -3px rgba(245, 158, 11, 0.25)',
        'glow-rose': '0 0 20px -3px rgba(244, 63, 94, 0.25)',
      },
    },
  },
  plugins: [],
}
