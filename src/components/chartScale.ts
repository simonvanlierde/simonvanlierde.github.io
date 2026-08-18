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

export const BAR_RADIUS = 0; // a drawing has no rounded corners
export const ZERO_STUB = 2;

// A bar as a path rather than a <rect>: a zero value still draws a
// `ZERO_STUB`-tall sliver (an empty period must read as "zero", not as "no
// data"), and the command sequence is identical for every input, so browsers
// can interpolate `d` on measure switch. BAR_RADIUS is kept in the path so a
// world with rounded corners can set it without touching the geometry.
export function barPath(cx: number, width: number, top: number, base: number): string {
  const h = Math.max(base - top, ZERO_STUB);
  const y = base - h;
  const r = Math.min(BAR_RADIUS, width / 2, h);
  const x = cx - width / 2;
  return `M${x},${base}V${y + r}a${r},${r} 0 0 1 ${r},${-r}H${x + width - r}a${r},${r} 0 0 1 ${r},${r}V${base}Z`;
}
