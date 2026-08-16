import { useMemo, useState } from 'react'
import { Button } from '../components/ui/Button'
import { Card, CardTitle } from '../components/ui/Card'
import { Field, Input, Textarea } from '../components/ui/Field'
import { DateNav } from '../components/DateNav'
import { upsertDailyReview, upsertWeeklyReview } from '../services/reviewService'
import { weeklySummary } from '../services/selectors'
import { useApp } from '../store/useApp'
import { addDays, startOfWeek, todayKey } from '../utils/dates'

export function ReviewPage() {
  const { state, patch, toast } = useApp()
  const today = todayKey()
  const [tab, setTab] = useState<'daily' | 'weekly'>('daily')
  const [date, setDate] = useState(today)
  const [weekStart, setWeekStart] = useState(startOfWeek(today, state.settings.weekStartsOn))
  const daily = state.dailyReviews.find((item) => item.date === date)
  const weekly = state.weeklyReviews.find((item) => item.weekStart === weekStart)
  const summary = useMemo(() => weeklySummary(state, weekStart), [state, weekStart])

  return (
    <>
      <div className="spread">
        <div>
          <h1>Review</h1>
          <p className="muted">Close the loop. Facts first, then judgment.</p>
        </div>
        <div className="tabs">
          <Button size="small" variant={tab === 'daily' ? 'primary' : 'default'} onClick={() => setTab('daily')}>
            Daily
          </Button>
          <Button size="small" variant={tab === 'weekly' ? 'primary' : 'default'} onClick={() => setTab('weekly')}>
            Weekly
          </Button>
        </div>
      </div>

      {tab === 'daily' ? (
        <>
          <DateNav date={date} today={today} onChange={setDate} />
          <DailyForm
            key={date}
            date={date}
            initial={daily}
            onSave={(input) => {
              patch((current) => upsertDailyReview(current, input))
              toast('Daily review saved.')
            }}
          />
        </>
      ) : (
        <>
          <div className="row">
            <Button size="small" onClick={() => setWeekStart(addDays(weekStart, -7))}>
              Previous week
            </Button>
            <Button size="small" onClick={() => setWeekStart(startOfWeek(today, state.settings.weekStartsOn))}>
              This week
            </Button>
            <Button size="small" onClick={() => setWeekStart(addDays(weekStart, 7))}>
              Next week
            </Button>
          </div>
          <Card>
            <CardTitle>Week of {weekStart}</CardTitle>
            <div className="grid-3">
              <Compare label="Tasks completed" current={summary.tasksCompleted} previous={summary.prev.tasksCompleted} />
              <Compare label="Tasks missed" current={summary.tasksMissed} previous={0} hidePrev />
              <Compare label="Habit completion" current={summary.habitCompletion} previous={summary.prev.habitCompletion} suffix="%" />
              <Compare label="Focus hours" current={summary.focusHours} previous={summary.prev.focusHours} />
              <Compare label="XP gained" current={summary.xpGained} previous={summary.prev.xpGained} />
              <div className="stat">
                <span className="stat-label">Goals progressed</span>
                <strong>{summary.goalsProgressed}</strong>
              </div>
              <div className="stat">
                <span className="stat-label">Strongest area</span>
                <strong>{summary.strongest}</strong>
              </div>
              <div className="stat">
                <span className="stat-label">Weakest area</span>
                <strong>{summary.weakest}</strong>
              </div>
            </div>
          </Card>
          <WeeklyForm
            key={weekStart}
            weekStart={weekStart}
            initial={weekly}
            onSave={(input) => {
              patch((current) => upsertWeeklyReview(current, input))
              toast('Weekly review saved.')
            }}
          />
        </>
      )}
    </>
  )
}

function Compare({
  label,
  current,
  previous,
  suffix = '',
  hidePrev,
}: {
  label: string
  current: number
  previous: number
  suffix?: string
  hidePrev?: boolean
}) {
  const delta = current - previous
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <strong>
        {current}
        {suffix}
      </strong>
      {hidePrev ? null : (
        <span className={delta >= 0 ? 'trend-up' : 'trend-down'}>
          {delta >= 0 ? '+' : ''}
          {delta}
          {suffix} vs previous week
        </span>
      )}
    </div>
  )
}

