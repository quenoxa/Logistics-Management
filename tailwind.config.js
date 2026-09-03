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
        // Core LOGISTIX Color System (Inspired by reference image)
        navy: {
          50: '#F0F4F9',
          100: '#E1E8F2',
          200: '#C3D1E5',
          300: '#9FB5D4',
          400: '#7392BE',
          500: '#4F72A7',
          600: '#3A578A',
          700: '#2A4068',
          800: '#1A2946',
          900: '#0F172A', // Primary Dark Navy
          950: '#09111E',
        },
        emerald: {
          50: '#ECFDF5',  // Light Teal Background
          100: '#D1FAE5', // Light Teal Badge
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981', // Primary Brand Emerald
          600: '#059669', // Dark Emerald Hover
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },
        slate: {
          50: '#F8FAFC',  // Light Background Canvas
          100: '#F1F5F9',
          200: '#E2E8F0', // Border Base
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B', // Secondary Text
          600: '#475569',
          700: '#334155', // Body Text
          800: '#1E293B', // Dark Cards / Dark Elements
          900: '#0F172A', // Primary Dark
        },
        // Legacy Aliases for seamless backwards-compatibility
        canvas: '#F8FAFC',
        sidebar: '#0F172A',
        header: '#FFFFFF',
        root: '#F8FAFC',
        cardPrimary: '#FFFFFF',
        cardElevated: '#FFFFFF',
        tableSurface: '#FFFFFF',
        tableRowHover: '#F8FAFC',
        borderBase: '#E2E8F0',
        borderStrong: '#CBD5E1',
        textPrimary: '#0F172A',
        textSecondary: '#64748B',
        textMuted: '#94A3B8',
        
        ops: {
          bg: '#F8FAFC',
          canvas: '#F8FAFC',
          sidebar: '#0F172A',
          header: '#FFFFFF',
          surface: '#FFFFFF',
          panel: '#FFFFFF',
          panelHover: '#F8FAFC',
          card: '#FFFFFF',
          cardHover: '#F8FAFC',
          elevated: '#FFFFFF',
          border: '#E2E8F0',
          borderLight: '#F1F5F9',
          borderStrong: '#CBD5E1',
          text: '#0F172A',
          textSecondary: '#64748B',
          muted: '#94A3B8',
          dim: '#94A3B8',
          accent: '#10B981',
          accentHover: '#059669',
          accentSoft: '#ECFDF5',
          gold: '#10B981',
          goldHover: '#059669',
          goldSoft: '#ECFDF5',
          success: '#10B981',
          successSoft: '#ECFDF5',
          info: '#0284C7',
          infoSoft: '#F0F9FF',
          warning: '#F59E0B',
          warningSoft: '#FEF3C7',
          danger: '#EF4444',
          dangerSoft: '#FEF2F2',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"SF Mono"', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)',
        'modal': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        'dropdown': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'glow-emerald': '0 0 20px -2px rgba(16, 185, 129, 0.25)',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      }
    },
  },
  plugins: [],
}
