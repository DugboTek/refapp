import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Play } from "../../data/types";
import { brand, semantic, ink } from "../../lib/theme";

interface Props {
  plays: Play[];
  height?: number;
}

function parseClock(t: string): number | null {
  const m = t.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

export default function ClockDensity({ plays, height = 300 }: Props) {
  const data = useMemo(() => {
    const bins = Array.from({ length: 40 }, (_, i) => {
      const half = i < 20 ? "H1" : "H2";
      const inHalf = i < 20 ? i : i - 20;
      return {
        minute: i,
        label: `${half} ${inHalf}'`,
        calls: 0,
        correct: 0,
        incorrect: 0,
      };
    });
    for (const p of plays) {
      if (p.period == null) continue;
      const sec = parseClock(p.time);
      if (sec == null) continue;
      // Clock counts down, so elapsed-in-half = 20 - ceil(sec/60), clamp 0..19
      let elapsedInHalf = 20 - Math.ceil(sec / 60);
      if (elapsedInHalf < 0) elapsedInHalf = 0;
      if (elapsedInHalf > 19) elapsedInHalf = 19;
      const idx = (p.period - 1) * 20 + elapsedInHalf;
      if (idx < 0 || idx > 39) continue;
      bins[idx].calls += 1;
      if (p.grade === "CC" || p.grade === "NCC") bins[idx].correct += 1;
      if (p.grade === "IC" || p.grade === "NCI") bins[idx].incorrect += 1;
    }
    return bins;
  }, [plays]);

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 12, bottom: 0, left: 0 }}
        >
          <defs>
            <linearGradient id="density" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={brand[600]} stopOpacity={0.38} />
              <stop offset="100%" stopColor={brand[600]} stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="wrong" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={semantic.wrong} stopOpacity={0.4} />
              <stop offset="100%" stopColor={semantic.wrong} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            interval={3}
            tickLine={false}
            axisLine={false}
            fontSize={10}
          />
          <YAxis tickLine={false} axisLine={false} />
          <ReferenceLine
            x="H2 0'"
            stroke={ink[400]}
            strokeDasharray="4 4"
            label={{
              value: "Halftime",
              position: "insideTopLeft",
              fontSize: 10,
              fill: ink[400],
            }}
          />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="calls"
            stroke={brand[600]}
            strokeWidth={2}
            fill="url(#density)"
            name="Total calls"
          />
          <Area
            type="monotone"
            dataKey="incorrect"
            stroke={semantic.wrong}
            strokeWidth={1.5}
            fill="url(#wrong)"
            name="Incorrect"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
