import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Bucket } from "../../data/types";
import { accuracy } from "../../lib/grades";
import { semantic } from "../../lib/theme";

interface Props {
  byPlayType: Record<string, Bucket>;
  topN?: number;
  height?: number;
  /** If true, bar length is accuracy % instead of volume. */
  byAccuracy?: boolean;
}

export default function PlayTypeBar({
  byPlayType,
  topN = 15,
  height = 380,
  byAccuracy = false,
}: Props) {
  const entries = Object.entries(byPlayType)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, topN);
  const data = entries.map(([name, b]) => {
    const acc = accuracy(b);
    return {
      name,
      total: b.total,
      accuracy: acc == null ? 0 : Math.round(acc * 1000) / 10,
      incorrect: b.incorrect,
      correct: b.correct,
    };
  });
  if (byAccuracy) data.sort((a, b) => b.accuracy - a.accuracy);

  const key = byAccuracy ? "accuracy" : "total";
  const color = (d: (typeof data)[number]) => {
    if (byAccuracy) {
      // Scale emerald → amber → red by accuracy
      if (d.accuracy >= 95) return semantic.correct;
      if (d.accuracy >= 90) return "#1e9a77";
      if (d.accuracy >= 85) return semantic.warn;
      return semantic.wrong;
    }
    if (d.accuracy >= 95) return semantic.correct;
    if (d.accuracy >= 90) return "#1e9a77";
    if (d.accuracy >= 85) return semantic.warn;
    return semantic.wrong;
  };

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 24, bottom: 8, left: 12 }}
        >
          <CartesianGrid horizontal={false} strokeDasharray="3 3" />
          <XAxis
            type="number"
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => (byAccuracy ? `${v}%` : v.toLocaleString())}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={150}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11 }}
          />
          <Tooltip
            formatter={(value: number, name: string, props: any) => {
              const d = props.payload;
              if (name === key) {
                return byAccuracy
                  ? [`${d.accuracy}%`, "Accuracy"]
                  : [d.total.toLocaleString(), "Plays"];
              }
              return [value, name];
            }}
            cursor={{ fill: "rgba(244,244,245,0.7)" }}
          />
          <Bar dataKey={key} radius={[0, 6, 6, 0]} maxBarSize={22}>
            {data.map((d) => (
              <Cell key={d.name} fill={color(d)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
