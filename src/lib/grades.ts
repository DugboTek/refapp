import type { Bucket, GradeCode } from "../data/types";
import { semantic, ink } from "./theme";

export const GRADE_LABELS: Record<string, string> = {
  CC: "Correct Call",
  IC: "Incorrect Call",
  NCC: "No Call Correct",
  NCI: "No Call Incorrect",
  INC: "Inconclusive",
  MCH: "Mechanics",
  NOTE: "Note / Comment",
};

export const GRADE_SHORT: Record<string, string> = {
  CC: "CC",
  IC: "IC",
  NCC: "NCC",
  NCI: "NCI",
  INC: "INC",
  MCH: "MCH",
  NOTE: "NOTE",
};

export const GRADE_COLORS: Record<string, string> = {
  CC: semantic.correct,
  NCC: "#1e9a77",
  IC: semantic.wrong,
  NCI: "#e08033",
  INC: semantic.warn,
  MCH: ink[500],
  NOTE: ink[400],
};

export const GRADE_ORDER: GradeCode[] = [
  "CC",
  "NCC",
  "INC",
  "NCI",
  "IC",
  "MCH",
  "NOTE",
];

export function isCorrect(code: string): boolean {
  return code === "CC" || code === "NCC";
}

export function isIncorrect(code: string): boolean {
  return code === "IC" || code === "NCI";
}

export function isGraded(code: string): boolean {
  return (
    code === "CC" ||
    code === "NCC" ||
    code === "IC" ||
    code === "NCI" ||
    code === "INC"
  );
}

export function accuracy(b: Bucket): number | null {
  const denom = b.correct + b.incorrect;
  if (denom === 0) return null;
  return b.correct / denom;
}

export function fmtPct(n: number | null, digits = 1): string {
  if (n == null || Number.isNaN(n)) return "—";
  return `${(n * 100).toFixed(digits)}%`;
}
