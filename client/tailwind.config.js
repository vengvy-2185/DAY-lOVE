/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Dark Mode Base Palette (Slate Style)
        base: {
          950: "#0f172a", // Background ចំបង (Slate 950)
          900: "#1e293b", // Panel / Sidebar Background (Slate 900)
          800: "#334155", // Message Bubble / Card (Slate 800)
          700: "#475569", // Border / Divider
          600: "#64748b", // Text Muted / Subtitle
          100: "#f8fafc", // Text Light
          50: "#ffffff",
        },
        // Accent Colors (Telegram Blue Style)
        accent: {
          DEFAULT: "#38bdf8", // Sky Blue - ភ្លឺច្បាស់ ស្រទន់ភ្នែក
          dim: "#0284c7",     // Medium Blue
          light: "#7dd3fc",   // Light Sky Blue
        },
        // Secondary Accent
        accent2: {
          DEFAULT: "#0ea5e9",
          dim: "#0369a1",
        },
      },
      backgroundImage: {
        // Linear Gradients បែប Soft Telegram Modern
        "brand-gradient": "linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)",
        "brand-gradient-soft": "linear-gradient(135deg, rgba(56, 189, 248, 0.12) 0%, rgba(14, 165, 233, 0.08) 100%)",
      },
      boxShadow: {
        glow: "0 8px 25px -6px rgba(56, 189, 248, 0.25)", // Soft Blue Shadow
      },
      fontFamily: {
        khmer: ["Kantumruy Pro", "Noto Sans Khmer", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};