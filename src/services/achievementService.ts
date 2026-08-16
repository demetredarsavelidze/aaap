import type { Achievement, AppState } from '../types'
import { todayKey } from '../utils/dates'
import { dailyCompletionPercent, dayStats, globalStreak } from './analyticsService'
import { hoursForSkill } from './focusService'
import { currentStreak } from './habitService'
import { totalXp } from './xpService'

interface AchievementDef {
  id: string
  title: string
  description: string
  unlocked: (state: AppState) => boolean
}

const DEFINITIONS: AchievementDef[] = [
  {
    id: 'first_perfect_day',
    title: 'First Perfect Day',
    description: 'Complete every scheduled task and habit in a single day.',
    unlocked: (state) => {
      const dates = new Set([
        ...state.tasks.map((task) => task.date),
        ...state.habitCompletions.map((item) => item.date),
      ])
      return [...dates].some((date) => {
        const point = dayStats(state, date)
        return point.tasksTotal + point.habitsDue > 0 && dailyCompletionPercent(point) === 100
      })
    },
  },
  {
    id: 'streak_7',
    title: '7 Day Streak',
    description: 'Log activity on 7 consecutive days.',
    unlocked: (state) => globalStreak(state).current >= 7 || globalStreak(state).longest >= 7,
  },
  {
    id: 'streak_30',
    title: '30 Day Streak',
    description: 'Log activity on 30 consecutive days.',
    unlocked: (state) => globalStreak(state).longest >= 30,
  },
  {
    id: 'focus_10h',
    title: '10 Focus Hours',
    description: 'Accumulate 10 hours of deep work.',
    unlocked: (state) => totalFocusHours(state) >= 10,
  },
  {
    id: 'focus_50h',
    title: '50 Focus Hours',
    description: 'Accumulate 50 hours of deep work.',
    unlocked: (state) => totalFocusHours(state) >= 50,
  },
  {
    id: 'tasks_100',
    title: '100 Tasks Completed',
    description: 'Complete 100 tasks.',
    unlocked: (state) => state.tasks.filter((task) => task.completed).length >= 100,
  },
  {
    id: 'first_goal',
    title: 'First Goal Completed',
    description: 'Mark a long-term goal as completed.',
    unlocked: (state) => state.goals.some((goal) => goal.status === 'completed'),
  },
  {
    id: 'xp_1000',
    title: '1000 XP Earned',
    description: 'Earn 1,000 lifetime XP.',
    unlocked: (state) => totalXp(state.xpTransactions) >= 1000,
  },
  {
    id: 'first_focus',
    title: 'First Deep Work',
    description: 'Complete your first focus session.',
    unlocked: (state) => state.focusSessions.length >= 1,
  },
  {
    id: 'habit_week',
    title: 'Habit Week',
    description: 'Keep any habit for 7 days in a row.',
    unlocked: (state) =>
      state.habits.some((habit) => {
        const dates = state.habitCompletions.filter((item) => item.habitId === habit.id).map((item) => item.date)
        return currentStreak(dates, todayKey()) >= 7 || dates.length >= 7
      }),
  },
  {
    id: 'reviews_7',
    title: 'Reflective',
    description: 'Write 7 daily reviews.',
    unlocked: (state) => state.dailyReviews.length >= 7,
  },
  {
    id: 'journal_5',
    title: 'Writer',
    description: 'Create 5 journal entries.',
    unlocked: (state) => state.journalEntries.length >= 5,
  },
  {
    id: 'skill_hours_20',
    title: 'Deliberate Practice',
    description: 'Invest 20 hours in a single skill.',
    unlocked: (state) => state.skills.some((skill) => hoursForSkill(state, skill.id) >= 20),
  },
  {
    id: 'level_5',
    title: 'Level 5',
    description: 'Reach level 5.',
    unlocked: (state) => {
      let remaining = totalXp(state.xpTransactions)
      let level = 1
      while (remaining >= Math.max(80, Math.round(140 * Math.pow(level, 1.42))) && level < 200) {
        remaining -= Math.max(80, Math.round(140 * Math.pow(level, 1.42)))
        level += 1
      }
      return level >= 5
    },
  },
]

function totalFocusHours(state: AppState): number {
  return state.focusSessions.reduce((sum, session) => sum + session.durationMinutes, 0) / 60
}

export function computeAchievements(state: AppState): Achievement[] {
  return DEFINITIONS.map((def) => ({
    id: def.id,
    title: def.title,
    description: def.description,
    unlocked: def.unlocked(state),
    unlockedAt: null,
  }))
}
