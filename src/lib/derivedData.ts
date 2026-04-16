// Synchronous import of the small aggregates file. Safe to use anywhere,
// does not require waiting for the large plays.json fetch.
import derivedRaw from "../data/derived.json";
import type { Derived } from "../data/types";

export const derived = derivedRaw as unknown as Derived;

export const allConferences: string[] = derived.conferences || [];
export const allEntryTypes: string[] = derived.entryTypes || [];
export const dateMin: string = derived.dateMin || "";
export const dateMax: string = derived.dateMax || "";
