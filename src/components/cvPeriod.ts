// Date helpers for the CV page. `cv-public.yaml` writes dates as `YYYY-MM`,
// bare `YYYY`, or the literal `present`; each renders differently.

/** The only date shapes the export may write; anything else fails the build in cv.ts. */
export const CV_DATE = /^(present|\d{4}(-(0[1-9]|1[0-2]))?)$/;

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

/**
 * An ISO timestamp as a long English date, e.g. `18 August 2026`. Always UTC,
 * so it names the same day as `isoDay`.
 */
export function formatIsoDate(value: string): string {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * The UTC calendar day of an ISO timestamp, e.g. `2026-08-18`. Not a slice of
 * the string: `2026-10-29T00:30:00+02:00` is still 28 October in UTC.
 */
export const isoDay = (value: string): string => new Date(value).toISOString().slice(0, 10);
