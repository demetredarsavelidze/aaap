import { useEffect, useState } from 'react'
import { Button } from '../components/ui/Button'
import { Card, CardTitle } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { Field, Input, Select } from '../components/ui/Field'
import { FOCUS_PRESETS } from '../constants'
import {
  completeExpiredFocus,
  elapsedMs,
  minutesOnDate,
  pauseFocus,
  remainingMs,
  resumeFocus,
  startFocus,
  stopFocus,
} from '../services/focusService'
import { formatClock, formatDuration, todayKey, addDays } from '../utils/dates'
import { useApp } from '../store/useApp'

export function FocusPage() {
  const { state, patch, toast } = useApp()
  const [now, setNow] = useState(Date.now())
  const [minutes, setMinutes] = useState(state.settings.defaultFocusMinutes)
  const [taskId, setTaskId] = useState('')
  const [goalId, setGoalId] = useState('')
  const [skillId, setSkillId] = useState('')
  const today = todayKey()

  useEffect(() => {
    const tick = () => {
      const timestamp = Date.now()
      setNow(timestamp)
      patch((current) => {
        if (!current.activeFocus || remainingMs(current.activeFocus, timestamp) > 0) return current
        queueMicrotask(() => toast('Focus session complete.'))
        return completeExpiredFocus(current, timestamp)
      })
    }
    const id = window.setInterval(tick, 250)
    const onVis = () => tick()
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [patch, toast])

  const active = state.activeFocus
  const remaining = active ? remainingMs(active, now) : minutes * 60_000
  const weekMinutes = state.focusSessions
    .filter((session) => session.date >= addDays(today, -6))
    .reduce((sum, session) => sum + session.durationMinutes, 0)
  const monthMinutes = state.focusSessions
    .filter((session) => session.date >= addDays(today, -29))
    .reduce((sum, session) => sum + session.durationMinutes, 0)
  const avg =
    state.focusSessions.length === 0
      ? 0
      : Math.round(
          state.focusSessions.reduce((sum, session) => sum + session.durationMinutes, 0) / state.focusSessions.length,
        )
  const longest = state.focusSessions.reduce((max, session) => Math.max(max, session.durationMinutes), 0)
  const openTasks = state.tasks.filter((task) => !task.completed)
  const history = [...state.focusSessions].sort((a, b) => b.startTime.localeCompare(a.startTime)).slice(0, 12)

  return (
    <>
      <div>
        <h1>Focus</h1>
        <p className="muted">Timestamp-based timer. Tab blur does not fake the clock.</p>
      </div>

      <Card>
        <div className="timer">{formatClock(remaining)}</div>
        <p className="muted" style={{ margin: '8px 0 16px' }}>
          {active
            ? active.pausedAt
              ? 'Paused'
              : `Elapsed ${formatClock(elapsedMs(active, now))}`
            : 'Ready'}
        </p>
        {!active ? (
          <div className="stack">
            <div className="row">
              {FOCUS_PRESETS.map((preset) => (
                <Button key={preset} size="small" onClick={() => setMinutes(preset)}>
                  {preset}m
                </Button>
              ))}
            </div>
            <Field label="Custom minutes">
              <Input type="number" min={5} value={minutes} onChange={(event) => setMinutes(Number(event.target.value))} />
            </Field>
            <Field label="Task">
              <Select value={taskId} onChange={(event) => setTaskId(event.target.value)}>
                <option value="">None</option>
                {openTasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Goal">
              <Select value={goalId} onChange={(event) => setGoalId(event.target.value)}>
                <option value="">None</option>
                {state.goals.map((goal) => (
                  <option key={goal.id} value={goal.id}>
                    {goal.title}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Skill">
              <Select value={skillId} onChange={(event) => setSkillId(event.target.value)}>
                <option value="">None</option>
                {state.skills.map((skill) => (
                  <option key={skill.id} value={skill.id}>
                    {skill.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Button
              variant="primary"
              onClick={() =>
                patch((current) =>
                  startFocus(current, minutes, {
                    taskId: taskId || null,
                    goalId: goalId || null,
                    skillId: skillId || null,
                  }),
                )
              }
            >
              Start
            </Button>
          </div>
        ) : (
          <div className="row">
            {active.pausedAt ? (
              <Button variant="primary" onClick={() => patch(resumeFocus)}>
                Resume
              </Button>
            ) : (
              <Button onClick={() => patch(pauseFocus)}>Pause</Button>
            )}
            <Button
              onClick={() => {
                patch((current) => stopFocus(current, true))
                toast('Session saved.')
              }}
            >
              Stop & save
            </Button>
            <Button variant="danger" onClick={() => patch((current) => stopFocus(current, false))}>
              Discard
            </Button>
          </div>
        )}
      </Card>

      <div className="kpis">
        <Card>
          <div className="stat-label">Focus today</div>
          <div className="stat-value">{formatDuration(minutesOnDate(state, today))}</div>
        </Card>
        <Card>
          <div className="stat-label">This week</div>
          <div className="stat-value">{formatDuration(weekMinutes)}</div>
        </Card>
        <Card>
          <div className="stat-label">This month</div>
          <div className="stat-value">{formatDuration(monthMinutes)}</div>
        </Card>
        <Card>
          <div className="stat-label">Average / longest</div>
          <div className="stat-value">
            {avg}m / {longest}m
          </div>
        </Card>
      </div>

      <Card>
        <CardTitle>History</CardTitle>
        {history.length === 0 ? (
          <EmptyState title="No sessions yet" body="Start a timer and stop it to keep an auditable record." />
        ) : (
          history.map((session) => (
            <div key={session.id} className="map-row">
              <span>
                {session.date} · {session.durationMinutes}m
              </span>
              <span className="muted">
                {session.skillId
                  ? state.skills.find((skill) => skill.id === session.skillId)?.name
                  : session.goalId
                    ? state.goals.find((goal) => goal.id === session.goalId)?.title
                    : session.taskId
                      ? state.tasks.find((task) => task.id === session.taskId)?.title
                      : 'Unlinked'}
              </span>
            </div>
          ))
        )}
      </Card>
    </>
  )
}
