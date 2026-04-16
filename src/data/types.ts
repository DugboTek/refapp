export type GradeCode =
  | "CC"
  | "IC"
  | "NCC"
  | "NCI"
  | "INC"
  | "MCH"
  | "NOTE"
  | (string & {});

export interface GraderComment {
  author: string | null;
  text: string;
  timestamp: string | null;
}

export interface Play {
  id: number;
  conference: string;
  date: string; // ISO yyyy-mm-dd
  home: string;
  visitor: string;
  gameId: string;
  playNumber: string;
  entryType: string;
  playType: string;
  period: number | null;
  time: string;
  positions: string[];
  officials: string[];
  userComments: string;
  graderComments: GraderComment[];
  gradeRaw: string;
  grade: GradeCode;
}

export interface Bucket {
  total: number;
  graded: number;
  correct: number;
  incorrect: number;
  grades: Record<string, number>;
}

export interface OfficialAgg extends Bucket {
  name: string;
  positions: Record<string, number>;
  conferences: string[];
}

export interface GameAgg extends Bucket {
  gameId: string;
  date: string;
  home: string;
  visitor: string;
  conference: string;
  crew: string[];
}

export interface Derived {
  overall: Bucket;
  byConference: Record<string, Bucket>;
  byPlayType: Record<string, Bucket>;
  byEntryType: Record<string, Bucket>;
  byDate: Record<string, Bucket>;
  officials: OfficialAgg[];
  games: GameAgg[];
  topPlayTypes: string[];
  heatmap: Record<string, Record<string, Bucket>>;
  sankeyCounts: Record<string, number>;
  sankeyPlayTypes: string[];
  lateGameBuckets: Record<string, Bucket>;
  keywordCounts: Record<string, Record<string, number>>;
  generatedAt: string;
  playCount: number;
  gameCount: number;
  officialCount: number;
  dateMin: string;
  dateMax: string;
  conferences: string[];
  entryTypes: string[];
}
