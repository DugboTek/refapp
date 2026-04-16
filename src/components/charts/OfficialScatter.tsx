import { useMemo } from "react";
import {
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import type { OfficialAgg } from "../../data/types";
import { accuracy } from "../../lib/grades";
import { semantic, ink } from "../../lib/theme";

interface Props {
  officials: OfficialAgg[];
  minVolume?: number;
  height?: number;
}

export default function OfficialScatter({
  officials,
  minVolume = 25,
  height = 460,
}: Props) {
  const { data, medianVolume, medianAcc } = useMemo(() => {
    const filtered = officials.filter((o) => o.total >= minVolume);
    const data = filtered.map((o) => {
      const acc = accuracy(o);
      return {
        name: o.name,
        volume: o.total,
        accuracy: acc == null ? 0 : acc * 100,
        incorrect: o.incorrect,
      };
    });
    const sortedV = [...data].map((d) => d.volume).sort((a, b) => a - b);
    const sortedA = [...data].map((d) => d.accuracy).sort((a, b) => a - b);
    return {
      data,
      medianVolume: sortedV[Math.floor(sortedV.length / 2)] || 0,
      medianAcc: sortedA[Math.floor(sortedA.length / 2)] || 0,
    };
  }, [officials, minVolume]);

  const color = (d: (typeof data)[number]) => {
    if (d.accuracy >= medianAcc && d.volume >= medianVolume) return semantic.correct;
    if (d.accuracy >= medianAcc && d.volume < medianVolume) return "#2563eb";
    if (d.accuracy < medianAcc && d.volume >= medianVolume) return semantic.warn;
    return semantic.wrong;
  };

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <ScatterChart margin={{ top: 12, right: 24, bottom: 36, left: 12 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="volume"
            name="Volume"
            tickLine={false}
            axisLine={false}
            label={{
              value: "Plays evaluated",
              position: "insideBottom",
              offset: -8,
              fontSize: 11,
              fill: ink[500],
            }}
          />
          <YAxis
            type="number"
            dataKey="accuracy"
            name="Accuracy %"
            domain={[
              (dataMin: number) => Math.max(60, Math.floor(dataMin - 2)),
              100,
            ]}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <ZAxis dataKey="incorrect" range={[30, 260]} name="Incorrect" />
          <ReferenceLine
            x={medianVolume}
            stroke={ink[400]}
            strokeDasharray="4 4"
          />
          <ReferenceLine
            y={medianAcc}
            stroke={ink[400]}
            strokeDasharray="4 4"
          />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            content={({ active, payload }) => {
              if (!active || !payload?.[0]?.payload) return null;
              const d = payload[0].payload;
              return (
                <div className="rounded-xl border border-zinc-200 bg-white shadow-soft p-3 text-xs">
                  <div className="font-semibold text-zinc-900">{d.name}</div>
                  <div className="text-zinc-600">
                    {d.volume.toLocaleString()} plays · {d.accuracy.toFixed(1)}%
                    accuracy
                  </div>
                  <div className="text-zinc-500">
                    {d.incorrect} incorrect calls
                  </div>
                </div>
              );
            }}
          />
          <Scatter data={data}>
            {data.map((d, i) => (
              <Cell key={i} fill={color(d)} fillOpacity={0.75} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
