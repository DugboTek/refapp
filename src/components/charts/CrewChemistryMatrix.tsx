import { useMemo } from "react";
import type { Play } from "../../data/types";
import { brand, ink } from "../../lib/theme";

interface Props {
  plays: Play[];
  topN?: number;
  cellSize?: number;
}

export default function CrewChemistryMatrix({
  plays,
  topN = 14,
  cellSize = 34,
}: Props) {
  const { labels, matrix, maxCount } = useMemo(() => {
    // Build game → crew set and game → {correct, incorrect}
    const gameCrews = new Map<string, Set<string>>();
    const gameStats = new Map<string, { correct: number; incorrect: number }>();
    for (const p of plays) {
      let crew = gameCrews.get(p.gameId);
      if (!crew) {
        crew = new Set();
        gameCrews.set(p.gameId, crew);
        gameStats.set(p.gameId, { correct: 0, incorrect: 0 });
      }
      for (const o of p.officials) crew.add(o);
      const st = gameStats.get(p.gameId)!;
      if (p.grade === "CC" || p.grade === "NCC") st.correct++;
      if (p.grade === "IC" || p.grade === "NCI") st.incorrect++;
    }
    // Games worked per official
    const refGames = new Map<string, number>();
    for (const crew of gameCrews.values()) {
      for (const r of crew) refGames.set(r, (refGames.get(r) || 0) + 1);
    }
    const topRefs = [...refGames.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([r]) => r);
    const topSet = new Set(topRefs);
    // Pair co-occurrence + shared accuracy
    const pairs = new Map<
      string,
      { games: number; correct: number; incorrect: number }
    >();
    for (const [gameId, crew] of gameCrews) {
      const inter = [...crew].filter((r) => topSet.has(r));
      if (inter.length < 2) continue;
      const st = gameStats.get(gameId)!;
      for (let i = 0; i < inter.length; i++) {
        for (let j = i + 1; j < inter.length; j++) {
          const a = inter[i];
          const b = inter[j];
          const key = a < b ? `${a}||${b}` : `${b}||${a}`;
          let c = pairs.get(key);
          if (!c) {
            c = { games: 0, correct: 0, incorrect: 0 };
            pairs.set(key, c);
          }
          c.games += 1;
          c.correct += st.correct;
          c.incorrect += st.incorrect;
        }
      }
    }
    let maxCount = 0;
    const matrix: ({ games: number; acc: number | null } | null)[][] = [];
    for (let i = 0; i < topRefs.length; i++) {
      matrix.push([]);
      for (let j = 0; j < topRefs.length; j++) {
        if (i === j) {
          matrix[i].push(null);
          continue;
        }
        const a = topRefs[i];
        const b = topRefs[j];
        const key = a < b ? `${a}||${b}` : `${b}||${a}`;
        const c = pairs.get(key);
        if (!c || c.games === 0) {
          matrix[i].push({ games: 0, acc: null });
          continue;
        }
        if (c.games > maxCount) maxCount = c.games;
        const denom = c.correct + c.incorrect;
        matrix[i].push({
          games: c.games,
          acc: denom === 0 ? null : c.correct / denom,
        });
      }
    }
    return { labels: topRefs, matrix, maxCount };
  }, [plays, topN]);

  const shortName = (n: string) => {
    const parts = n.trim().split(/\s+/);
    if (parts.length === 1) return n;
    return `${parts[0][0]}. ${parts.slice(1).join(" ")}`;
  };

  const labelCol = 120;
  const labelRow = 120;
  const width = labelCol + labels.length * cellSize + 8;
  const height = labelRow + labels.length * cellSize + 8;

  return (
    <div className="overflow-x-auto">
      <svg width={width} height={height}>
        {labels.map((name, i) => (
          <g
            key={`col-${i}`}
            transform={`translate(${labelCol + i * cellSize + cellSize / 2}, ${labelRow - 8}) rotate(-45)`}
          >
            <text
              textAnchor="start"
              fontSize={10}
              fill={ink[600]}
              fontWeight={500}
            >
              {shortName(name)}
            </text>
          </g>
        ))}
        {labels.map((name, i) => (
          <text
            key={`row-${i}`}
            x={labelCol - 10}
            y={labelRow + i * cellSize + cellSize / 2 + 4}
            textAnchor="end"
            fontSize={10}
            fill={ink[900]}
            fontWeight={500}
          >
            {shortName(name)}
          </text>
        ))}
        {matrix.map((row, i) =>
          row.map((cell, j) => {
            const x = labelCol + j * cellSize;
            const y = labelRow + i * cellSize;
            if (cell === null) {
              return (
                <rect
                  key={`${i}-${j}`}
                  x={x + 2}
                  y={y + 2}
                  width={cellSize - 4}
                  height={cellSize - 4}
                  rx={4}
                  fill={ink[50]}
                />
              );
            }
            const intensity = maxCount === 0 ? 0 : cell.games / maxCount;
            const fill =
              cell.games === 0
                ? ink[100]
                : `rgba(234, 88, 12, ${0.12 + intensity * 0.78})`;
            return (
              <g key={`${i}-${j}`}>
                <rect
                  x={x + 2}
                  y={y + 2}
                  width={cellSize - 4}
                  height={cellSize - 4}
                  rx={4}
                  fill={fill}
                >
                  <title>
                    {labels[i]} + {labels[j]}: {cell.games} game
                    {cell.games === 1 ? "" : "s"}
                    {cell.acc != null
                      ? `, ${(cell.acc * 100).toFixed(1)}% accuracy`
                      : ""}
                  </title>
                </rect>
                {cell.games > 0 ? (
                  <text
                    x={x + cellSize / 2}
                    y={y + cellSize / 2 + 3}
                    textAnchor="middle"
                    fontSize={10}
                    fontWeight={600}
                    fill={intensity > 0.55 ? "#fefdfb" : ink[900]}
                  >
                    {cell.games}
                  </text>
                ) : null}
              </g>
            );
          }),
        )}
      </svg>
      <div className="mt-3 text-[11px] text-zinc-500">
        Number = games the two officials crewed together this season · hover
        for joint accuracy
      </div>
    </div>
  );
}
