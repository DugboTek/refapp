import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Bucket } from "../../data/types";
import { GRADE_COLORS, GRADE_LABELS, GRADE_ORDER } from "../../lib/grades";

interface Props {
  byConference: Record<string, Bucket>;
  height?: number;
}

export default function ConferenceStackedBar({
  byConference,
  height = 280,
}: Props) {
  const data = Object.entries(byConference)
    .sort((a, b) => b[1].total - a[1].total)
    .map(([name, b]) => {
      const row: Record<string, number | string> = { name: shortConf(name) };
      for (const g of GRADE_ORDER) {
        row[g] = b.grades[g] || 0;
      }
      return row;
    });
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="name" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} />
          <Tooltip cursor={{ fill: "rgba(244,244,245,0.7)" }} />
          <Legend
            iconType="circle"
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
            formatter={(v) => GRADE_LABELS[v as string] || v}
          />
          {GRADE_ORDER.map((g) => (
            <Bar
              key={g}
              dataKey={g}
              stackId="g"
              fill={GRADE_COLORS[g]}
              radius={[0, 0, 0, 0]}
              maxBarSize={90}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function shortConf(name: string): string {
  return name
    .replace("Men's Basketball", "MBB")
    .replace("  ", " ")
    .trim();
}
