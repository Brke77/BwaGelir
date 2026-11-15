import type { DateRange, Frequency, RecurringRule } from "./types";

export function today(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
export function isDate(value: string): boolean {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    value < "1900-01-01" ||
    value > "2199-12-31"
  )
    return false;
  const date = new Date(value + "T12:00:00Z");
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}
export const dayLabel = (value: string, short = false) =>
  new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: short ? "short" : "long",
    year: short ? undefined : "numeric",
    timeZone: "UTC",
  }).format(new Date(value + "T12:00:00Z"));
export const monthLabel = (value: string) =>
  new Intl.DateTimeFormat("tr-TR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value.slice(0, 7) + "-01T12:00:00Z"));
export function addDays(value: string, count: number): string {
  const date = new Date(value + "T12:00:00Z");
  date.setUTCDate(date.getUTCDate() + count);
  return date.toISOString().slice(0, 10);
}
export function monthEnd(value: string): string {
  const date = new Date(value.slice(0, 7) + "-01T12:00:00Z");
  date.setUTCMonth(date.getUTCMonth() + 1, 0);
  return date.toISOString().slice(0, 10);
}
export const presets = [
  "Bugün",
  "Bu hafta",
  "Bu ay",
  "Geçen ay",
  "Son 3 ay",
  "Bu yıl",
  "Özel aralık",
] as const;
export function getRange(preset: string, now = today()): DateRange {
  const startOfMonth = now.slice(0, 7) + "-01";
  if (preset === "Bugün") return { start: now, end: now };
  if (preset === "Bu hafta") {
    const day = new Date(now + "T12:00:00Z").getUTCDay();
    return { start: addDays(now, -(day === 0 ? 6 : day - 1)), end: now };
  }
  if (preset === "Geçen ay") {
    const end = addDays(startOfMonth, -1);
    return { start: end.slice(0, 7) + "-01", end };
  }
  if (preset === "Son 3 ay") {
    const date = new Date(startOfMonth + "T12:00:00Z");
    date.setUTCMonth(date.getUTCMonth() - 2);
    return { start: date.toISOString().slice(0, 10), end: now };
  }
  if (preset === "Bu yıl")
    return { start: now.slice(0, 4) + "-01-01", end: now };
  return { start: startOfMonth, end: monthEnd(now) };
}
export function occurrenceDate(
  start: string,
  frequency: Frequency,
  index: number,
): string {
  if (frequency === "daily") return addDays(start, index);
  if (frequency === "weekly") return addDays(start, index * 7);
  const anchor = new Date(start + "T12:00:00Z");
  const day = anchor.getUTCDate();
  anchor.setUTCDate(1);
  anchor.setUTCMonth(
    anchor.getUTCMonth() + index * (frequency === "yearly" ? 12 : 1),
  );
  const lastDay = new Date(
    Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + 1, 0),
  ).getUTCDate();
  anchor.setUTCDate(Math.min(day, lastDay));
  return anchor.toISOString().slice(0, 10);
}
export function occurrences(
  rule: RecurringRule,
  from: string,
  until: string,
): string[] {
  const result: string[] = [];
  const end = rule.end_date && rule.end_date < until ? rule.end_date : until;
  if (!rule.active || end < rule.start_date) return result;
  for (let index = 0; index < 110000; index++) {
    const date = occurrenceDate(rule.start_date, rule.frequency, index);
    if (date > end) break;
    if (date >= from) result.push(date);
  }
  return result;
}
