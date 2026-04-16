import { useMemo } from "react";
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Bucket } from "../../data/types";
import { fmtDateShort } from "../../lib/format";
import { semantic, ink } from "../../lib/theme";

interface Props {
  byDate: Record<string, Bucket>;
  window?: number;
  height?: number;
}

export default function SeasonTrendLine({
  byDate,
  window = 7,
  height = 320,
}: Props) {
  const data = useMemo(() => {
    const entries = Object.entries(byDate).sort((a, b) =>
      a[0] < b[0] ? -1 : 1,
    );
    return entries.map((_, i) => {
      const start = Math.max(0, i - window + 1);
      let correct = 0;
      let incorrect = 0;
      for (let j = start; j <= i; j++) {
        const b = entries[j][1];
        correct += b.correct;
        incorrect += b.incorrect;
      }
      const denom = correct + incorrect;
      return {
        date: entries[i][0],
        rolling: denom === 0 ? null : Math.round((correct / denom) * 1000) / 10,
        volume: entries[i][1].total,
      };
    });
  }, [byDate, window]);

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <ComposedChart
          data={data}
          margin={{ top: 10, right: 12, bottom: 0, left: 0 }}
        >
          <defs>
            <linearGradient id="rollAcc" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={semantic.correct} stopOpacity={0.32} />
              <stop offset="100%" stopColor={semantic.correct} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={(d) => fmtDateShort(d)}
            minTickGap={32}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            yAxisId="left"
            domain={[80, 100]}
            tickFormatter={(v) => `${v}%`}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            labelFormatter={(d) => fmtDateShort(d as string)}
            formatter={(value, name) => {
              if (name === "rolling")
                return [`${value}%`, `${window}d rolling accuracy`];
              if (name === "volume") return [value, "Plays / day"];
              return [value, name];
            }}
          />
          <Bar
            yAxisId="right"
            dataKey="volume"
            fill={ink[200]}
            radius={[2, 2, 0, 0]}
            name="volume"
          />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="rolling"
            stroke={semantic.correct}
            strokeWidth={2.5}
            fill="url(#rollAcc)"
            name="rolling"
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
