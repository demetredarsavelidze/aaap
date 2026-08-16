import type { AppState, Task } from '../types'
import { addDays, todayKey, weekKeys } from '../utils/dates'
import { computeAnalytics, lastActivityDate, lifeAreaSnapshots } from './analyticsService'
import { challengeProgress } from './challengeService'
import { hoursForSkill } from './focusService'
import { currentStreak, longestStreak } from './habitService'
import { activeLifeAreas } from './settingsService'

export function tasksOnDate(state: AppState, date: string): Task[] {
  return state.tasks
    .filter((task) => task.date === date)
    .sort((a, b) => Number(b.isTodayPriority) - Number(a.isTodayPriority) || priorityRank(a.priority) - priorityRank(b.priority))
}

function priorityRank(priority: Task['priority']): number {
  if (priority === 'high') return 0
  if (priority === 'medium') return 1
  return 2
}

export function lifeAreaName(state: AppState, id: string): string {
  return state.lifeAreas.find((area) => area.id === id)?.name ?? 'Unassigned'
}

export function lifeAreaColor(state: AppState, id: string): string {
  return state.lifeAreas.find((area) => area.id === id)?.color ?? '#6d8cff'
}

export function habitStats(state: AppState, habitId: string, today = todayKey()) {
  const completions = state.habitCompletions.filter((item) => item.habitId === habitId)
  const dates = completions.map((item) => item.date)
  const habit = state.habits.find((item) => item.id === habitId)
  const created = habit?.createdAt.slice(0, 10) ?? today
  const dayCount = Math.max(1, Math.round((Date.parse(`${today}T00:00:00`) - Date.parse(`${created}T00:00:00`)) / 86_400_000) + 1)
  return {
    current: currentStreak(dates, today),
    longest: longestStreak(dates),
    total: completions.length,
    percent: Math.round((completions.length / dayCount) * 100),
  }
}

export function skillHours(state: AppState, skillId: string): number {
  return Math.round(hoursForSkill(state, skillId) * 10) / 10
}

export function challengeCurrent(state: AppState, challengeId: string): number {
  return challengeProgress(state, challengeId)
}

export interface WeeklySummary {
  weekStart: string
  tasksCompleted: number
  tasksMissed: number
  habitCompletion: number
  focusHours: number
  xpGained: number
  goalsProgressed: number
  strongest: string
  weakest: string
  prev: {
    tasksCompleted: number
    habitCompletion: number
    focusHours: number
    xpGained: number
  }
}

export function weeklySummary(state: AppState, weekStart: string): WeeklySummary {
  const today = todayKey()
  const keys = weekKeys(weekStart)
  const end = keys[6] ?? weekStart
  const analytics = computeAnalytics(state, '7d', end > today ? today : end)
  const prevEnd = addDays(weekStart, -1)
  const prevAnalytics = computeAnalytics(state, '7d', prevEnd)
  const areas = lifeAreaSnapshots(state, end > today ? today : end)
  const strongest = [...areas].sort((a, b) => b.score - a.score)[0]
  const weakest = [...areas].sort((a, b) => a.score - b.score)[0]
  const missed = state.tasks.filter((task) => keys.includes(task.date) && !task.completed).length
  return {
    weekStart,
    tasksCompleted: analytics.tasksCompleted,
    tasksMissed: missed,
    habitCompletion: analytics.habitConsistency,
    focusHours: analytics.focusHours,
    xpGained: analytics.xpEarned,
    goalsProgressed: analytics.goalsProgressed,
    strongest: strongest?.name ?? '—',
    weakest: weakest?.name ?? '—',
    prev: {
      tasksCompleted: prevAnalytics.tasksCompleted,
      habitCompletion: prevAnalytics.habitConsistency,
      focusHours: prevAnalytics.focusHours,
      xpGained: prevAnalytics.xpEarned,
    },
  }
}

export { activeLifeAreas, lastActivityDate }
