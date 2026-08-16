import { DEFAULT_LIFE_AREAS, DEFAULT_SETTINGS, DEFAULT_USER } from '../constants'
import type { AppState } from '../types'

export function createEmptyState(): AppState {
  return {
    version: 1,
    demoActive: false,
    user: { ...DEFAULT_USER },
    settings: { ...DEFAULT_SETTINGS },
    lifeAreas: DEFAULT_LIFE_AREAS.map((area) => ({ ...area, isDemo: false })),
    tasks: [],
    habits: [],
    habitCompletions: [],
    goals: [],
    skills: [],
    focusSessions: [],
    activeFocus: null,
    dailyReviews: [],
    weeklyReviews: [],
    journalEntries: [],
    xpTransactions: [],
    challenges: [],
    challengeCheckins: [],
    personalRules: [],
    ruleChecks: [],
  }
}
