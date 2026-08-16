import { focusXpForMinutes } from '../constants'
import type { ActiveFocus, AppState, FocusSession } from '../types'
import { isoNow, toDateKey } from '../utils/dates'
import { createId } from '../utils/id'
import { awardXp } from './xpService'

export function remainingMs(focus: ActiveFocus, now = Date.now()): number {
  const elapsed =
    focus.pausedAt !== null
      ? focus.pausedAt - focus.startedAt - focus.totalPausedMs
      : now - focus.startedAt - focus.totalPausedMs
  return Math.max(0, focus.durationMs - elapsed)
}

export function elapsedMs(focus: ActiveFocus, now = Date.now()): number {
  return focus.durationMs - remainingMs(focus, now)
}

export function startFocus(
  state: AppState,
  durationMinutes: number,
  refs: { taskId: string | null; goalId: string | null; skillId: string | null },
): AppState {
  if (state.activeFocus) return state
  return {
    ...state,
    activeFocus: {
      startedAt: Date.now(),
      durationMs: durationMinutes * 60_000,
      pausedAt: null,
      totalPausedMs: 0,
      taskId: refs.taskId,
      goalId: refs.goalId,
      skillId: refs.skillId,
    },
  }
}

export function pauseFocus(state: AppState): AppState {
  if (!state.activeFocus || state.activeFocus.pausedAt !== null) return state
  return {
    ...state,
    activeFocus: { ...state.activeFocus, pausedAt: Date.now() },
  }
}

export function resumeFocus(state: AppState): AppState {
  if (!state.activeFocus || state.activeFocus.pausedAt === null) return state
  const pausedFor = Date.now() - state.activeFocus.pausedAt
  return {
    ...state,
    activeFocus: {
      ...state.activeFocus,
      pausedAt: null,
      totalPausedMs: state.activeFocus.totalPausedMs + pausedFor,
    },
  }
}

export function stopFocus(state: AppState, complete: boolean): AppState {
  const active = state.activeFocus
  if (!active) return state
  if (!complete) return { ...state, activeFocus: null }

  const minutes = Math.max(1, Math.round(elapsedMs(active) / 60_000))
  const xp = focusXpForMinutes(minutes)
  const session: FocusSession = {
    id: createId(),
    startTime: new Date(active.startedAt).toISOString(),
    endTime: isoNow(),
    durationMinutes: minutes,
    taskId: active.taskId,
    goalId: active.goalId,
    skillId: active.skillId,
    date: toDateKey(new Date()),
    xpAwarded: xp,
    isDemo: false,
  }
  const withSession = {
    ...state,
    activeFocus: null,
    focusSessions: [...state.focusSessions, session],
  }
  return awardXp(withSession, xp, 'focus', session.id, `Focus session (${minutes}m)`)
}

export function completeExpiredFocus(state: AppState, now = Date.now()): AppState {
  if (!state.activeFocus) return state
  if (remainingMs(state.activeFocus, now) > 0) return state
  const active = state.activeFocus
  const minutes = Math.max(1, Math.round(active.durationMs / 60_000))
  const xp = focusXpForMinutes(minutes)
  const session: FocusSession = {
    id: createId(),
    startTime: new Date(active.startedAt).toISOString(),
    endTime: new Date(now).toISOString(),
    durationMinutes: minutes,
    taskId: active.taskId,
    goalId: active.goalId,
    skillId: active.skillId,
    date: toDateKey(new Date(now)),
    xpAwarded: xp,
    isDemo: false,
  }
  const withSession = {
    ...state,
    activeFocus: null,
    focusSessions: [...state.focusSessions, session],
  }
  return awardXp(withSession, xp, 'focus', session.id, `Focus session (${minutes}m)`)
}

export function hoursForSkill(state: AppState, skillId: string): number {
  const skill = state.skills.find((item) => item.id === skillId)
  const focused = state.focusSessions
    .filter((session) => session.skillId === skillId)
    .reduce((sum, session) => sum + session.durationMinutes, 0)
  return (skill?.manualHours ?? 0) + focused / 60
}

export function minutesOnDate(state: AppState, date: string): number {
  return state.focusSessions
    .filter((session) => session.date === date)
    .reduce((sum, session) => sum + session.durationMinutes, 0)
}
