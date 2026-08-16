import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { TaskForm, type TaskDraft } from '../components/TaskForm'
import { Button } from '../components/ui/Button'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { addTask, deleteTask, setTodayPriority, toggleTaskComplete, updateTask } from '../services/taskService'
import { lifeAreaColor, tasksOnDate } from '../services/selectors'
import { useApp } from '../store/useApp'
import type { Task } from '../types'
import { addDays, formatWeekday, startOfWeek, todayKey, weekKeys } from '../utils/dates'

export function PlannerPage() {
  const { state, patch, toast } = useApp()
  const today = todayKey()
  const [weekStart, setWeekStart] = useState(startOfWeek(today, state.settings.weekStartsOn))
  const [formOpen, setFormOpen] = useState(false)
  const [formDate, setFormDate] = useState(today)
  const [editing, setEditing] = useState<Task | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Task | null>(null)
  const days = weekKeys(weekStart)

  function saveTask(draft: TaskDraft) {
    patch((current) => {
      if (editing) {
        let next = updateTask(current, editing.id, draft)
        const result = setTodayPriority(next, editing.id, draft.isTodayPriority)
        return 'error' in result ? next : result
      }
      return addTask(current, draft)
    })
    setFormOpen(false)
    setEditing(null)
    toast(editing ? 'Task updated.' : 'Task added.')
  }

  return (
    <>
      <div className="spread">
        <div>
          <h1>Planner</h1>
          <p className="muted">One task list. Plan the week, execute from Today.</p>
        </div>
        <div className="row">
          <Button size="icon" aria-label="Previous week" onClick={() => setWeekStart(addDays(weekStart, -7))}>
            <ChevronLeft size={16} />
          </Button>
          <Button size="small" onClick={() => setWeekStart(startOfWeek(today, state.settings.weekStartsOn))}>
            This week
          </Button>
          <Button size="icon" aria-label="Next week" onClick={() => setWeekStart(addDays(weekStart, 7))}>
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      <div className="week-grid">
        {days.map((date) => {
          const tasks = tasksOnDate(state, date)
          const isToday = date === today
          return (
            <section key={date} className={`week-day ${isToday ? 'today' : ''}`}>
              <div className="spread">
                <div>
                  <div className="stat-label">{formatWeekday(date)}</div>
                  <strong>{date.slice(8)}</strong>
                </div>
                <Button
                  size="small"
                  variant="ghost"
                  onClick={() => {
                    setEditing(null)
                    setFormDate(date)
                    setFormOpen(true)
                  }}
                >
                  Add
                </Button>
              </div>
              {tasks.length === 0 ? <p className="faint" style={{ marginTop: 12 }}>Empty</p> : null}
              {tasks.map((task) => (
                <article
                  key={task.id}
                  className={`week-task ${task.completed ? 'done' : ''}`}
                >
                  <button
                    type="button"
                    className="week-task-main"
                    onClick={() => {
                      setEditing(task)
                      setFormDate(task.date)
                      setFormOpen(true)
                    }}
                  >
                    <div className="spread">
                      <span className="area-dot" style={{ background: lifeAreaColor(state, task.lifeAreaId) }} />
                      <span className="faint">{task.estimatedMinutes}m</span>
                    </div>
                    <div style={{ marginTop: 4 }}>{task.title}</div>
                  </button>
                  <div className="row" style={{ marginTop: 6 }}>
                    <Button
                      size="small"
                      variant="ghost"
                      onClick={() => patch((current) => toggleTaskComplete(current, task.id))}
                    >
                      {task.completed ? 'Undo' : 'Done'}
                    </Button>
                    <Button size="small" variant="ghost" onClick={() => setPendingDelete(task)}>
                      Delete
                    </Button>
                  </div>
                </article>
              ))}
            </section>
          )
        })}
      </div>

      <TaskForm
        open={formOpen}
        date={formDate}
        task={editing}
        onClose={() => { setFormOpen(false); setEditing(null) }}
        onSubmit={saveTask}
      />
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete task"
        message="This removes the task from every view and reverses awarded XP."
        confirmLabel="Delete"
        danger
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) patch((current) => deleteTask(current, pendingDelete.id))
          setPendingDelete(null)
        }}
      />
    </>
  )
}
