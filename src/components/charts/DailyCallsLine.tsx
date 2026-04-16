import {
  Area,
  AreaChart,
  Brush,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Bucket } from "../../data/types";
import { fmtDateShort } from "../../lib/format";
import { brand, ink } from "../../lib/theme";

interface Props {
  byDate: Record<string, Bucket>;
  height?: number;
}

export default function DailyCallsLine({ byDate, height = 280 }: Props) {
  const data = Object.entries(byDate)
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([date, b]) => ({
      date,
      total: b.total,
      correct: b.correct,
      incorrect: b.incorrect,
    }));
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 12, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={brand[600]} stopOpacity={0.32} />
              <stop offset="100%" stopColor={brand[600]} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickFormatter={(d) => fmtDateShort(d)}
            minTickGap={24}
          />
          <YAxis tickLine={false} axisLine={false} />
          <Tooltip
            labelFormatter={(d) => fmtDateShort(d as string)}
            cursor={{ stroke: ink[200] }}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke={brand[600]}
            strokeWidth={2}
            fill="url(#gradTotal)"
            name="Plays"
          />
          <Brush
            dataKey="date"
            height={22}
            travellerWidth={8}
            stroke={ink[400]}
            tickFormatter={(d) => fmtDateShort(d as string)}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
