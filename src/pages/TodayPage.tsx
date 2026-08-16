import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { DateNav } from '../components/DateNav'
import { Heatmap } from '../components/Heatmap'
import { TaskForm, type TaskDraft } from '../components/TaskForm'
import { TaskItem } from '../components/TaskItem'
import { Button } from '../components/ui/Button'
import { Card, CardTitle } from '../components/ui/Card'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { EmptyState } from '../components/ui/EmptyState'
import { ProgressBar } from '../components/ui/ProgressBar'
import { addTask, deleteTask, setTodayPriority, toggleTaskComplete, updateTask } from '../services/taskService'
import { toggleHabitCompletion, currentStreak } from '../services/habitService'
import { minutesOnDate } from '../services/focusService'
import { dailyCompletionPercent, dayStats, globalStreak } from '../services/analyticsService'
import { computeAscensionScore } from '../services/scoreService'
import { getAttentionItems } from '../services/attentionService'
import { challengeProgress } from '../services/challengeService'
import { setRuleCheck } from '../services/challengeService'
import { activeLifeAreas } from '../services/settingsService'
import { lifeAreaSnapshots } from '../services/analyticsService'
import { tasksOnDate, lifeAreaColor } from '../services/selectors'
import { levelFromXp, totalXp, xpOnDate } from '../services/xpService'
import { useApp } from '../store/useApp'
import type { Task } from '../types'
import { todayKey } from '../utils/dates'

