import { useMemo } from "react";
import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { Play } from "../../data/types";

interface Props {
  plays: Play[];
  topPlayTypes: string[];
  height?: number;
}

import { categorical, ink } from "../../lib/theme";
const COLORS = categorical;

export default function ConferenceRadar({
  plays,
  topPlayTypes,
  height = 420,
}: Props) {
  const { data, conferences } = useMemo(() => {
    const axes = topPlayTypes.slice(0, 7);
    const confs = Array.from(new Set(plays.map((p) => p.conference))).sort();
    const tallies: Record<
      string,
      Record<string, { correct: number; incorrect: number }>
    > = {};
    for (const c of confs) {
      tallies[c] = {};
      for (const pt of axes) tallies[c][pt] = { correct: 0, incorrect: 0 };
    }
    for (const p of plays) {
      if (!tallies[p.conference]) continue;
      if (!axes.includes(p.playType)) continue;
      const cell = tallies[p.conference][p.playType];
      if (p.grade === "CC" || p.grade === "NCC") cell.correct++;
      if (p.grade === "IC" || p.grade === "NCI") cell.incorrect++;
    }
    const data = axes.map((pt) => {
      const row: Record<string, string | number> = { playType: pt };
      for (const c of confs) {
        const cell = tallies[c][pt];
        const denom = cell.correct + cell.incorrect;
        row[c] = denom === 0 ? 0 : Math.round((cell.correct / denom) * 1000) / 10;
      }
      return row;
    });
    return { data, conferences: confs };
  }, [plays, topPlayTypes]);

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke={ink[200]} />
          <PolarAngleAxis
            dataKey="playType"
            tick={{ fontSize: 10, fill: ink[600] }}
          />
          <PolarRadiusAxis
            domain={[60, 100]}
            tick={{ fontSize: 9, fill: ink[400] }}
            angle={30}
          />
          <Tooltip formatter={(v: number) => `${v}%`} />
          <Legend
            iconType="circle"
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
            formatter={(v) => (v as string).replace("Men's Basketball", "MBB")}
          />
          {conferences.map((c, i) => (
            <Radar
              key={c}
              name={c}
              dataKey={c}
              stroke={COLORS[i % COLORS.length]}
              fill={COLORS[i % COLORS.length]}
              fillOpacity={0.15}
              strokeWidth={2}
            />
          ))}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
