import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  PieChart,
  Pie,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import KpiCard from "../components/kpi/KpiCard";
import { Skeleton } from "../components/ui/Skeleton";
import { fmtNum } from "../lib/format";
import { brand, ink, semantic, categorical } from "../lib/theme";
import {
  gameLogs,
  gameSummaries,
  operatorStats,
  operatorActions,
  clockBuckets,
  eventGaps,
  totalEvents,
  totalGames,
  totalOperators,
  totalWP,
  totalAP,
} from "../lib/whistlestopData";

const GAME_COLORS = [
  brand[600],
  semantic.correct,
  "#2563eb",
  "#7c3aed",
  "#d97706",
  "#0891b2",
];

export default function WhistleStop() {
  // Event type distribution for pie chart
  const eventTypePie = useMemo(
    () => [
      { name: "Whistle Press (WP)", value: totalWP, fill: brand[600] },
      { name: "Admin Press (AP)", value: totalAP, fill: "#2563eb" },
    ],
    [],
  );

  // Action distribution for pie chart
  const actionPie = useMemo(() => {
    let starts = 0;
    let stops = 0;
    for (const g of gameLogs) {
      for (const e of g.events) {
        if (e.action === "Start") starts++;
        else stops++;
      }
    }
    return [
      { name: "Start", value: starts, fill: semantic.correct },
      { name: "Stop", value: stops, fill: semantic.wrong },
    ];
  }, []);

  // Top operators bar data
  const topOperators = useMemo(
    () =>
      operatorStats.slice(0, 12).map((o) => ({
        name:
          o.name.length > 16
            ? o.name.slice(0, 15) + "…"
            : o.name,
        events: o.totalEvents,
        games: o.gamesWorked,
      })),
    [],
  );

  // Game comparison data
  const gameComparison = useMemo(
    () =>
      gameSummaries.map((g, i) => ({
        name: g.event.length > 20 ? g.event.slice(0, 19) + "…" : g.event,
        fullName: g.event,
        wp: g.wpEvents,
        ap: g.apEvents,
        total: g.totalEvents,
        color: GAME_COLORS[i % GAME_COLORS.length],
      })),
    [],
  );

  // Gap distribution histogram (buckets of 5 seconds)
  const gapHistogram = useMemo(() => {
    const buckets: Record<string, number> = {};
    for (let s = 0; s < 120; s += 5) {
      buckets[`${s}-${s + 5}s`] = 0;
    }
    for (const { gap } of eventGaps) {
      const b = Math.min(Math.floor(gap / 5) * 5, 115);
      const key = `${b}-${b + 5}s`;
      buckets[key] = (buckets[key] || 0) + 1;
    }
    return Object.entries(buckets)
      .filter(([, v]) => v > 0)
      .slice(0, 15)
      .map(([bucket, count]) => ({
        bucket,
        count,
      }));
  }, []);

  // Event scatter — each event as a dot, x=game clock seconds, y=game index
  const eventScatter = useMemo(() => {
    const points: {
      x: number;
      y: number;
      game: string;
      operator: string;
      type: string;
      action: string;
    }[] = [];
    gameLogs.forEach((g, gi) => {
      for (const ev of g.events) {
        points.push({
          x: ev.timeSeconds,
          y: gi,
          game: g.event,
          operator: ev.operator,
          type: ev.type,
          action: ev.action,
        });
      }
    });
    return points;
  }, []);

  const wpScatter = eventScatter.filter((p) => p.type === "WP");
  const apScatter = eventScatter.filter((p) => p.type === "AP");

  // Operator radar — per-game event counts for top 6 operators across games
  const operatorRadar = useMemo(() => {
    const top = operatorStats.filter((o) => o.gamesWorked >= 1).slice(0, 6);
    return gameLogs.map((g) => {
      const row: Record<string, string | number> = { game: g.event.slice(0, 16) };
      for (const op of top) {
        row[op.name] = g.events.filter((e) => e.operator === op.name).length;
      }
      return row;
    });
  }, []);

  const radarOperators = operatorStats
    .filter((o) => o.gamesWorked >= 1)
    .slice(0, 6)
    .map((o) => o.name);

  // Per-game timeline strips
  const gameTimelines = useMemo(
    () =>
      gameLogs.map((g) => {
        // Group events by operator
        const byOp: Record<string, { time: number; action: string; type: string }[]> = {};
        for (const ev of g.events) {
          if (!byOp[ev.operator]) byOp[ev.operator] = [];
          byOp[ev.operator].push({
            time: ev.timeSeconds,
            action: ev.action,
            type: ev.type,
          });
        }
        return { game: g, byOp };
      }),
    [],
  );

  // Events per minute across all games
  const eventsPerMinute = useMemo(() => {
    const minutes: Record<number, number> = {};
    for (let m = 0; m <= 20; m++) minutes[m] = 0;
    for (const g of gameLogs) {
      for (const ev of g.events) {
        const m = Math.min(Math.floor(ev.timeSeconds / 60), 20);
        minutes[m] = (minutes[m] || 0) + 1;
      }
    }
    return Object.entries(minutes)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([min, count]) => ({
        minute: `${min}:00`,
        events: count,
      }));
  }, []);

  return (
    <div className="flex flex-col gap-fluid-xl">
      {/* Header */}
      <header className="max-w-4xl">
        <div className="page-kicker">Whistle Stop Integration</div>
        <h2 className="page-title mt-4">
          Every whistle, tracked.{" "}
          <span className="text-ink-400">
            Real-time officiating data.
          </span>
        </h2>
        <p className="page-lede mt-5">
          Whistle Stop captures every button press from on-court officials and
          timekeepers — start events, stop events, and the exact game-clock
          moment they happen. {fmtNum(totalEvents)} events across{" "}
          {totalGames} games.
        </p>
      </header>

      {/* KPI Row */}
      <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-6 gap-y-6 ruled">
        <KpiCard label="Total Events" value={fmtNum(totalEvents)} />
        <KpiCard label="Games Tracked" value={fmtNum(totalGames)} />
        <KpiCard label="Operators" value={fmtNum(totalOperators)} />
        <KpiCard
          label="Avg Events / Game"
          value={fmtNum(Math.round(totalEvents / totalGames))}
        />
        <KpiCard
          label="Whistle Presses"
          value={fmtNum(totalWP)}
          sub={`${((totalWP / totalEvents) * 100).toFixed(1)}% of total`}
        />
        <KpiCard
          label="Admin Presses"
          value={fmtNum(totalAP)}
          sub={`${((totalAP / totalEvents) * 100).toFixed(1)}% of total`}
        />
      </section>

      {/* Event Type & Action Distribution — side by side */}
      <section className="ruled grid grid-cols-12 gap-x-8 gap-y-10">
        <div className="col-span-12 lg:col-span-6">
          <div className="eyebrow mb-3">Distribution · 01</div>
          <h3 className="section-title mb-2">Event type breakdown</h3>
          <p className="section-sub mb-6">
            Whistle presses (WP) by officials vs. administrative presses (AP)
            by the timekeeper.
          </p>
          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={eventTypePie}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {eventTypePie.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) => fmtNum(v)}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-6">
          <div className="eyebrow mb-3">Distribution · 02</div>
          <h3 className="section-title mb-2">Start vs. Stop actions</h3>
          <p className="section-sub mb-6">
            Balance between clock-start and clock-stop events across all games.
          </p>
          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={actionPie}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {actionPie.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) => fmtNum(v)}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Operator Workload */}
      <section className="ruled">
        <div className="eyebrow mb-3">Operators · 03</div>
        <h3 className="section-title mb-2">Operator workload</h3>
        <p className="section-sub mb-6">
          Total events triggered by each operator across all tracked games.
          Includes both officials and timekeepers.
        </p>
        <div
          role="img"
          aria-label="Horizontal bar chart of operator event counts"
          style={{ width: "100%", height: Math.max(300, topOperators.length * 36) }}
        >
          <ResponsiveContainer>
            <BarChart
              data={topOperators}
              layout="vertical"
              margin={{ top: 4, right: 20, bottom: 8, left: 12 }}
            >
              <CartesianGrid horizontal={false} strokeDasharray="3 3" />
              <XAxis type="number" tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={150}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                formatter={(v: number, name: string) => [
                  fmtNum(v),
                  name === "events" ? "Total events" : name,
                ]}
              />
              <Bar
                dataKey="events"
                fill={brand[600]}
                radius={[0, 4, 4, 0]}
                maxBarSize={22}
              >
                {topOperators.map((_, i) => (
                  <Cell
                    key={i}
                    fill={
                      GAME_COLORS[i % GAME_COLORS.length]
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Operator Start vs Stop stacked bar */}
      <section className="ruled">
        <div className="eyebrow mb-3">Operators · 04</div>
        <h3 className="section-title mb-2">Start vs. Stop per operator</h3>
        <p className="section-sub mb-6">
          How each operator splits between starting and stopping the clock.
        </p>
        <div
          role="img"
          aria-label="Stacked bar chart of start vs stop per operator"
          style={{
            width: "100%",
            height: Math.max(300, operatorActions.length * 36),
          }}
        >
          <ResponsiveContainer>
            <BarChart
              data={operatorActions}
              layout="vertical"
              margin={{ top: 4, right: 20, bottom: 8, left: 12 }}
            >
              <CartesianGrid horizontal={false} strokeDasharray="3 3" />
              <XAxis type="number" tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={150}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
              />
              <Tooltip />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 12 }}
              />
              <Bar
                dataKey="starts"
                stackId="a"
                fill={semantic.correct}
                name="Starts"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="stops"
                stackId="a"
                fill={semantic.wrong}
                name="Stops"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Game Comparison */}
      <section className="ruled">
        <div className="eyebrow mb-3">Games · 05</div>
        <h3 className="section-title mb-2">
          Event volume by game
        </h3>
        <p className="section-sub mb-6">
          WP (official whistles) and AP (timekeeper) events stacked per game.
          More events suggest a more whistle-heavy contest.
        </p>
        <div
          role="img"
          aria-label="Stacked bar chart comparing games by event volume"
          style={{ width: "100%", height: 340 }}
        >
          <ResponsiveContainer>
            <BarChart
              data={gameComparison}
              margin={{ top: 8, right: 12, bottom: 60, left: 0 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                angle={-35}
                textAnchor="end"
                interval={0}
                height={80}
                tick={{ fontSize: 10 }}
              />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip
                labelFormatter={(label: string, payload: any[]) =>
                  payload?.[0]?.payload?.fullName || label
                }
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 12 }}
              />
              <Bar
                dataKey="wp"
                stackId="a"
                fill={brand[600]}
                name="Whistle Press"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="ap"
                stackId="a"
                fill="#2563eb"
                name="Admin Press"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Clock position heatmap */}
      <section className="ruled">
        <div className="eyebrow mb-3">Timing · 06</div>
        <h3 className="section-title mb-2">
          Events by game clock position
        </h3>
        <p className="section-sub mb-6">
          When in the period do events cluster? Buckets are 2-minute windows
          of the game clock (counting down from 20:00).
        </p>
        <div
          role="img"
          aria-label="Bar chart of events by 2-minute clock bucket"
          style={{ width: "100%", height: 300 }}
        >
          <ResponsiveContainer>
            <BarChart
              data={clockBuckets}
              margin={{ top: 8, right: 12, bottom: 0, left: 0 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="bucket" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 12 }}
              />
              <Bar
                dataKey="wp"
                fill={brand[600]}
                name="Whistle Press"
                radius={[3, 3, 0, 0]}
              />
              <Bar
                dataKey="ap"
                fill="#2563eb"
                name="Admin Press"
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Events per minute */}
      <section className="ruled">
        <div className="eyebrow mb-3">Timing · 07</div>
        <h3 className="section-title mb-2">
          Events per minute on the clock
        </h3>
        <p className="section-sub mb-6">
          Minute-by-minute event density. Higher values at certain clock
          positions reveal natural stoppages in play.
        </p>
        <div
          role="img"
          aria-label="Line chart of event density per minute"
          style={{ width: "100%", height: 280 }}
        >
          <ResponsiveContainer>
            <LineChart data={eventsPerMinute}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="minute"
                tickLine={false}
                axisLine={false}
                fontSize={11}
              />
              <YAxis tickLine={false} axisLine={false} fontSize={11} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="events"
                stroke={brand[600]}
                strokeWidth={2.5}
                dot={{ r: 3.5, fill: brand[600] }}
                activeDot={{ r: 5 }}
                name="Events"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Event scatter timeline */}
      <section className="ruled">
        <div className="eyebrow mb-3">Timeline · 08</div>
        <h3 className="section-title mb-2">Event timeline across games</h3>
        <p className="section-sub mb-6">
          Every event plotted against the game clock. Orange dots are official
          whistles (WP), blue dots are timekeeper presses (AP). Each row is a
          different game.
        </p>
        <div
          role="img"
          aria-label="Scatter plot of all events by game clock and game"
          style={{ width: "100%", height: 320 }}
        >
          <ResponsiveContainer>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="x"
                name="Clock (sec)"
                domain={[0, 1200]}
                tickFormatter={(v) => `${Math.floor(v / 60)}:00`}
                tickLine={false}
                axisLine={false}
                fontSize={11}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="Game"
                domain={[-0.5, gameLogs.length - 0.5]}
                tickCount={gameLogs.length}
                tickFormatter={(v) =>
                  gameLogs[v]?.event.slice(0, 14) || ""
                }
                tickLine={false}
                axisLine={false}
                fontSize={10}
                width={120}
              />
              <ZAxis range={[20, 20]} />
              <Tooltip
                content={({ payload }) => {
                  if (!payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-white border border-ink-200 rounded-md px-3 py-2 text-xs">
                      <div className="font-semibold text-ink-900">
                        {d.game}
                      </div>
                      <div className="text-ink-600">
                        {d.type} · {d.operator} · {d.action}
                      </div>
                      <div className="text-ink-500">
                        Clock: {Math.floor(d.x / 60)}:
                        {String(Math.floor(d.x % 60)).padStart(2, "0")}
                      </div>
                    </div>
                  );
                }}
              />
              <Scatter
                name="WP"
                data={wpScatter}
                fill={brand[600]}
                opacity={0.7}
              />
              <Scatter
                name="AP"
                data={apScatter}
                fill="#2563eb"
                opacity={0.7}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 12 }}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Event gap distribution */}
      <section className="ruled">
        <div className="eyebrow mb-3">Cadence · 09</div>
        <h3 className="section-title mb-2">Time between consecutive events</h3>
        <p className="section-sub mb-6">
          How quickly do events follow one another? Shorter gaps mean
          rapid-fire stoppages and restarts.
        </p>
        <div
          role="img"
          aria-label="Histogram of time gaps between events"
          style={{ width: "100%", height: 280 }}
        >
          <ResponsiveContainer>
            <BarChart
              data={gapHistogram}
              margin={{ top: 8, right: 12, bottom: 0, left: 0 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="bucket"
                tickLine={false}
                axisLine={false}
                fontSize={10}
              />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar
                dataKey="count"
                fill={brand[300]}
                radius={[3, 3, 0, 0]}
                name="Event pairs"
              >
                {gapHistogram.map((_, i) => (
                  <Cell
                    key={i}
                    fill={
                      i < 3 ? semantic.wrong : i < 6 ? brand[500] : brand[200]
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-3 text-[11px] text-ink-500 mt-3 flex-wrap">
          <span className="chip-quiet">
            <span
              aria-hidden="true"
              className="w-2 h-2 rounded-full"
              style={{ background: semantic.wrong }}
            />
            Rapid (&lt;15s)
          </span>
          <span className="chip-quiet">
            <span
              aria-hidden="true"
              className="w-2 h-2 rounded-full"
              style={{ background: brand[500] }}
            />
            Moderate (15–30s)
          </span>
          <span className="chip-quiet">
            <span
              aria-hidden="true"
              className="w-2 h-2 rounded-full"
              style={{ background: brand[200] }}
            />
            Spaced (&gt;30s)
          </span>
        </div>
      </section>

      {/* Per-game detail cards */}
      <section className="ruled">
        <div className="eyebrow mb-3">Game logs · 10</div>
        <h3 className="section-title mb-2">Individual game breakdowns</h3>
        <p className="section-sub mb-6">
          Detailed event data for each tracked game.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {gameSummaries.map((g, gi) => (
            <div
              key={g.id}
              className="card card-pad flex flex-col gap-4"
            >
              <div>
                <div
                  className="font-display text-lg text-ink-900 leading-tight"
                  style={{ fontVariationSettings: '"opsz" 72' }}
                >
                  {g.event}
                </div>
                <div className="text-xs text-ink-500 mt-1">
                  {g.date} · {g.location}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="border-t border-ink-200 pt-2">
                  <div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-ink-500">
                    Events
                  </div>
                  <div className="font-display text-2xl text-ink-900 mt-1">
                    {g.totalEvents}
                  </div>
                </div>
                <div className="border-t border-ink-200 pt-2">
                  <div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-ink-500">
                    WP
                  </div>
                  <div
                    className="font-display text-2xl mt-1"
                    style={{ color: brand[600] }}
                  >
                    {g.wpEvents}
                  </div>
                </div>
                <div className="border-t border-ink-200 pt-2">
                  <div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-ink-500">
                    AP
                  </div>
                  <div
                    className="font-display text-2xl mt-1"
                    style={{ color: "#2563eb" }}
                  >
                    {g.apEvents}
                  </div>
                </div>
              </div>
              <div className="text-xs text-ink-600">
                <span className="font-medium">Crew:</span>{" "}
                {g.operators.join(", ")}
              </div>
              {/* Mini bar showing WP vs AP ratio */}
              <div className="relative h-2 bg-ink-100 rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    width: `${(g.wpEvents / g.totalEvents) * 100}%`,
                    background: brand[600],
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-ink-500">
                <span>
                  WP {((g.wpEvents / g.totalEvents) * 100).toFixed(0)}%
                </span>
                <span>
                  AP {((g.apEvents / g.totalEvents) * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Raw event log table for latest game */}
      <section className="ruled">
        <div className="eyebrow mb-3">Raw data · 11</div>
        <h3 className="section-title mb-2">
          Sample event log — {gameLogs[gameLogs.length - 1]?.event}
        </h3>
        <p className="section-sub mb-6">
          The raw sequence of whistle events from the most recent game in the
          dataset.
        </p>
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>#</th>
                <th>Type</th>
                <th>Clock</th>
                <th>Operator</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {gameLogs[gameLogs.length - 1]?.events
                .slice(0, 40)
                .map((ev, i) => (
                  <tr key={i}>
                    <td className="tabular-nums text-ink-500">{i + 1}</td>
                    <td>
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                        style={{
                          background:
                            ev.type === "WP" ? brand[600] : "#2563eb",
                        }}
                      >
                        {ev.type}
                      </span>
                    </td>
                    <td className="tabular-nums font-medium">
                      {ev.timeRaw}
                    </td>
                    <td>{ev.operator}</td>
                    <td>
                      <span
                        style={{
                          color:
                            ev.action === "Start"
                              ? semantic.correct
                              : semantic.wrong,
                        }}
                        className="font-medium"
                      >
                        {ev.action}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {(gameLogs[gameLogs.length - 1]?.events.length ?? 0) > 40 && (
            <div className="text-xs text-ink-500 mt-3 px-3">
              Showing first 40 of{" "}
              {gameLogs[gameLogs.length - 1]?.events.length} events.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