export function TodayPage() {
  const { state, patch, toast } = useApp()
  const [date, setDate] = useState(todayKey())
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Task | null>(null)
  const today = todayKey()

  const tasks = tasksOnDate(state, date)
  const priorities = tasks.filter((task) => task.isTodayPriority).slice(0, 3)
  const otherTasks = tasks.filter((task) => !task.isTodayPriority)
  const day = dayStats(state, date)
  const completion = dailyCompletionPercent(day)
  const level = levelFromXp(totalXp(state.xpTransactions))
  const streak = globalStreak(state, today)
  const score = computeAscensionScore(state, today)
  const attention = getAttentionItems(state, today)
  const areas = activeLifeAreas(state)
  const snapshots = lifeAreaSnapshots(state, today)
  const habits = state.habits.filter((habit) => !habit.archived && habit.active && habit.createdAt.slice(0, 10) <= date)
  const rules = state.personalRules.filter((rule) => rule.active && rule.checkDaily)
  const challenges = state.challenges.filter((item) => item.status === 'active')
  const focusMinutes = minutesOnDate(state, date)

  const heatDates = useMemo(
    () => state.habitCompletions.map((item) => item.date).concat(state.tasks.filter((t) => t.completed).map((t) => t.date)),
    [state.habitCompletions, state.tasks],
  )

  function saveTask(draft: TaskDraft) {
    patch((current) => {
      if (editing) {
        let next = updateTask(current, editing.id, draft)
        const result = setTodayPriority(next, editing.id, draft.isTodayPriority)
        if ('error' in result) {
          toast(result.error, 'error')
          return next
        }
        return result
      }
      let next = addTask(current, draft)
      const created = next.tasks[next.tasks.length - 1]
      if (created && draft.isTodayPriority) {
        const result = setTodayPriority(next, created.id, true)
        if ('error' in result) {
          toast(result.error, 'error')
          return next
        }
        return result
      }
      return next
    })
    setFormOpen(false)
    setEditing(null)
    toast(editing ? 'Task updated.' : 'Task added.')
  }

  return (
    <>
      {state.demoActive ? (
        <div className="demo-banner">
          Demo data is loaded so the dashboard is populated. Clear it in Settings when you want a clean slate.
        </div>
      ) : null}

      <DateNav date={date} today={today} onChange={setDate} />

      <div className="hero">
        <Card>
          <div className="brand-mark" style={{ marginBottom: 8 }}>
            ASCENSION
          </div>
          <div className="spread">
            <div>
              <div className="stat-label">Level {level.level}</div>
              <div className="muted">
                {level.currentXp} / {level.nextLevelXp} XP
              </div>
            </div>
            <div className="stat">
              <span className="stat-label">Ascension Score</span>
              <span className="score-num">{score.score}</span>
              <span className="faint">/ 100</span>
            </div>
          </div>
          <ProgressBar value={(level.currentXp / level.nextLevelXp) * 100} />
        </Card>
        <div className="kpis" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <Card>
            <div className="stat-label">Streak</div>
            <div className="stat-value">{streak.current}d</div>
          </Card>
          <Card>
            <div className="stat-label">Daily completion</div>
            <div className="stat-value">{completion}%</div>
          </Card>
          <Card>
            <div className="stat-label">XP today</div>
            <div className="stat-value">{Math.max(0, xpOnDate(state.xpTransactions, date))}</div>
          </Card>
          <Card>
            <div className="stat-label">Focus today</div>
            <div className="stat-value">{focusMinutes}m</div>
          </Card>
        </div>
      </div>

      {attention.length > 0 ? (
        <Card>
          <CardTitle>Needs Attention</CardTitle>
          <div className="stack">
            {attention.map((item) => (
              <Link key={item.id} to={item.href} className={`attention ${item.severity}`}>
                {item.message}
              </Link>
            ))}
          </div>
        </Card>
      ) : null}

      <div className="grid-2">
        <Card>
          <div className="spread card-title">
            <h2>Top Priorities</h2>
            <Button size="small" onClick={() => { setEditing(null); setFormOpen(true) }}>
              Add task
            </Button>
          </div>
          {priorities.length === 0 ? (
            <EmptyState title="No priorities pinned" body="Pin up to three tasks that define a successful day." />
          ) : (
            priorities.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onEdit={(item) => { setEditing(item); setFormOpen(true) }}
                onDelete={setPendingDelete}
                onToggle={(item) => patch((current) => toggleTaskComplete(current, item.id))}
                onPin={(item) => {
                  patch((current) => {
                    const result = setTodayPriority(current, item.id, !item.isTodayPriority)
                    if ('error' in result) {
                      toast(result.error, 'error')
                      return current
                    }
                    return result
                  })
                }}
              />
            ))
          )}
          {otherTasks.length > 0 ? (
            <div style={{ marginTop: 12 }}>
              <h2 className="card-title">Other tasks</h2>
              {otherTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onEdit={(item) => { setEditing(item); setFormOpen(true) }}
                  onDelete={setPendingDelete}
                  onToggle={(item) => patch((current) => toggleTaskComplete(current, item.id))}
                  onPin={(item) => {
                    patch((current) => {
                      const result = setTodayPriority(current, item.id, !item.isTodayPriority)
                      if ('error' in result) {
                        toast(result.error, 'error')
                        return current
                      }
                      return result
                    })
                  }}
                />
              ))}
            </div>
          ) : null}
        </Card>

        <Card>
          <CardTitle>Today's Habits</CardTitle>
          {habits.length === 0 ? (
            <EmptyState title="No habits scheduled" body="Create daily habits to build a completion baseline." />
          ) : (
            habits.map((habit) => {
              const done = state.habitCompletions.some((item) => item.habitId === habit.id && item.date === date)
              const dates = state.habitCompletions.filter((item) => item.habitId === habit.id).map((item) => item.date)
              return (
                <label key={habit.id} className="check" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <input
                    type="checkbox"
                    checked={done}
                    onChange={() => patch((current) => toggleHabitCompletion(current, habit.id, date))}
                  />
                  <span>
                    <strong>{habit.name}</strong>
                    <div className="faint">Streak {currentStreak(dates, today)} · {habit.xpReward} XP</div>
                  </span>
                </label>
              )
            })
          )}
        </Card>
      </div>

      <Card>
        <CardTitle>Life Areas</CardTitle>
        <div className="grid-3">
          {areas.map((area) => {
            const snap = snapshots.find((item) => item.areaId === area.id)
            return (
              <div key={area.id} className="stack">
                <div className="spread">
                  <span className="row">
                    <span className="area-dot" style={{ background: area.color }} />
                    {area.name}
                  </span>
                  <span className="muted">{snap?.score ?? 0}</span>
                </div>
                <ProgressBar value={snap?.score ?? 0} />
              </div>
            )
          })}
        </div>
      </Card>

      <div className="grid-2">
        <Card>
          <div className="spread card-title">
            <h2>Focus</h2>
            <Link to="/focus" className="btn small primary">
              Start Focus
            </Link>
          </div>
          <div className="kpis" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="stat">
              <span className="stat-label">Focused today</span>
              <span className="stat-value">{focusMinutes}m</span>
            </div>
            <div className="stat">
              <span className="stat-label">Current focus goal</span>
              <span className="muted">{state.settings.defaultFocusMinutes}m default</span>
            </div>
          </div>
        </Card>
        <Card>
          <CardTitle>Daily Summary</CardTitle>
          <div className="grid-2">
            <Summary label="Tasks completed" value={`${day.tasksCompleted}/${day.tasksTotal}`} />
            <Summary label="Habits completed" value={`${day.habitsCompleted}/${day.habitsDue}`} />
            <Summary label="Focus minutes" value={`${focusMinutes}`} />
            <Summary label="XP earned" value={`${Math.max(0, day.xp)}`} />
            <Summary label="Daily completion" value={`${completion}%`} />
          </div>
        </Card>
      </div>

      <div className="grid-2">
        <Card>
          <CardTitle>Personal Rules</CardTitle>
          {rules.length === 0 ? (
            <EmptyState title="No daily rules" body="Add rules in Settings if you want a daily check." />
          ) : (
            rules.map((rule) => {
              const check = state.ruleChecks.find((item) => item.ruleId === rule.id && item.date === date)
              return (
                <label key={rule.id} className="check" style={{ padding: '8px 0' }}>
                  <input
                    type="checkbox"
                    checked={check?.kept === true}
                    onChange={() => patch((current) => setRuleCheck(current, rule.id, date, true))}
                  />
                  <span>{rule.text}</span>
                </label>
              )
            })
          )}
        </Card>
        <Card>
          <div className="spread card-title">
            <h2>Challenges</h2>
            <Link to="/settings" className="btn small ghost">
              Manage
            </Link>
          </div>
          {challenges.length === 0 ? (
            <EmptyState title="No active challenges" body="Create a simple constraint with a target and an end date." />
          ) : (
            challenges.map((challenge) => {
              const current = challengeProgress(state, challenge.id)
              return (
                <div key={challenge.id} className="stack" style={{ marginBottom: 12 }}>
                  <div className="spread">
                    <strong>{challenge.name}</strong>
                    <span className="muted">
                      {current} / {challenge.target} {challenge.unit.toUpperCase()}
                    </span>
                  </div>
                  <ProgressBar value={(current / Math.max(1, challenge.target)) * 100} />
                </div>
              )
            })
          )}
        </Card>
      </div>

      <Card>
        <CardTitle>Ascension Map</CardTitle>
        {snapshots.map((snap) => (
          <div key={snap.areaId} className="map-row">
            <span className="row">
              <span className="area-dot" style={{ background: lifeAreaColor(state, snap.areaId) }} />
              {snap.name}
            </span>
            <span className={`trend-${snap.trend}`}>
              {snap.trend === 'up' ? '↑' : snap.trend === 'down' ? '↓' : '→'} {snap.score}
            </span>
          </div>
        ))}
      </Card>

      <Card>
        <CardTitle>Activity</CardTitle>
        <Heatmap dates={heatDates} />
      </Card>

      <TaskForm
        open={formOpen}
        date={date}
        task={editing}
        onClose={() => { setFormOpen(false); setEditing(null) }}
        onSubmit={saveTask}
      />
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete task"
        message="This removes the task and reverses any XP it awarded."
        confirmLabel="Delete"
        danger
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) patch((current) => deleteTask(current, pendingDelete.id))
          setPendingDelete(null)
          toast('Task deleted.', 'info')
        }}
      />
    </>
  )
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <span>{value}</span>
    </div>
  )
}
