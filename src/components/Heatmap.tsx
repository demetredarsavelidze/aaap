import { addDays, rangeKeys, todayKey } from '../utils/dates'

export function Heatmap({ dates, weeks = 16 }: { dates: string[]; weeks?: number }) {
  const today = todayKey()
  const start = addDays(today, -(weeks * 7 - 1))
  const keys = rangeKeys(start, today)
  const counts = new Map<string, number>()
  for (const date of dates) counts.set(date, (counts.get(date) ?? 0) + 1)

  return (
    <div className="heatmap" aria-label="Completion heatmap">
      {keys.map((date) => {
        const count = counts.get(date) ?? 0
        const level = count === 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : count <= 4 ? 3 : 4
        return (
          <div
            key={date}
            className={`heat-cell heat-${level}`}
            title={`${date}: ${count} completion${count === 1 ? '' : 's'}`}
          />
        )
      })}
    </div>
  )
}
