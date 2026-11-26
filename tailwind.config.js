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
        // Paleta Oficial AtocarYa · Programación de Canciones
        iglesia: {
          DEFAULT: '#2E4056', // Azul Iglesia
          dark: '#213042',
          hover: '#384E68',
          light: '#E7EDF3',
        },
        arena: {
          DEFAULT: '#DCBD9E', // Arena cálida
          dark: '#B58B63',
          light: '#F5EBE0',
        },
        cafe: {
          DEFAULT: '#302C24', // Café oscuro
          muted: '#635C51',
          soft: '#8D8579',
        },
        salvia: {
          DEFAULT: '#8E9B84', // Salvia apagado
          dark: '#637358',
          light: '#EBF0E7',
        },
        crema: {
          DEFAULT: '#F8F4EA', // Crema Fondo
          card: '#FCFBF8',
          border: '#E5DEC9',
        },
        brand: {
          petrol: '#2E4056',
          petrolDark: '#213042',
          petrolLight: '#E7EDF3',
          petrolHover: '#384E68',
          coral: '#B85D4B',
          coralDark: '#9A4838',
          coralLight: '#F7E7E3',
          coralBg: '#F9EFEA',
          mustard: '#DCBD9E',
          mustardDark: '#A67C52',
          mustardLight: '#F5EBE0',
          slate: '#635C51',
          slateLight: '#EFECE4',
          cream: '#F8F4EA',
          page: '#FBF9F3',
          card: '#FCFBF8',
          textPrimary: '#302C24',
          textSecondary: '#635C51',
          textMuted: '#8D8579',
          navy: '#2E4056',
          electric: '#2E4056',
          orange: '#DCBD9E',
          white: '#FFFFFF',
        },
        emerald: {
          50: '#F1F5EE',
          100: '#E4ECE0',
          200: '#CBD9C4',
          300: '#AEBEA4',
          400: '#8E9B84', // Salvia apagado
          500: '#728267',
          600: '#2E4056', // Azul Iglesia en acciones principales
          700: '#213042',
          800: '#2E4056',
          900: '#1C2836',
          950: '#121A24',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Montserrat', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        serif: ['Montserrat', '"Plus Jakarta Sans"', 'sans-serif'],
        script: ['Montserrat', 'sans-serif'],
      },
      boxShadow: {
        '2xs': '0 1px 2px rgba(48, 44, 36, 0.05)',
        'xs': '0 3px 10px -2px rgba(48, 44, 36, 0.07), inset 0 1px 0 rgba(255,255,255,0.8)',
        'card': '0 10px 28px -8px rgba(48, 44, 36, 0.08), 0 2px 6px -1px rgba(48, 44, 36, 0.04), inset 0 1px 0 #FFFFFF',
        'hover': '0 18px 38px -10px rgba(46, 64, 86, 0.16), 0 4px 12px -2px rgba(48, 44, 36, 0.06)',
        'modal': '0 28px 70px -12px rgba(46, 64, 86, 0.28)',
        'glow': '0 8px 22px -4px rgba(46, 64, 86, 0.28)',
        'glow-yellow': '0 8px 20px -4px rgba(220, 189, 158, 0.45)',
      }
    },
  },
  plugins: [],
}
