export type TaskPriority = 'low' | 'medium' | 'high'
export type GoalStatus = 'not_started' | 'active' | 'paused' | 'completed'
export type SkillLevel = 'beginner' | 'developing' | 'intermediate' | 'advanced' | 'mastery'
export type ChallengeStatus = 'active' | 'paused' | 'completed' | 'failed'
export type ChallengeUnit = 'days' | 'hours' | 'count'
export type Mood = 'low' | 'off' | 'ok' | 'good' | 'high'
export type WeekStartDay = 0 | 1
export type ThemePreference = 'dark' | 'darker'
export type HabitFrequency = 'daily'

export type XpSourceType =
  | 'task'
  | 'habit'
  | 'milestone'
  | 'goal'
  | 'focus'
  | 'challenge'
  | 'review'
  | 'skill_milestone'

export interface User {
  name: string
}

export interface LifeArea {
  id: string
  name: string
  color: string
  order: number
  archived: boolean
  isDemo: boolean
}

export interface Settings {
  defaultTaskXp: number
  defaultHabitXp: number
  defaultMilestoneXp: number
  defaultFocusMinutes: number
  weekStartsOn: WeekStartDay
  theme: ThemePreference
}

export interface Task {
  id: string
  title: string
  description: string
  date: string
  lifeAreaId: string
  priority: TaskPriority
  estimatedMinutes: number
  xpReward: number
  completed: boolean
  completedAt: string | null
  isTodayPriority: boolean
  createdAt: string
  isDemo: boolean
}

export interface Habit {
  id: string
  name: string
  description: string
  lifeAreaId: string
  frequency: HabitFrequency
  xpReward: number
  createdAt: string
  active: boolean
  archived: boolean
  isDemo: boolean
}

export interface HabitCompletion {
  id: string
  habitId: string
  date: string
  completedAt: string
  habitNameSnapshot: string
  lifeAreaIdSnapshot: string
  xpAwarded: number
  isDemo: boolean
}

export interface GoalMilestone {
  id: string
  title: string
  completed: boolean
  completedAt: string | null
  xpReward: number
}

export interface Goal {
  id: string
  title: string
  description: string
  lifeAreaId: string
  startDate: string
  deadline: string
  target: string
  progress: number
  status: GoalStatus
  milestones: GoalMilestone[]
  createdAt: string
  lastProgressAt: string | null
  isDemo: boolean
}

export interface SkillMilestone {
  id: string
  title: string
  completed: boolean
  completedAt: string | null
  xpReward: number
}

export interface Skill {
  id: string
  name: string
  category: string
  currentLevel: SkillLevel
  target: string
  manualHours: number
  notes: string
  milestones: SkillMilestone[]
  createdAt: string
  isDemo: boolean
}

export interface FocusSession {
  id: string
  startTime: string
  endTime: string
  durationMinutes: number
  taskId: string | null
  goalId: string | null
  skillId: string | null
  date: string
  xpAwarded: number
  isDemo: boolean
}

export interface ActiveFocus {
  startedAt: number
  durationMs: number
  pausedAt: number | null
  totalPausedMs: number
  taskId: string | null
  goalId: string | null
  skillId: string | null
}

export interface DailyReview {
  id: string
  date: string
  accomplished: string
  wentWell: string
  wastedTime: string
  avoided: string
  improve: string
  tomorrowPriorities: string
  rating: number
  createdAt: string
  updatedAt: string
  isDemo: boolean
}

export interface WeeklyReview {
  id: string
  weekStart: string
  biggestWin: string
  biggestFailure: string
  stopDoing: string
  continueDoing: string
  changeNextWeek: string
  createdAt: string
  updatedAt: string
  isDemo: boolean
}

export interface JournalEntry {
  id: string
  title: string
  content: string
  date: string
  mood: Mood
  tags: string[]
  createdAt: string
  updatedAt: string
  isDemo: boolean
}

export interface Achievement {
  id: string
  title: string
  description: string
  unlocked: boolean
  unlockedAt: string | null
}

export interface XPTransaction {
  id: string
  amount: number
  sourceType: XpSourceType
  sourceId: string
  timestamp: string
  description: string
  isDemo: boolean
}

export interface Challenge {
  id: string
  name: string
  description: string
  target: number
  unit: ChallengeUnit
  startDate: string
  endDate: string
  lifeAreaId: string
  status: ChallengeStatus
  createdAt: string
  isDemo: boolean
}

export interface ChallengeCheckin {
  id: string
  challengeId: string
  date: string
  amount: number
  createdAt: string
  isDemo: boolean
}

export interface PersonalRule {
  id: string
  text: string
  active: boolean
  checkDaily: boolean
  createdAt: string
  isDemo: boolean
}

export interface RuleCheck {
  id: string
  ruleId: string
  date: string
  kept: boolean
  createdAt: string
  isDemo: boolean
}

export interface AppState {
  version: 1
  demoActive: boolean
  user: User
  settings: Settings
  lifeAreas: LifeArea[]
  tasks: Task[]
  habits: Habit[]
  habitCompletions: HabitCompletion[]
  goals: Goal[]
  skills: Skill[]
  focusSessions: FocusSession[]
  activeFocus: ActiveFocus | null
  dailyReviews: DailyReview[]
  weeklyReviews: WeeklyReview[]
  journalEntries: JournalEntry[]
  xpTransactions: XPTransaction[]
  challenges: Challenge[]
  challengeCheckins: ChallengeCheckin[]
  personalRules: PersonalRule[]
  ruleChecks: RuleCheck[]
}

export interface AttentionItem {
  id: string
  message: string
  severity: 'info' | 'warn' | 'critical'
  href: string
}

export type LifeAreaTrend = 'up' | 'down' | 'flat'

export interface LifeAreaSnapshot {
  areaId: string
  name: string
  color: string
  score: number
  trend: LifeAreaTrend
  activityCurrent: number
  activityPrevious: number
}

export type DateRangeKey = '7d' | '30d' | '90d' | 'all'
