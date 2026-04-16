import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import type { Play } from "../data/types";
import { usePlays } from "./usePlays";

export interface GlobalFilters {
  conference: string | null;
  grade: string | null;
  dateFrom: string | null;
  dateTo: string | null;
  team: string | null;
}

const KEYS: Record<keyof GlobalFilters, string> = {
  conference: "conf",
  grade: "grade",
  dateFrom: "from",
  dateTo: "to",
  team: "team",
};

export function useGlobalFilters(): {
  filters: GlobalFilters;
  setFilter: (key: keyof GlobalFilters, value: string | null) => void;
  clear: () => void;
  filtered: Play[] | null;
  loading: boolean;
} {
  const [params, setParams] = useSearchParams();
  const allPlays = usePlays();

  const filters: GlobalFilters = {
    conference: params.get("conf"),
    grade: params.get("grade"),
    dateFrom: params.get("from"),
    dateTo: params.get("to"),
    team: params.get("team"),
  };

  const setFilter = (key: keyof GlobalFilters, value: string | null) => {
    const next = new URLSearchParams(params);
    const pkey = KEYS[key];
    if (value == null || value === "") next.delete(pkey);
    else next.set(pkey, value);
    setParams(next, { replace: true });
  };

  const clear = () => setParams(new URLSearchParams(), { replace: true });

  const filtered = useMemo(() => {
    if (!allPlays) return null;
    return allPlays.filter((p) => {
      if (filters.conference && p.conference !== filters.conference) return false;
      if (filters.grade && p.grade !== filters.grade) return false;
      if (filters.dateFrom && p.date < filters.dateFrom) return false;
      if (filters.dateTo && p.date > filters.dateTo) return false;
      if (
        filters.team &&
        p.home !== filters.team &&
        p.visitor !== filters.team
      )
        return false;
      return true;
    });
  }, [
    allPlays,
    filters.conference,
    filters.grade,
    filters.dateFrom,
    filters.dateTo,
    filters.team,
  ]);

  return {
    filters,
    setFilter,
    clear,
    filtered,
    loading: allPlays == null,
  };
}

/** Build a URL search string preserving the current filters, so detail-page links
 *  carry filter context forward. */
export function withFilters(
  params: URLSearchParams,
  extra?: Record<string, string>,
): string {
  const next = new URLSearchParams(params);
  if (extra) {
    for (const [k, v] of Object.entries(extra)) next.set(k, v);
  }
  const s = next.toString();
  return s ? `?${s}` : "";
}
