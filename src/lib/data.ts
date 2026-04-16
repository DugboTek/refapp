// Legacy re-export shim. Prefer importing from:
//   - ./derivedData (for aggregates, synchronous)
//   - ./usePlays (for the full plays array, async via hook)
export { derived, allConferences, allEntryTypes, dateMin, dateMax } from "./derivedData";
export { usePlays } from "./usePlays";
