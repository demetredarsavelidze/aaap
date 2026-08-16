/**
 * ASCENSION SCORE (0–100)
 *
 * A rolling 7-day performance index. It is not a lifetime vanity total.
 * Each component is computed from stored tasks, habits, focus sessions,
 * goals, and life-area activity — never from hardcoded demo numbers.
 *
 *   Score = round(
 *     0.25 * taskCompletion +
 *     0.25 * habitConsistency +
 *     0.20 * focusActivity +
 *     0.15 * goalMomentum +
 *     0.15 * areaBalance
 *   )
 *
 * Components (each 0–100):
 *
 * 1. Task completion — completed / scheduled tasks in the last 7 days.
 *    Days with no scheduled tasks do not inflate the rate.
 *
 * 2. Habit consistency — completed / due daily habits in the last 7 days.
 *
 * 3. Focus activity — minutes focused vs a 150-minute weekly target,
 *    capped at 100. Zero minutes = 0.
 *
 * 4. Goal momentum — share of active/completed goals that recorded
 *    progress (milestone, status change) in the last 14 days.
 *
 * 5. Area balance — average of per-area scores, penalized when any
 *    area has zero activity in the last 7 days.
 *
 * Life-area sub-scores shown under the headline use the same 7-day
 * activity model as the Ascension Map (tasks, habits, focus).
 */
import type { AppState, LifeAreaSnapshot } from '../types'
import { todayKey } from '../utils/dates'
import { clamp } from '../utils/math'
import { computeAnalytics, lifeAreaSnapshots } from './analyticsService'

export interface ScoreBreakdown {
  score: number
  taskCompletion: number
  habitConsistency: number
  focusActivity: number
  goalMomentum: number
  areaBalance: number
  areas: LifeAreaSnapshot[]
}

export function computeAscensionScore(state: AppState, today = todayKey()): ScoreBreakdown {
  const week = computeAnalytics(state, '7d', today)
  const areas = lifeAreaSnapshots(state, today)

  const taskCompletion = week.tasksTotal === 0 ? 40 : week.taskCompletionRate
  const habitConsistency = week.habitsDue === 0 ? 40 : week.habitConsistency
  const focusActivity = clamp(Math.round((week.focusHours / 2.5) * 100), 0, 100)

  const trackedGoals = state.goals.filter((goal) => goal.status === 'active' || goal.status === 'completed')
  const recentGoals = trackedGoals.filter((goal) => {
    if (!goal.lastProgressAt) return goal.status === 'completed'
    return goal.lastProgressAt.slice(0, 10) >= week.keys[0]
  }).length
  const goalMomentum =
    trackedGoals.length === 0 ? 40 : clamp(Math.round((recentGoals / trackedGoals.length) * 100), 0, 100)

  const areaScores = areas.map((area) => area.score)
  const mean = areaScores.length === 0 ? 0 : areaScores.reduce((sum, n) => sum + n, 0) / areaScores.length
  const neglected = areas.filter((area) => area.activityCurrent === 0).length
  const areaBalance = clamp(Math.round(mean - neglected * 8), 0, 100)

  const score = clamp(
    Math.round(
      0.25 * taskCompletion +
        0.25 * habitConsistency +
        0.2 * focusActivity +
        0.15 * goalMomentum +
        0.15 * areaBalance,
    ),
    0,
    100,
  )

  return {
    score,
    taskCompletion,
    habitConsistency,
    focusActivity,
    goalMomentum,
    areaBalance,
    areas,
  }
}
