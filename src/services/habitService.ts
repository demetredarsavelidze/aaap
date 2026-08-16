import type { AppState, Habit } from '../types'
import { isoNow } from '../utils/dates'
import { createId } from '../utils/id'
import { awardXp, reverseXp } from './xpService'

export interface HabitInput {
  name: string
  description: string
  lifeAreaId: string
  xpReward: number
  active?: boolean
}

export function addHabit(state: AppState, input: HabitInput, isDemo = false): AppState {
  const habit: Habit = {
    id: createId(),
    name: input.name.trim(),
    description: input.description.trim(),
    lifeAreaId: input.lifeAreaId,
    frequency: 'daily',
    xpReward: input.xpReward,
    createdAt: isoNow(),
    active: input.active ?? true,
    archived: false,
    isDemo,
  }
  return { ...state, habits: [...state.habits, habit] }
}

export function updateHabit(state: AppState, id: string, patch: Partial<HabitInput>): AppState {
  return {
    ...state,
    habits: state.habits.map((habit) => {
      if (habit.id !== id) return habit
      return {
        ...habit,
        name: patch.name !== undefined ? patch.name.trim() : habit.name,
        description: patch.description !== undefined ? patch.description.trim() : habit.description,
        lifeAreaId: patch.lifeAreaId ?? habit.lifeAreaId,
        xpReward: patch.xpReward ?? habit.xpReward,
        active: patch.active ?? habit.active,
      }
    }),
  }
}

export function archiveHabit(state: AppState, id: string): AppState {
  return {
    ...state,
    habits: state.habits.map((habit) =>
      habit.id === id ? { ...habit, archived: true, active: false } : habit,
    ),
  }
}

export function toggleHabitCompletion(state: AppState, habitId: string, date: string): AppState {
  const habit = state.habits.find((item) => item.id === habitId)
  if (!habit) return state
  const sourceId = `${habitId}:${date}`
  const existing = state.habitCompletions.find((item) => item.habitId === habitId && item.date === date)

  if (existing) {
    const next = reverseXp(state, 'habit', sourceId, `Unchecked habit: ${habit.name}`)
    return {
      ...next,
      habitCompletions: next.habitCompletions.filter((item) => item.id !== existing.id),
    }
  }

  const next = awardXp(state, habit.xpReward, 'habit', sourceId, `Habit: ${habit.name}`, habit.isDemo)
  return {
    ...next,
    habitCompletions: [
      ...next.habitCompletions,
      {
        id: createId(),
        habitId,
        date,
        completedAt: isoNow(),
        habitNameSnapshot: habit.name,
        lifeAreaIdSnapshot: habit.lifeAreaId,
        xpAwarded: habit.xpReward,
        isDemo: habit.isDemo,
      },
    ],
  }
}

export function currentStreak(dates: string[], today: string): number {
  const set = new Set(dates)
  let cursor = set.has(today) ? today : previousDayIfMissed(set, today)
  if (!cursor) return 0
  let streak = 0
  while (set.has(cursor)) {
    streak += 1
    cursor = shift(cursor, -1)
  }
  return streak
}

export function longestStreak(dates: string[]): number {
  if (dates.length === 0) return 0
  const unique = [...new Set(dates)].sort()
  let best = 1
  let run = 1
  for (let i = 1; i < unique.length; i += 1) {
    const prev = unique[i - 1]
    const curr = unique[i]
    if (!prev || !curr) continue
    if (shift(prev, 1) === curr) {
      run += 1
      best = Math.max(best, run)
    } else {
      run = 1
    }
  }
  return best
}

function previousDayIfMissed(set: Set<string>, today: string): string | null {
  const yesterday = shift(today, -1)
  return set.has(yesterday) ? yesterday : null
}

function shift(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  const date = new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1)
  date.setDate(date.getDate() + days)
  const yy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}
