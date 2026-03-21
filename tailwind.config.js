/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'white': '#FFFFFF',
        'black': '#0A0A0A',
        'stone': '#F5F3F0',
      },
      fontFamily: {
        'cormorant': ['"Cormorant Garamond"', 'serif'],
        'inter': ['Inter', 'sans-serif'],
        'lora': ['"Lora"', 'serif'],
        'bricolage': ['"Bricolage Grotesque"', 'sans-serif'],
      },
      letterSpacing: {
        'editorial': '0.12em',
        'nav': '0.2em',
        'body': '0.06em',
      },
      spacing: {
        'section': '120px',
        'card-gap': '32px',
        'card-margin': '80px',
      },
    },
  },
  plugins: [],
}
