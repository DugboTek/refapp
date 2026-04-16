import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { GRADE_COLORS, GRADE_LABELS, GRADE_ORDER } from "../../lib/grades";
import type { Bucket } from "../../data/types";

interface Props {
  bucket: Bucket;
  height?: number;
  showLegend?: boolean;
}

export default function GradeDonut({
  bucket,
  height = 260,
  showLegend = true,
}: Props) {
  const data = GRADE_ORDER.filter((g) => (bucket.grades[g] || 0) > 0).map(
    (g) => ({
      name: GRADE_LABELS[g] || g,
      code: g,
      value: bucket.grades[g] || 0,
      color: GRADE_COLORS[g] || "#9b9181",
    }),
  );
  return (
    <div className="flex items-center gap-4 w-full">
      <div style={{ width: "55%", height }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius={65}
              outerRadius={95}
              paddingAngle={1.5}
              stroke="#ffffff"
              strokeWidth={2}
            >
              {data.map((d) => (
                <Cell key={d.code} fill={d.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v: number, _n, p: any) => [
                v.toLocaleString(),
                p.payload.name,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {showLegend ? (
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          {data.map((d) => (
            <div
              key={d.code}
              className="flex items-center justify-between text-xs text-zinc-700"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{ background: d.color }}
                />
                <span className="truncate">{d.name}</span>
              </div>
              <span className="text-zinc-900 font-medium tabular-nums">
                {d.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
