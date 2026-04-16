import { useMemo } from "react";
import type { Bucket } from "../../data/types";
import { accuracy, fmtPct } from "../../lib/grades";
import { accuracyColor, accuracyLegend, ink } from "../../lib/theme";

interface Props {
  heatmap: Record<string, Record<string, Bucket>>;
  playTypes: string[];
  positions?: string[];
  cellSize?: number;
}

export default function AccuracyHeatmap({
  heatmap,
  playTypes,
  positions = ["Lead", "Center", "Trail"],
  cellSize = 46,
}: Props) {
  const cells = useMemo(() => {
    const out: {
      row: number;
      col: number;
      pos: string;
      pt: string;
      bucket: Bucket | null;
      acc: number | null;
    }[] = [];
    positions.forEach((pos, r) => {
      playTypes.forEach((pt, c) => {
        const b = heatmap[pos]?.[pt] || null;
        out.push({
          row: r,
          col: c,
          pos,
          pt,
          bucket: b,
          acc: b ? accuracy(b) : null,
        });
      });
    });
    return out;
  }, [heatmap, playTypes, positions]);

  const labelCol = 80;
  const labelRow = 120;
  const width = labelCol + playTypes.length * cellSize + 8;
  const height = labelRow + positions.length * cellSize + 8;

  return (
    <div className="overflow-x-auto">
      <svg
        width={width}
        height={height}
        role="img"
        aria-label={`Accuracy heatmap, ${positions.length} positions by ${playTypes.length} play types`}
      >
        {playTypes.map((pt, c) => (
          <g
            key={pt}
            transform={`translate(${labelCol + c * cellSize + cellSize / 2}, ${labelRow - 8}) rotate(-40)`}
          >
            <text
              textAnchor="start"
              fontSize={11}
              fill={ink[600]}
              fontWeight={500}
            >
              {pt}
            </text>
          </g>
        ))}
        {positions.map((pos, r) => (
          <text
            key={pos}
            x={labelCol - 10}
            y={labelRow + r * cellSize + cellSize / 2 + 4}
            textAnchor="end"
            fontSize={12}
            fontWeight={600}
            fill={ink[900]}
          >
            {pos}
          </text>
        ))}
        {cells.map((cell) => {
          const x = labelCol + cell.col * cellSize;
          const y = labelRow + cell.row * cellSize;
          const hasData = cell.bucket && cell.bucket.total > 0;
          return (
            <g key={`${cell.pos}-${cell.pt}`}>
              <rect
                x={x + 2}
                y={y + 2}
                width={cellSize - 4}
                height={cellSize - 4}
                rx={4}
                fill={accuracyColor(cell.acc)}
                stroke="#ffffff"
                strokeWidth={1}
              >
                <title>
                  {cell.pos} · {cell.pt}
                  {hasData
                    ? `\nAccuracy ${fmtPct(cell.acc)} · ${cell.bucket!.total} plays`
                    : "\nNo data"}
                </title>
              </rect>
              {hasData ? (
                <text
                  x={x + cellSize / 2}
                  y={y + cellSize / 2 + 3}
                  textAnchor="middle"
                  fontSize={10}
                  fontWeight={600}
                  fill={
                    cell.acc != null && cell.acc < 0.85 ? "#ffffff" : ink[900]
                  }
                >
                  {cell.acc != null ? `${Math.round(cell.acc * 100)}` : "—"}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
      <div className="mt-3 flex items-center gap-2 text-[11px] text-ink-500">
        <span>Accuracy</span>
        <div className="flex items-center">
          {accuracyLegend.map((s) => (
            <div key={s.label} className="flex items-center gap-1 ml-1.5">
              <span
                className="w-3 h-3 rounded-sm inline-block"
                style={{ background: s.color }}
              />
              <span className="tabular-nums">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
