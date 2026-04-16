// Async loader for the large plays.json asset.
// The file is served from /data/plays.json (public/) so it lives outside
// the JS bundle and can be CDN-cached independently of code changes.

import type { Play } from "../data/types";

let cache: Play[] | null = null;
let inflight: Promise<Play[]> | null = null;
const listeners = new Set<() => void>();

export function getPlaysSnapshot(): Play[] | null {
  return cache;
}

export function subscribePlays(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function loadPlays(): Promise<Play[]> {
  if (cache) return Promise.resolve(cache);
  if (!inflight) {
    inflight = fetch("/data/plays.json", { cache: "force-cache" })
      .then((r) => {
        if (!r.ok) {
          throw new Error(`Failed to load plays.json: ${r.status}`);
        }
        return r.json();
      })
      .then((data: Play[]) => {
        cache = data;
        for (const l of listeners) l();
        return data;
      })
      .catch((err) => {
        inflight = null;
        throw err;
      });
  }
  return inflight;
}

// Start loading on idle after module import so it's warm by the time a
// data-heavy route is visited.
if (typeof window !== "undefined") {
  const warm = () => loadPlays().catch(() => undefined);
  if ("requestIdleCallback" in window) {
    (window as any).requestIdleCallback(warm, { timeout: 2000 });
  } else {
    setTimeout(warm, 500);
  }
}
