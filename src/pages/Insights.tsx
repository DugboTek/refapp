import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import AccuracyHeatmap from "../components/charts/AccuracyHeatmap";
import CallSankey from "../components/charts/CallSankey";
import OfficialScatter from "../components/charts/OfficialScatter";
import PlayTypeBar from "../components/charts/PlayTypeBar";
import GradeDonut from "../components/charts/GradeDonut";
import SeasonTrendLine from "../components/charts/SeasonTrendLine";
import CalendarHeatmap from "../components/charts/CalendarHeatmap";
import CrewChemistryMatrix from "../components/charts/CrewChemistryMatrix";
import ClockDensity from "../components/charts/ClockDensity";
import ConferenceRadar from "../components/charts/ConferenceRadar";
import { Skeleton } from "../components/ui/Skeleton";
import { usePlays } from "../lib/usePlays";
import { derived } from "../lib/derivedData";
import { withFilters } from "../lib/filters";
import { accuracy, fmtPct, GRADE_COLORS, GRADE_LABELS } from "../lib/grades";
import { brand } from "../lib/theme";
import { fmtDate, fmtNum, slugify } from "../lib/format";
import type { Bucket, Play } from "../data/types";

const DOW_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Insights() {
  const allPlays = usePlays();
  const [params] = useSearchParams();

  const lateGameSeries = useMemo(() => {
    const rows: { elapsed: string; accuracy: number; n: number }[] = [];
    for (let b = 9; b >= 0; b--) {
      const bucket = derived.lateGameBuckets[String(b)];
      if (!bucket) continue;
      const acc = accuracy(bucket);
      const elapsedMin = (9 - b) * 2;
      rows.push({
        elapsed: `${elapsedMin}-${elapsedMin + 2}'`,
        accuracy: acc == null ? 0 : Math.round(acc * 1000) / 10,
        n: bucket.total,
      });
    }
    return rows;
  }, []);

  const topKeywords = useMemo(() => {
    const byGrade: { grade: string; top: { kw: string; n: number }[] }[] = [];
    for (const [grade, kws] of Object.entries(derived.keywordCounts)) {
      const sorted = Object.entries(kws)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([kw, n]) => ({ kw, n }));
      if (sorted.length) byGrade.push({ grade, top: sorted });
    }
    byGrade.sort((a, b) => (b.top[0]?.n || 0) - (a.top[0]?.n || 0));
    return byGrade;
  }, []);

  const extra = useMemo(() => {
    if (!allPlays) return null;
    const dow = DOW_NAMES.map((d) => ({
      day: d,
      plays: 0,
      correct: 0,
      incorrect: 0,
      games: new Set<string>(),
    }));
    const teamCount: Record<string, number> = {};
    const graderCount: Record<string, number> = {};
    const graderAccuracy: Record<
      string,
      { correct: number; incorrect: number }
    > = {};
    let spotlight: {
      play: Play;
      len: number;
      text: string;
      author: string | null;
    } | null = null;

    for (const p of allPlays) {
      const wd = new Date(p.date).getUTCDay();
      const d = dow[wd];
      d.plays += 1;
      d.games.add(p.gameId);
      if (p.grade === "CC" || p.grade === "NCC") d.correct++;
      if (p.grade === "IC" || p.grade === "NCI") d.incorrect++;

      if (p.entryType === "Foul") {
        teamCount[p.home] = (teamCount[p.home] || 0) + 1;
        teamCount[p.visitor] = (teamCount[p.visitor] || 0) + 1;
      }

      for (const c of p.graderComments) {
        if (c.author) {
          graderCount[c.author] = (graderCount[c.author] || 0) + 1;
          if (!graderAccuracy[c.author]) {
            graderAccuracy[c.author] = { correct: 0, incorrect: 0 };
          }
          const ga = graderAccuracy[c.author];
          if (p.grade === "CC" || p.grade === "NCC") ga.correct++;
          if (p.grade === "IC" || p.grade === "NCI") ga.incorrect++;
        }
        if (c.text.length > (spotlight?.len || 0)) {
          spotlight = { play: p, len: c.text.length, text: c.text, author: c.author };
        }
      }
    }

    const dowData = dow.map((row) => {
      const denom = row.correct + row.incorrect;
      return {
        day: row.day,
        plays: row.plays,
        games: row.games.size,
        accuracy:
          denom === 0 ? 0 : Math.round((row.correct / denom) * 1000) / 10,
      };
    });

    const topTeams = Object.entries(teamCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([team, plays]) => ({ team, plays }));

    const topGraders = Object.entries(graderCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([author, comments]) => {
        const ga = graderAccuracy[author];
        const denom = ga.correct + ga.incorrect;
        return {
          author,
          comments,
          sampleAcc: denom === 0 ? null : ga.correct / denom,
        };
      });

    return { dowData, topTeams, topGraders, spotlight };
  }, [allPlays]);

  const block = derived.byPlayType["Blocking"] as Bucket | undefined;
  const charge = derived.byPlayType["Offense Initiated Contact (OIC)"] as
    | Bucket
    | undefined;
  const rule1014 = derived.byPlayType["10.1.4"] as Bucket | undefined;

  const rareCalls = useMemo(() => {
    return Object.entries(derived.byPlayType)
      .filter(([, b]) => b.total > 0 && b.total <= 5)
      .sort((a, b) => a[1].total - b[1].total)
      .slice(0, 16);
  }, []);

  const loadingHeavy = !allPlays;

  return (
    <div className="flex flex-col gap-fluid-xl">
      <header className="max-w-4xl">
        <div className="page-kicker">Insights</div>
        <h2 className="page-title mt-4">
          Ten thousand plays,{" "}
          <span className="text-ink-400">cross-examined.</span>
        </h2>
        <p className="page-lede mt-5">
          Cross-cutting analyses of the whole dataset — how calls flow, where
          accuracy lives, which crews work together, and what the graders
          actually write down.
        </p>
      </header>

      {/* ============ FLOW — full bleed ============ */}
      <section className="ruled">
        <div className="eyebrow mb-3">Flow · 01</div>
        <h3 className="section-title mb-2">
          Where do calls flow?
        </h3>
        <p className="section-sub mb-6">
          Entry type → play type → final grade for the 15 most-common plays.
          Wider streams mean more plays; stream color tracks the final grade.
        </p>
        <CallSankey
          sankeyCounts={derived.sankeyCounts}
          sankeyPlayTypes={derived.sankeyPlayTypes}
        />
      </section>

      {/* ============ TEMPORAL ============ */}
      <section className="ruled">
        <div className="eyebrow mb-3">Temporal · 02</div>
        <h3 className="section-title mb-2">Season momentum</h3>
        <p className="section-sub mb-6">
          Daily volume in bars, 7-day rolling accuracy in the line.
        </p>
        <SeasonTrendLine byDate={derived.byDate} window={7} />
      </section>

      <section className="ruled">
        <div className="eyebrow mb-3">Temporal · 03</div>
        <h3 className="section-title mb-2">Season calendar</h3>
        <p className="section-sub mb-6">
          Darker squares = more plays evaluated that day.
        </p>
        <CalendarHeatmap byDate={derived.byDate} />
      </section>

      <section className="ruled">
        <div className="eyebrow mb-3">Temporal · 04</div>
        <h3 className="section-title mb-2">Day of week</h3>
        <p className="section-sub mb-6">
          College basketball clusters Tuesday–Saturday. Any day call more
          accurately?
        </p>
        {loadingHeavy || !extra ? (
          <Skeleton className="h-60" />
        ) : (
          <div
            role="img"
            aria-label="Bar chart of plays per day of week with accuracy overlay"
            style={{ width: "100%", height: 260 }}
          >
            <ResponsiveContainer>
              <BarChart data={extra.dowData} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" tickLine={false} axisLine={false} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[85, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip />
                <Bar
                  yAxisId="left"
                  dataKey="plays"
                  fill={brand[100]}
                  radius={[3, 3, 0, 0]}
                  name="Plays"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="accuracy"
                  stroke={brand[600]}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: brand[600] }}
                  name="Accuracy %"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* ============ STRUCTURAL ============ */}
      <section className="ruled">
        <div className="eyebrow mb-3">Structural · 05</div>
        <h3 className="section-title mb-2">
          Position × play type accuracy
        </h3>
        <p className="section-sub mb-6">
          Which on-court position calls each play type most accurately?
        </p>
        <AccuracyHeatmap
          heatmap={derived.heatmap}
          playTypes={derived.topPlayTypes}
        />
      </section>

      <section className="ruled">
        <div className="eyebrow mb-3">Structural · 06</div>
        <h3 className="section-title mb-2">Conference accuracy profile</h3>
        <p className="section-sub mb-6">
          Same calls, different crews — where do the conferences diverge?
        </p>
        {loadingHeavy ? (
          <Skeleton className="h-96" />
        ) : (
          <ConferenceRadar
            plays={allPlays}
            topPlayTypes={derived.topPlayTypes}
          />
        )}
      </section>

      {/* ============ PEOPLE ============ */}
      <section className="ruled grid grid-cols-12 gap-x-8 gap-y-10">
        <div className="col-span-12 lg:col-span-7">
          <div className="eyebrow mb-3">People · 07</div>
          <h3 className="section-title mb-2">
            Volume versus accuracy for every official
          </h3>
          <p className="section-sub mb-6">
            Each dot is one official with 25+ plays. Quadrant lines mark
            medians. Dot size maps to incorrect calls.
          </p>
          <OfficialScatter officials={derived.officials} minVolume={25} />
          <div className="flex gap-3 text-[11px] text-ink-500 mt-3 flex-wrap">
            <span className="chip-quiet">
              <span
                aria-hidden="true"
                className="w-2 h-2 rounded-full bg-correct"
              />
              High vol · high acc
            </span>
            <span className="chip-quiet">
              <span
                aria-hidden="true"
                className="w-2 h-2 rounded-full"
                style={{ background: "#b5620a" }}
              />
              High vol · below median
            </span>
            <span className="chip-quiet">
              <span
                aria-hidden="true"
                className="w-2 h-2 rounded-full"
                style={{ background: "#2563eb" }}
              />
              Low vol · high acc
            </span>
          </div>
        </div>
        <div className="col-span-12 lg:col-span-5">
          <div className="eyebrow mb-3">People · 08</div>
          <h3 className="section-title mb-2">Late-game pressure</h3>
          <p className="section-sub mb-6">
            Accuracy by elapsed minute of the second half.
          </p>
          <div
            role="img"
            aria-label="Line chart of accuracy in the second half by 2-minute bucket"
            style={{ width: "100%", height: 320 }}
          >
            <ResponsiveContainer>
              <LineChart data={lateGameSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="elapsed"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                />
                <YAxis
                  domain={[80, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                />
                <Tooltip
                  formatter={(v: number, _n, p: any) => [
                    `${v}% (${p.payload.n} plays)`,
                    "Accuracy",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  stroke={brand[600]}
                  strokeWidth={2.5}
                  dot={{ r: 3.5, fill: brand[600] }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="ruled">
        <div className="eyebrow mb-3">People · 09</div>
        <h3 className="section-title mb-2">Crew chemistry</h3>
        <p className="section-sub mb-6">
          The 14 busiest officials and how often they work on the same crew.
          Hover for joint accuracy.
        </p>
        {loadingHeavy ? (
          <Skeleton className="h-[520px]" />
        ) : (
          <CrewChemistryMatrix plays={allPlays} topN={14} />
        )}
      </section>

      {/* ============ GAME CLOCK ============ */}
      <section className="ruled">
        <div className="eyebrow mb-3">Game clock · 10</div>
        <h3 className="section-title mb-2">Call density across 40 minutes</h3>
        <p className="section-sub mb-6">
          Total whistles in orange; incorrect calls in red. Halftime marked.
        </p>
        {loadingHeavy ? (
          <Skeleton className="h-72" />
        ) : (
          <ClockDensity plays={allPlays} />
        )}
      </section>

      {/* ============ PLAY TYPES ============ */}
      <section className="ruled">
        <div className="eyebrow mb-3">Play types · 11</div>
        <h3 className="section-title mb-2">The hardest calls to get right</h3>
        <p className="section-sub mb-6">
          Top 20 most-evaluated play types, ordered by correct-call rate.
        </p>
        <PlayTypeBar
          byPlayType={derived.byPlayType}
          topN={20}
          byAccuracy
          height={480}
        />
      </section>

      <section className="ruled grid grid-cols-12 gap-x-8 gap-y-10">
        <div className="col-span-12 lg:col-span-8">
          <div className="eyebrow mb-3">Play types · 12</div>
          <h3 className="section-title mb-2">Block vs. Charge</h3>
          <p className="section-sub mb-6">
            The classic hard call, from both sides.
          </p>
          <div className="grid grid-cols-2 gap-6">
            <DuelStat title="Blocking" bucket={block} accent="#c52033" />
            <DuelStat
              title="Offense Initiated Contact"
              subtitle="the charge"
              bucket={charge}
              accent="#0d7a5f"
            />
          </div>
        </div>
        <div className="col-span-12 lg:col-span-4">
          <div className="eyebrow mb-3">Play types · 13</div>
          <h3 className="section-title mb-2">Rule 10.1.4</h3>
          <p className="section-sub mb-5">
            The third-most common play type is simply a rule number.
          </p>
          {rule1014 ? (
            <div className="flex flex-col gap-4">
              <div>
                <div className="kpi-label">Plays tagged</div>
                <div
                  className="font-display text-5xl text-ink-900 leading-none mt-2"
                  style={{ fontVariationSettings: '"opsz" 144' }}
                >
                  {fmtNum(rule1014.total)}
                </div>
              </div>
              <div>
                <div className="kpi-label">Accuracy</div>
                <div
                  className="font-display text-5xl text-ink-900 leading-none mt-2"
                  style={{ fontVariationSettings: '"opsz" 144' }}
                >
                  {fmtPct(accuracy(rule1014), 1)}
                </div>
              </div>
              <p className="text-xs text-ink-600 leading-relaxed border-t border-ink-200 pt-4">
                NCAA rule 10.1.4 governs illegal contact by a defender around
                ball-handling and post play. It shows up {fmtNum(rule1014.total)}{" "}
                times — more than Holding, Pushing, Traveling, or Blocking.
              </p>
            </div>
          ) : (
            <div className="text-xs text-ink-500">No data.</div>
          )}
        </div>
      </section>

      <section className="ruled">
        <div className="eyebrow mb-3">Play types · 14</div>
        <h3 className="section-title mb-2">The long tail</h3>
        <p className="section-sub mb-6">
          Play types that showed up five or fewer times all season.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6">
          {rareCalls.map(([name, b]) => (
            <Link
              key={name}
              to={`/plays${withFilters(params, { playType: name })}`}
              className="flex items-center justify-between py-2.5 border-b border-ink-100 text-sm hover:text-brand-600"
            >
              <span className="text-ink-800 truncate mr-2">{name}</span>
              <span className="text-xs text-ink-500 tabular-nums shrink-0">
                {b.total}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ============ TEAMS ============ */}
      <section className="ruled">
        <div className="eyebrow mb-3">Teams · 15</div>
        <h3 className="section-title mb-2">Most-whistled teams</h3>
        <p className="section-sub mb-6">
          Top 12 teams by fouls involved in their games.
        </p>
        {loadingHeavy || !extra ? (
          <Skeleton className="h-80" />
        ) : (
          <div
            role="img"
            aria-label="Horizontal bar chart of teams ranked by foul volume"
            style={{ width: "100%", height: 360 }}
          >
            <ResponsiveContainer>
              <BarChart
                data={extra.topTeams}
                layout="vertical"
                margin={{ top: 4, right: 20, bottom: 8, left: 12 }}
              >
                <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                <XAxis type="number" tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="team"
                  width={140}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip />
                <Bar
                  dataKey="plays"
                  fill={brand[600]}
                  radius={[0, 4, 4, 0]}
                  maxBarSize={22}
                >
                  {extra.topTeams.map((t) => (
                    <Cell key={t.team} fill={brand[600]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* ============ CONFERENCES ============ */}
      <section className="ruled">
        <div className="eyebrow mb-3">Conferences · 16</div>
        <h3 className="section-title mb-2">
          Three conferences, three grade mixes
        </h3>
        <p className="section-sub mb-6">Same question, three answers.</p>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-10 gap-y-10">
          {Object.entries(derived.byConference)
            .sort((a, b) => b[1].total - a[1].total)
            .map(([conf, b]) => (
              <div key={conf}>
                <div
                  className="font-display text-xl text-ink-900 leading-tight mb-1"
                  style={{ fontVariationSettings: '"opsz" 72' }}
                >
                  {conf.replace("Men's Basketball", "MBB")}
                </div>
                <div className="text-xs text-ink-500 mb-5">
                  {b.total.toLocaleString()} plays · {fmtPct(accuracy(b), 1)}{" "}
                  accuracy
                </div>
                <GradeDonut bucket={b} height={220} />
              </div>
            ))}
        </div>
      </section>

      {/* ============ TEXT ============ */}
      <section className="ruled grid grid-cols-12 gap-x-8 gap-y-10">
        <div className="col-span-12 lg:col-span-6">
          <div className="eyebrow mb-3">Graders · 17</div>
          <h3 className="section-title mb-2">Top reviewers</h3>
          <p className="section-sub mb-6">
            Who's writing the feedback, and how their plays graded out.
          </p>
          {loadingHeavy || !extra ? (
            <Skeleton className="h-72" />
          ) : (
            <div className="flex flex-col">
              {extra.topGraders.map((g, i) => (
                <div
                  key={g.author}
                  className="flex items-center justify-between py-3 border-b border-ink-100"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="text-xs text-ink-400 tabular-nums w-5">
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium text-ink-900 truncate">
                      {g.author}
                    </span>
                  </div>
                  <div className="flex items-center gap-5 text-xs text-ink-500 shrink-0">
                    <span className="tabular-nums text-ink-800">
                      {fmtNum(g.comments)}
                    </span>
                    <span className="tabular-nums w-14 text-right">
                      {g.sampleAcc != null ? fmtPct(g.sampleAcc, 1) : "—"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="col-span-12 lg:col-span-6">
          <div className="eyebrow mb-3">Graders · 18</div>
          <h3 className="section-title mb-2">Vocabulary by grade</h3>
          <p className="section-sub mb-6">
            Most-used keywords, broken down by the grade applied.
          </p>
          <div className="flex flex-col gap-5">
            {topKeywords.map((g) => (
              <div key={g.grade}>
                <div className="eyebrow mb-2">
                  {GRADE_LABELS[g.grade] || g.grade}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {g.top.map((t) => (
                    <span
                      key={t.kw}
                      className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-2.5 py-1 text-[11px]"
                    >
                      <span className="font-medium text-ink-800">{t.kw}</span>
                      <span className="text-ink-500 tabular-nums">{t.n}</span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ SPOTLIGHT ============ */}
      {extra?.spotlight ? (
        <section className="ruled">
          <div className="eyebrow mb-3">Spotlight · 19</div>
          <h3 className="section-title mb-2">
            The longest grader comment in the dataset
          </h3>
          <p className="section-sub mb-6">
            {extra.spotlight.len} characters on a single play.
          </p>
          <div className="max-w-3xl">
            <div className="flex items-baseline gap-3 flex-wrap mb-4">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white"
                style={{
                  background: GRADE_COLORS[extra.spotlight.play.grade],
                }}
              >
                {GRADE_LABELS[extra.spotlight.play.grade] ||
                  extra.spotlight.play.grade}
              </span>
              <span className="text-sm font-semibold text-ink-900">
                {extra.spotlight.play.home} vs {extra.spotlight.play.visitor}
              </span>
              <span className="text-xs text-ink-500">
                {fmtDate(extra.spotlight.play.date)} · Q
                {extra.spotlight.play.period} {extra.spotlight.play.time} ·{" "}
                {extra.spotlight.play.playType}
              </span>
            </div>
            <blockquote
              className="font-display text-2xl md:text-3xl leading-snug text-ink-900 italic border-l-4 border-brand-500 pl-6"
              style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100' }}
            >
              "{extra.spotlight.text}"
            </blockquote>
            <div className="text-xs text-ink-500 mt-5">
              — {extra.spotlight.author || "anonymous"} ·{" "}
              <Link
                to={`/games/${encodeURIComponent(extra.spotlight.play.gameId)}${withFilters(params)}`}
                className="text-brand-600 hover:underline"
              >
                see the game
              </Link>
              {extra.spotlight.play.officials[0] ? (
                <>
                  {" · "}
                  <Link
                    to={`/officials/${slugify(extra.spotlight.play.officials[0])}${withFilters(params)}`}
                    className="text-brand-600 hover:underline"
                  >
                    see {extra.spotlight.play.officials[0]}
                  </Link>
                </>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function DuelStat({
  title,
  subtitle,
  bucket,
  accent,
}: {
  title: string;
  subtitle?: string;
  bucket: Bucket | undefined;
  accent: string;
}) {
  if (!bucket) {
    return (
      <div className="text-xs text-ink-500 border-t border-ink-200 pt-4">
        No data for {title}.
      </div>
    );
  }
  const acc = accuracy(bucket);
  const pct = acc == null ? 0 : acc * 100;
  return (
    <div className="border-t border-ink-300 pt-4 flex flex-col gap-3">
      <div>
        <div className="kpi-label">{title}</div>
        {subtitle ? (
          <div className="text-[11px] text-ink-400 italic mt-0.5">
            {subtitle}
          </div>
        ) : null}
      </div>
      <div className="flex items-baseline gap-2">
        <div
          className="font-display text-5xl tracking-tight leading-none"
          style={{ color: accent, fontVariationSettings: '"opsz" 144' }}
        >
          {fmtPct(acc, 1)}
        </div>
      </div>
      <div className="relative h-1 bg-ink-100 overflow-hidden">
        <div
          className="absolute inset-y-0 left-0"
          style={{ width: `${pct.toFixed(1)}%`, background: accent }}
        />
      </div>
      <div className="flex items-center justify-between text-[11px] text-ink-500">
        <span>{fmtNum(bucket.total)} plays</span>
        <span>
          {fmtNum(bucket.correct)} / {fmtNum(bucket.incorrect)}
        </span>
      </div>
    </div>
  );
}
