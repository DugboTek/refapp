import { useMemo } from "react";
import KpiCard from "../components/kpi/KpiCard";
import GradeDonut from "../components/charts/GradeDonut";
import ConferenceStackedBar from "../components/charts/ConferenceStackedBar";
import DailyCallsLine from "../components/charts/DailyCallsLine";
import PlayTypeBar from "../components/charts/PlayTypeBar";
import { Skeleton } from "../components/ui/Skeleton";
import { useGlobalFilters } from "../lib/filters";
import { emptyBucket, bump } from "../lib/aggregate";
import { accuracy, fmtPct } from "../lib/grades";
import { fmtNum } from "../lib/format";
import type { Bucket } from "../data/types";

export default function Overview() {
  const { filtered, loading } = useGlobalFilters();

  const agg = useMemo(() => {
    if (!filtered) return null;
    const overall = emptyBucket();
    const byConference: Record<string, Bucket> = {};
    const byPlayType: Record<string, Bucket> = {};
    const byDate: Record<string, Bucket> = {};
    const officials = new Set<string>();
    const games = new Set<string>();
    for (const p of filtered) {
      bump(overall, p.grade);
      if (!byConference[p.conference]) byConference[p.conference] = emptyBucket();
      bump(byConference[p.conference], p.grade);
      if (!byPlayType[p.playType]) byPlayType[p.playType] = emptyBucket();
      bump(byPlayType[p.playType], p.grade);
      if (!byDate[p.date]) byDate[p.date] = emptyBucket();
      bump(byDate[p.date], p.grade);
      for (const o of p.officials) officials.add(o);
      games.add(p.gameId);
    }
    let topType = "—";
    let topTypeN = 0;
    for (const [k, v] of Object.entries(byPlayType)) {
      if (v.total > topTypeN) {
        topType = k;
        topTypeN = v.total;
      }
    }
    return {
      overall,
      byConference,
      byPlayType,
      byDate,
      nOfficials: officials.size,
      nGames: games.size,
      topType,
      topTypeN,
    };
  }, [filtered]);

  if (loading || !agg) {
    return (
      <div className="flex flex-col gap-8" aria-busy="true">
        <div className="space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-12 w-[28rem] max-w-full" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-12 gap-8">
          <Skeleton className="col-span-12 md:col-span-5 h-56" />
          <div className="col-span-12 md:col-span-7 grid grid-cols-2 gap-6">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  const { overall, byConference, byPlayType, byDate, nOfficials, nGames, topType, topTypeN } = agg;
  const acc = accuracy(overall);

  return (
    <div className="flex flex-col gap-fluid-lg">
      {/* Masthead — editorial, left-aligned, asymmetric */}
      <header className="max-w-4xl">
        <div className="page-kicker">Season report · 2024–25</div>
        <h2 className="page-title mt-4">
          Ten thousand whistles.{" "}
          <span className="text-ink-400">A season of calls, reviewed.</span>
        </h2>
        <p className="page-lede mt-5">
          Every evaluated play from Big 12, WCC and BWC men's basketball —
          262 games, graded call by call. Filter the season above, then
          explore.
        </p>
      </header>

      {/* Hero: oversized accuracy next to satellite stats */}
      <section className="grid grid-cols-12 gap-x-8 gap-y-6 ruled">
        <div className="col-span-12 lg:col-span-5">
          <div className="kpi-label">Season accuracy</div>
          <div
            className="font-display text-[clamp(4rem,8vw,8rem)] leading-[0.85] tracking-tight text-ink-900 mt-3"
            style={{ fontVariationSettings: '"opsz" 144, "SOFT" 50' }}
          >
            {fmtPct(acc, 1)}
          </div>
          <div className="text-sm text-ink-500 mt-3 max-w-sm">
            {fmtNum(overall.correct)} correct and {fmtNum(overall.incorrect)}{" "}
            incorrect calls out of{" "}
            {fmtNum(overall.correct + overall.incorrect)} gradeable plays.
            Inconclusives and notes excluded.
          </div>
        </div>
        <div className="col-span-12 lg:col-span-7 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-6">
          <KpiCard label="Plays reviewed" value={fmtNum(overall.total)} />
          <KpiCard
            label="Incorrect calls"
            value={fmtNum(overall.incorrect)}
            sub={`${fmtNum(overall.grades.IC || 0)} IC · ${fmtNum(overall.grades.NCI || 0)} NCI`}
          />
          <KpiCard label="Officials" value={fmtNum(nOfficials)} />
          <KpiCard label="Games" value={fmtNum(nGames)} />
          <div className="col-span-2 md:col-span-4 border-t border-ink-200 pt-4">
            <div className="kpi-label">Most-called play</div>
            <div className="flex items-baseline gap-3 mt-2">
              <div
                className="font-display text-3xl text-ink-900 tracking-tight leading-tight"
                style={{ fontVariationSettings: '"opsz" 72' }}
              >
                {topType}
              </div>
              <div className="text-sm text-ink-500">
                {fmtNum(topTypeN)} plays
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Two charts side by side — no card wrappers */}
      <section className="grid grid-cols-12 gap-x-8 gap-y-10 ruled">
        <div className="col-span-12 lg:col-span-5">
          <div className="eyebrow mb-3">Grade distribution</div>
          <h3 className="section-title mb-5">
            How the crews' calls break down
          </h3>
          <GradeDonut bucket={overall} />
        </div>
        <div className="col-span-12 lg:col-span-7">
          <div className="eyebrow mb-3">By conference</div>
          <h3 className="section-title mb-5">
            Plays by grade across conferences
          </h3>
          <ConferenceStackedBar byConference={byConference} />
        </div>
      </section>

      {/* Full-bleed trend */}
      <section className="ruled">
        <div className="eyebrow mb-3">Daily volume</div>
        <h3 className="section-title mb-2">
          Evaluated plays per day, Nov → Mar
        </h3>
        <p className="section-sub mb-6">
          Drag the bottom strip to zoom a window.
        </p>
        <DailyCallsLine byDate={byDate} />
      </section>

      <section className="ruled">
        <div className="eyebrow mb-3">Volume × accuracy</div>
        <h3 className="section-title mb-2">
          The top 15 play types of the season
        </h3>
        <p className="section-sub mb-6">
          Bars sized by volume, colored by correct-call rate.
        </p>
        <PlayTypeBar byPlayType={byPlayType} topN={15} />
      </section>
    </div>
  );
}
