import { useId, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, TrendingDown, TrendingUp } from "lucide-react";
import { Skeleton } from "../components/ui/Skeleton";
import { useGlobalFilters, withFilters } from "../lib/filters";
import { accuracy, fmtPct } from "../lib/grades";
import { emptyBucket, bump } from "../lib/aggregate";
import type { Bucket } from "../data/types";
import { slugify, fmtNum } from "../lib/format";

interface Row {
  name: string;
  bucket: Bucket;
  positions: Record<string, number>;
  conferences: Set<string>;
}

export default function Officials() {
  const { filtered, loading } = useGlobalFilters();
  const [params] = useSearchParams();
  const [minVolume, setMinVolume] = useState(25);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<"total" | "accuracy" | "incorrect">(
    "total",
  );
  const searchId = useId();
  const sliderId = useId();
  const sortId = useId();

  const { rows, medianAcc } = useMemo(() => {
    if (!filtered) return { rows: [] as Row[], medianAcc: null as number | null };
    const map = new Map<string, Row>();
    for (const p of filtered) {
      for (const who of p.officials) {
        let row = map.get(who);
        if (!row) {
          row = {
            name: who,
            bucket: emptyBucket(),
            positions: {},
            conferences: new Set(),
          };
          map.set(who, row);
        }
        bump(row.bucket, p.grade);
        row.conferences.add(p.conference);
        for (const pos of p.positions) {
          row.positions[pos] = (row.positions[pos] || 0) + 1;
        }
      }
    }
    let arr = Array.from(map.values()).filter(
      (r) => r.bucket.total >= minVolume,
    );
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter((r) => r.name.toLowerCase().includes(q));
    }
    arr.sort((a, b) => {
      if (sortKey === "total") return b.bucket.total - a.bucket.total;
      if (sortKey === "incorrect")
        return b.bucket.incorrect - a.bucket.incorrect;
      const aa = accuracy(a.bucket) ?? -1;
      const bb = accuracy(b.bucket) ?? -1;
      return bb - aa;
    });
    const allAcc = arr
      .map((r) => accuracy(r.bucket))
      .filter((v): v is number => v != null)
      .sort((a, b) => a - b);
    const medianAcc =
      allAcc.length > 0 ? allAcc[Math.floor(allAcc.length / 2)] : null;
    return { rows: arr, medianAcc };
  }, [filtered, minVolume, search, sortKey]);

  return (
    <div className="flex flex-col gap-fluid-lg">
      <header className="max-w-3xl">
        <div className="page-kicker">Officials leaderboard</div>
        <h2 className="page-title mt-4">
          Who's calling it. Who's getting it right.
        </h2>
        <p className="page-lede mt-4">
          {loading
            ? "Loading the full crew file…"
            : `${rows.length.toLocaleString()} officials with at least ${minVolume} evaluated plays. Median accuracy is ${fmtPct(medianAcc, 1)}.`}
        </p>
      </header>

      <section className="ruled pt-6">
        <div className="flex flex-wrap items-end gap-x-5 gap-y-3 mb-5">
          <div className="flex flex-col">
            <label htmlFor={searchId} className="field-label">
              Search
            </label>
            <div className="relative">
              <Search
                size={15}
                aria-hidden="true"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"
              />
              <input
                id={searchId}
                type="search"
                className="input !w-64 pl-9"
                placeholder="Search officials…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col">
            <label htmlFor={sliderId} className="field-label">
              Min volume · <span className="text-ink-800">{minVolume}</span>
            </label>
            <input
              id={sliderId}
              type="range"
              min={5}
              max={200}
              step={5}
              value={minVolume}
              aria-valuetext={`${minVolume} plays minimum`}
              onChange={(e) => setMinVolume(Number(e.target.value))}
              className="w-48 accent-brand-600"
            />
          </div>
          <div className="flex flex-col ml-auto">
            <label htmlFor={sortId} className="field-label">
              Sort by
            </label>
            <select
              id={sortId}
              className="input !w-auto"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as any)}
            >
              <option value="total">Volume</option>
              <option value="accuracy">Accuracy</option>
              <option value="incorrect">Most incorrect</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto border border-ink-200">
          {loading ? (
            <div className="p-5 space-y-2.5">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : (
            <table className="table-base">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Official</th>
                  <th className="text-right">Plays</th>
                  <th className="text-right">Accuracy</th>
                  <th className="text-right">CC</th>
                  <th className="text-right">IC</th>
                  <th className="text-right">NCI</th>
                  <th>Top position</th>
                  <th>Conferences</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const acc = accuracy(r.bucket);
                  const topPos = Object.entries(r.positions).sort(
                    (a, b) => b[1] - a[1],
                  )[0]?.[0];
                  const vsMedian =
                    acc != null && medianAcc != null ? acc - medianAcc : null;
                  return (
                    <tr key={r.name}>
                      <td className="text-ink-400 tabular-nums">{i + 1}</td>
                      <td>
                        <Link
                          to={`/officials/${slugify(r.name)}${withFilters(params)}`}
                          className="font-medium text-ink-900 hover:text-brand-600"
                        >
                          {r.name}
                        </Link>
                      </td>
                      <td className="text-right tabular-nums">
                        {fmtNum(r.bucket.total)}
                      </td>
                      <td className="text-right tabular-nums">
                        <span className="text-ink-900 font-medium">
                          {fmtPct(acc, 1)}
                        </span>
                        {vsMedian != null ? (
                          <span
                            className={
                              vsMedian >= 0
                                ? "ml-2 inline-flex items-center gap-0.5 text-[11px] text-correct"
                                : "ml-2 inline-flex items-center gap-0.5 text-[11px] text-wrong"
                            }
                            aria-label={`${vsMedian >= 0 ? "above" : "below"} median by ${(Math.abs(vsMedian) * 100).toFixed(1)} points`}
                          >
                            {vsMedian >= 0 ? (
                              <TrendingUp size={11} aria-hidden="true" />
                            ) : (
                              <TrendingDown size={11} aria-hidden="true" />
                            )}
                            {(Math.abs(vsMedian) * 100).toFixed(1)}
                          </span>
                        ) : null}
                      </td>
                      <td className="text-right tabular-nums text-ink-600">
                        {fmtNum(r.bucket.grades.CC || 0)}
                      </td>
                      <td className="text-right tabular-nums text-wrong">
                        {fmtNum(r.bucket.grades.IC || 0)}
                      </td>
                      <td className="text-right tabular-nums text-warn">
                        {fmtNum(r.bucket.grades.NCI || 0)}
                      </td>
                      <td className="text-ink-600 text-xs">{topPos || "—"}</td>
                      <td className="text-ink-600 text-xs">
                        {Array.from(r.conferences)
                          .map((c) => c.replace("Men's Basketball", "MBB"))
                          .join(", ")}
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center text-ink-500 py-16">
                      No officials match.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
