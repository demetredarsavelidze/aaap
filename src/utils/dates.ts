import type { WeekStartDay } from '../types'

export function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1)
}

export function todayKey(): string {
  return toDateKey(new Date())
}

export function addDays(dateKey: string, days: number): string {
  const date = parseDateKey(dateKey)
  date.setDate(date.getDate() + days)
  return toDateKey(date)
}

export function startOfWeek(dateKey: string, weekStartsOn: WeekStartDay): string {
  const date = parseDateKey(dateKey)
  const day = date.getDay()
  const diff = weekStartsOn === 1 ? (day === 0 ? 6 : day - 1) : day
  date.setDate(date.getDate() - diff)
  return toDateKey(date)
}

export function weekKeys(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
}

export function isSameDay(a: string, b: string): boolean {
  return a === b
}

export function formatLongDate(dateKey: string): string {
  return parseDateKey(dateKey).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatShortDate(dateKey: string): string {
  return parseDateKey(dateKey).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

export function formatWeekday(dateKey: string): string {
  return parseDateKey(dateKey).toLocaleDateString(undefined, { weekday: 'short' })
}

export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

export function daysBetween(fromKey: string, toKey: string): number {
  const from = parseDateKey(fromKey).getTime()
  const to = parseDateKey(toKey).getTime()
  return Math.round((to - from) / 86_400_000)
}

export function rangeKeys(fromKey: string, toKey: string): string[] {
  const keys: string[] = []
  let cursor = fromKey
  while (cursor <= toKey) {
    keys.push(cursor)
    cursor = addDays(cursor, 1)
  }
  return keys
}

export function keysForRange(range: '7d' | '30d' | '90d' | 'all', earliest: string, today: string): string[] {
  if (range === 'all') {
    return rangeKeys(earliest > today ? today : earliest, today)
  }
  const days = range === '7d' ? 6 : range === '30d' ? 29 : 89
  return rangeKeys(addDays(today, -days), today)
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function isoNow(): string {
  return new Date().toISOString()
}
