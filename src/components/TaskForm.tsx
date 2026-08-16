import { useEffect, useState } from 'react'
import type { Task, TaskPriority } from '../types'
import { PRIORITY_LABELS } from '../constants'
import { activeLifeAreas } from '../services/settingsService'
import { useApp } from '../store/useApp'
import { Button } from './ui/Button'
import { Field, Input, Select, Textarea } from './ui/Field'
import { Modal } from './ui/Modal'

export interface TaskDraft {
  title: string
  description: string
  date: string
  lifeAreaId: string
  priority: TaskPriority
  estimatedMinutes: number
  xpReward: number
  isTodayPriority: boolean
}

interface Props {
  open: boolean
  date: string
  task?: Task | null
  onClose: () => void
  onSubmit: (draft: TaskDraft) => void
}

export function TaskForm({ open, date, task, onClose, onSubmit }: Props) {
  const { state } = useApp()
  const areas = activeLifeAreas(state)
  const defaultAreaId = areas[0]?.id ?? ''
  const defaultXp = state.settings.defaultTaskXp
  const [draft, setDraft] = useState<TaskDraft>(emptyDraft(date, defaultAreaId, defaultXp))

  useEffect(() => {
    if (!open) return
    if (task) {
      setDraft({
        title: task.title,
        description: task.description,
        date: task.date,
        lifeAreaId: task.lifeAreaId,
        priority: task.priority,
        estimatedMinutes: task.estimatedMinutes,
        xpReward: task.xpReward,
        isTodayPriority: task.isTodayPriority,
      })
    } else {
      setDraft(emptyDraft(date, defaultAreaId, defaultXp))
    }
  }, [open, task, date, defaultAreaId, defaultXp])

  return (
    <Modal open={open} title={task ? 'Edit task' : 'Add task'} onClose={onClose}>
      <form
        className="stack"
        onSubmit={(event) => {
          event.preventDefault()
          if (!draft.title.trim()) return
          onSubmit(draft)
        }}
      >
        <Field label="Title" htmlFor="task-title">
          <Input
            id="task-title"
            required
            value={draft.title}
            onChange={(event) => setDraft({ ...draft, title: event.target.value })}
          />
        </Field>
        <Field label="Description" htmlFor="task-desc">
          <Textarea
            id="task-desc"
            value={draft.description}
            onChange={(event) => setDraft({ ...draft, description: event.target.value })}
          />
        </Field>
        <div className="grid-2">
          <Field label="Date" htmlFor="task-date">
            <Input
              id="task-date"
              type="date"
              value={draft.date}
              onChange={(event) => setDraft({ ...draft, date: event.target.value })}
            />
          </Field>
          <Field label="Life area" htmlFor="task-area">
            <Select
              id="task-area"
              value={draft.lifeAreaId}
              onChange={(event) => setDraft({ ...draft, lifeAreaId: event.target.value })}
            >
              {areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Priority" htmlFor="task-priority">
            <Select
              id="task-priority"
              value={draft.priority}
              onChange={(event) => setDraft({ ...draft, priority: event.target.value as TaskPriority })}
            >
              {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Estimated minutes" htmlFor="task-minutes">
            <Input
              id="task-minutes"
              type="number"
              min={5}
              step={5}
              value={draft.estimatedMinutes}
              onChange={(event) => setDraft({ ...draft, estimatedMinutes: Number(event.target.value) })}
            />
          </Field>
          <Field label="XP reward" htmlFor="task-xp">
            <Input
              id="task-xp"
              type="number"
              min={0}
              value={draft.xpReward}
              onChange={(event) => setDraft({ ...draft, xpReward: Number(event.target.value) })}
            />
          </Field>
        </div>
        <label className="check">
          <input
            type="checkbox"
            checked={draft.isTodayPriority}
            onChange={(event) => setDraft({ ...draft, isTodayPriority: event.target.checked })}
          />
          <span>Pin as a top priority (max 3)</span>
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

function emptyDraft(date: string, lifeAreaId: string, xp: number): TaskDraft {
  return {
    title: '',
    description: '',
    date,
    lifeAreaId,
    priority: 'medium',
    estimatedMinutes: 30,
    xpReward: xp,
    isTodayPriority: false,
  }
}
