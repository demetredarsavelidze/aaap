import { ChevronLeft, ChevronRight } from 'lucide-react'
import { addDays, formatLongDate } from '../utils/dates'
import { Button } from './ui/Button'

export function DateNav({
  date,
  onChange,
  today,
}: {
  date: string
  today: string
  onChange: (date: string) => void
}) {
  return (
    <div className="spread">
      <div>
        <div className="faint" style={{ fontSize: 12 }}>
          {date === today ? 'Today' : 'Historical day'}
        </div>
        <h1>{formatLongDate(date)}</h1>
      </div>
      <div className="row">
        <Button size="icon" aria-label="Previous day" onClick={() => onChange(addDays(date, -1))}>
          <ChevronLeft size={16} />
        </Button>
        <Button size="small" onClick={() => onChange(today)}>
          Today
        </Button>
        <Button size="icon" aria-label="Next day" onClick={() => onChange(addDays(date, 1))}>
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  )
}
