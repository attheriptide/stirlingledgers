/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#fdfcf8",
        ink: "#1d2b6b",
        rule: "#d8c7c7",
        accent: "#1d2b6b",
        green: "#1c6b3a",
        red: "#9b1c1c",
        muted: "#6b6f80",
      },
      fontFamily: {
        serif: ["Georgia", "Iowan Old Style", "serif"],
      },
    },
  },
  plugins: [],
}
