import type { AppState, DateRangeKey, LifeAreaSnapshot, LifeAreaTrend } from '../types'
import { addDays, keysForRange, rangeKeys, todayKey } from '../utils/dates'
import { clamp, percent } from '../utils/math'
import { currentStreak, longestStreak } from './habitService'
import { activeLifeAreas } from './settingsService'
import { totalXp } from './xpService'

export interface DayPoint {
  date: string
  tasksCompleted: number
  tasksTotal: number
  habitsCompleted: number
  habitsDue: number
  focusMinutes: number
  xp: number
}

export interface AnalyticsSummary {
  range: DateRangeKey
  keys: string[]
  taskCompletionRate: number
  habitConsistency: number
  focusHours: number
  xpEarned: number
  tasksCompleted: number
  tasksTotal: number
  habitsCompleted: number
  habitsDue: number
  goalsProgressed: number
  currentStreak: number
  longestStreak: number
  daily: DayPoint[]
}

export function earliestDataDate(state: AppState): string {
  const dates = [
    ...state.tasks.map((item) => item.date),
    ...state.habitCompletions.map((item) => item.date),
    ...state.focusSessions.map((item) => item.date),
    ...state.xpTransactions.map((item) => item.timestamp.slice(0, 10)),
    ...state.habits.map((item) => item.createdAt.slice(0, 10)),
  ].filter(Boolean)
  if (dates.length === 0) return todayKey()
  return dates.reduce((min, date) => (date < min ? date : min))
}

export function activityDates(state: AppState): string[] {
  const set = new Set<string>()
  for (const task of state.tasks) {
    if (task.completed && task.completedAt) set.add(task.completedAt.slice(0, 10))
  }
  for (const completion of state.habitCompletions) set.add(completion.date)
  return [...set]
}

export function globalStreak(state: AppState, today = todayKey()): { current: number; longest: number } {
  const dates = activityDates(state)
  return {
    current: currentStreak(dates, today),
    longest: longestStreak(dates),
  }
}

export function habitsDueOn(state: AppState, date: string): typeof state.habits {
  return state.habits.filter((habit) => {
    if (habit.archived) return false
    if (!habit.active && date > todayKey()) return false
    const created = habit.createdAt.slice(0, 10)
    return created <= date && (habit.active || date < todayKey())
  })
}

export function dayStats(state: AppState, date: string): DayPoint {
  const tasks = state.tasks.filter((task) => task.date === date)
  const dueHabits = habitsDueOn(state, date)
  const habitDone = state.habitCompletions.filter((item) => item.date === date)
  const focusMinutes = state.focusSessions
    .filter((session) => session.date === date)
    .reduce((sum, session) => sum + session.durationMinutes, 0)
  const xp = state.xpTransactions
    .filter((tx) => tx.timestamp.slice(0, 10) === date)
    .reduce((sum, tx) => sum + tx.amount, 0)
  return {
    date,
    tasksCompleted: tasks.filter((task) => task.completed).length,
    tasksTotal: tasks.length,
    habitsCompleted: habitDone.length,
    habitsDue: dueHabits.length,
    focusMinutes,
    xp,
  }
}

export function dailyCompletionPercent(point: DayPoint): number {
  const total = point.tasksTotal + point.habitsDue
  if (total === 0) return 0
  return percent(point.tasksCompleted + point.habitsCompleted, total)
}

export function computeAnalytics(state: AppState, range: DateRangeKey, today = todayKey()): AnalyticsSummary {
  const keys = keysForRange(range, earliestDataDate(state), today)
  const daily = keys.map((date) => dayStats(state, date))
  const tasksCompleted = daily.reduce((sum, day) => sum + day.tasksCompleted, 0)
  const tasksTotal = daily.reduce((sum, day) => sum + day.tasksTotal, 0)
  const habitsCompleted = daily.reduce((sum, day) => sum + day.habitsCompleted, 0)
  const habitsDue = daily.reduce((sum, day) => sum + day.habitsDue, 0)
  const focusMinutes = daily.reduce((sum, day) => sum + day.focusMinutes, 0)
  const xpEarned = daily.reduce((sum, day) => sum + Math.max(0, day.xp), 0)
  const from = keys[0] ?? today
  const goalsProgressed = state.goals.filter((goal) => {
    if (!goal.lastProgressAt) return false
    return goal.lastProgressAt.slice(0, 10) >= from
  }).length
  const streaks = globalStreak(state, today)
  return {
    range,
    keys,
    taskCompletionRate: percent(tasksCompleted, tasksTotal),
    habitConsistency: percent(habitsCompleted, habitsDue),
    focusHours: Math.round((focusMinutes / 60) * 10) / 10,
    xpEarned,
    tasksCompleted,
    tasksTotal,
    habitsCompleted,
    habitsDue,
    goalsProgressed,
    currentStreak: streaks.current,
    longestStreak: streaks.longest,
    daily,
  }
}

function areaActivity(state: AppState, areaId: string, from: string, to: string): number {
  const keys = new Set(rangeKeys(from, to))
  const tasks = state.tasks.filter(
    (task) => task.lifeAreaId === areaId && task.completed && keys.has(task.date),
  ).length
  const habits = state.habitCompletions.filter((item) => {
    if (!keys.has(item.date)) return false
    return item.lifeAreaIdSnapshot === areaId
  }).length
  const focus = state.focusSessions
    .filter((session) => keys.has(session.date))
    .reduce((sum, session) => {
      if (session.taskId) {
        const task = state.tasks.find((item) => item.id === session.taskId)
        if (task?.lifeAreaId === areaId) return sum + session.durationMinutes
      }
      if (session.goalId) {
        const goal = state.goals.find((item) => item.id === session.goalId)
        if (goal?.lifeAreaId === areaId) return sum + session.durationMinutes
      }
      if (session.skillId && areaId === 'skills') return sum + session.durationMinutes
      return sum
    }, 0)
  return tasks * 12 + habits * 10 + focus * 0.15
}

export function lastActivityDate(state: AppState, areaId: string): string | null {
  const dates: string[] = []
  for (const task of state.tasks) {
    if (task.lifeAreaId === areaId && task.completed) dates.push(task.date)
  }
  for (const item of state.habitCompletions) {
    if (item.lifeAreaIdSnapshot === areaId) dates.push(item.date)
  }
  if (dates.length === 0) return null
  return dates.reduce((max, date) => (date > max ? date : max))
}

export function lifeAreaSnapshots(state: AppState, today = todayKey()): LifeAreaSnapshot[] {
  const currentFrom = addDays(today, -6)
  const previousFrom = addDays(today, -13)
  const previousTo = addDays(today, -7)
  return activeLifeAreas(state).map((area) => {
    const activityCurrent = areaActivity(state, area.id, currentFrom, today)
    const activityPrevious = areaActivity(state, area.id, previousFrom, previousTo)
    let trend: LifeAreaTrend = 'flat'
    if (activityCurrent > activityPrevious * 1.12) trend = 'up'
    else if (activityCurrent < activityPrevious * 0.88) trend = 'down'
    const score = clamp(Math.round((activityCurrent / 80) * 100), 0, 100)
    return {
      areaId: area.id,
      name: area.name,
      color: area.color,
      score,
      trend,
      activityCurrent,
      activityPrevious,
    }
  })
}

export function totalXpValue(state: AppState): number {
  return totalXp(state.xpTransactions)
}
