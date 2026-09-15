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
        // ATocarYa Official Brand Palette
        brand: {
          navy: '#0B132B',
          electric: '#1E74FD',
          orange: '#FF7E22',
          white: '#FFFFFF',
        },
        navy: {
          50: '#f4f6fa',
          100: '#e6ebf4',
          200: '#d0daeb',
          300: '#acc0dc',
          400: '#81a0ca',
          500: '#5f82b7',
          600: '#4967a0',
          700: '#3b5283',
          800: '#1d2d54',
          900: '#111c38',
          950: '#0B132B',
        },
        electric: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#1E74FD',
          700: '#155de0',
          800: '#164bb8',
          900: '#1e3a8a',
          950: '#0f172a',
        },
        accent: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#FF7E22',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
        // Mapeo armonizado para preservar 100% de la funcionalidad mientras moderniza los tonos de la app
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#1E74FD', // Electric Blue
          700: '#155de0',
          800: '#164bb8',
          900: '#1e3a8a',
          950: '#0B132B',
        },
        emerald: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#1E74FD', // Electric Blue Principal
          700: '#155de0',
          800: '#164bb8',
          900: '#1e3a8a',
          950: '#0B132B', // Deep Navy Blue
        },
        teal: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#FF7E22', // Orange Accent
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
        pc: {
          green: '#1E74FD',
          emerald: '#1E74FD',
          dark: '#0B132B',
          card: '#ffffff',
          surface: '#f8fafc',
          border: '#e2e8f0',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(15, 23, 42, 0.04)',
        'xs': '0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.06)',
        'pc': '0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        'pc-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}
