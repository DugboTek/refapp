import { useId, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { Skeleton } from "../components/ui/Skeleton";
import { useGlobalFilters, withFilters } from "../lib/filters";
import { emptyBucket, bump } from "../lib/aggregate";
import { accuracy, fmtPct } from "../lib/grades";
import type { Bucket } from "../data/types";
import { fmtDate, fmtNum } from "../lib/format";

interface Row {
  gameId: string;
  date: string;
  home: string;
  visitor: string;
  conference: string;
  crew: Set<string>;
  bucket: Bucket;
}

export default function Games() {
  const { filtered, loading } = useGlobalFilters();
  const [params] = useSearchParams();
  const [search, setSearch] = useState("");
  const searchId = useId();

  const rows = useMemo(() => {
    if (!filtered) return [] as Row[];
    const map = new Map<string, Row>();
    for (const p of filtered) {
      let r = map.get(p.gameId);
      if (!r) {
        r = {
          gameId: p.gameId,
          date: p.date,
          home: p.home,
          visitor: p.visitor,
          conference: p.conference,
          crew: new Set(),
          bucket: emptyBucket(),
        };
        map.set(p.gameId, r);
      }
      for (const o of p.officials) r.crew.add(o);
      bump(r.bucket, p.grade);
    }
    let arr = Array.from(map.values()).sort((a, b) =>
      a.date > b.date ? -1 : 1,
    );
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter(
        (r) =>
          r.home.toLowerCase().includes(q) ||
          r.visitor.toLowerCase().includes(q) ||
          Array.from(r.crew).some((c) => c.toLowerCase().includes(q)),
      );
    }
    return arr;
  }, [filtered, search]);

  return (
    <div className="flex flex-col gap-fluid-lg">
      <header className="max-w-3xl">
        <div className="page-kicker">Games</div>
        <h2 className="page-title mt-4">
          Every game, call by call.
        </h2>
        <p className="page-lede mt-4">
          {loading
            ? "Loading games…"
            : `${rows.length.toLocaleString()} games match the current filters. Open any game for its play-by-play timeline.`}
        </p>
      </header>

      <section className="ruled pt-6">
        <div className="flex items-end gap-3 mb-5">
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
                className="input !w-72 pl-9"
                placeholder="Team or official…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
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
                  <th>Date</th>
                  <th>Matchup</th>
                  <th>Conference</th>
                  <th className="text-right">Plays</th>
                  <th className="text-right">Accuracy</th>
                  <th>Crew</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.gameId}>
                    <td className="whitespace-nowrap text-ink-600">
                      {fmtDate(r.date)}
                    </td>
                    <td>
                      <Link
                        to={`/games/${encodeURIComponent(r.gameId)}${withFilters(params)}`}
                        className="font-medium text-ink-900 hover:text-brand-600"
                      >
                        {r.home}{" "}
                        <span className="text-ink-400">vs</span> {r.visitor}
                      </Link>
                    </td>
                    <td className="text-xs text-ink-500">
                      {r.conference.replace("Men's Basketball", "MBB")}
                    </td>
                    <td className="text-right tabular-nums">
                      {fmtNum(r.bucket.total)}
                    </td>
                    <td className="text-right tabular-nums text-ink-800">
                      {fmtPct(accuracy(r.bucket), 1)}
                    </td>
                    <td className="text-xs text-ink-600">
                      {Array.from(r.crew).join(", ")}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-ink-500 py-16">
                      No games match.
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
