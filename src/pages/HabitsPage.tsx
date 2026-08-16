import { useEffect, useMemo, useState } from 'react'
import { Heatmap } from '../components/Heatmap'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardTitle } from '../components/ui/Card'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { EmptyState } from '../components/ui/EmptyState'
import { Field, Input, Select, Textarea } from '../components/ui/Field'
import { Modal } from '../components/ui/Modal'
import { ProgressBar } from '../components/ui/ProgressBar'
import { addHabit, archiveHabit, toggleHabitCompletion, updateHabit } from '../services/habitService'
import { habitStats } from '../services/selectors'
import { activeLifeAreas } from '../services/settingsService'
import { useApp } from '../store/useApp'
import type { Habit } from '../types'
import { addDays, todayKey } from '../utils/dates'

export function HabitsPage() {
  const { state, patch, toast } = useApp()
  const today = todayKey()
  const [selected, setSelected] = useState<Habit | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Habit | null>(null)
  const [pending, setPending] = useState<Habit | null>(null)
  const [browseDate, setBrowseDate] = useState(today)
  const habits = state.habits.filter((habit) => !habit.archived)
  const areas = activeLifeAreas(state)
  const active = selected ?? habits[0] ?? null
  const heatDates = useMemo(
    () =>
      (active ? state.habitCompletions.filter((item) => item.habitId === active.id) : state.habitCompletions).map(
        (item) => item.date,
      ),
    [active, state.habitCompletions],
  )

  return (
    <>
      <div className="spread">
        <div>
          <h1>Habits</h1>
          <p className="muted">Definitions stay stable. Completions are historical records.</p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setEditing(null)
            setFormOpen(true)
          }}
        >
          New habit
        </Button>
      </div>

      {habits.length === 0 ? (
        <Card>
          <EmptyState title="No habits yet" body="Start with one daily action you are willing to protect." />
        </Card>
      ) : (
        <div className="grid-2">
          <Card>
            {habits.map((habit) => {
              const stats = habitStats(state, habit.id, today)
              const done = state.habitCompletions.some((item) => item.habitId === habit.id && item.date === browseDate)
              return (
                <article
                  key={habit.id}
                  className="week-task"
                  style={{ width: '100%', textAlign: 'left', border: active?.id === habit.id ? '1px solid var(--accent)' : undefined }}
                >
                  <button type="button" className="week-task-main" onClick={() => setSelected(habit)}>
                    <div className="spread">
                      <strong>{habit.name}</strong>
                      {habit.active ? <Badge tone="success">Active</Badge> : <Badge>Paused</Badge>}
                    </div>
                    <div className="task-meta">
                      <span>Streak {stats.current}</span>
                      <span>Best {stats.longest}</span>
                      <span>{stats.percent}%</span>
                      <span>{stats.total} total</span>
                    </div>
                  </button>
                  <div className="row" style={{ marginTop: 8 }}>
                    <Button
                      size="small"
                      onClick={() => patch((current) => toggleHabitCompletion(current, habit.id, browseDate))}
                    >
                      {done ? 'Uncheck' : 'Check'} {browseDate === today ? 'today' : browseDate}
                    </Button>
                    <Button
                      size="small"
                      variant="ghost"
                      onClick={() => {
                        setEditing(habit)
                        setFormOpen(true)
                      }}
                    >
                      Edit
                    </Button>
                    <Button size="small" variant="ghost" onClick={() => setPending(habit)}>
                      Archive
                    </Button>
                  </div>
                </article>
              )
            })}
          </Card>
          <Card>
            <CardTitle>{active?.name ?? 'Select a habit'}</CardTitle>
            {active ? (
              <>
                <p className="muted">{active.description || 'No description.'}</p>
                <Field label="Browse date">
                  <Input type="date" value={browseDate} onChange={(event) => setBrowseDate(event.target.value)} />
                </Field>
                <div className="row" style={{ margin: '8px 0' }}>
                  <Button size="small" onClick={() => setBrowseDate(addDays(browseDate, -1))}>
                    Previous
                  </Button>
                  <Button size="small" onClick={() => setBrowseDate(today)}>
                    Today
                  </Button>
                  <Button size="small" onClick={() => setBrowseDate(addDays(browseDate, 1))}>
                    Next
                  </Button>
                </div>
                {(() => {
                  const stats = habitStats(state, active.id, today)
                  return (
                    <div className="grid-2" style={{ marginTop: 12 }}>
                      <Stat label="Current streak" value={`${stats.current}`} />
                      <Stat label="Longest streak" value={`${stats.longest}`} />
                      <Stat label="Completion %" value={`${stats.percent}%`} />
                      <Stat label="Total completions" value={`${stats.total}`} />
                    </div>
                  )
                })()}
                <div style={{ marginTop: 16 }}>
                  <ProgressBar value={habitStats(state, active.id, today).percent} />
                </div>
                <div style={{ marginTop: 16 }}>
                  <Heatmap dates={heatDates} />
                </div>
              </>
            ) : null}
          </Card>
        </div>
      )}

      <HabitForm
        key={editing?.id ?? 'new'}
        open={formOpen}
        areas={areas}
        habit={editing}
        defaultXp={state.settings.defaultHabitXp}
        onClose={() => setFormOpen(false)}
        onSubmit={(input) => {
          patch((current) => (editing ? updateHabit(current, editing.id, input) : addHabit(current, input)))
          setFormOpen(false)
          toast(editing ? 'Habit updated.' : 'Habit created.')
        }}
      />
      <ConfirmDialog
        open={Boolean(pending)}
        title="Archive habit"
        message="The habit will stop appearing on Today. Historical completions remain intact."
        confirmLabel="Archive"
        danger
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (pending) patch((current) => archiveHabit(current, pending.id))
          setPending(null)
          toast('Habit archived.', 'info')
        }}
      />
    </>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function HabitForm({
  open,
  habit,
  areas,
  defaultXp,
  onClose,
  onSubmit,
}: {
  open: boolean
  habit: Habit | null
  areas: { id: string; name: string }[]
  defaultXp: number
  onClose: () => void
  onSubmit: (input: { name: string; description: string; lifeAreaId: string; xpReward: number; active: boolean }) => void
}) {
  const defaultAreaId = areas[0]?.id ?? ''
  const [name, setName] = useState(habit?.name ?? '')
  const [description, setDescription] = useState(habit?.description ?? '')
  const [lifeAreaId, setLifeAreaId] = useState(habit?.lifeAreaId ?? defaultAreaId)
  const [xpReward, setXpReward] = useState(habit?.xpReward ?? defaultXp)
  const [active, setActive] = useState(habit?.active ?? true)

  useEffect(() => {
    if (!open) return
    setName(habit?.name ?? '')
    setDescription(habit?.description ?? '')
    setLifeAreaId(habit?.lifeAreaId ?? defaultAreaId)
    setXpReward(habit?.xpReward ?? defaultXp)
    setActive(habit?.active ?? true)
  }, [open, habit, defaultAreaId, defaultXp])

  const title = habit ? 'Edit habit' : 'New habit'
  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
    >
      <form
        className="stack"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit({ name, description, lifeAreaId, xpReward, active })
        }}
      >
        <Field label="Name">
          <Input required value={name} onChange={(event) => setName(event.target.value)} />
        </Field>
        <Field label="Description">
          <Textarea value={description} onChange={(event) => setDescription(event.target.value)} />
        </Field>
        <Field label="Life area">
          <Select value={lifeAreaId} onChange={(event) => setLifeAreaId(event.target.value)}>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="XP reward">
          <Input type="number" min={0} value={xpReward} onChange={(event) => setXpReward(Number(event.target.value))} />
        </Field>
        <label className="check">
          <input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} />
          <span>Active</span>
        </label>
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            Save
          </Button>
        </div>
      </form>
    </Modal>
  )
}
