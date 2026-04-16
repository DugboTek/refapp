// Reads the source Excel and emits normalized JSON + precomputed aggregates.
// plays.json goes to public/data/ so it stays out of the JS bundle.
// derived.json stays in src/data/ so aggregates can be imported statically
// by lightweight pages (Overview) without awaiting a fetch.

import * as XLSX from "xlsx";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SRC_XLSX = resolve(ROOT, "Higgins Portal All Evaluations.xlsx");
const DERIVED_DIR = resolve(ROOT, "src/data");
const PLAYS_DIR = resolve(ROOT, "public/data");

// ---------------- grade normalization ----------------
const GRADE_MAP = {
  "Correct Call (CC)": "CC",
  "Incorrect Call (IC)": "IC",
  "No Call Correct (NCC)": "NCC",
  "No Call Incorrect (NCI)": "NCI",
  "Inconclusive (INC)": "INC",
  "Mechanics (MCH)": "MCH",
  "Note/Comment": "NOTE",
};

function canonGrade(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  if (GRADE_MAP[s]) return GRADE_MAP[s];
  const m = s.match(/\(([A-Z]+)\)/);
  if (m) return m[1];
  if (s === "Note/Comment") return "NOTE";
  return s;
}

function isCorrect(code) {
  return code === "CC" || code === "NCC";
}
function isIncorrect(code) {
  return code === "IC" || code === "NCI";
}
function isGraded(code) {
  return (
    code === "CC" ||
    code === "NCC" ||
    code === "IC" ||
    code === "NCI" ||
    code === "INC"
  );
}

// ---------------- grader comment parser ----------------
function parseGraderComments(raw) {
  if (!raw) return [];
  const text = String(raw).trim();
  if (!text) return [];
  const results = [];
  const chunks = text
    .split(/\n+/)
    .map((c) => c.trim())
    .filter(Boolean);
  for (const chunk of chunks) {
    const tsMatch = chunk.match(
      /\(([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4}\s+[0-9]{1,2}:[0-9]{2}(?:AM|PM))\)\s*$/i,
    );
    let timestamp = null;
    let body = chunk;
    if (tsMatch) {
      timestamp = tsMatch[1];
      body = chunk.slice(0, tsMatch.index).trim();
    }
    const sep = body.indexOf(": ");
    let author = null;
    let message = body;
    if (sep > 0 && sep < 40) {
      author = body.slice(0, sep).trim();
      message = body.slice(sep + 2).trim();
    }
    results.push({ author, text: message, timestamp });
  }
  return results;
}

// ---------------- run ----------------
console.log("[build-data] reading", SRC_XLSX);
const wb = XLSX.read(readFileSync(SRC_XLSX), { type: "buffer", cellDates: true });
const ws = wb.Sheets[wb.SheetNames[0]];

const rows = XLSX.utils.sheet_to_json(ws, {
  header: 1,
  defval: null,
  raw: true,
});

const header = rows[2];
const dataRows = rows
  .slice(3)
  .filter((r) => r && r.some((v) => v !== null && v !== ""));

console.log(`[build-data] rows=${dataRows.length}`);

const COL = {};
header.forEach((name, i) => {
  COL[String(name).trim()] = i;
});

function g(row, key) {
  const idx = COL[key];
  if (idx === undefined) return null;
  return row[idx];
}

