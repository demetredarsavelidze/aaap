export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function round1(value: number): number {
  return Math.round(value * 10) / 10
}

export function percent(part: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((part / total) * 100)
}

export function average(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, n) => sum + n, 0) / values.length
}

export function sumBy<T>(items: T[], pick: (item: T) => number): number {
  return items.reduce((sum, item) => sum + pick(item), 0)
}
