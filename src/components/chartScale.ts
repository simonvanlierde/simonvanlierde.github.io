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
