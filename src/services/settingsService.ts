import type { AppState, LifeArea, Settings, User } from '../types'
import { createId } from '../utils/id'

export function updateUser(state: AppState, user: Partial<User>): AppState {
  return { ...state, user: { ...state.user, ...user } }
}

export function updateSettings(state: AppState, patch: Partial<Settings>): AppState {
  return { ...state, settings: { ...state.settings, ...patch } }
}

export function addLifeArea(state: AppState, name: string, color: string): AppState {
  const area: LifeArea = {
    id: createId(),
    name: name.trim(),
    color,
    order: state.lifeAreas.length,
    archived: false,
    isDemo: false,
  }
  return { ...state, lifeAreas: [...state.lifeAreas, area] }
}

export function updateLifeArea(state: AppState, id: string, patch: Partial<Pick<LifeArea, 'name' | 'color' | 'archived'>>): AppState {
  return {
    ...state,
    lifeAreas: state.lifeAreas.map((area) => (area.id === id ? { ...area, ...patch } : area)),
  }
}

export function reorderLifeAreas(state: AppState, ids: string[]): AppState {
  return {
    ...state,
    lifeAreas: state.lifeAreas.map((area) => ({
      ...area,
      order: ids.indexOf(area.id) === -1 ? area.order : ids.indexOf(area.id),
    })),
  }
}

export function clearDemoData(state: AppState): AppState {
  const drop = <T extends { isDemo: boolean }>(items: T[]) => items.filter((item) => !item.isDemo)
  return {
    ...state,
    demoActive: false,
    tasks: drop(state.tasks),
    habits: drop(state.habits),
    habitCompletions: drop(state.habitCompletions),
    goals: drop(state.goals),
    skills: drop(state.skills),
    focusSessions: drop(state.focusSessions),
    dailyReviews: drop(state.dailyReviews),
    weeklyReviews: drop(state.weeklyReviews),
    journalEntries: drop(state.journalEntries),
    xpTransactions: drop(state.xpTransactions),
    challenges: drop(state.challenges),
    challengeCheckins: drop(state.challengeCheckins),
    personalRules: drop(state.personalRules),
    ruleChecks: drop(state.ruleChecks),
    lifeAreas: state.lifeAreas.map((area) => ({ ...area, isDemo: false })),
  }
}

export function activeLifeAreas(state: AppState): LifeArea[] {
  return [...state.lifeAreas].filter((area) => !area.archived).sort((a, b) => a.order - b.order)
}
