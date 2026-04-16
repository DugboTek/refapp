import { useMemo } from "react";
import type { Bucket } from "../../data/types";
import { fmtDate } from "../../lib/format";
import { brand, ink } from "../../lib/theme";

interface Props {
  byDate: Record<string, Bucket>;
  cellSize?: number;
}

function parseISODate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function toISO(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export default function CalendarHeatmap({ byDate, cellSize = 15 }: Props) {
  const { cells, weeks, maxVol, months } = useMemo(() => {
    const keys = Object.keys(byDate).sort();
    if (keys.length === 0) {
      return {
        cells: [],
        weeks: 0,
        maxVol: 0,
        months: [] as { col: number; label: string }[],
      };
    }
    const first = parseISODate(keys[0]);
    const last = parseISODate(keys[keys.length - 1]);
    const start = new Date(first);
    start.setUTCDate(start.getUTCDate() - first.getUTCDay());
    const end = new Date(last);
    end.setUTCDate(end.getUTCDate() + (6 - last.getUTCDay()));
    const totalDays =
      Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
    const cells: {
      iso: string;
      col: number;
      row: number;
      vol: number;
      bucket: Bucket | undefined;
    }[] = [];
    const months: { col: number; label: string }[] = [];
    let max = 0;
    let currentMonth = -1;
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(start);
      d.setUTCDate(d.getUTCDate() + i);
      const iso = toISO(d);
      const col = Math.floor(i / 7);
      const row = i % 7;
      const b = byDate[iso];
      const vol = b?.total || 0;
      if (vol > max) max = vol;
      cells.push({ iso, col, row, vol, bucket: b });
      if (row === 0 && d.getUTCMonth() !== currentMonth) {
        currentMonth = d.getUTCMonth();
        months.push({
          col,
          label: d.toLocaleString("en-US", {
            month: "short",
            timeZone: "UTC",
          }),
        });
      }
    }
    return { cells, weeks: Math.ceil(totalDays / 7), maxVol: max, months };
  }, [byDate]);

  const color = (vol: number) => {
    if (vol === 0) return ink[100];
    const t = vol / maxVol;
    if (t > 0.8) return brand[900];
    if (t > 0.6) return brand[800];
    if (t > 0.4) return brand[700];
    if (t > 0.2) return brand[600];
    if (t > 0.08) return brand[400];
    return brand[200];
  };

  const labelH = 22;
  const padL = 32;
  const gap = 3;
  const width = padL + weeks * (cellSize + gap);
  const height = labelH + 7 * (cellSize + gap);

  return (
    <div className="overflow-x-auto">
      <svg
        width={width}
        height={height}
        role="img"
        aria-label={`Calendar heatmap of daily play volume over ${weeks} weeks`}
      >
        {months.map((m) => (
          <text
            key={`${m.col}-${m.label}`}
            x={padL + m.col * (cellSize + gap)}
            y={14}
            fontSize={10}
            fill={ink[500]}
            fontWeight={500}
          >
            {m.label}
          </text>
        ))}
        {["", "Mon", "", "Wed", "", "Fri", ""].map((l, i) => (
          <text
            key={i}
            x={padL - 6}
            y={labelH + i * (cellSize + gap) + cellSize - 3}
            fontSize={9}
            fill={ink[400]}
            textAnchor="end"
          >
            {l}
          </text>
        ))}
        {cells.map((c) => (
          <rect
            key={c.iso}
            x={padL + c.col * (cellSize + gap)}
            y={labelH + c.row * (cellSize + gap)}
            width={cellSize}
            height={cellSize}
            rx={3}
            fill={color(c.vol)}
          >
            <title>
              {fmtDate(c.iso)} — {c.vol} plays
              {c.bucket
                ? ` · ${c.bucket.correct} correct / ${c.bucket.incorrect} incorrect`
                : ""}
            </title>
          </rect>
        ))}
      </svg>
      <div className="mt-3 flex items-center gap-2 text-[11px] text-ink-500">
        <span>Less</span>
        {[ink[100], brand[200], brand[400], brand[600], brand[700], brand[900]].map(
          (c) => (
            <span
              key={c}
              className="w-3 h-3 rounded-sm inline-block"
              style={{ background: c }}
            />
          ),
        )}
        <span>More</span>
        <span className="ml-4 text-ink-400">Peak day: {maxVol} plays</span>
      </div>
    </div>
  );
}
