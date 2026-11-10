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

/**
 * The index sheet's date: the newest of the CV export, the R9lab counts and every figure on the
 * sheet, so the title block is never older than a number below it.
 */
export function indexDated(
  exported: string | undefined,
  statsAsOf: string,
  featured: { data: { figures?: Record<string, Figure> } }[],
): string | undefined {
  const figures = featured.flatMap((p) => Object.values(p.data.figures ?? {}).map((f) => f.as_of));
  return [exported, statsAsOf, participants.as_of, ...figures].filter(Boolean).sort().at(-1);
}
