/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          950: "#0b0e13",
          900: "#11151c",
          800: "#171c25",
          700: "#222836",
          600: "#2e3648",
          100: "#f4f6fb",
          50: "#ffffff",
        },
        accent: {
          DEFAULT: "#6c5ce7",
          dim: "#5849c4",
          light: "#a29bfe",
        },
        accent2: {
          DEFAULT: "#00cec9",
          dim: "#00a8a3",
        },
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #6c5ce7 0%, #a259ff 45%, #00cec9 100%)",
        "brand-gradient-soft": "linear-gradient(135deg, rgba(108,92,231,0.18) 0%, rgba(0,206,201,0.14) 100%)",
      },
      boxShadow: {
        glow: "0 8px 30px -8px rgba(108, 92, 231, 0.45)",
      },
      fontFamily: {
        khmer: ["Kantumruy Pro", "Noto Sans Khmer", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
