/** Whistle Stop log data types */

export type EventType = "WP" | "AP";
export type ActionType = "Start" | "Stop";

export interface WhistleEvent {
  /** WP (Whistle Press) or AP (Administrative/Auto Press) */
  type: EventType;
  /** Raw time string from the log, e.g. "19:12" or "0:39.2" */
  timeRaw: string;
  /** Time in seconds from start of period (20:00 countdown) */
  timeSeconds: number;
  /** Name of the operator who triggered the event */
  operator: string;
  /** Start or Stop */
  action: ActionType;
  /** Line index within the game log (for ordering) */
  lineIndex: number;
}

export interface GameLog {
  /** Filename-derived ID */
  id: string;
  sport: string;
  event: string;
  location: string;
  /** ISO date string yyyy-mm-dd */
  date: string;
  /** Named whistle operators (WP1–WP4) */
  operators: string[];
  timeKeeper: string;
  events: WhistleEvent[];
}

export interface OperatorStats {
  name: string;
  totalEvents: number;
  starts: number;
  stops: number;
  wpEvents: number;
  apEvents: number;
  gamesWorked: number;
  gameIds: string[];
}

export interface GameSummary {
  id: string;
  event: string;
  date: string;
  location: string;
  totalEvents: number;
  wpEvents: number;
  apEvents: number;
  starts: number;
  stops: number;
  operators: string[];
  durationBuckets: Record<string, number>;
}
