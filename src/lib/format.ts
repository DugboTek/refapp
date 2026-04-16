import { format, parseISO } from "date-fns";

export function fmtDate(iso: string): string {
  try {
    return format(parseISO(iso), "MMM d, yyyy");
  } catch {
    return iso;
  }
}

export function fmtDateShort(iso: string): string {
  try {
    return format(parseISO(iso), "MMM d");
  } catch {
    return iso;
  }
}

export function fmtNum(n: number): string {
  return n.toLocaleString("en-US");
}

export function slugify(s: string): string {
  return encodeURIComponent(s.trim());
}

export function unslug(s: string): string {
  return decodeURIComponent(s);
}
