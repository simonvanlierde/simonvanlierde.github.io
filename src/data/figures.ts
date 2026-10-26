import type { Figure } from "./projectSchema.ts";

// Figures on the index sheet that are not project-card figures.

/** The public endpoint scripts/fetch-stats.mjs copies src/data/stats.json from. */
export const statsSource = "https://api.r9lab.io/v1/stats/totals";

/** Not in the stats API: counted at the two pilot workshops, and kept by hand. */
export const participants: Figure = {
  value: "135",
  source: "https://docs.r9lab.io/project/",
  as_of: "2026-10-10",
};