function DailyForm({
  date,
  initial,
  onSave,
}: {
  date: string
  initial?: {
    accomplished: string
    wentWell: string
    wastedTime: string
    avoided: string
    improve: string
    tomorrowPriorities: string
    rating: number
  }
  onSave: (input: {
    date: string
    accomplished: string
    wentWell: string
    wastedTime: string
    avoided: string
    improve: string
    tomorrowPriorities: string
    rating: number
  }) => void
}) {
  const [accomplished, setAccomplished] = useState(initial?.accomplished ?? '')
  const [wentWell, setWentWell] = useState(initial?.wentWell ?? '')
  const [wastedTime, setWastedTime] = useState(initial?.wastedTime ?? '')
  const [avoided, setAvoided] = useState(initial?.avoided ?? '')
  const [improve, setImprove] = useState(initial?.improve ?? '')
  const [tomorrowPriorities, setTomorrowPriorities] = useState(initial?.tomorrowPriorities ?? '')
  const [rating, setRating] = useState(initial?.rating ?? 5)

  return (
    <Card>
      <form
        className="stack"
        onSubmit={(event) => {
          event.preventDefault()
          onSave({ date, accomplished, wentWell, wastedTime, avoided, improve, tomorrowPriorities, rating })
        }}
      >
        <Field label="What did I accomplish today?">
          <Textarea value={accomplished} onChange={(event) => setAccomplished(event.target.value)} />
        </Field>
        <Field label="What went well?">
          <Textarea value={wentWell} onChange={(event) => setWentWell(event.target.value)} />
        </Field>
        <Field label="What wasted my time?">
          <Textarea value={wastedTime} onChange={(event) => setWastedTime(event.target.value)} />
        </Field>
        <Field label="What did I avoid?">
          <Textarea value={avoided} onChange={(event) => setAvoided(event.target.value)} />
        </Field>
        <Field label="What could I improve?">
          <Textarea value={improve} onChange={(event) => setImprove(event.target.value)} />
        </Field>
        <Field label="What are my top priorities tomorrow?">
          <Textarea value={tomorrowPriorities} onChange={(event) => setTomorrowPriorities(event.target.value)} />
        </Field>
        <Field label="Productivity rating (1–10)">
          <Input type="number" min={1} max={10} value={rating} onChange={(event) => setRating(Number(event.target.value))} />
        </Field>
        <Button variant="primary" type="submit">
          Save daily review
        </Button>
      </form>
    </Card>
  )
}

function WeeklyForm({
  weekStart,
  initial,
  onSave,
}: {
  weekStart: string
  initial?: {
    biggestWin: string
    biggestFailure: string
    stopDoing: string
    continueDoing: string
    changeNextWeek: string
  }
  onSave: (input: {
    weekStart: string
    biggestWin: string
    biggestFailure: string
    stopDoing: string
    continueDoing: string
    changeNextWeek: string
  }) => void
}) {
  const [biggestWin, setBiggestWin] = useState(initial?.biggestWin ?? '')
  const [biggestFailure, setBiggestFailure] = useState(initial?.biggestFailure ?? '')
  const [stopDoing, setStopDoing] = useState(initial?.stopDoing ?? '')
  const [continueDoing, setContinueDoing] = useState(initial?.continueDoing ?? '')
  const [changeNextWeek, setChangeNextWeek] = useState(initial?.changeNextWeek ?? '')

  return (
    <Card>
      <CardTitle>Reflection</CardTitle>
      <form
        className="stack"
        onSubmit={(event) => {
          event.preventDefault()
          onSave({ weekStart, biggestWin, biggestFailure, stopDoing, continueDoing, changeNextWeek })
        }}
      >
        <Field label="What was my biggest win?">
          <Textarea value={biggestWin} onChange={(event) => setBiggestWin(event.target.value)} />
        </Field>
        <Field label="What was my biggest failure?">
          <Textarea value={biggestFailure} onChange={(event) => setBiggestFailure(event.target.value)} />
        </Field>
        <Field label="What should I stop doing?">
          <Textarea value={stopDoing} onChange={(event) => setStopDoing(event.target.value)} />
        </Field>
        <Field label="What should I continue doing?">
          <Textarea value={continueDoing} onChange={(event) => setContinueDoing(event.target.value)} />
        </Field>
        <Field label="What should I change next week?">
          <Textarea value={changeNextWeek} onChange={(event) => setChangeNextWeek(event.target.value)} />
        </Field>
        <Button variant="primary" type="submit">
          Save weekly review
        </Button>
      </form>
    </Card>
  )
}
