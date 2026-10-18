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
        forest: {
          50: '#f2f8f4',
          100: '#e1f0e6',
          200: '#c3e2cd',
          300: '#96cca7',
          400: '#63ae7c',
          500: '#3d9258',
          600: '#2d7744',
          700: '#245e37',
          800: '#1f4b2e',
          900: '#1a3e27',
          950: '#0c2214',
        },
        earth: {
          50: '#fdfaf6',
          100: '#f8f1e7',
          200: '#f0e0cd',
          300: '#e3c7a9',
          400: '#d0a77f',
          500: '#bd8958',
          600: '#a36d40',
          700: '#835234',
          800: '#6c432d',
          900: '#583726',
          950: '#301c13',
        },
        moss: {
          50: '#f6f7f2',
          100: '#ebeee2',
          200: '#d6dcc5',
          300: '#bac4a1',
          400: '#9ca97e',
          500: '#828e62',
          600: '#65704b',
          700: '#4f573c',
          800: '#414733',
          900: '#383c2d',
          950: '#1d2116',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        elevation: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}
