import { useMemo } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { usePlays } from "../lib/usePlays";
import { emptyBucket, bump } from "../lib/aggregate";
import { accuracy, fmtPct, GRADE_COLORS, GRADE_LABELS } from "../lib/grades";
import { fmtDate, fmtNum } from "../lib/format";
import { Skeleton } from "../components/ui/Skeleton";
import KpiCard from "../components/kpi/KpiCard";
import GradeDonut from "../components/charts/GradeDonut";
import GameTimelineStrip from "../components/charts/GameTimelineStrip";
import { withFilters } from "../lib/filters";
import type { Bucket, Play } from "../data/types";

export default function GameDetail() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const gameId = decodeURIComponent(id || "");
  const allPlays = usePlays();

  const data = useMemo(() => {
    if (!allPlays) return null;
    const plays = allPlays.filter((p) => p.gameId === gameId);
    const bucket = emptyBucket();
    const byPeriod: Record<string, Bucket> = {};
    const crewMap = new Map<string, Bucket>();
    for (const p of plays) {
      bump(bucket, p.grade);
      const pk = String(p.period ?? "?");
      if (!byPeriod[pk]) byPeriod[pk] = emptyBucket();
      bump(byPeriod[pk], p.grade);
      for (const o of p.officials) {
        let b = crewMap.get(o);
        if (!b) {
          b = emptyBucket();
          crewMap.set(o, b);
        }
        bump(b, p.grade);
      }
    }
    const header = plays[0];
    const crewStats = Array.from(crewMap.entries()).sort(
      (a, b) => b[1].total - a[1].total,
    );
    return { plays, bucket, byPeriod, crewStats, header };
  }, [allPlays, gameId]);

  if (!data) {
    return (
      <div className="flex flex-col gap-6" aria-busy="true">
        <Skeleton className="h-10 w-96" />
        <Skeleton className="h-56" />
        <Skeleton className="h-72" />
      </div>
    );
  }

  const { plays, bucket, crewStats, header } = data;

  if (!header) {
    return (
      <div className="text-sm text-ink-500">
        Game not found.{" "}
        <Link to="/games" className="text-brand-600">
          Back to games
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-fluid-lg">
      <header>
        <Link
          to={`/games${withFilters(params)}`}
          className="inline-flex items-center gap-1.5 text-xs text-ink-500 hover:text-ink-800"
        >
          <ArrowLeft size={13} aria-hidden="true" />
          Back to games
        </Link>
        <div className="page-kicker mt-5">Game report</div>
        <h2 className="page-title mt-3">
          {header.home}{" "}
          <span className="text-ink-400 font-normal">vs</span>{" "}
          {header.visitor}
        </h2>
        <p className="page-lede mt-3">
          {fmtDate(header.date)} ·{" "}
          {header.conference.replace("Men's Basketball", "MBB")} · {plays.length}{" "}
          evaluated plays
        </p>
      </header>

      <section className="ruled grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-6">
        <KpiCard label="Plays" value={fmtNum(bucket.total)} />
        <KpiCard label="Accuracy" value={fmtPct(accuracy(bucket), 1)} />
        <KpiCard
          label="Incorrect"
          value={fmtNum(bucket.incorrect)}
          sub={`${bucket.grades.IC || 0} IC · ${bucket.grades.NCI || 0} NCI`}
        />
        <KpiCard label="Crew size" value={fmtNum(crewStats.length)} />
      </section>

      <section className="ruled">
        <div className="eyebrow mb-3">Play timeline</div>
        <h3 className="section-title mb-5">
          Every whistle, plotted on the clock
        </h3>
        <GameTimelineStrip plays={plays} />
      </section>

      <section className="ruled grid grid-cols-12 gap-x-8 gap-y-10">
        <div className="col-span-12 lg:col-span-4">
          <div className="eyebrow mb-3">Grade distribution</div>
          <GradeDonut bucket={bucket} />
        </div>
        <div className="col-span-12 lg:col-span-8">
          <div className="eyebrow mb-3">Crew</div>
          <h3 className="section-title mb-5">Who worked it</h3>
          <div className="flex flex-col gap-3">
            {crewStats.map(([name, b]) => {
              const acc = accuracy(b);
              return (
                <div
                  key={name}
                  className="grid grid-cols-[1fr_60px_80px_1fr] items-center gap-3 text-sm"
                >
                  <Link
                    to={`/officials/${encodeURIComponent(name)}${withFilters(params)}`}
                    className="text-ink-900 font-medium hover:text-brand-600 truncate"
                  >
                    {name}
                  </Link>
                  <span className="text-right tabular-nums text-ink-600">
                    {b.total}
                  </span>
                  <span className="text-right tabular-nums text-ink-900">
                    {fmtPct(acc, 1)}
                  </span>
                  <div className="relative h-1.5 bg-ink-100 rounded-full overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-correct"
                      style={{ width: `${((acc || 0) * 100).toFixed(1)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="ruled">
        <div className="eyebrow mb-3">Play-by-play</div>
        <div className="overflow-x-auto border border-ink-200">
          <table className="table-base">
            <thead>
              <tr>
                <th>Q</th>
                <th>Clock</th>
                <th>Entry</th>
                <th>Play type</th>
                <th>Position</th>
                <th>Official(s)</th>
                <th>Grade</th>
              </tr>
            </thead>
            <tbody>
              {plays
                .slice()
                .sort((a, b) => {
                  if (a.period !== b.period) {
                    return (a.period || 0) - (b.period || 0);
                  }
                  const pa = parseInt(a.time.replace(":", "")) || 0;
                  const pb = parseInt(b.time.replace(":", "")) || 0;
                  return pb - pa;
                })
                .map((p: Play) => (
                  <tr key={p.id}>
                    <td className="tabular-nums text-ink-500">
                      {p.period ?? "—"}
                    </td>
                    <td className="tabular-nums text-ink-500">{p.time}</td>
                    <td>
                      <span className="chip text-[11px]">{p.entryType}</span>
                    </td>
                    <td className="text-ink-800">{p.playType}</td>
                    <td className="text-xs text-ink-600">
                      {p.positions.join(", ")}
                    </td>
                    <td className="text-xs text-ink-700">
                      {p.officials.join(", ")}
                    </td>
                    <td>
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold text-white"
                        style={{
                          background: GRADE_COLORS[p.grade] || "#a1a1aa",
                        }}
                      >
                        {GRADE_LABELS[p.grade] || p.grade}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
