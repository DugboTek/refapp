import {
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import type { Play } from "../../data/types";
import { GRADE_COLORS, GRADE_LABELS } from "../../lib/grades";
import { ink } from "../../lib/theme";

interface Props {
  plays: Play[];
  height?: number;
}

function parseClock(t: string): number | null {
  const m = t.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

export default function GameTimelineStrip({ plays, height = 260 }: Props) {
  // X axis: cumulative elapsed game time in seconds.
  // Period 1 = 0..1200s (20-min halves), period 2 = 1200..2400s.
  // Clock counts down, so elapsed = 1200 - clock for each half.
  const data = plays
    .map((p) => {
      const sec = parseClock(p.time);
      if (sec == null || p.period == null) return null;
      const elapsed = (p.period - 1) * 1200 + (1200 - sec);
      return {
        x: elapsed,
        y: p.period,
        play: p,
      };
    })
    .filter(Boolean) as { x: number; y: number; play: Play }[];

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <ScatterChart margin={{ top: 12, right: 18, bottom: 24, left: 12 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="x"
            domain={[0, 2400]}
            ticks={[0, 300, 600, 900, 1200, 1500, 1800, 2100, 2400]}
            tickFormatter={(v) => {
              const half = v < 1200 ? "H1" : "H2";
              const mins = Math.floor((v % 1200) / 60);
              return `${half} ${mins}′`;
            }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="number"
            dataKey="y"
            domain={[0.5, 2.5]}
            ticks={[1, 2]}
            tickFormatter={(v) => `Half ${v}`}
            tickLine={false}
            axisLine={false}
            width={60}
          />
          <ZAxis range={[80, 80]} />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            content={({ active, payload }) => {
              if (!active || !payload?.[0]?.payload) return null;
              const p: Play = payload[0].payload.play;
              return (
                <div className="rounded-xl border border-zinc-200 bg-white shadow-soft p-3 text-xs">
                  <div className="font-semibold text-zinc-900 mb-0.5">
                    {p.playType}
                  </div>
                  <div className="text-zinc-600">
                    Q{p.period} {p.time} · {p.entryType}
                  </div>
                  <div className="text-zinc-500">
                    {p.officials.join(", ")}
                  </div>
                  <div
                    className="mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-white text-[10px] font-semibold"
                    style={{ background: GRADE_COLORS[p.grade] }}
                  >
                    {GRADE_LABELS[p.grade] || p.grade}
                  </div>
                </div>
              );
            }}
          />
          <Scatter data={data}>
            {data.map((d, i) => (
              <Cell
                key={i}
                fill={GRADE_COLORS[d.play.grade] || ink[400]}
                fillOpacity={0.85}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