function toISODate(v) {
  if (!v) return null;
  if (v instanceof Date) {
    const y = v.getUTCFullYear();
    const m = String(v.getUTCMonth() + 1).padStart(2, "0");
    const d = String(v.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const s = String(v).trim();
  const m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  const m2 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m2) return `${m2[3]}-${m2[1].padStart(2, "0")}-${m2[2].padStart(2, "0")}`;
  return s;
}

function splitList(v) {
  if (!v) return [];
  return String(v)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const plays = dataRows.map((r, i) => {
  const dateISO = toISODate(g(r, "Game Date"));
  const home = g(r, "Home Team") || "";
  const visitor = g(r, "Visitor Team") || "";
  const gameId = `${dateISO}|${home}|${visitor}`;
  const gradeRaw = g(r, "Grade");
  const grade = canonGrade(gradeRaw);
  const positions = splitList(g(r, "Positions"));
  const officials = splitList(g(r, "Calling Users"));
  const graderComments = parseGraderComments(g(r, "Grader Comments"));
  return {
    id: i,
    conference: g(r, "Conference") || "",
    date: dateISO,
    home,
    visitor,
    gameId,
    playNumber: g(r, "Play Number") || "",
    entryType: g(r, "Entry Type") || "",
    playType: g(r, "Play Type") || "",
    period: g(r, "Period"),
    time: g(r, "Time") || "",
    positions,
    officials,
    userComments: g(r, "User Comments") || "",
    graderComments,
    gradeRaw: gradeRaw || "",
    grade,
  };
});

// ---------------- derived aggregates ----------------
function bumpGrade(bucket, code) {
  bucket.total += 1;
  bucket.grades[code] = (bucket.grades[code] || 0) + 1;
  if (isGraded(code)) bucket.graded += 1;
  if (isCorrect(code)) bucket.correct += 1;
  if (isIncorrect(code)) bucket.incorrect += 1;
}

function emptyBucket() {
  return { total: 0, graded: 0, correct: 0, incorrect: 0, grades: {} };
}

const overall = emptyBucket();
for (const p of plays) bumpGrade(overall, p.grade);

const byConference = {};
for (const p of plays) {
  if (!byConference[p.conference]) byConference[p.conference] = emptyBucket();
  bumpGrade(byConference[p.conference], p.grade);
}

const byPlayType = {};
for (const p of plays) {
  if (!byPlayType[p.playType]) byPlayType[p.playType] = emptyBucket();
  bumpGrade(byPlayType[p.playType], p.grade);
}

const byEntryType = {};
for (const p of plays) {
  if (!byEntryType[p.entryType]) byEntryType[p.entryType] = emptyBucket();
  bumpGrade(byEntryType[p.entryType], p.grade);
}

const byDate = {};
for (const p of plays) {
  if (!byDate[p.date]) byDate[p.date] = emptyBucket();
  bumpGrade(byDate[p.date], p.grade);
}

const byOfficial = {};
for (const p of plays) {
  for (const who of p.officials) {
    if (!byOfficial[who]) {
      byOfficial[who] = {
        name: who,
        conferences: new Set(),
        positions: {},
        ...emptyBucket(),
      };
    }
    const row = byOfficial[who];
    row.conferences.add(p.conference);
    for (const pos of p.positions) {
      row.positions[pos] = (row.positions[pos] || 0) + 1;
    }
    bumpGrade(row, p.grade);
  }
}
const officialsArr = Object.values(byOfficial).map((o) => ({
  name: o.name,
  total: o.total,
  graded: o.graded,
  correct: o.correct,
  incorrect: o.incorrect,
  grades: o.grades,
  positions: o.positions,
  conferences: Array.from(o.conferences),
}));

const byGame = {};
for (const p of plays) {
  if (!byGame[p.gameId]) {
    byGame[p.gameId] = {
      gameId: p.gameId,
      date: p.date,
      home: p.home,
      visitor: p.visitor,
      conference: p.conference,
      crew: new Set(),
      ...emptyBucket(),
    };
  }
  const game = byGame[p.gameId];
  for (const who of p.officials) game.crew.add(who);
  bumpGrade(game, p.grade);
}
const gamesArr = Object.values(byGame).map((g) => ({
  gameId: g.gameId,
  date: g.date,
  home: g.home,
  visitor: g.visitor,
  conference: g.conference,
  total: g.total,
  graded: g.graded,
  correct: g.correct,
  incorrect: g.incorrect,
  grades: g.grades,
  crew: Array.from(g.crew),
}));

const topPlayTypes = Object.entries(byPlayType)
  .sort((a, b) => b[1].total - a[1].total)
  .slice(0, 20)
  .map(([k]) => k);

const positionNames = ["Lead", "Center", "Trail"];
const heatmap = {};
for (const pos of positionNames) heatmap[pos] = {};
for (const p of plays) {
  if (!topPlayTypes.includes(p.playType)) continue;
  for (const pos of p.positions) {
    if (!positionNames.includes(pos)) continue;
    if (!heatmap[pos][p.playType]) heatmap[pos][p.playType] = emptyBucket();
    bumpGrade(heatmap[pos][p.playType], p.grade);
  }
}

const topPlayTypesSankey = topPlayTypes.slice(0, 15);
const sankeyCounts = {};
for (const p of plays) {
  if (!topPlayTypesSankey.includes(p.playType)) continue;
  const et = p.entryType || "Unknown";
  const pt = p.playType;
  const gr = p.grade || "Unknown";
  const k1 = `${et}||${pt}`;
  const k2 = `${pt}||${gr}`;
  sankeyCounts[k1] = (sankeyCounts[k1] || 0) + 1;
  sankeyCounts[k2] = (sankeyCounts[k2] || 0) + 1;
}

function parseClock(t) {
  if (!t) return null;
  const m = String(t).match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}
const lateGameBuckets = {};
for (const p of plays) {
  if (p.period !== 2) continue;
  const sec = parseClock(p.time);
  if (sec == null) continue;
  const bucket = Math.floor(sec / 120);
  if (!lateGameBuckets[bucket]) lateGameBuckets[bucket] = emptyBucket();
  bumpGrade(lateGameBuckets[bucket], p.grade);
}

const KEYWORDS = [
  "good call",
  "missed",
  "travel",
  "block",
  "charge",
  "push",
  "hold",
  "agree",
  "disagree",
  "whistle",
  "late",
  "correct",
  "incorrect",
  "no call",
  "freedom of movement",
  "illegal",
  "contact",
  "verticality",
];
const keywordCounts = {};
for (const p of plays) {
  const bucket = p.grade || "Unknown";
  if (!keywordCounts[bucket]) keywordCounts[bucket] = {};
  for (const c of p.graderComments) {
    const t = (c.text || "").toLowerCase();
    for (const kw of KEYWORDS) {
      if (t.includes(kw)) {
        keywordCounts[bucket][kw] = (keywordCounts[bucket][kw] || 0) + 1;
      }
    }
  }
}

// ---------------- write ----------------
mkdirSync(DERIVED_DIR, { recursive: true });
mkdirSync(PLAYS_DIR, { recursive: true });

// plays.json goes to public/data/ (served as static asset, fetched on demand)
writeFileSync(resolve(PLAYS_DIR, "plays.json"), JSON.stringify(plays));

const derived = {
  overall,
  byConference,
  byPlayType,
  byEntryType,
  byDate,
  officials: officialsArr,
  games: gamesArr,
  topPlayTypes,
  heatmap,
  sankeyCounts,
  sankeyPlayTypes: topPlayTypesSankey,
  lateGameBuckets,
  keywordCounts,
  generatedAt: new Date().toISOString(),
  playCount: plays.length,
  gameCount: gamesArr.length,
  officialCount: officialsArr.length,
  dateMin: plays.reduce(
    (a, p) => (p.date && (!a || p.date < a) ? p.date : a),
    "",
  ),
  dateMax: plays.reduce(
    (a, p) => (p.date && (!a || p.date > a) ? p.date : a),
    "",
  ),
  conferences: Array.from(new Set(plays.map((p) => p.conference))).sort(),
  entryTypes: Array.from(new Set(plays.map((p) => p.entryType))).sort(),
};

writeFileSync(resolve(DERIVED_DIR, "derived.json"), JSON.stringify(derived));

const sumConfs = Object.values(byConference).reduce((a, b) => a + b.total, 0);
console.log(
  `[build-data] wrote public/data/plays.json (${plays.length} rows) and src/data/derived.json (${officialsArr.length} officials, ${gamesArr.length} games, conference sum=${sumConfs})`,
);
