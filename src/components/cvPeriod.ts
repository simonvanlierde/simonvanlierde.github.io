// Date helpers for the CV page. `cv-public.yaml` writes dates as `YYYY-MM`,
// bare `YYYY`, or the literal `present`; each renders differently.

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** `2024-04` -> `Apr 2024`; `2018` -> `2018`; `present` -> `Present`. */
export function formatDate(value: string): string {
  if (value === "present") return "Present";

  const [year, month] = value.split("-");
  if (!month) return year;

  return `${MONTHS[Number(month) - 1]} ${year}`;
}

/** An en dash range, e.g. `Apr 2024 – Present`. */
export function formatPeriod(start: string, end: string): string {
  return `${formatDate(start)} – ${formatDate(end)}`;
}
