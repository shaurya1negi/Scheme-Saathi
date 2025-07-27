/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        accent: {
          500: '#10b981',
          600: '#059669',
        },
        // Enhanced Indian Flag Colors
        saffron: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#ff9933',
          500: '#ff7722',
          600: '#ff6600',
          700: '#e55100',
          800: '#bf360c',
          900: '#8d2f00',
        },
        indianGreen: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#228b22',
          500: '#138808',
          600: '#0d5f0d',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        // Additional Indian Inspired Colors
        turmeric: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        marigold: {
          400: '#fcd34d',
          500: '#fbbf24',
          600: '#f59e0b',
        },
        lotus: {
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
        },
        peacock: {
          400: '#06b6d4',
          500: '#0891b2',
          600: '#0e7490',
        },
        ashoka: {
          500: '#4338ca',
          600: '#3730a3',
          700: '#312e81',
        }
      },
      fontFamily: {
        'hindi': ['Devanagari', 'serif'],
        'english': ['Inter', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'bounce-soft': 'bounceSoft 2s infinite',
        'float': 'float 3s ease-in-out infinite',
        'pulse-indian': 'pulse-indian 2s infinite',
        'gradient-shift': 'gradientShift 3s ease infinite',
        'rotate-slow': 'rotateSlow 20s linear infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'scale-pulse': 'scalePulse 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceSoft: {
          '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
          '40%': { transform: 'translateY(-8px)' },
          '60%': { transform: 'translateY(-4px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        rotateSlow: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        scalePulse: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
      },
      backgroundImage: {
        'indian-gradient': 'linear-gradient(135deg, #ff6600 0%, #ffffff 50%, #138808 100%)',
        'saffron-gradient': 'linear-gradient(135deg, #ff9933 0%, #ff7722 100%)',
        'green-gradient': 'linear-gradient(135deg, #228b22 0%, #138808 100%)',
        'cultural-pattern': `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ff9933' fill-opacity='0.1'%3E%3Cpath d='M30 30c0-16.569 13.431-30 30-30v30H30zM0 30c0-16.569 13.431-30 30-30v30H0z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      },
      boxShadow: {
        'indian': '0 4px 20px rgba(255, 153, 51, 0.3)',
        'green-glow': '0 4px 20px rgba(19, 136, 8, 0.3)',
        'golden': '0 8px 32px rgba(251, 191, 36, 0.3)',
        'cultural': '0 10px 40px rgba(255, 102, 0, 0.2), 0 6px 20px rgba(19, 136, 8, 0.2)',
      },
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [],
}