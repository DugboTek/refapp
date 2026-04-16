import { useId } from "react";
import { X } from "lucide-react";
import {
  allConferences,
  dateMax,
  dateMin,
} from "../../lib/derivedData";
import { GRADE_LABELS, GRADE_ORDER } from "../../lib/grades";
import { useGlobalFilters } from "../../lib/filters";

export default function FilterBar() {
  const { filters, setFilter, clear } = useGlobalFilters();
  const confId = useId();
  const gradeId = useId();
  const fromId = useId();
  const toId = useId();
  const anyActive =
    filters.conference ||
    filters.grade ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.team;

  return (
    <div className="border-b border-ink-200 bg-ink-50">
      <div className="px-5 md:px-10 py-4 max-w-[1600px] w-full mx-auto flex flex-wrap items-end gap-x-5 gap-y-3">
        <div className="flex flex-col">
          <label htmlFor={confId} className="field-label">
            Conference
          </label>
          <select
            id={confId}
            className="input !w-auto"
            value={filters.conference || ""}
            onChange={(e) => setFilter("conference", e.target.value || null)}
          >
            <option value="">All</option>
            {allConferences.map((c) => (
              <option key={c} value={c}>
                {c.replace("Men's Basketball", "MBB")}
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
            value={filters.grade || ""}
            onChange={(e) => setFilter("grade", e.target.value || null)}
          >
            <option value="">All grades</option>
            {GRADE_ORDER.map((g) => (
              <option key={g} value={g}>
                {GRADE_LABELS[g] || g}
              </option>
            ))}
          </select>
        </div>
        <fieldset className="flex flex-col border-0 p-0 m-0">
          <legend className="field-label">Date range</legend>
          <div className="flex items-center gap-2">
            <label htmlFor={fromId} className="sr-only">
              From
            </label>
            <input
              id={fromId}
              type="date"
              className="input !w-auto"
              min={dateMin}
              max={dateMax}
              value={filters.dateFrom || ""}
              onChange={(e) => setFilter("dateFrom", e.target.value || null)}
            />
            <span aria-hidden="true" className="text-ink-400">
              →
            </span>
            <label htmlFor={toId} className="sr-only">
              To
            </label>
            <input
              id={toId}
              type="date"
              className="input !w-auto"
              min={dateMin}
              max={dateMax}
              value={filters.dateTo || ""}
              onChange={(e) => setFilter("dateTo", e.target.value || null)}
            />
          </div>
        </fieldset>
        {anyActive ? (
          <button
            type="button"
            className="btn btn-sm self-end"
            onClick={clear}
          >
            <X size={14} aria-hidden="true" />
            Clear filters
          </button>
        ) : null}
      </div>
    </div>
  );
}
