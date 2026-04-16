import { useId, useMemo, useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type SortingState,
} from "@tanstack/react-table";
import clsx from "clsx";
import { Download, Search, ChevronLeft, ChevronRight, Info } from "lucide-react";
import { Dialog } from "../components/ui/Dialog";
import { Skeleton } from "../components/ui/Skeleton";
import { useGlobalFilters } from "../lib/filters";
import {
  GRADE_COLORS,
  GRADE_LABELS,
  GRADE_ORDER,
} from "../lib/grades";
import type { Play } from "../data/types";
import { fmtDateShort } from "../lib/format";
import { allEntryTypes } from "../lib/derivedData";

const col = createColumnHelper<Play>();

export default function Plays() {
  const { filtered, loading } = useGlobalFilters();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [colFilters, setColFilters] = useState<ColumnFiltersState>([]);
  const [globalSearch, setGlobalSearch] = useState("");
  const [selected, setSelected] = useState<Play | null>(null);
  const searchId = useId();
  const entryId = useId();
  const gradeId = useId();
  const pageSizeId = useId();

  const data = useMemo(() => {
    if (!filtered) return [] as Play[];
    if (!globalSearch.trim()) return filtered;
    const q = globalSearch.toLowerCase();
    return filtered.filter((p) => {
      if (p.playType.toLowerCase().includes(q)) return true;
      if (p.entryType.toLowerCase().includes(q)) return true;
      if (p.home.toLowerCase().includes(q)) return true;
      if (p.visitor.toLowerCase().includes(q)) return true;
      if (p.officials.some((o) => o.toLowerCase().includes(q))) return true;
      if (p.userComments?.toLowerCase().includes(q)) return true;
      if (p.graderComments.some((c) => c.text.toLowerCase().includes(q)))
        return true;
      return false;
    });
  }, [filtered, globalSearch]);

  const columns = useMemo(
    () => [
      col.accessor("date", {
        header: "Date",
        cell: (c) => (
          <span className="whitespace-nowrap text-ink-600">
            {fmtDateShort(c.getValue())}
          </span>
        ),
      }),
      col.accessor((row) => `${row.home} vs ${row.visitor}`, {
        id: "game",
        header: "Game",
        cell: (c) => (
          <span className="whitespace-nowrap text-ink-800">
            {c.getValue() as string}
          </span>
        ),
      }),
      col.accessor("entryType", {
        header: "Entry",
        filterFn: "equals",
        cell: (c) => <span className="chip text-[11px]">{c.getValue()}</span>,
      }),
      col.accessor("playType", {
        header: "Play type",
        cell: (c) => <span className="text-ink-800">{c.getValue()}</span>,
      }),
      col.accessor("period", {
        header: "Q",
        cell: (c) => (
          <span className="text-ink-500 tabular-nums">
            {c.getValue() ?? "—"}
          </span>
        ),
      }),
      col.accessor("time", {
        header: "Clock",
        cell: (c) => (
          <span className="text-ink-500 tabular-nums">
            {c.getValue() || "—"}
          </span>
        ),
      }),
      col.accessor((row) => row.positions.join(", "), {
        id: "positions",
        header: "Pos.",
        cell: (c) => (
          <span className="text-ink-600 text-xs">{c.getValue() as string}</span>
        ),
      }),
      col.accessor((row) => row.officials.join(", "), {
        id: "officials",
        header: "Official(s)",
        cell: (c) => (
          <span className="text-ink-700 text-xs">{c.getValue() as string}</span>
        ),
      }),
      col.accessor("grade", {
        header: "Grade",
        filterFn: "equals",
        cell: (c) => {
          const g = c.getValue();
          return (
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold text-white"
              style={{ background: GRADE_COLORS[g] || "#a1a1aa" }}
            >
              {g}
            </span>
          );
        },
      }),
      col.display({
        id: "details",
        header: "",
        cell: (ctx) => (
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => setSelected(ctx.row.original)}
            aria-label={`Details for ${ctx.row.original.playType} on ${fmtDateShort(
              ctx.row.original.date,
            )}`}
          >
            <Info size={13} aria-hidden="true" />
            Details
          </button>
        ),
      }),
    ],
    [],
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters: colFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 25 } },
  });

  const exportCSV = () => {
    const rows = table.getFilteredRowModel().rows.map((r) => r.original);
    const header = [
      "Date",
      "Conference",
      "Home",
      "Visitor",
      "Entry Type",
      "Play Type",
      "Period",
      "Time",
      "Positions",
      "Officials",
      "Grade",
    ];
    const lines = [
      header.join(","),
      ...rows.map((p) =>
        [
          p.date,
          q(p.conference),
          q(p.home),
          q(p.visitor),
          q(p.entryType),
          q(p.playType),
          p.period ?? "",
          q(p.time),
          q(p.positions.join("; ")),
          q(p.officials.join("; ")),
          p.grade,
        ].join(","),
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `plays-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const entryFilter =
    (colFilters.find((f) => f.id === "entryType")?.value ?? "") as string;
  const gradeFilter =
    (colFilters.find((f) => f.id === "grade")?.value ?? "") as string;
  const setColFilter = (id: string, value: string | null) => {
    setColFilters((prev) => {
      const next = prev.filter((p) => p.id !== id);
      if (value) next.push({ id, value });
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-fluid-lg">
      <header className="max-w-3xl">
        <div className="page-kicker">Plays explorer</div>
        <h2 className="page-title mt-4">
          Every whistle, searchable.
        </h2>
        <p className="page-lede mt-4">
          {loading
            ? "Loading the full play-by-play file…"
            : `${data.length.toLocaleString()} plays match the current filters. Sort columns, drill into details, or export a CSV.`}
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-x-5 gap-y-3 ruled pt-6">
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
                placeholder="Team, play type, official, comment…"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col">
            <label htmlFor={entryId} className="field-label">
              Entry type
            </label>
            <select
              id={entryId}
              className="input !w-auto"
              value={entryFilter}
              onChange={(e) => setColFilter("entryType", e.target.value || null)}
            >
              <option value="">All</option>
              {allEntryTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label htmlFor={gradeId} className="field-label">
              Grade
            </label>
            <select
              id={gradeId}
              className="input !w-auto"
              value={gradeFilter}
              onChange={(e) => setColFilter("grade", e.target.value || null)}
            >
              <option value="">All</option>
              {GRADE_ORDER.map((g) => (
                <option key={g} value={g}>
                  {GRADE_LABELS[g] || g}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className="btn ml-auto self-end"
            onClick={exportCSV}
            disabled={loading || data.length === 0}
          >
            <Download size={15} aria-hidden="true" />
            Export CSV
          </button>
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
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id}>
                    {hg.headers.map((h) => (
                      <th
                        key={h.id}
                        aria-sort={
                          h.column.getIsSorted() === "asc"
                            ? "ascending"
                            : h.column.getIsSorted() === "desc"
                              ? "descending"
                              : "none"
                        }
                      >
                        {h.column.getCanSort() ? (
                          <button
                            type="button"
                            className={clsx(
                              "inline-flex items-center gap-1 hover:text-ink-900 transition-colors",
                              h.column.getIsSorted() && "text-ink-900",
                            )}
                            onClick={h.column.getToggleSortingHandler()}
                          >
                            {flexRender(
                              h.column.columnDef.header,
                              h.getContext(),
                            )}
                            {h.column.getIsSorted() === "asc" ? " ↑" : null}
                            {h.column.getIsSorted() === "desc" ? " ↓" : null}
                          </button>
                        ) : (
                          flexRender(h.column.columnDef.header, h.getContext())
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((r) => (
                  <tr key={r.id}>
                    {r.getVisibleCells().map((c) => (
                      <td key={c.id}>
                        {flexRender(c.column.columnDef.cell, c.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="text-center text-ink-500 py-16"
                    >
                      No plays match these filters.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-ink-500">
          <div>
            {loading
              ? "Loading…"
              : `Page ${table.getState().pagination.pageIndex + 1} of ${Math.max(1, table.getPageCount())} · ${table.getFilteredRowModel().rows.length.toLocaleString()} rows`}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="Previous page"
            >
              <ChevronLeft size={14} aria-hidden="true" />
              Prev
            </button>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label="Next page"
            >
              Next
              <ChevronRight size={14} aria-hidden="true" />
            </button>
            <label htmlFor={pageSizeId} className="sr-only">
              Rows per page
            </label>
            <select
              id={pageSizeId}
              className="input !w-auto !min-h-0 !py-1.5 !text-xs"
              value={table.getState().pagination.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
            >
              {[10, 25, 50, 100, 250].map((n) => (
                <option key={n} value={n}>
                  {n} / page
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <Dialog
        open={!!selected}
        onClose={() => setSelected(null)}
        subtitle={
          selected
            ? `${selected.conference} · ${fmtDateShort(selected.date)}`
            : undefined
        }
        title={
          selected ? `${selected.home} vs ${selected.visitor}` : ""
        }
        headerAside={
          selected ? (
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold text-white"
              style={{ background: GRADE_COLORS[selected.grade] || "#a1a1aa" }}
            >
              {GRADE_LABELS[selected.grade] || selected.grade}
            </span>
          ) : null
        }
      >
        {selected ? (
          <div className="flex flex-col gap-5 text-sm">
            <div className="text-ink-600">
              {selected.entryType} · {selected.playType} · Q
              {selected.period ?? "—"} {selected.time}
            </div>
            {selected.officials.length ? (
              <div className="flex gap-2 flex-wrap">
                {selected.officials.map((o) => (
                  <span key={o} className="chip">
                    {o}
                    {selected.positions.length ? (
                      <span className="text-ink-400">
                        {" "}
                        · {selected.positions.join("/")}
                      </span>
                    ) : null}
                  </span>
                ))}
              </div>
            ) : null}
            {selected.userComments ? (
              <div>
                <div className="eyebrow mb-1">User comments</div>
                <div className="text-ink-700 whitespace-pre-wrap">
                  {selected.userComments}
                </div>
              </div>
            ) : null}
            {selected.graderComments.length ? (
              <div>
                <div className="eyebrow mb-2">Grader comments</div>
                <div className="flex flex-col gap-2">
                  {selected.graderComments.map((c, i) => (
                    <div
                      key={i}
                      className="border-l-2 border-brand-300 pl-3 py-0.5"
                    >
                      <div className="text-xs text-ink-500">
                        <span className="font-semibold text-ink-700">
                          {c.author || "—"}
                        </span>
                        {c.timestamp ? ` · ${c.timestamp}` : null}
                      </div>
                      <div className="text-ink-800 mt-0.5 whitespace-pre-wrap">
                        {c.text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}

function q(v: string | number | null | undefined): string {
  if (v == null) return "";
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
