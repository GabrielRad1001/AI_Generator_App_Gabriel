/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        bg: { base: "#030705", surface: "#08120B", elevated: "#0D1D13" },
        line: { DEFAULT: "#172A1F", hover: "#264231" },
        ink: { primary: "#F4FFF9", secondary: "#9EAF9C", muted: "#7D8B7A" },
        brand: {
          DEFAULT: "#00FFA3",
          hover: "#A3E635",
          accent: "#0D6E46",
          danger: "#EF4444",
        },
      },
      fontFamily: {
        sans: ['Geist', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        tightest: "-0.04em",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(0, 255, 163, 0.0)" },
          "50%": { boxShadow: "0 0 28px 4px rgba(0, 255, 163, 0.18)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out forwards",
        "pulse-glow": "pulse-glow 2.4s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
