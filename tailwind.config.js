/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pageBg: "#f6f6f3",
        paper: "#ffffff",
        ink: "#17181c",
        muted: "#8a8a86",
        rule: "#ececea",
        accent: "#ee6a30",
        "accent-dim": "#fdece2",
        highlight: "#f7f6f3",
        "highlight-border": "#e9e8e4",
        green: "#1c8a4a",
        "green-bg": "#e9f7ee",
        red: "#c8402c",
        "danger-bg": "#fceeec",
        "danger-border": "#f0c9c2",
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "Inter", "Segoe UI", "sans-serif"],
        display: ["Georgia", "Iowan Old Style", "serif"],
      },
    },
  },
  plugins: [],
}
