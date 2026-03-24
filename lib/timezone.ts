export const DEFAULT_TIME_ZONE = 'UTC';

export function isValidTimeZone(value?: string | null): boolean {
  if (!value) {
    return false;
  }

  try {
    Intl.DateTimeFormat('en-US', { timeZone: value }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export function resolveTimeZone(value?: string | null, fallback: string = DEFAULT_TIME_ZONE): string {
  if (isValidTimeZone(value)) {
    return value as string;
  }

  if (isValidTimeZone(fallback)) {
    return fallback;
  }

  return DEFAULT_TIME_ZONE;
}

export function formatDateInTimeZone(
  date: Date,
  timeZone: string,
  options: Intl.DateTimeFormatOptions = {}
): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: resolveTimeZone(timeZone),
    ...options,
  }).format(date);
}

export function formatTimeInTimeZone(
  date: Date,
  timeZone: string,
  options: Intl.DateTimeFormatOptions = {}
): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: resolveTimeZone(timeZone),
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    ...options,
  }).format(date);
}

export function formatDateTimeInTimeZone(
  date: Date,
  timeZone: string,
  options: Intl.DateTimeFormatOptions = {}
): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: resolveTimeZone(timeZone),
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    ...options,
  }).format(date);
}
