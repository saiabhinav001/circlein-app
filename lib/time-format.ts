import { format, parseISO } from 'date-fns'

export type TimeFormat = '12h' | '24h'

/**
 * Master time formatter. All time display in the entire app goes
 * through this function. Never format time inline with .toLocaleTimeString()
 * or manual string manipulation anywhere else in the codebase.
 */
export function formatTime(
  time: string | Date,
  timeFormat: TimeFormat = '24h',
  options?: { showSeconds?: boolean }
): string {
  let date: Date
  if (typeof time === 'string') {
    const [h, m, s] = time.split(':').map(Number)
    date = new Date()
    date.setHours(h, m, s ?? 0, 0)
  } else {
    date = time
  }

  if (timeFormat === '12h') {
    const h = date.getHours()
    const m = date.getMinutes()
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hour12 = h % 12 || 12
    const mins = String(m).padStart(2, '0')
    return options?.showSeconds
      ? `${hour12}:${mins}:${String(date.getSeconds()).padStart(2, '0')} ${ampm}`
      : `${hour12}:${mins} ${ampm}`
  }

  const h = String(date.getHours()).padStart(2, '0')
  const m = String(date.getMinutes()).padStart(2, '0')
  return options?.showSeconds
    ? `${h}:${m}:${String(date.getSeconds()).padStart(2, '0')}`
    : `${h}:${m}`
}

export function formatTimeRange(
  startTime: string,
  endTime: string,
  timeFormat: TimeFormat = '24h'
): string {
  return `${formatTime(startTime, timeFormat)} - ${formatTime(endTime, timeFormat)}`
}

export function formatDateTime(
  date: Date | string,
  timeFormat: TimeFormat = '24h'
): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  const dateStr = format(d, 'dd MMM yyyy')
  const timeStr = formatTime(d, timeFormat)
  return `${dateStr}, ${timeStr}`
}

// Slot label helper used in the booking UI
export function formatSlot(slot: string, timeFormat: TimeFormat): string {
  if (slot.includes('-')) {
    const [start, end] = slot.split('-')
    return formatTimeRange(start, end, timeFormat)
  }
  return formatTime(slot, timeFormat)
}
