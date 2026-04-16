// Single source of truth for colors used in JS/SVG chart code.
// Tailwind classes reference the same values via tailwind.config.js.

export const ink = {
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
} as const;

export const brand = {
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
} as const;

export const semantic = {
  correct: "#0d7a5f",
  correctSoft: "#d6f0e5",
  wrong: "#c52033",
  wrongSoft: "#fbe1e3",
  warn: "#b5620a",
  warnSoft: "#fbead0",
  neutral: ink[500],
} as const;

// Categorical palette for multi-series charts (conferences, etc).
// Ordered so neighboring series are visually distinct.
export const categorical = [
  brand[600],
  semantic.correct,
  "#2563eb", // blue-600
  "#7c3aed", // violet-600
  "#d97706", // amber-600
] as const;

// Heatmap diverging scale — red → amber → emerald
export function accuracyColor(acc: number | null): string {
  if (acc == null) return ink[100];
  if (acc >= 0.97) return "#0d7a5f";
  if (acc >= 0.95) return "#1e9a77";
  if (acc >= 0.92) return "#4cb595";
  if (acc >= 0.9) return "#9ed6bf";
  if (acc >= 0.85) return "#f0d47d";
  if (acc >= 0.8) return "#ecb34a";
  if (acc >= 0.7) return "#e08033";
  return "#c52033";
}

export const accuracyLegend = [
  { color: "#c52033", label: "<70" },
  { color: "#e08033", label: "70" },
  { color: "#ecb34a", label: "80" },
  { color: "#f0d47d", label: "85" },
  { color: "#9ed6bf", label: "90" },
  { color: "#4cb595", label: "92" },
  { color: "#1e9a77", label: "95" },
  { color: "#0d7a5f", label: "97+" },
];
