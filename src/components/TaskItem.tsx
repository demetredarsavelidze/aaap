import { Pencil, Pin, Trash2 } from 'lucide-react'
import type { Task } from '../types'
import { PRIORITY_LABELS } from '../constants'
import { lifeAreaColor, lifeAreaName } from '../services/selectors'
import { useApp } from '../store/useApp'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'

interface Props {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  onToggle: (task: Task) => void
  onPin?: (task: Task) => void
}

export function TaskItem({ task, onEdit, onDelete, onToggle, onPin }: Props) {
  const { state } = useApp()
  return (
    <article className={`task ${task.completed ? 'done' : ''}`}>
      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => onToggle(task)}
        aria-label={`Mark ${task.title} ${task.completed ? 'incomplete' : 'complete'}`}
      />
      <div>
        <div className="task-title">{task.title}</div>
        {task.description ? <p className="muted" style={{ fontSize: 12 }}>{task.description}</p> : null}
        <div className="task-meta">
          <span className="row">
            <span className="area-dot" style={{ background: lifeAreaColor(state, task.lifeAreaId) }} />
            {lifeAreaName(state, task.lifeAreaId)}
          </span>
          <Badge tone={task.priority}>{PRIORITY_LABELS[task.priority]}</Badge>
          <span>{task.estimatedMinutes}m</span>
          <span>{task.xpReward} XP</span>
          {task.isTodayPriority ? <Badge tone="success">Priority</Badge> : null}
        </div>
      </div>
      <div className="row">
        {onPin ? (
          <Button
            variant="ghost"
            size="icon"
            aria-label={task.isTodayPriority ? 'Unpin priority' : 'Pin as priority'}
            onClick={() => onPin(task)}
          >
            <Pin size={15} />
          </Button>
        ) : null}
        <Button variant="ghost" size="icon" aria-label={`Edit ${task.title}`} onClick={() => onEdit(task)}>
          <Pencil size={15} />
        </Button>
        <Button variant="ghost" size="icon" aria-label={`Delete ${task.title}`} onClick={() => onDelete(task)}>
          <Trash2 size={15} />
        </Button>
      </div>
    </article>
  )
}
