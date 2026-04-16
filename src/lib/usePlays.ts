import { useSyncExternalStore, useEffect } from "react";
import type { Play } from "../data/types";
import { getPlaysSnapshot, loadPlays, subscribePlays } from "./playsLoader";

/** Hook that returns plays once loaded, null while fetching. */
export function usePlays(): Play[] | null {
  const plays = useSyncExternalStore(
    subscribePlays,
    getPlaysSnapshot,
    getPlaysSnapshot,
  );
  useEffect(() => {
    if (plays == null) {
      loadPlays().catch((err) => {
        console.error("[usePlays] failed", err);
      });
    }
  }, [plays]);
  return plays;
}
