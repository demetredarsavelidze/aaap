import type { AppState, Challenge, ChallengeStatus, ChallengeUnit } from '../types'
import { isoNow } from '../utils/dates'
import { createId } from '../utils/id'
import { awardXp, reverseXp } from './xpService'

export interface ChallengeInput {
  name: string
  description: string
  target: number
  unit: ChallengeUnit
  startDate: string
  endDate: string
  lifeAreaId: string
}

export function addChallenge(state: AppState, input: ChallengeInput, isDemo = false): AppState {
  const challenge: Challenge = {
    id: createId(),
    name: input.name.trim(),
    description: input.description.trim(),
    target: input.target,
    unit: input.unit,
    startDate: input.startDate,
    endDate: input.endDate,
    lifeAreaId: input.lifeAreaId,
    status: 'active',
    createdAt: isoNow(),
    isDemo,
  }
  return { ...state, challenges: [...state.challenges, challenge] }
}

export function updateChallenge(
  state: AppState,
  id: string,
  patch: Partial<ChallengeInput> & { status?: ChallengeStatus },
): AppState {
  return {
    ...state,
    challenges: state.challenges.map((item) =>
      item.id === id
        ? {
            ...item,
            name: patch.name !== undefined ? patch.name.trim() : item.name,
            description: patch.description !== undefined ? patch.description.trim() : item.description,
            target: patch.target ?? item.target,
            unit: patch.unit ?? item.unit,
            startDate: patch.startDate ?? item.startDate,
            endDate: patch.endDate ?? item.endDate,
            lifeAreaId: patch.lifeAreaId ?? item.lifeAreaId,
            status: patch.status ?? item.status,
          }
        : item,
    ),
  }
}

export function deleteChallenge(state: AppState, id: string): AppState {
  const next = reverseXp(state, 'challenge', id, 'Challenge deleted')
  return {
    ...next,
    challenges: next.challenges.filter((item) => item.id !== id),
    challengeCheckins: next.challengeCheckins.filter((item) => item.challengeId !== id),
  }
}

export function challengeProgress(state: AppState, challengeId: string): number {
  return state.challengeCheckins
    .filter((item) => item.challengeId === challengeId)
    .reduce((sum, item) => sum + item.amount, 0)
}

export function toggleChallengeCheckin(state: AppState, challengeId: string, date: string): AppState {
  const challenge = state.challenges.find((item) => item.id === challengeId)
  if (!challenge || challenge.status !== 'active') return state
  const existing = state.challengeCheckins.find(
    (item) => item.challengeId === challengeId && item.date === date,
  )
  if (existing) {
    return {
      ...state,
      challengeCheckins: state.challengeCheckins.filter((item) => item.id !== existing.id),
    }
  }
  let next: AppState = {
    ...state,
    challengeCheckins: [
      ...state.challengeCheckins,
      {
        id: createId(),
        challengeId,
        date,
        amount: 1,
        createdAt: isoNow(),
        isDemo: challenge.isDemo,
      },
    ],
  }
  const progress = challengeProgress(next, challengeId)
  if (progress >= challenge.target && challenge.status === 'active') {
    next = {
      ...next,
      challenges: next.challenges.map((item) =>
        item.id === challengeId ? { ...item, status: 'completed' } : item,
      ),
    }
    next = awardXp(next, 75, 'challenge', challengeId, `Completed challenge: ${challenge.name}`, challenge.isDemo)
  }
  return next
}

export interface RuleInput {
  text: string
  checkDaily: boolean
}

export function addRule(state: AppState, input: RuleInput, isDemo = false): AppState {
  return {
    ...state,
    personalRules: [
      ...state.personalRules,
      {
        id: createId(),
        text: input.text.trim(),
        active: true,
        checkDaily: input.checkDaily,
        createdAt: isoNow(),
        isDemo,
      },
    ],
  }
}

export function updateRule(state: AppState, id: string, patch: Partial<RuleInput> & { active?: boolean }): AppState {
  return {
    ...state,
    personalRules: state.personalRules.map((rule) =>
      rule.id === id
        ? {
            ...rule,
            text: patch.text !== undefined ? patch.text.trim() : rule.text,
            checkDaily: patch.checkDaily ?? rule.checkDaily,
            active: patch.active ?? rule.active,
          }
        : rule,
    ),
  }
}

export function deleteRule(state: AppState, id: string): AppState {
  return {
    ...state,
    personalRules: state.personalRules.filter((rule) => rule.id !== id),
    ruleChecks: state.ruleChecks.filter((check) => check.ruleId !== id),
  }
}

export function setRuleCheck(state: AppState, ruleId: string, date: string, kept: boolean): AppState {
  const existing = state.ruleChecks.find((item) => item.ruleId === ruleId && item.date === date)
  if (existing) {
    if (existing.kept === kept) {
      return {
        ...state,
        ruleChecks: state.ruleChecks.filter((item) => item.id !== existing.id),
      }
    }
    return {
      ...state,
      ruleChecks: state.ruleChecks.map((item) => (item.id === existing.id ? { ...item, kept } : item)),
    }
  }
  return {
    ...state,
    ruleChecks: [
      ...state.ruleChecks,
      {
        id: createId(),
        ruleId,
        date,
        kept,
        createdAt: isoNow(),
        isDemo: false,
      },
    ],
  }
}
