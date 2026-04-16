/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        // Body: Space Grotesk — geometric sans with character in numerals
        sans: [
          '"Space Grotesk Variable"',
          "Space Grotesk",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        // Display: Fraunces — variable serif with optical sizes + grade axis
        display: [
          '"Fraunces Variable"',
          "Fraunces",
          "ui-serif",
          "Georgia",
          "serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      colors: {
        // Warm, ink-tinted neutrals (tinted toward #1a120b, brand hue).
        // Replaces Tailwind's cool zinc default.
        ink: {
          50: "#fbf9f6",
          100: "#f4f0e9",
          200: "#e7e0d3",
          300: "#c9bfae",
          400: "#9b9181",
          500: "#6f6659",
          600: "#4e4638",
          700: "#2f2a20",
          800: "#1f1b14",
          900: "#13110c",
          950: "#0a0907",
        },
        brand: {
          50: "#fff5ed",
          100: "#ffe6d2",
          200: "#ffc79b",
          300: "#ff9d5a",
          400: "#ff7a2d",
          500: "#ec5a0c",
          600: "#c74408",
          700: "#9f340a",
          800: "#782810",
          900: "#5a2012",
        },
        // Semantic
        correct: {
          DEFAULT: "#0d7a5f",
          soft: "#d6f0e5",
        },
        wrong: {
          DEFAULT: "#c52033",
          soft: "#fbe1e3",
        },
        warn: {
          DEFAULT: "#b5620a",
          soft: "#fbead0",
        },
      },
      boxShadow: {
        hairline: "inset 0 0 0 1px rgba(31, 27, 20, 0.08)",
      },
      spacing: {
        "fluid-xs": "clamp(0.5rem, 0.4rem + 0.5vw, 0.75rem)",
        "fluid-sm": "clamp(0.75rem, 0.5rem + 1vw, 1.25rem)",
        "fluid-md": "clamp(1rem, 0.7rem + 1.5vw, 2rem)",
        "fluid-lg": "clamp(1.5rem, 1rem + 2.5vw, 3.5rem)",
        "fluid-xl": "clamp(2rem, 1.5rem + 4vw, 5rem)",
      },
    },
  },
  plugins: [],
};
