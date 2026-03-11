import {
  addDays,
  endOfISOWeek,
  format,
  getISOWeek,
  getISOWeekYear,
  parseISO,
  startOfISOWeek,
  subWeeks,
} from "date-fns";

export function todayKey(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function currentWeekKey(): string {
  return weekKeyFromDate(new Date());
}

export function weekKeyFromDate(date: Date): string {
  const year = getISOWeekYear(date);
  const week = String(getISOWeek(date)).padStart(2, "0");
  return `${year}-W${week}`;
}

export function weekDatesFromStart(weekStart: Date): string[] {
  return Array.from({ length: 7 }, (_, i) =>
    format(addDays(weekStart, i), "yyyy-MM-dd"),
  );
}

export function currentWeekDates(): string[] {
  return weekDatesFromStart(startOfISOWeek(new Date()));
}

export function weekStartFromKey(weekKey: string): Date {
  // Parse "2026-W11" => startOfISOWeek
  const [yearStr, wStr] = weekKey.split("-W");
  const year = Number.parseInt(yearStr, 10);
  const week = Number.parseInt(wStr, 10);
  // Jan 4 of the year is always in ISO week 1
  const jan4 = new Date(year, 0, 4);
  const weekOneStart = startOfISOWeek(jan4);
  return addDays(weekOneStart, (week - 1) * 7);
}

export function weekLabel(weekStart: Date): string {
  const end = endOfISOWeek(weekStart);
  const startStr = format(weekStart, "MMM d");
  const endStr =
    weekStart.getMonth() === end.getMonth()
      ? format(end, "d")
      : format(end, "MMM d");
  const year = format(end, "yyyy");
  return `${startStr}–${endStr}, ${year}`;
}

export function dateToWeekKey(dateStr: string): string {
  const d = parseISO(dateStr);
  return weekKeyFromDate(d);
}

export function getPastWeeks(count: number): Date[] {
  const result: Date[] = [];
  for (let i = 1; i <= count; i++) {
    result.push(startOfISOWeek(subWeeks(new Date(), i)));
  }
  return result;
}
