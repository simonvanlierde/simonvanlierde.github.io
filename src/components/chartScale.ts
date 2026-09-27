// Axis with a round 1/2/5 × 10ⁿ step. Whole counts get an integer step: a max
// of 2 would otherwise tick every 0.5 and format as "0,1,1,2,2".
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

// Stepped outline of a running total (`line`) and the same outline closed to
// the baseline (`area`). The path commands depend only on the month count, so
// CSS can transition `d` between measures.
export function stepPaths(tops: number[], left: number, colW: number, base: number): { line: string; area: string } {
  const steps = tops.map((top, i) => `V${top}H${left + (i + 1) * colW}`).join("");
  return {
    line: `M${left},${tops[0] ?? base}${steps}`,
    area: `M${left},${base}${steps}V${base}H${left}Z`,
  };
}

// Thousands separated by a thin space, the style the notes use.
export const formatCount = (n: number) => Math.round(n).toLocaleString("en-US").replace(/,/g, " ");

// Running totals, counted back from the payload's totals so the last column
// matches the notes. Months before the first nonzero `startKey` are dropped.
// Their counts stay in the totals.
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
