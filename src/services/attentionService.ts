import type { AppState, AttentionItem } from '../types'
import { addDays, daysBetween, startOfWeek, todayKey, weekKeys } from '../utils/dates'
import { percent } from '../utils/math'
import { computeAnalytics, lastActivityDate } from './analyticsService'
import { activeLifeAreas } from './settingsService'

export function getAttentionItems(state: AppState, today = todayKey()): AttentionItem[] {
  const items: AttentionItem[] = []
  const week = computeAnalytics(state, '7d', today)
  const prev = computeAnalyticsRangeShift(state, today)
  const areas = activeLifeAreas(state)

  for (const area of areas) {
    const last = lastActivityDate(state, area.id)
    if (!last) {
      items.push({
        id: `area-none-${area.id}`,
        message: `No recorded work in ${area.name} yet.`,
        severity: 'info',
        href: '/',
      })
      continue
    }
    const gap = daysBetween(last, today)
    if (gap >= 5) {
      items.push({
        id: `area-gap-${area.id}`,
        message: `You haven't worked on ${area.name} for ${gap} days.`,
        severity: gap >= 10 ? 'critical' : 'warn',
        href: '/analytics',
      })
    }
  }

  const weekStart = startOfWeek(today, state.settings.weekStartsOn)
  const thisWeek = new Set(weekKeys(weekStart))
  const overdue = state.tasks.filter((task) => !task.completed && task.date < today && thisWeek.has(task.date))
  const byArea = new Map<string, number>()
  for (const task of overdue) {
    byArea.set(task.lifeAreaId, (byArea.get(task.lifeAreaId) ?? 0) + 1)
  }
  for (const [areaId, count] of byArea) {
    if (count < 2) continue
    const area = areas.find((item) => item.id === areaId)
    items.push({
      id: `overdue-${areaId}`,
      message: `${count} ${area?.name ?? 'unassigned'} tasks were left incomplete this week.`,
      severity: 'warn',
      href: '/planner',
    })
  }

  if (prev.habitConsistency > 0 && week.habitConsistency + 10 <= prev.habitConsistency) {
    const drop = prev.habitConsistency - week.habitConsistency
    items.push({
      id: 'habit-drop',
      message: `Your habit completion rate dropped ${drop}% versus the previous week.`,
      severity: drop >= 20 ? 'critical' : 'warn',
      href: '/habits',
    })
  }

  for (const goal of state.goals.filter((item) => item.status === 'active')) {
    if (!goal.lastProgressAt) {
      const age = daysBetween(goal.startDate || goal.createdAt.slice(0, 10), today)
      if (age >= 7) {
        items.push({
          id: `goal-none-${goal.id}`,
          message: `No progress on “${goal.title}” since it started.`,
          severity: 'warn',
          href: '/goals',
        })
      }
      continue
    }
    const gap = daysBetween(goal.lastProgressAt.slice(0, 10), today)
    if (gap >= 12) {
      items.push({
        id: `goal-gap-${goal.id}`,
        message: `No progress on “${goal.title}” for ${gap} days.`,
        severity: 'warn',
        href: '/goals',
      })
    }
  }

  if (week.focusHours < 1 && state.focusSessions.length > 0) {
    items.push({
      id: 'focus-low',
      message: 'Focus time is under 1 hour in the last 7 days.',
      severity: 'info',
      href: '/focus',
    })
  }

  return items.slice(0, 8)
}

function computeAnalyticsRangeShift(state: AppState, today: string) {
  const previousEnd = addDays(today, -7)
  const previousStart = addDays(today, -13)
  const keys: string[] = []
  let cursor = previousStart
  while (cursor <= previousEnd) {
    keys.push(cursor)
    cursor = addDays(cursor, 1)
  }
  const currentHabits = state.habitCompletions.filter((item) => keys.includes(item.date)).length
  const due = keys.reduce((sum, date) => {
    return sum + state.habits.filter((habit) => !habit.archived && habit.createdAt.slice(0, 10) <= date).length
  }, 0)
  return { habitConsistency: percent(currentHabits, due) }
}
