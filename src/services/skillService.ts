import type { AppState, Skill, SkillLevel } from '../types'
import { isoNow } from '../utils/dates'
import { createId } from '../utils/id'
import { awardXp, reverseXp } from './xpService'

export interface SkillInput {
  name: string
  category: string
  currentLevel: SkillLevel
  target: string
  manualHours: number
  notes: string
  milestones: string[]
}

export function addSkill(state: AppState, input: SkillInput, isDemo = false): AppState {
  const skill: Skill = {
    id: createId(),
    name: input.name.trim(),
    category: input.category.trim(),
    currentLevel: input.currentLevel,
    target: input.target.trim(),
    manualHours: input.manualHours,
    notes: input.notes.trim(),
    milestones: input.milestones
      .map((title) => title.trim())
      .filter(Boolean)
      .map((title) => ({
        id: createId(),
        title,
        completed: false,
        completedAt: null,
        xpReward: state.settings.defaultMilestoneXp,
      })),
    createdAt: isoNow(),
    isDemo,
  }
  return { ...state, skills: [...state.skills, skill] }
}

export function updateSkill(state: AppState, id: string, patch: Partial<SkillInput>): AppState {
  return {
    ...state,
    skills: state.skills.map((skill) => {
      if (skill.id !== id) return skill
      let milestones = skill.milestones
      if (patch.milestones) {
        milestones = patch.milestones
          .map((title) => title.trim())
          .filter(Boolean)
          .map((title) => {
            const existing = skill.milestones.find((m) => m.title === title)
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
      return {
        ...skill,
        name: patch.name !== undefined ? patch.name.trim() : skill.name,
        category: patch.category !== undefined ? patch.category.trim() : skill.category,
        currentLevel: patch.currentLevel ?? skill.currentLevel,
        target: patch.target !== undefined ? patch.target.trim() : skill.target,
        manualHours: patch.manualHours ?? skill.manualHours,
        notes: patch.notes !== undefined ? patch.notes.trim() : skill.notes,
        milestones,
      }
    }),
  }
}

export function deleteSkill(state: AppState, id: string): AppState {
  const skill = state.skills.find((item) => item.id === id)
  if (!skill) return state
  let next = state
  for (const milestone of skill.milestones) {
    next = reverseXp(next, 'skill_milestone', milestone.id, `Skill milestone deleted: ${milestone.title}`)
  }
  return { ...next, skills: next.skills.filter((item) => item.id !== id) }
}

export function toggleSkillMilestone(state: AppState, skillId: string, milestoneId: string): AppState {
  const skill = state.skills.find((item) => item.id === skillId)
  if (!skill) return state
  const milestone = skill.milestones.find((item) => item.id === milestoneId)
  if (!milestone) return state
  let next = state
  if (milestone.completed) {
    next = reverseXp(state, 'skill_milestone', milestoneId, `Unchecked: ${milestone.title}`)
  } else {
    next = awardXp(
      state,
      milestone.xpReward,
      'skill_milestone',
      milestoneId,
      `Skill milestone: ${milestone.title}`,
      skill.isDemo,
    )
  }
  return {
    ...next,
    skills: next.skills.map((item) => {
      if (item.id !== skillId) return item
      return {
        ...item,
        milestones: item.milestones.map((m) =>
          m.id === milestoneId
            ? { ...m, completed: !m.completed, completedAt: m.completed ? null : isoNow() }
            : m,
        ),
      }
    }),
  }
}
