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
        brand: {
          DEFAULT: "#D4AF37",
          light: "#E8CC6A",
          dark: "#A8892B",
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
