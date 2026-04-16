import { useMemo } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { usePlays } from "../lib/usePlays";
import { emptyBucket, bump } from "../lib/aggregate";
import { accuracy, fmtPct, GRADE_COLORS } from "../lib/grades";
import { fmtDate, fmtNum, unslug } from "../lib/format";
import { Skeleton } from "../components/ui/Skeleton";
import KpiCard from "../components/kpi/KpiCard";
import GradeDonut from "../components/charts/GradeDonut";
import PlayTypeBar from "../components/charts/PlayTypeBar";
import { withFilters } from "../lib/filters";
import type { Bucket, Play } from "../data/types";

export default function OfficialDetail() {
  const { name: rawName } = useParams();
  const [params] = useSearchParams();
  const name = unslug(rawName || "");
  const allPlays = usePlays();

  const data = useMemo(() => {
    if (!allPlays) return null;
    const bucket = emptyBucket();
    const byPlayType: Record<string, Bucket> = {};
    const byPosition: Record<string, Bucket> = {};
    const games = new Map<
      string,
      { date: string; home: string; visitor: string; n: number }
    >();
    const playsForOfficial: Play[] = [];
    for (const p of allPlays) {
      if (!p.officials.includes(name)) continue;
      playsForOfficial.push(p);
      bump(bucket, p.grade);
      if (!byPlayType[p.playType]) byPlayType[p.playType] = emptyBucket();
      bump(byPlayType[p.playType], p.grade);
      for (const pos of p.positions) {
        if (!byPosition[pos]) byPosition[pos] = emptyBucket();
        bump(byPosition[pos], p.grade);
      }
      const g = games.get(p.gameId) || {
        date: p.date,
        home: p.home,
        visitor: p.visitor,
        n: 0,
      };
      g.n += 1;
      games.set(p.gameId, g);
    }
    const gamesWorked = Array.from(games.entries()).sort((a, b) =>
      a[1].date > b[1].date ? -1 : 1,
    );
    return { bucket, playsForOfficial, byPlayType, byPosition, gamesWorked };
  }, [allPlays, name]);

  if (!data) {
    return (
      <div className="flex flex-col gap-6" aria-busy="true">
        <Skeleton className="h-10 w-72" />
        <div className="grid grid-cols-4 gap-6">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const { bucket, playsForOfficial, byPlayType, byPosition, gamesWorked } = data;
  const acc = accuracy(bucket);

  const hardestCalls = [...playsForOfficial]
    .filter((p) => p.grade === "IC" || p.grade === "NCI")
    .sort(
      (a, b) =>
        (b.graderComments[0]?.text.length || 0) -
        (a.graderComments[0]?.text.length || 0),
    )
    .slice(0, 6);

  return (
    <div className="flex flex-col gap-fluid-lg">
      <header>
        <Link
          to={`/officials${withFilters(params)}`}
          className="inline-flex items-center gap-1.5 text-xs text-ink-500 hover:text-ink-800"
        >
          <ArrowLeft size={13} aria-hidden="true" />
          Back to officials
        </Link>
        <div className="page-kicker mt-5">Official profile</div>
        <h2 className="page-title mt-3">{name}</h2>
        <p className="page-lede mt-3">
          {fmtNum(bucket.total)} evaluated plays across {gamesWorked.length}{" "}
          games this season.
        </p>
      </header>

      <section className="ruled grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-6">
        <KpiCard label="Plays" value={fmtNum(bucket.total)} />
        <KpiCard label="Accuracy" value={fmtPct(acc, 1)} />
        <KpiCard
          label="Incorrect"
          value={fmtNum(bucket.incorrect)}
          sub={`${bucket.grades.IC || 0} IC · ${bucket.grades.NCI || 0} NCI`}
        />
        <KpiCard label="Games" value={fmtNum(gamesWorked.length)} />
      </section>

      <section className="ruled grid grid-cols-12 gap-x-8 gap-y-10">
        <div className="col-span-12 lg:col-span-5">
          <div className="eyebrow mb-3">Grade distribution</div>
          <h3 className="section-title mb-5">How their calls break down</h3>
          <GradeDonut bucket={bucket} />
        </div>
        <div className="col-span-12 lg:col-span-7">
          <div className="eyebrow mb-3">Top play types</div>
          <h3 className="section-title mb-5">
            What they see most, and how they grade
          </h3>
          <PlayTypeBar byPlayType={byPlayType} topN={10} height={320} />
        </div>
      </section>

      <section className="ruled grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-10">
        <div>
          <div className="eyebrow mb-3">By position</div>
          <h3 className="section-title mb-5">
            Lead, Center, Trail — where does the whistle live?
          </h3>
          <div className="flex flex-col gap-3">
            {Object.entries(byPosition)
              .sort((a, b) => b[1].total - a[1].total)
              .map(([pos, b]) => {
                const pct = accuracy(b);
                return (
                  <div
                    key={pos}
                    className="grid grid-cols-[90px_1fr_88px] items-center gap-3 text-sm"
                  >
                    <span className="text-ink-800 font-medium">{pos}</span>
                    <div className="relative h-2 bg-ink-100 rounded-full overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-correct"
                        style={{ width: `${((pct || 0) * 100).toFixed(1)}%` }}
                      />
                    </div>
                    <span className="text-right tabular-nums text-ink-800">
                      {fmtPct(pct, 1)}{" "}
                      <span className="text-ink-500 text-xs">
                        ({b.total})
                      </span>
                    </span>
                  </div>
                );
              })}
          </div>
        </div>

        <div>
          <div className="eyebrow mb-3">Flagged calls</div>
          <h3 className="section-title mb-5">
            The plays the graders dwelled on
          </h3>
          <div className="flex flex-col gap-4">
            {hardestCalls.length === 0 ? (
              <div className="text-sm text-ink-500">
                No incorrect calls in this dataset.
              </div>
            ) : (
              hardestCalls.map((p) => (
                <div
                  key={p.id}
                  className="border-l-2 border-wrong pl-4 py-1 flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-ink-500">
                      {fmtDate(p.date)} · {p.home} vs {p.visitor} · Q
                      {p.period} {p.time}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
                      style={{ background: GRADE_COLORS[p.grade] }}
                    >
                      {p.grade}
                    </span>
                  </div>
                  <div className="text-sm text-ink-800">{p.playType}</div>
                  {p.graderComments[0]?.text ? (
                    <div className="text-xs text-ink-600 italic">
                      "{p.graderComments[0].text}"
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="ruled">
        <div className="eyebrow mb-3">Workload</div>
        <h3 className="section-title mb-5">
          Games worked ({gamesWorked.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1.5">
          {gamesWorked.map(([gameId, g]) => (
            <Link
              key={gameId}
              to={`/games/${encodeURIComponent(gameId)}${withFilters(params)}`}
              className="flex items-center justify-between py-2 border-b border-ink-100 hover:text-brand-600 transition-colors text-sm"
            >
              <span className="text-ink-800 truncate">
                {g.home} vs {g.visitor}
              </span>
              <span className="text-xs text-ink-500 shrink-0 ml-2">
                {fmtDate(g.date)} · {g.n}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
