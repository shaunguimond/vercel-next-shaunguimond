/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: "class",
  theme: {
    extend: {
      screens: {
        'mobile': '480px',
        // => @media (min-width: 480px) { ... }
        'sm': '640px',
        // => @media (min-width: 640px) { ... }
  
        'tablet': '768px',
        // => @media (min-width: 768px) { ... }
  
        'lg': '1024px',
        // => @media (min-width: 1024px) { ... }
  
        'desktop': '1280px',
        // => @media (min-width: 1280px) { ... }
  
        '2xl': '1536px',
        // => @media (min-width: 1536px) { ... }
      },
      colors: {
        'laccent-1': '#acb1dbb3',
        'daccent-1': '#242a3e',
        'daccent-2': '#070a15cc',
        'brand': '#17694b',
        'accent-1': '#FAFAFA',
        'accent-2': '#EAEAEA',
        'accent-7': '#333',
        success: '#0070f3',
        cyan: '#79FFE1',
      },
      spacing: {
        28: '7rem',
      },
      letterSpacing: {
        tighter: '-.04em',
      },
      lineHeight: {
        tight: 1.2,
      },
      fontFamily: {
        QuicksandRegular: 'QuicksandRegular',
        Gotu: ['Gotu'],
        sans: ['QuicksandRegular', 'sans-serif'],
        serif: ['Gotu', 'serif']
      },
      fontSize: {
        '5xl': '2.5rem',
        '6xl': '2.75rem',
        '7xl': '4.5rem',
        '8xl': '6.25rem',
      },
      boxShadow: {
        small: '0 5px 10px rgba(0, 0, 0, 0.12)',
        medium: '0 8px 30px rgba(0, 0, 0, 0.12)',
      },
    },
  },
  plugins: [],
  corePlugins: {
    fontFamily: true,
  }
}
