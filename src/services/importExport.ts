import type {
  ActiveFocus,
  AppState,
  Challenge,
  ChallengeCheckin,
  DailyReview,
  FocusSession,
  Goal,
  GoalMilestone,
  Habit,
  HabitCompletion,
  JournalEntry,
  LifeArea,
  PersonalRule,
  RuleCheck,
  Settings,
  Skill,
  SkillMilestone,
  Task,
  User,
  WeeklyReview,
  XPTransaction,
} from '../types'
import { isBoolean, isNumber, isRecord, isString, isStringArray } from '../utils/guards'
import { createEmptyState } from './emptyState'

function asString(value: unknown, fallback = ''): string {
  return isString(value) ? value : fallback
}

function asNumber(value: unknown, fallback = 0): number {
  return isNumber(value) ? value : fallback
}

function asBoolean(value: unknown, fallback = false): boolean {
  return isBoolean(value) ? value : fallback
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function parseActiveFocus(value: unknown): ActiveFocus | null {
  if (!isRecord(value) || !isNumber(value.startedAt) || !isNumber(value.durationMs)) return null
  return {
    startedAt: value.startedAt,
    durationMs: value.durationMs,
    pausedAt: isNumber(value.pausedAt) ? value.pausedAt : null,
    totalPausedMs: asNumber(value.totalPausedMs),
    taskId: isString(value.taskId) ? value.taskId : null,
    goalId: isString(value.goalId) ? value.goalId : null,
    skillId: isString(value.skillId) ? value.skillId : null,
  }
}

function parseUser(value: unknown): User {
  if (!isRecord(value)) return createEmptyState().user
  return { name: asString(value.name) }
}

function parseSettings(value: unknown): Settings {
  const defaults = createEmptyState().settings
  if (!isRecord(value)) return defaults
  const weekStartsOn = value.weekStartsOn === 0 ? 0 : 1
  return {
    defaultTaskXp: asNumber(value.defaultTaskXp, defaults.defaultTaskXp),
    defaultHabitXp: asNumber(value.defaultHabitXp, defaults.defaultHabitXp),
    defaultMilestoneXp: asNumber(value.defaultMilestoneXp, defaults.defaultMilestoneXp),
    defaultFocusMinutes: asNumber(value.defaultFocusMinutes, defaults.defaultFocusMinutes),
    weekStartsOn,
    theme: value.theme === 'darker' ? 'darker' : 'dark',
  }
}

function parseLifeArea(value: unknown): LifeArea | null {
  if (!isRecord(value) || !isString(value.id) || !isString(value.name)) return null
  return {
    id: value.id,
    name: value.name,
    color: asString(value.color, '#6d8cff'),
    order: asNumber(value.order),
    archived: asBoolean(value.archived),
    isDemo: asBoolean(value.isDemo),
  }
}

function parseTask(value: unknown): Task | null {
  if (!isRecord(value) || !isString(value.id) || !isString(value.title) || !isString(value.date)) return null
  const priority = value.priority === 'high' || value.priority === 'low' ? value.priority : 'medium'
  return {
    id: value.id,
    title: value.title,
    description: asString(value.description),
    date: value.date,
    lifeAreaId: asString(value.lifeAreaId),
    priority,
    estimatedMinutes: asNumber(value.estimatedMinutes, 30),
    xpReward: asNumber(value.xpReward, 25),
    completed: asBoolean(value.completed),
    completedAt: isString(value.completedAt) ? value.completedAt : null,
    isTodayPriority: asBoolean(value.isTodayPriority),
    createdAt: asString(value.createdAt),
    isDemo: asBoolean(value.isDemo),
  }
}

function parseHabit(value: unknown): Habit | null {
  if (!isRecord(value) || !isString(value.id) || !isString(value.name)) return null
  return {
    id: value.id,
    name: value.name,
    description: asString(value.description),
    lifeAreaId: asString(value.lifeAreaId),
    frequency: 'daily',
    xpReward: asNumber(value.xpReward, 15),
    createdAt: asString(value.createdAt),
    active: value.active === false ? false : true,
    archived: asBoolean(value.archived),
    isDemo: asBoolean(value.isDemo),
  }
}

function parseHabitCompletion(value: unknown): HabitCompletion | null {
  if (!isRecord(value) || !isString(value.id) || !isString(value.habitId) || !isString(value.date)) return null
  return {
    id: value.id,
    habitId: value.habitId,
    date: value.date,
    completedAt: asString(value.completedAt),
    habitNameSnapshot: asString(value.habitNameSnapshot),
    lifeAreaIdSnapshot: asString(value.lifeAreaIdSnapshot),
    xpAwarded: asNumber(value.xpAwarded),
    isDemo: asBoolean(value.isDemo),
  }
}

function parseMilestone(value: unknown): GoalMilestone | null {
  if (!isRecord(value) || !isString(value.id) || !isString(value.title)) return null
  return {
    id: value.id,
    title: value.title,
    completed: asBoolean(value.completed),
    completedAt: isString(value.completedAt) ? value.completedAt : null,
    xpReward: asNumber(value.xpReward, 40),
  }
}

function parseGoal(value: unknown): Goal | null {
  if (!isRecord(value) || !isString(value.id) || !isString(value.title)) return null
  const status =
    value.status === 'not_started' ||
    value.status === 'paused' ||
    value.status === 'completed'
      ? value.status
      : 'active'
  return {
    id: value.id,
    title: value.title,
    description: asString(value.description),
    lifeAreaId: asString(value.lifeAreaId),
    startDate: asString(value.startDate),
    deadline: asString(value.deadline),
    target: asString(value.target),
    progress: asNumber(value.progress),
    status,
    milestones: asArray(value.milestones).map(parseMilestone).filter((m): m is GoalMilestone => m !== null),
    createdAt: asString(value.createdAt),
    lastProgressAt: isString(value.lastProgressAt) ? value.lastProgressAt : null,
    isDemo: asBoolean(value.isDemo),
  }
}

function parseSkillMilestone(value: unknown): SkillMilestone | null {
  if (!isRecord(value) || !isString(value.id) || !isString(value.title)) return null
  return {
    id: value.id,
    title: value.title,
    completed: asBoolean(value.completed),
    completedAt: isString(value.completedAt) ? value.completedAt : null,
    xpReward: asNumber(value.xpReward, 40),
  }
}

function parseSkill(value: unknown): Skill | null {
  if (!isRecord(value) || !isString(value.id) || !isString(value.name)) return null
  const levels = ['beginner', 'developing', 'intermediate', 'advanced', 'mastery'] as const
  const currentLevel = levels.includes(value.currentLevel as (typeof levels)[number])
    ? (value.currentLevel as Skill['currentLevel'])
    : 'beginner'
  return {
    id: value.id,
    name: value.name,
    category: asString(value.category),
    currentLevel,
    target: asString(value.target),
    manualHours: asNumber(value.manualHours),
    notes: asString(value.notes),
    milestones: asArray(value.milestones)
      .map(parseSkillMilestone)
      .filter((m): m is SkillMilestone => m !== null),
    createdAt: asString(value.createdAt),
    isDemo: asBoolean(value.isDemo),
  }
}

function parseFocusSession(value: unknown): FocusSession | null {
  if (!isRecord(value) || !isString(value.id) || !isString(value.date)) return null
  return {
    id: value.id,
    startTime: asString(value.startTime),
    endTime: asString(value.endTime),
    durationMinutes: asNumber(value.durationMinutes),
    taskId: isString(value.taskId) ? value.taskId : null,
    goalId: isString(value.goalId) ? value.goalId : null,
    skillId: isString(value.skillId) ? value.skillId : null,
    date: value.date,
    xpAwarded: asNumber(value.xpAwarded),
    isDemo: asBoolean(value.isDemo),
  }
}

function parseDailyReview(value: unknown): DailyReview | null {
  if (!isRecord(value) || !isString(value.id) || !isString(value.date)) return null
  return {
    id: value.id,
    date: value.date,
    accomplished: asString(value.accomplished),
    wentWell: asString(value.wentWell),
    wastedTime: asString(value.wastedTime),
    avoided: asString(value.avoided),
    improve: asString(value.improve),
    tomorrowPriorities: asString(value.tomorrowPriorities),
    rating: asNumber(value.rating, 5),
    createdAt: asString(value.createdAt),
    updatedAt: asString(value.updatedAt),
    isDemo: asBoolean(value.isDemo),
  }
}

function parseWeeklyReview(value: unknown): WeeklyReview | null {
  if (!isRecord(value) || !isString(value.id) || !isString(value.weekStart)) return null
  return {
    id: value.id,
    weekStart: value.weekStart,
    biggestWin: asString(value.biggestWin),
    biggestFailure: asString(value.biggestFailure),
    stopDoing: asString(value.stopDoing),
    continueDoing: asString(value.continueDoing),
    changeNextWeek: asString(value.changeNextWeek),
    createdAt: asString(value.createdAt),
    updatedAt: asString(value.updatedAt),
    isDemo: asBoolean(value.isDemo),
  }
}

function parseJournalEntry(value: unknown): JournalEntry | null {
  if (!isRecord(value) || !isString(value.id) || !isString(value.date)) return null
  const moods = ['low', 'off', 'ok', 'good', 'high'] as const
  const mood = moods.includes(value.mood as (typeof moods)[number])
    ? (value.mood as JournalEntry['mood'])
    : 'ok'
  return {
    id: value.id,
    title: asString(value.title),
    content: asString(value.content),
    date: value.date,
    mood,
    tags: isStringArray(value.tags) ? value.tags : [],
    createdAt: asString(value.createdAt),
    updatedAt: asString(value.updatedAt),
    isDemo: asBoolean(value.isDemo),
  }
}

function parseXp(value: unknown): XPTransaction | null {
  if (!isRecord(value) || !isString(value.id) || !isNumber(value.amount) || !isString(value.sourceType)) {
    return null
  }
  return {
    id: value.id,
    amount: value.amount,
    sourceType: value.sourceType as XPTransaction['sourceType'],
    sourceId: asString(value.sourceId),
    timestamp: asString(value.timestamp),
    description: asString(value.description),
    isDemo: asBoolean(value.isDemo),
  }
}

function parseChallenge(value: unknown): Challenge | null {
  if (!isRecord(value) || !isString(value.id) || !isString(value.name)) return null
  const status =
    value.status === 'paused' || value.status === 'completed' || value.status === 'failed'
      ? value.status
      : 'active'
  const unit = value.unit === 'hours' || value.unit === 'count' ? value.unit : 'days'
  return {
    id: value.id,
    name: value.name,
    description: asString(value.description),
    target: asNumber(value.target, 30),
    unit,
    startDate: asString(value.startDate),
    endDate: asString(value.endDate),
    lifeAreaId: asString(value.lifeAreaId),
    status,
    createdAt: asString(value.createdAt),
    isDemo: asBoolean(value.isDemo),
  }
}

function parseChallengeCheckin(value: unknown): ChallengeCheckin | null {
  if (!isRecord(value) || !isString(value.id) || !isString(value.challengeId) || !isString(value.date)) {
    return null
  }
  return {
    id: value.id,
    challengeId: value.challengeId,
    date: value.date,
    amount: asNumber(value.amount, 1),
    createdAt: asString(value.createdAt),
    isDemo: asBoolean(value.isDemo),
  }
}

function parseRule(value: unknown): PersonalRule | null {
  if (!isRecord(value) || !isString(value.id) || !isString(value.text)) return null
  return {
    id: value.id,
    text: value.text,
    active: value.active === false ? false : true,
    checkDaily: value.checkDaily === false ? false : true,
    createdAt: asString(value.createdAt),
    isDemo: asBoolean(value.isDemo),
  }
}

function parseRuleCheck(value: unknown): RuleCheck | null {
  if (!isRecord(value) || !isString(value.id) || !isString(value.ruleId) || !isString(value.date)) return null
  return {
    id: value.id,
    ruleId: value.ruleId,
    date: value.date,
    kept: asBoolean(value.kept),
    createdAt: asString(value.createdAt),
    isDemo: asBoolean(value.isDemo),
  }
}

export function parseAppState(value: unknown): AppState | null {
  if (!isRecord(value)) return null
  return {
    version: 1,
    demoActive: asBoolean(value.demoActive),
    user: parseUser(value.user),
    settings: parseSettings(value.settings),
    lifeAreas: asArray(value.lifeAreas).map(parseLifeArea).filter((item): item is LifeArea => item !== null),
    tasks: asArray(value.tasks).map(parseTask).filter((item): item is Task => item !== null),
    habits: asArray(value.habits).map(parseHabit).filter((item): item is Habit => item !== null),
    habitCompletions: asArray(value.habitCompletions)
      .map(parseHabitCompletion)
      .filter((item): item is HabitCompletion => item !== null),
    goals: asArray(value.goals).map(parseGoal).filter((item): item is Goal => item !== null),
    skills: asArray(value.skills).map(parseSkill).filter((item): item is Skill => item !== null),
    focusSessions: asArray(value.focusSessions)
      .map(parseFocusSession)
      .filter((item): item is FocusSession => item !== null),
    activeFocus: parseActiveFocus(value.activeFocus),
    dailyReviews: asArray(value.dailyReviews)
      .map(parseDailyReview)
      .filter((item): item is DailyReview => item !== null),
    weeklyReviews: asArray(value.weeklyReviews)
      .map(parseWeeklyReview)
      .filter((item): item is WeeklyReview => item !== null),
    journalEntries: asArray(value.journalEntries)
      .map(parseJournalEntry)
      .filter((item): item is JournalEntry => item !== null),
    xpTransactions: asArray(value.xpTransactions)
      .map(parseXp)
      .filter((item): item is XPTransaction => item !== null),
    challenges: asArray(value.challenges)
      .map(parseChallenge)
      .filter((item): item is Challenge => item !== null),
    challengeCheckins: asArray(value.challengeCheckins)
      .map(parseChallengeCheckin)
      .filter((item): item is ChallengeCheckin => item !== null),
    personalRules: asArray(value.personalRules)
      .map(parseRule)
      .filter((item): item is PersonalRule => item !== null),
    ruleChecks: asArray(value.ruleChecks)
      .map(parseRuleCheck)
      .filter((item): item is RuleCheck => item !== null),
  }
}

export function validateImport(value: unknown): { ok: true; state: AppState } | { ok: false; error: string } {
  const parsed = parseAppState(value)
  if (!parsed) return { ok: false, error: 'File is not valid ASCENSION JSON.' }
  if (parsed.lifeAreas.length === 0) {
    return { ok: false, error: 'Imported data must include at least one life area.' }
  }
  return { ok: true, state: parsed }
}
