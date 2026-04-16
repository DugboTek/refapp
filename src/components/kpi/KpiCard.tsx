import clsx from "clsx";
import type { ReactNode } from "react";

interface Props {
  label: string;
  value: string | number;
  sub?: ReactNode;
  tone?: "default" | "muted";
}

/**
 * Editorial stat block. No card wrapper, no accent bar — just a rule line
 * and typographic hierarchy. Layout relies on its parent for spacing so
 * multiple blocks on a row create a clean horizontal rhythm.
 */
export default function KpiCard({ label, value, sub, tone = "default" }: Props) {
  return (
    <div
      className={clsx(
        "border-t border-ink-300 pt-4",
        tone === "muted" && "text-ink-500",
      )}
    >
      <div className="kpi-label">{label}</div>
      <div className="kpi-value mt-2">{value}</div>
      {sub ? <div className="mt-2 text-xs text-ink-500">{sub}</div> : null}
    </div>
  );
}
