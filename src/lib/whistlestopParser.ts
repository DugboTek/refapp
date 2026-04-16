import type {
  GameLog,
  WhistleEvent,
  EventType,
  ActionType,
} from "../data/whistlestopTypes";

/**
 * Parse a raw .log file into a structured GameLog.
 * Handles the header metadata and event lines between START/END markers.
 */
export function parseLog(raw: string, filename: string): GameLog {
  const lines = raw.split(/\r?\n/).map((l) => l.trim());

  // Extract header fields
  const get = (key: string): string => {
    const line = lines.find((l) => l.startsWith(key + ":"));
    return line ? line.slice(key.length + 1).trim() : "";
  };

  const sport = get("Sport");
  const event = get("Event");
  const location = get("Location");
  const dateRaw = get("Date"); // e.g. "3/12/26" or "1/11/26" or "12/21/25"

  // Parse date to ISO
  const date = parseDate(dateRaw);

  // Collect operators (skip empty, STANDBY, SPARE, TIMEKEEP variants)
  const opNames: string[] = [];
  for (let i = 1; i <= 4; i++) {
    const name = get(`NameWP${i}`);
    if (name && !isSkipName(name)) opNames.push(name);
  }
  const timeKeeper = get("TimeKeeper");

  // Find START and END markers
  const startIdx = lines.findIndex((l) => l.includes("-------START-------"));
  const endIdx = lines.findIndex((l) => l.includes("--------END--------"));
  const eventLines =
    startIdx >= 0 && endIdx > startIdx
      ? lines.slice(startIdx + 1, endIdx)
      : [];

  const events: WhistleEvent[] = [];
  for (let i = 0; i < eventLines.length; i++) {
    const parsed = parseEventLine(eventLines[i], i);
    if (parsed) events.push(parsed);
  }

  // Derive ID from filename
  const id = filename.replace(/\.log$/, "").replace(/[^a-zA-Z0-9-]/g, "-");

  return {
    id,
    sport,
    event,
    location,
    date,
    operators: opNames,
    timeKeeper,
    events,
  };
}

function isSkipName(name: string): boolean {
  const lower = name.toLowerCase();
  return (
    lower === "standby" ||
    lower === "spare" ||
    lower === "timekeep" ||
    lower === ""
  );
}

/**
 * Parse a single event line like "WP 19:12 DOUG Stop"
 */
function parseEventLine(
  line: string,
  lineIndex: number,
): WhistleEvent | null {
  // Match: (WP|AP) (TIME) (NAME) (Start|Stop)
  const match = line.match(
    /^(WP|AP)\s+([\d:.]+)\s+(.+?)\s+(Start|Stop)\s*$/,
  );
  if (!match) return null;

  const type = match[1] as EventType;
  const timeRaw = match[2];
  const operator = match[3].trim();
  const action = match[4] as ActionType;
  const timeSeconds = parseTimeToSeconds(timeRaw);

  return { type, timeRaw, timeSeconds, operator, action, lineIndex };
}

/**
 * Convert a game clock time string to seconds.
 * "19:12" → 19*60+12 = 1152
 * "0:39.2" → 39.2
 * "0:04.9" → 4.9
 */
function parseTimeToSeconds(raw: string): number {
  const parts = raw.split(":");
  if (parts.length === 2) {
    const min = parseInt(parts[0], 10);
    const sec = parseFloat(parts[1]);
    return min * 60 + sec;
  }
  return parseFloat(raw);
}

/**
 * Parse date from "M/D/YY" format to "YYYY-MM-DD" ISO.
 * Assumes years < 50 are 2000s, >= 50 are 1900s.
 */
function parseDate(raw: string): string {
  if (!raw) return "";
  const parts = raw.split("/");
  if (parts.length !== 3) return raw;
  const m = parseInt(parts[0], 10);
  const d = parseInt(parts[1], 10);
  let y = parseInt(parts[2], 10);
  if (y < 100) y += y < 50 ? 2000 : 1900;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
