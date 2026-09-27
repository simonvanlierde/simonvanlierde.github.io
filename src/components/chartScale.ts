// Build an axis with a "nice" round step (1/2/5 × 10ⁿ) so tick labels are
// evenly spaced and never collide after formatting. For whole-count measures
// the step is forced to an integer, so e.g. a max of 2 gives ticks 0,1,2
// rather than 0,0.5,1,1.5,2 (which round to a duplicated "0,1,1,2,2").
export function buildScale(max: number, integer: boolean): { yMax: number; ticks: number[] } {
  const targetSteps = 4;
  const rawStep = max / targetSteps || 1;
  const mag = 10 ** Math.floor(Math.log10(rawStep));
  const norm = rawStep / mag;
  let step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
  if (integer) step = Math.max(1, Math.round(step));
  const yMax = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let t = 0; t <= yMax + step / 1000; t += step) ticks.push(t);
  return { yMax, ticks };
}

// A running total as a step: each month holds its value flat across its own
// column and rises at the column edge, which is how a count that only grows
// actually behaves. Returns the outline (`line`) and the same outline closed
// down to the baseline (`area`). The command sequence depends only on the
// number of months, never on the values, so browsers can interpolate `d`
// between measures.
export function stepPaths(tops: number[], left: number, colW: number, base: number): { line: string; area: string } {
  const steps = tops.map((top, i) => `V${top}H${left + (i + 1) * colW}`).join("");
  return {
    line: `M${left},${tops[0] ?? base}${steps}`,
    area: `M${left},${base}${steps}V${base}H${left}Z`,
  };
}

// Counts in the drafting hand's thousands style (a thin space, as the notes set
// them), so "1 779" reads the same in the notes, the chart, and its table.
export const formatCount = (n: number) => Math.round(n).toLocaleString("en-US").replace(/,/g, " ");

// Running totals, anchored to the payload's own totals so the last column
// always equals the figure in the notes. Months before `startKey` first moves
// (the platform took sign-ups before anyone took a product apart) are not
// drawn as a run of empty columns; their counts are already in the totals.
export function runningTotals<K extends string, R extends { period: string; label: string } & Record<K, number>>(
  rows: R[],
  keys: readonly K[],
  totals: Record<K, number>,
  startKey: K,
): (R & { total: Record<K, number> })[] {
  const total = { ...totals };
  const withTotals = rows
    .toReversed()
    .map((row) => {
      const snapshot = { ...total };
      for (const k of keys) total[k] -= Number(row[k]) || 0;
      return { ...row, total: snapshot };
    })
    .toReversed();
  const start = rows.findIndex((row) => row[startKey] > 0);
  return start === -1 ? withTotals : withTotals.slice(start);
}
