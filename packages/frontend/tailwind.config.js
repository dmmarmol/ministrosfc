/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{vue,js,ts,jsx,tsx}",
    "./src/components/**/*.{vue,js,ts}",
    "./src/layouts/**/*.vue",
    "./src/pages/**/*.vue",
  ],
  theme: {
    extend: {
      colors: {
        // Brand color palettes for Nuxt UI theming.
        // Nuxt UI reserves `primary` and rewrites it to CSS variables,
        // so the concrete palette must live under a different key.
        brand: {
          DEFAULT: "#D4AF37",
          50: "#FEF9F0",
          100: "#FDF2E0",
          200: "#FAE5C0",
          300: "#F7D39C",
          400: "#F3BF64",
          500: "#D4AF37",
          600: "#C89B29",
          700: "#A87620",
          800: "#8A5E18",
          900: "#6D4810",
          950: "#3D2E0A",
        },
        primary: {
          DEFAULT: "#8D818C",
          50: "#E4E1E4",
          100: "#DBD7DA",
          200: "#C7C1C7",
          300: "#B4ACB3",
          400: "#A096A0",
          500: "#8D818C",
          600: "#70666F",
          700: "#534B52",
          800: "#353035",
          900: "#181618",
          950: "#090809",
        },
        // Secondary: Dark Navy (#050517)
        secondary: {
          50: "#E8E7ED",
          100: "#D1CEDC",
          200: "#A39DB8",
          300: "#756C95",
          400: "#473B71",
          500: "#050517",
          600: "#040412",
          700: "#03030E",
          800: "#02020A",
          900: "#010105",
          950: "#000000",
        },
        // Tertiary: Light Blue (#DFEEF7)
        tertiary: {
          50: "#FFFFFF",
          100: "#FBFDFE",
          200: "#F7FBFD",
          300: "#EFF6FA",
          400: "#E7F1F8",
          500: "#DFEEF7",
          600: "#C8DEF0",
          700: "#A9CBDE",
          800: "#7BA8C8",
          900: "#5588B3",
          950: "#4A7C99",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
      },
    },
  },
  plugins: [],
};
