/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // use .dark for dark mode
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', 'Geist Fallback', 'Inter', 'sans-serif'],
        mono: ['Geist Mono', 'Geist Mono Fallback', 'monospace'],
      },
      colors: {
        // Light mode colors
        background: 'oklch(1 0 0)',
        foreground: 'oklch(0.145 0 0)',
        card: 'oklch(1 0 0)',
        cardForeground: 'oklch(0.145 0 0)',
        primary: 'oklch(0.205 0 0)',
        'primary-foreground': 'oklch(0.985 0 0)',
        secondary: 'oklch(0.97 0 0)',
        'secondary-foreground': 'oklch(0.205 0 0)',
        accent: 'oklch(0.97 0 0)',
        'accent-foreground': 'oklch(0.205 0 0)',
        destructive: 'oklch(0.577 0.245 27.325)',
        'destructive-foreground': 'oklch(0.577 0.245 27.325)',
        border: 'oklch(0.922 0 0)',
        ring: 'oklch(0.708 0 0)',
      },
      borderRadius: {
        DEFAULT: '0.625rem',
        sm: '0.375rem',
        md: '0.605rem',
        lg: '0.625rem',
        xl: '1.025rem',
      },
    },
  },
  plugins: [
    require('tw-animate-css'),
  ],
};
