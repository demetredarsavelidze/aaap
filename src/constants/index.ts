import type { LifeArea, Settings, User } from '../types'

export const STORAGE_KEY = 'ascension:v1'

export const DEFAULT_USER: User = {
  name: '',
}

export const DEFAULT_SETTINGS: Settings = {
  defaultTaskXp: 25,
  defaultHabitXp: 15,
  defaultMilestoneXp: 40,
  defaultFocusMinutes: 50,
  weekStartsOn: 1,
  theme: 'dark',
}

export const DEFAULT_LIFE_AREAS: Omit<LifeArea, 'isDemo'>[] = [
  { id: 'career', name: 'Career', color: '#6d8cff', order: 0, archived: false },
  { id: 'body', name: 'Body', color: '#3dd68c', order: 1, archived: false },
  { id: 'mind', name: 'Mind', color: '#c084fc', order: 2, archived: false },
  { id: 'money', name: 'Money', color: '#e6c35c', order: 3, archived: false },
  { id: 'social', name: 'Social', color: '#f07178', order: 4, archived: false },
  { id: 'discipline', name: 'Discipline', color: '#94a3b8', order: 5, archived: false },
  { id: 'skills', name: 'Skills', color: '#5eead4', order: 6, archived: false },
]

export const SKILL_LEVELS = [
  'beginner',
  'developing',
  'intermediate',
  'advanced',
  'mastery',
] as const

export const SKILL_LEVEL_LABELS: Record<(typeof SKILL_LEVELS)[number], string> = {
  beginner: 'Beginner',
  developing: 'Developing',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  mastery: 'Mastery',
}

export const GOAL_STATUS_LABELS = {
  not_started: 'Not Started',
  active: 'Active',
  paused: 'Paused',
  completed: 'Completed',
} as const

export const PRIORITY_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
} as const

export const MOOD_LABELS = {
  low: 'Low',
  off: 'Off',
  ok: 'Okay',
  good: 'Good',
  high: 'High',
} as const

export const FOCUS_PRESETS = [25, 50, 90] as const

export const NAV_ITEMS = [
  { to: '/', label: 'Today', icon: 'layout-dashboard' },
  { to: '/planner', label: 'Planner', icon: 'calendar' },
  { to: '/goals', label: 'Goals', icon: 'flag' },
  { to: '/habits', label: 'Habits', icon: 'repeat' },
  { to: '/focus', label: 'Focus', icon: 'timer' },
  { to: '/skills', label: 'Skills', icon: 'graduation-cap' },
  { to: '/analytics', label: 'Analytics', icon: 'chart-no-axes-column' },
  { to: '/review', label: 'Review', icon: 'clipboard-check' },
  { to: '/journal', label: 'Journal', icon: 'book-open' },
  { to: '/achievements', label: 'Achievements', icon: 'medal' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
] as const

/**
 * Level curve: XP required to go from level L to L+1.
 * xpToNext(L) = round(140 * L^1.42)
 *
 * This is intentionally slow. Completing a typical day (~80–120 XP)
 * should not jump multiple levels. Rough cumulative XP:
 *   L5  ~ 1,600
 *   L10 ~ 5,400
 *   L20 ~ 18,000
 */
export function xpToNextLevel(level: number): number {
  return Math.max(80, Math.round(140 * Math.pow(level, 1.42)))
}

export function focusXpForMinutes(minutes: number): number {
  return Math.max(8, Math.round(minutes / 2))
}
