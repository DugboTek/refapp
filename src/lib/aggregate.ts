import type { Bucket, Play } from "../data/types";
import { isCorrect, isGraded, isIncorrect } from "./grades";

export function emptyBucket(): Bucket {
  return { total: 0, graded: 0, correct: 0, incorrect: 0, grades: {} };
}

export function bump(b: Bucket, grade: string): void {
  b.total += 1;
  b.grades[grade] = (b.grades[grade] || 0) + 1;
  if (isGraded(grade)) b.graded += 1;
  if (isCorrect(grade)) b.correct += 1;
  if (isIncorrect(grade)) b.incorrect += 1;
}

/** Group plays by a key-returning function and compute a bucket per group. */
export function groupBuckets<T>(
  plays: Play[],
  keyFn: (p: Play) => T | T[] | null | undefined,
): Map<T, Bucket> {
  const out = new Map<T, Bucket>();
  for (const p of plays) {
    const k = keyFn(p);
    if (k == null) continue;
    const keys: T[] = Array.isArray(k) ? k : [k];
    for (const key of keys) {
      let bucket = out.get(key);
      if (!bucket) {
        bucket = emptyBucket();
        out.set(key, bucket);
      }
      bump(bucket, p.grade);
    }
  }
  return out;
}

export function sortedByTotal<K>(
  entries: [K, Bucket][],
  desc = true,
): [K, Bucket][] {
  return [...entries].sort((a, b) =>
    desc ? b[1].total - a[1].total : a[1].total - b[1].total,
  );
}

/** Top-N play types by volume. */
export function topByVolume<K>(m: Map<K, Bucket>, n = 15): [K, Bucket][] {
  return sortedByTotal([...m.entries()]).slice(0, n);
}
