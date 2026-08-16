import { useEffect, useState } from 'react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { EmptyState } from '../components/ui/EmptyState'
import { Field, Input, Select, Textarea } from '../components/ui/Field'
import { Modal } from '../components/ui/Modal'
import { ProgressBar } from '../components/ui/ProgressBar'
import { GOAL_STATUS_LABELS } from '../constants'
import { addGoal, deleteGoal, setGoalStatus, toggleMilestone, updateGoal } from '../services/goalService'
import { activeLifeAreas } from '../services/settingsService'
import { useApp } from '../store/useApp'
import type { Goal, GoalStatus } from '../types'
import { todayKey } from '../utils/dates'

export function GoalsPage() {
  const { state, patch, toast } = useApp()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Goal | null>(null)
  const [pending, setPending] = useState<Goal | null>(null)
  const goals = [...state.goals].sort((a, b) => a.title.localeCompare(b.title))

  return (
    <>
      <div className="spread">
        <div>
          <h1>Goals</h1>
          <p className="muted">Long-term targets with completable milestones.</p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setEditing(null)
            setFormOpen(true)
          }}
        >
          New goal
        </Button>
      </div>

      {goals.length === 0 ? (
        <Card>
          <EmptyState title="No goals" body="Define one outcome that would make the next quarter obviously better." />
        </Card>
      ) : (
        <div className="stack">
          {goals.map((goal) => (
            <Card key={goal.id}>
              <div className="spread">
                <div>
                  <h2>{goal.title}</h2>
                  <p className="muted">{goal.description}</p>
                </div>
                <Badge tone={goal.status === 'completed' ? 'success' : goal.status === 'paused' ? 'warn' : undefined}>
                  {GOAL_STATUS_LABELS[goal.status]}
                </Badge>
              </div>
              <div className="task-meta" style={{ margin: '8px 0 12px' }}>
                <span>{state.lifeAreas.find((area) => area.id === goal.lifeAreaId)?.name}</span>
                <span>
                  {goal.startDate} → {goal.deadline}
                </span>
                <span>{goal.target}</span>
              </div>
              <ProgressBar value={goal.progress} />
              <div className="stack" style={{ marginTop: 12 }}>
                {goal.milestones.map((milestone) => (
                  <label key={milestone.id} className="check">
                    <input
                      type="checkbox"
                      checked={milestone.completed}
                      onChange={() => patch((current) => toggleMilestone(current, goal.id, milestone.id))}
                    />
                    <span>{milestone.title}</span>
                  </label>
                ))}
              </div>
              <div className="row" style={{ marginTop: 14 }}>
                {goal.status !== 'paused' && goal.status !== 'completed' ? (
                  <Button size="small" onClick={() => patch((current) => setGoalStatus(current, goal.id, 'paused'))}>
                    Pause
                  </Button>
                ) : null}
                {goal.status === 'paused' ? (
                  <Button size="small" onClick={() => patch((current) => setGoalStatus(current, goal.id, 'active'))}>
                    Resume
                  </Button>
                ) : null}
                {goal.status !== 'completed' ? (
                  <Button size="small" onClick={() => patch((current) => setGoalStatus(current, goal.id, 'completed'))}>
                    Complete
                  </Button>
                ) : (
                  <Button size="small" onClick={() => patch((current) => setGoalStatus(current, goal.id, 'active'))}>
                    Reopen
                  </Button>
                )}
                <Button
                  size="small"
                  variant="ghost"
                  onClick={() => {
                    setEditing(goal)
                    setFormOpen(true)
                  }}
                >
                  Edit
                </Button>
                <Button size="small" variant="danger" onClick={() => setPending(goal)}>
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <GoalForm
        key={editing?.id ?? 'new'}
        open={formOpen}
        goal={editing}
        areas={activeLifeAreas(state)}
        onClose={() => setFormOpen(false)}
        onSubmit={(input) => {
          patch((current) => {
            if (!editing) return addGoal(current, input)
            return updateGoal(current, editing.id, input)
          })
          setFormOpen(false)
          toast(editing ? 'Goal updated.' : 'Goal created.')
        }}
      />
      <ConfirmDialog
        open={Boolean(pending)}
        title="Delete goal"
        message="Milestones and related XP will be removed."
        confirmLabel="Delete"
        danger
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (pending) patch((current) => deleteGoal(current, pending.id))
          setPending(null)
        }}
      />
    </>
  )
}

function GoalForm({
  open,
  goal,
  areas,
  onClose,
  onSubmit,
}: {
  open: boolean
  goal: Goal | null
  areas: { id: string; name: string }[]
  onClose: () => void
  onSubmit: (input: {
    title: string
    description: string
    lifeAreaId: string
    startDate: string
    deadline: string
    target: string
    milestones: string[]
    status?: GoalStatus
  }) => void
}) {
  const today = todayKey()
  const defaultAreaId = areas[0]?.id ?? ''
  const [title, setTitle] = useState(goal?.title ?? '')
  const [description, setDescription] = useState(goal?.description ?? '')
  const [lifeAreaId, setLifeAreaId] = useState(goal?.lifeAreaId ?? defaultAreaId)
  const [startDate, setStartDate] = useState(goal?.startDate ?? today)
  const [deadline, setDeadline] = useState(goal?.deadline ?? today)
  const [target, setTarget] = useState(goal?.target ?? '')
  const [milestones, setMilestones] = useState(goal?.milestones.map((item) => item.title).join('\n') ?? '')

  useEffect(() => {
    if (!open) return
    setTitle(goal?.title ?? '')
    setDescription(goal?.description ?? '')
    setLifeAreaId(goal?.lifeAreaId ?? defaultAreaId)
    setStartDate(goal?.startDate ?? today)
    setDeadline(goal?.deadline ?? today)
    setTarget(goal?.target ?? '')
    setMilestones(goal?.milestones.map((item) => item.title).join('\n') ?? '')
  }, [open, goal, defaultAreaId, today])

  return (
    <Modal open={open} title={goal ? 'Edit goal' : 'New goal'} onClose={onClose}>
      <form
        className="stack"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit({
            title,
            description,
            lifeAreaId,
            startDate,
            deadline,
            target,
            milestones: milestones.split('\n'),
          })
        }}
      >
        <Field label="Title">
          <Input required value={title} onChange={(event) => setTitle(event.target.value)} />
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
        <div className="grid-2">
          <Field label="Start">
            <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          </Field>
          <Field label="Deadline">
            <Input type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} />
          </Field>
        </div>
        <Field label="Target">
          <Input value={target} onChange={(event) => setTarget(event.target.value)} />
        </Field>
        <Field label="Milestones (one per line)">
          <Textarea value={milestones} onChange={(event) => setMilestones(event.target.value)} />
        </Field>
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
