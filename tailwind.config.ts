import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d5fe',
          300: '#a4b4fc',
          400: '#7c8af8',
          500: '#5a5ef2',
          600: '#4340e6',
          700: '#3730cb',
          800: '#2e29a4',
          900: '#292782',
        },
        brand: {
          DEFAULT: '#5a5ef2',
          dark: '#3730cb',
          light: '#7c8af8',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
