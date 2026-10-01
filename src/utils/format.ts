import {
  differenceInCalendarDays,
  format,
  formatDistanceToNowStrict,
  isAfter,
  isValid,
  parseISO,
  startOfDay,
} from 'date-fns';

export function toDate(value: string | Date): Date {
  return typeof value === 'string' ? parseISO(value) : value;
}

export function formatDate(value?: string | Date, pattern = 'd MMM yyyy'): string {
  if (!value) return '—';
  const date = toDate(value);
  return isValid(date) ? format(date, pattern) : '—';
}

export function formatShortDate(value?: string | Date): string {
  return formatDate(value, 'd MMM');
}

export function formatDateTime(value?: string | Date): string {
  return formatDate(value, "d MMM yyyy 'at' HH:mm");
}

export function formatRelative(value?: string | Date): string {
  if (!value) return '—';
  const date = toDate(value);
  if (!isValid(date)) return '—';
  return `${formatDistanceToNowStrict(date)} ago`;
}

export function daysUntil(value?: string | Date): number | undefined {
  if (!value) return undefined;
  const date = toDate(value);
  if (!isValid(date)) return undefined;
  return differenceInCalendarDays(startOfDay(date), startOfDay(new Date()));
}

export function isOverdue(dueDate: string | undefined, isComplete: boolean): boolean {
  if (!dueDate || isComplete) return false;
  const date = toDate(dueDate);
  return isValid(date) && !isAfter(startOfDay(date), startOfDay(new Date()));
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

export function titleCase(value: string): string {
  return value
    .split(/[_\s-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function pluralise(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function percent(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
