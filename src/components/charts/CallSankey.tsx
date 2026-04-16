import { useMemo } from "react";
import { sankey, sankeyLinkHorizontal, type SankeyGraph } from "d3-sankey";
import { GRADE_COLORS } from "../../lib/grades";
import { brand, ink } from "../../lib/theme";

interface Node {
  name: string;
  kind: "entry" | "play" | "grade";
}
interface Link {
  source: number;
  target: number;
  value: number;
}

interface Props {
  sankeyCounts: Record<string, number>;
  sankeyPlayTypes: string[];
  width?: number;
  height?: number;
}

const ENTRY_COLOR = brand[500];
const PLAY_COLOR = ink[500];

export default function CallSankey({
  sankeyCounts,
  sankeyPlayTypes,
  width = 900,
  height = 520,
}: Props) {
  const graph = useMemo(() => {
    const entrySet = new Set<string>();
    const gradeSet = new Set<string>();
    for (const k of Object.keys(sankeyCounts)) {
      const [a, b] = k.split("||");
      if (sankeyPlayTypes.includes(a)) gradeSet.add(b);
      else entrySet.add(a);
    }
    const entries = Array.from(entrySet).sort();
    const plays = sankeyPlayTypes;
    const grades = ["CC", "NCC", "INC", "NCI", "IC", "MCH", "NOTE"].filter(
      (g) => gradeSet.has(g),
    );
    const nodes: Node[] = [
      ...entries.map((e) => ({ name: e, kind: "entry" as const })),
      ...plays.map((p) => ({ name: p, kind: "play" as const })),
      ...grades.map((g) => ({ name: g, kind: "grade" as const })),
    ];
    const idx = new Map<string, number>();
    nodes.forEach((n, i) => idx.set(`${n.kind}|${n.name}`, i));
    const links: Link[] = [];
    for (const [k, v] of Object.entries(sankeyCounts)) {
      const [a, b] = k.split("||");
      if (entrySet.has(a) && plays.includes(b)) {
        links.push({
          source: idx.get(`entry|${a}`)!,
          target: idx.get(`play|${b}`)!,
          value: v,
        });
      } else if (plays.includes(a) && grades.includes(b)) {
        links.push({
          source: idx.get(`play|${a}`)!,
          target: idx.get(`grade|${b}`)!,
          value: v,
        });
      }
    }
    return { nodes, links };
  }, [sankeyCounts, sankeyPlayTypes]);

  const layout = useMemo(() => {
    const s = sankey<Node, Link>()
      .nodeWidth(14)
      .nodePadding(8)
      .extent([
        [8, 8],
        [width - 180, height - 8],
      ]);
    const cloned: SankeyGraph<Node, Link> = {
      nodes: graph.nodes.map((n) => ({ ...n })),
      links: graph.links.map((l) => ({ ...l })),
    };
    return s(cloned);
  }, [graph, width, height]);

  const nodeColor = (n: Node) => {
    if (n.kind === "entry") return ENTRY_COLOR;
    if (n.kind === "play") return PLAY_COLOR;
    return GRADE_COLORS[n.name] || ink[400];
  };

  return (
    <div className="overflow-x-auto">
      <svg
        width={width}
        height={height}
        role="img"
        aria-label="Sankey flow from entry type through play type to final grade"
      >
        <g>
          {layout.links.map((link, i) => {
            const targetNode = link.target as unknown as Node;
            const color = nodeColor(targetNode);
            return (
              <path
                key={i}
                d={sankeyLinkHorizontal()(link as any) || ""}
                fill="none"
                stroke={color}
                strokeOpacity={0.22}
                strokeWidth={Math.max(1, link.width || 1)}
              >
                <title>
                  {(link.source as unknown as Node).name} →{" "}
                  {(link.target as unknown as Node).name}:{" "}
                  {link.value.toLocaleString()}
                </title>
              </path>
            );
          })}
        </g>
        <g>
          {layout.nodes.map((n, i) => {
            const node = n as unknown as Node & {
              x0: number;
              x1: number;
              y0: number;
              y1: number;
              value: number;
            };
            const color = nodeColor(node);
            return (
              <g key={i}>
                <rect
                  x={node.x0}
                  y={node.y0}
                  width={node.x1 - node.x0}
                  height={Math.max(1, node.y1 - node.y0)}
                  fill={color}
                  rx={2}
                >
                  <title>
                    {node.name}: {node.value.toLocaleString()}
                  </title>
                </rect>
                <text
                  x={node.x0 < width / 2 ? node.x1 + 6 : node.x0 - 6}
                  y={(node.y0 + node.y1) / 2}
                  dy="0.35em"
                  textAnchor={node.x0 < width / 2 ? "start" : "end"}
                  fontSize={11}
                  fontWeight={500}
                  fill={ink[900]}
                >
                  {node.name}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
