import type { AppState, Task, TaskPriority } from '../types'
import { isoNow } from '../utils/dates'
import { createId } from '../utils/id'
import { awardXp, reverseXp } from './xpService'

export interface TaskInput {
  title: string
  description: string
  date: string
  lifeAreaId: string
  priority: TaskPriority
  estimatedMinutes: number
  xpReward: number
  isTodayPriority?: boolean
}

export function addTask(state: AppState, input: TaskInput, isDemo = false): AppState {
  const priorityCount = state.tasks.filter(
    (task) => task.date === input.date && task.isTodayPriority && !task.completed,
  ).length
  const task: Task = {
    id: createId(),
    title: input.title.trim(),
    description: input.description.trim(),
    date: input.date,
    lifeAreaId: input.lifeAreaId,
    priority: input.priority,
    estimatedMinutes: input.estimatedMinutes,
    xpReward: input.xpReward,
    completed: false,
    completedAt: null,
    isTodayPriority: Boolean(input.isTodayPriority) && priorityCount < 3,
    createdAt: isoNow(),
    isDemo,
  }
  return { ...state, tasks: [...state.tasks, task] }
}

export function updateTask(state: AppState, id: string, patch: Partial<TaskInput>): AppState {
  return {
    ...state,
    tasks: state.tasks.map((task) => {
      if (task.id !== id) return task
      return {
        ...task,
        title: patch.title !== undefined ? patch.title.trim() : task.title,
        description: patch.description !== undefined ? patch.description.trim() : task.description,
        date: patch.date ?? task.date,
        lifeAreaId: patch.lifeAreaId ?? task.lifeAreaId,
        priority: patch.priority ?? task.priority,
        estimatedMinutes: patch.estimatedMinutes ?? task.estimatedMinutes,
        xpReward: patch.xpReward ?? task.xpReward,
      }
    }),
  }
}

export function deleteTask(state: AppState, id: string): AppState {
  const next = reverseXp(state, 'task', id, 'Task deleted — XP reversed')
  return { ...next, tasks: next.tasks.filter((task) => task.id !== id) }
}

export function toggleTaskComplete(state: AppState, id: string): AppState {
  const task = state.tasks.find((item) => item.id === id)
  if (!task) return state
  if (task.completed) {
    const next = reverseXp(state, 'task', id, `Uncompleted: ${task.title}`)
    return {
      ...next,
      tasks: next.tasks.map((item) =>
        item.id === id ? { ...item, completed: false, completedAt: null } : item,
      ),
    }
  }
  const next = awardXp(state, task.xpReward, 'task', id, `Completed task: ${task.title}`, task.isDemo)
  return {
    ...next,
    tasks: next.tasks.map((item) =>
      item.id === id ? { ...item, completed: true, completedAt: isoNow() } : item,
    ),
  }
}

export function setTodayPriority(state: AppState, id: string, enabled: boolean): AppState | { error: string } {
  const task = state.tasks.find((item) => item.id === id)
  if (!task) return state
  if (enabled) {
    const count = state.tasks.filter(
      (item) => item.date === task.date && item.isTodayPriority && item.id !== id,
    ).length
    if (count >= 3) return { error: 'You can only pin 3 priorities for a day.' }
  }
  return {
    ...state,
    tasks: state.tasks.map((item) => (item.id === id ? { ...item, isTodayPriority: enabled } : item)),
  }
}
