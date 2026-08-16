import type { AppState, Goal, GoalMilestone, GoalStatus } from '../types'
import { isoNow } from '../utils/dates'
import { createId } from '../utils/id'
import { percent } from '../utils/math'
import { awardXp, reverseXp } from './xpService'

export interface GoalInput {
  title: string
  description: string
  lifeAreaId: string
  startDate: string
  deadline: string
  target: string
  milestones: string[]
}

export function addGoal(state: AppState, input: GoalInput, isDemo = false): AppState {
  const milestones: GoalMilestone[] = input.milestones
    .map((title) => title.trim())
    .filter(Boolean)
    .map((title) => ({
      id: createId(),
      title,
      completed: false,
      completedAt: null,
      xpReward: state.settings.defaultMilestoneXp,
    }))
  const goal: Goal = {
    id: createId(),
    title: input.title.trim(),
    description: input.description.trim(),
    lifeAreaId: input.lifeAreaId,
    startDate: input.startDate,
    deadline: input.deadline,
    target: input.target.trim(),
    progress: 0,
    status: 'active',
    milestones,
    createdAt: isoNow(),
    lastProgressAt: null,
    isDemo,
  }
  return { ...state, goals: [...state.goals, goal] }
}

export function updateGoal(state: AppState, id: string, patch: Partial<GoalInput> & { status?: GoalStatus }): AppState {
  return {
    ...state,
    goals: state.goals.map((goal) => {
      if (goal.id !== id) return goal
      let milestones = goal.milestones
      if (patch.milestones) {
        milestones = patch.milestones
          .map((title) => title.trim())
          .filter(Boolean)
          .map((title) => {
            const existing = goal.milestones.find((m) => m.title === title)
            return (
              existing ?? {
                id: createId(),
                title,
                completed: false,
                completedAt: null,
                xpReward: state.settings.defaultMilestoneXp,
              }
            )
          })
      }
      const next = {
        ...goal,
        title: patch.title !== undefined ? patch.title.trim() : goal.title,
        description: patch.description !== undefined ? patch.description.trim() : goal.description,
        lifeAreaId: patch.lifeAreaId ?? goal.lifeAreaId,
        startDate: patch.startDate ?? goal.startDate,
        deadline: patch.deadline ?? goal.deadline,
        target: patch.target !== undefined ? patch.target.trim() : goal.target,
        status: patch.status ?? goal.status,
        milestones,
      }
      return { ...next, progress: progressFromMilestones(next.milestones) }
    }),
  }
}

export function deleteGoal(state: AppState, id: string): AppState {
  const goal = state.goals.find((item) => item.id === id)
  if (!goal) return state
  let next = reverseXp(state, 'goal', id, `Goal deleted: ${goal.title}`)
  for (const milestone of goal.milestones) {
    next = reverseXp(next, 'milestone', milestone.id, `Milestone deleted: ${milestone.title}`)
  }
  return { ...next, goals: next.goals.filter((item) => item.id !== id) }
}

export function setGoalStatus(state: AppState, id: string, status: GoalStatus): AppState {
  const goal = state.goals.find((item) => item.id === id)
  if (!goal) return state
  let next = state
  if (status === 'completed' && goal.status !== 'completed') {
    next = awardXp(state, 100, 'goal', id, `Completed goal: ${goal.title}`, goal.isDemo)
  }
  if (status !== 'completed' && goal.status === 'completed') {
    next = reverseXp(state, 'goal', id, `Reopened goal: ${goal.title}`)
  }
  return {
    ...next,
    goals: next.goals.map((item) =>
      item.id === id
        ? {
            ...item,
            status,
            progress: status === 'completed' ? 100 : progressFromMilestones(item.milestones),
            lastProgressAt: status === 'completed' ? isoNow() : item.lastProgressAt,
          }
        : item,
    ),
  }
}

export function toggleMilestone(state: AppState, goalId: string, milestoneId: string): AppState {
  const goal = state.goals.find((item) => item.id === goalId)
  if (!goal) return state
  const milestone = goal.milestones.find((item) => item.id === milestoneId)
  if (!milestone) return state

  let next = state
  if (milestone.completed) {
    next = reverseXp(state, 'milestone', milestoneId, `Unchecked milestone: ${milestone.title}`)
  } else {
    next = awardXp(
      state,
      milestone.xpReward,
      'milestone',
      milestoneId,
      `Milestone: ${milestone.title}`,
      goal.isDemo,
    )
  }

  return {
    ...next,
    goals: next.goals.map((item) => {
      if (item.id !== goalId) return item
      const milestones = item.milestones.map((m) =>
        m.id === milestoneId
          ? { ...m, completed: !m.completed, completedAt: m.completed ? null : isoNow() }
          : m,
      )
      const progress = progressFromMilestones(milestones)
      const allDone = milestones.length > 0 && milestones.every((m) => m.completed)
      return {
        ...item,
        milestones,
        progress,
        lastProgressAt: isoNow(),
        status: allDone && item.status === 'active' ? 'completed' : item.status,
      }
    }),
  }
}

export function progressFromMilestones(milestones: GoalMilestone[]): number {
  if (milestones.length === 0) return 0
  return percent(milestones.filter((m) => m.completed).length, milestones.length)
}
