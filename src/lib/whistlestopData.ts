import { parseLog } from "./whistlestopParser";
import type {
  GameLog,
  OperatorStats,
  GameSummary,
} from "../data/whistlestopTypes";

// Eagerly import all .log files as raw text at build time
const logModules = import.meta.glob("../whistlestop/*.log", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

// Parse every log file
export const gameLogs: GameLog[] = Object.entries(logModules)
  .map(([path, raw]) => {
    const filename = path.split("/").pop() || path;
    return parseLog(raw, filename);
  })
  .sort((a, b) => a.date.localeCompare(b.date));

// Aggregate operator stats across all games
export const operatorStats: OperatorStats[] = (() => {
  const map = new Map<string, OperatorStats>();

  for (const game of gameLogs) {
    const seen = new Set<string>();
    for (const ev of game.events) {
      if (!map.has(ev.operator)) {
        map.set(ev.operator, {
          name: ev.operator,
          totalEvents: 0,
          starts: 0,
          stops: 0,
          wpEvents: 0,
          apEvents: 0,
          gamesWorked: 0,
          gameIds: [],
        });
      }
      const s = map.get(ev.operator)!;
      s.totalEvents++;
      if (ev.action === "Start") s.starts++;
      else s.stops++;
      if (ev.type === "WP") s.wpEvents++;
      else s.apEvents++;
      seen.add(ev.operator);
    }
    for (const name of seen) {
      const s = map.get(name)!;
      s.gamesWorked++;
      s.gameIds.push(game.id);
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => b.totalEvents - a.totalEvents,
  );
})();

// Game summaries
export const gameSummaries: GameSummary[] = gameLogs.map((g) => {
  const wpEvents = g.events.filter((e) => e.type === "WP").length;
  const apEvents = g.events.filter((e) => e.type === "AP").length;
  const starts = g.events.filter((e) => e.action === "Start").length;
  const stops = g.events.filter((e) => e.action === "Stop").length;

  // Bucket events by 2-minute intervals (0-2, 2-4, ... 18-20)
  const durationBuckets: Record<string, number> = {};
  for (const ev of g.events) {
    // Game clock counts down from 20:00, so remaining minutes = timeSeconds / 60
    const minutesRemaining = ev.timeSeconds / 60;
    const bucket = Math.min(Math.floor(minutesRemaining / 2) * 2, 18);
    const key = `${bucket}-${bucket + 2}`;
    durationBuckets[key] = (durationBuckets[key] || 0) + 1;
  }

  // Get unique operators (excluding timekeeper-like names)
  const operators = [
    ...new Set(
      g.events
        .filter((e) => e.type === "WP")
        .map((e) => e.operator),
    ),
  ];

  return {
    id: g.id,
    event: g.event,
    date: g.date,
    location: g.location,
    totalEvents: g.events.length,
    wpEvents,
    apEvents,
    starts,
    stops,
    operators,
    durationBuckets,
  };
});

// Global aggregates
export const totalEvents = gameLogs.reduce(
  (sum, g) => sum + g.events.length,
  0,
);
export const totalGames = gameLogs.length;
export const totalOperators = new Set(
  gameLogs.flatMap((g) => g.operators),
).size;
export const totalWP = gameLogs.reduce(
  (sum, g) => sum + g.events.filter((e) => e.type === "WP").length,
  0,
);
export const totalAP = gameLogs.reduce(
  (sum, g) => sum + g.events.filter((e) => e.type === "AP").length,
  0,
);

// Consecutive event gaps (time between sequential events in each game)
export const eventGaps: { gap: number; game: string }[] = (() => {
  const gaps: { gap: number; game: string }[] = [];
  for (const game of gameLogs) {
    const sorted = [...game.events].sort(
      (a, b) => a.lineIndex - b.lineIndex,
    );
    for (let i = 1; i < sorted.length; i++) {
      const diff = Math.abs(sorted[i - 1].timeSeconds - sorted[i].timeSeconds);
      if (diff > 0 && diff < 600) {
        gaps.push({ gap: diff, game: game.event });
      }
    }
  }
  return gaps;
})();

// Clock bucket aggregation across all games
export const clockBuckets: { bucket: string; wp: number; ap: number }[] =
  (() => {
    const buckets: Record<string, { wp: number; ap: number }> = {};
    for (let m = 0; m <= 18; m += 2) {
      buckets[`${m}-${m + 2}`] = { wp: 0, ap: 0 };
    }
    for (const game of gameLogs) {
      for (const ev of game.events) {
        const minutesRemaining = ev.timeSeconds / 60;
        const b = Math.min(Math.floor(minutesRemaining / 2) * 2, 18);
        const key = `${b}-${b + 2}`;
        if (!buckets[key]) buckets[key] = { wp: 0, ap: 0 };
        if (ev.type === "WP") buckets[key].wp++;
        else buckets[key].ap++;
      }
    }
    return Object.entries(buckets)
      .sort(
        (a, b) => parseInt(a[0].split("-")[0]) - parseInt(b[0].split("-")[0]),
      )
      .map(([bucket, counts]) => ({
        bucket: `${bucket}'`,
        ...counts,
      }));
  })();

// Action breakdown per operator (for stacked bar)
export const operatorActions: {
  name: string;
  starts: number;
  stops: number;
}[] = operatorStats
  .filter((o) => o.totalEvents >= 3)
  .map((o) => ({
    name: o.name.length > 12 ? o.name.slice(0, 11) + "…" : o.name,
    starts: o.starts,
    stops: o.stops,
  }));
