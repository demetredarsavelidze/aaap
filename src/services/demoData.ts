import { focusXpForMinutes } from '../constants'
import type { AppState, FocusSession } from '../types'
import { addDays, todayKey } from '../utils/dates'
import { createId } from '../utils/id'
import { addChallenge, addRule, toggleChallengeCheckin } from './challengeService'
import { createEmptyState } from './emptyState'
import { addGoal, toggleMilestone } from './goalService'
import { addHabit, toggleHabitCompletion } from './habitService'
import { addJournalEntry, upsertDailyReview, upsertWeeklyReview } from './reviewService'
import { addSkill, toggleSkillMilestone } from './skillService'
import { addTask, setTodayPriority, toggleTaskComplete } from './taskService'
import { awardXp } from './xpService'

const DEMO = true

function apply(state: AppState, next: AppState | { error: string }): AppState {
  if ('error' in next) return state
  return next
}

export function createDemoState(): AppState {
  const today = todayKey()
  let state = createEmptyState()
  state = {
    ...state,
    demoActive: true,
    user: { name: 'Alex Rivera' },
  }

  state = addHabit(state, {
    name: 'Deep work block',
    description: 'Protect one uninterrupted block for the most important work.',
    lifeAreaId: 'career',
    xpReward: 20,
  }, DEMO)
  state = addHabit(state, {
    name: 'Strength or conditioning',
    description: 'Train. Walk. Move with intent.',
    lifeAreaId: 'body',
    xpReward: 15,
  }, DEMO)
  state = addHabit(state, {
    name: 'Read 20 pages',
    description: 'Non-fiction or technical reading.',
    lifeAreaId: 'mind',
    xpReward: 12,
  }, DEMO)
  state = addHabit(state, {
    name: 'No phone first 60 minutes',
    description: 'Start the day without a feed.',
    lifeAreaId: 'discipline',
    xpReward: 15,
  }, DEMO)
  state = addHabit(state, {
    name: 'Skill practice',
    description: 'Deliberate practice on a tracked skill.',
    lifeAreaId: 'skills',
    xpReward: 18,
  }, DEMO)

  const habits = state.habits
  for (let i = 45; i >= 0; i -= 1) {
    const date = addDays(today, -i)
    habits.forEach((habit, index) => {
      const miss = (i + index) % 9 === 0 || (i === 2 && index === 1) || (i === 1 && index === 2)
      if (miss && i !== 0) return
      if (i === 0 && index > 2) return
      state = toggleHabitCompletion(state, habit.id, date)
    })
  }

  state = addSkill(state, {
    name: 'TypeScript',
    category: 'Frontend',
    currentLevel: 'intermediate',
    target: 'Write production-grade typed React apps without hesitation.',
    manualHours: 4,
    notes: 'Focus on generics, discriminated unions, and strict app architecture.',
    milestones: ['Strict mode fluency', 'Advanced types', 'Ship a typed design system'],
  }, DEMO)
  state = addSkill(state, {
    name: 'React',
    category: 'Frontend',
    currentLevel: 'intermediate',
    target: 'Own complex client state and performance.',
    manualHours: 6,
    notes: 'Composition, data flow, and maintainable feature folders.',
    milestones: ['Hooks mental model', 'Routing + data layer', 'Production portfolio app'],
  }, DEMO)
  state = addSkill(state, {
    name: 'CSS',
    category: 'Frontend',
    currentLevel: 'developing',
    target: 'Design polished interfaces without a component library.',
    manualHours: 2,
    notes: 'Layout, tokens, and hierarchy.',
    milestones: ['Layout systems', 'Accessible forms', 'Dark UI polish'],
  }, DEMO)
  state = addSkill(state, {
    name: 'English',
    category: 'Communication',
    currentLevel: 'developing',
    target: 'Clear technical writing and interviews.',
    manualHours: 8,
    notes: 'Daily reading plus weekly writing.',
    milestones: ['Daily reading streak', 'Write 10 journal entries'],
  }, DEMO)

  const ts = state.skills.find((s) => s.name === 'TypeScript')
  const react = state.skills.find((s) => s.name === 'React')
  if (ts?.milestones[0]) state = toggleSkillMilestone(state, ts.id, ts.milestones[0].id)
  if (react?.milestones[0]) state = toggleSkillMilestone(state, react.id, react.milestones[0].id)

  state = addGoal(state, {
    title: 'Become job-ready frontend developer',
    description: 'Build the skill, proof, and application pipeline required for a serious frontend role.',
    lifeAreaId: 'career',
    startDate: addDays(today, -40),
    deadline: addDays(today, 80),
    target: '3 portfolio projects + active applications',
    milestones: [
      'Finish JavaScript',
      'Learn React',
      'Learn TypeScript',
      'Build portfolio',
      'Build 3 serious projects',
      'Apply to jobs',
    ],
  }, DEMO)
  state = addGoal(state, {
    title: 'Rebuild physical baseline',
    description: 'Consistent training, sleep, and energy — not a 30-day sprint.',
    lifeAreaId: 'body',
    startDate: addDays(today, -20),
    deadline: addDays(today, 70),
    target: 'Train 4x / week for 12 weeks',
    milestones: ['Establish 4-day training week', 'Sleep before 00:00 for 14 nights', 'Complete a 5k without stopping'],
  }, DEMO)
  state = addGoal(state, {
    title: 'Emergency fund floor',
    description: 'Stop treating money as an afterthought.',
    lifeAreaId: 'money',
    startDate: addDays(today, -15),
    deadline: addDays(today, 120),
    target: '3 months of expenses saved',
    milestones: ['Track every expense for 30 days', 'Automate a weekly transfer', 'Reach first month of runway'],
  }, DEMO)

  const careerGoal = state.goals.find((g) => g.lifeAreaId === 'career')
  if (careerGoal) {
    for (const milestone of careerGoal.milestones.slice(0, 3)) {
      state = toggleMilestone(state, careerGoal.id, milestone.id)
    }
  }
  const bodyGoal = state.goals.find((g) => g.lifeAreaId === 'body')
  if (bodyGoal?.milestones[0]) {
    state = toggleMilestone(state, bodyGoal.id, bodyGoal.milestones[0].id)
  }

  const todayTasks: Array<{ title: string; area: string; minutes: number; priority: 'high' | 'medium' | 'low'; pin?: boolean; done?: boolean }> = [
    { title: 'Ship the dashboard analytics calculations', area: 'career', minutes: 90, priority: 'high', pin: true },
    { title: 'TypeScript discriminated unions drill', area: 'skills', minutes: 50, priority: 'high', pin: true },
    { title: 'Lower-body training session', area: 'body', minutes: 60, priority: 'medium', pin: true },
    { title: 'Review weekly spending', area: 'money', minutes: 25, priority: 'medium' },
    { title: 'Message one person I have been avoiding', area: 'social', minutes: 15, priority: 'low' },
  ]

  for (const item of todayTasks) {
    state = addTask(state, {
      title: item.title,
      description: '',
      date: today,
      lifeAreaId: item.area,
      priority: item.priority,
      estimatedMinutes: item.minutes,
      xpReward: item.priority === 'high' ? 35 : 25,
      isTodayPriority: item.pin,
    }, DEMO)
  }

  const firstToday = state.tasks.find((task) => task.date === today)
  if (firstToday) state = toggleTaskComplete(state, firstToday.id)

  for (let i = 1; i <= 21; i += 1) {
    const date = addDays(today, -i)
    const batch = [
      { title: 'Implement feature slice', area: 'career', minutes: 80 },
      { title: 'Practice TypeScript', area: 'skills', minutes: 45 },
      { title: 'Training', area: 'body', minutes: 50 },
      { title: 'Read and take notes', area: 'mind', minutes: 30 },
    ]
    if (i % 4 === 0) batch.push({ title: 'Budget check-in', area: 'money', minutes: 20 })
    if (i % 5 === 0) batch.push({ title: 'Call or write someone', area: 'social', minutes: 20 })
    batch.forEach((item, index) => {
      state = addTask(state, {
        title: `${item.title}`,
        description: 'Demo historical task',
        date,
        lifeAreaId: item.area,
        priority: index === 0 ? 'high' : 'medium',
        estimatedMinutes: item.minutes,
        xpReward: 25,
      }, DEMO)
      const created = state.tasks[state.tasks.length - 1]
      const skip = i === 3 && index === 2
      if (created && !skip) state = toggleTaskComplete(state, created.id)
    })
  }

  for (let i = 0; i < 5; i += 1) {
    const date = addDays(today, i + 1)
    state = addTask(state, {
      title: i === 0 ? 'Write weekly review' : `Planned deep work ${i + 1}`,
      description: '',
      date,
      lifeAreaId: i % 2 === 0 ? 'career' : 'skills',
      priority: 'medium',
      estimatedMinutes: 50,
      xpReward: 25,
    }, DEMO)
  }

  const pin = state.tasks.filter((task) => task.date === today && !task.isTodayPriority)[0]
  if (pin) state = apply(state, setTodayPriority(state, pin.id, true))

  const skillByName = (name: string) => state.skills.find((s) => s.name === name)?.id ?? null
  for (let i = 0; i < 18; i += 1) {
    const date = addDays(today, -i)
    if (i === 2 || i === 8) continue
    const minutes = [50, 90, 25, 50][i % 4] ?? 50
    const skillId = [skillByName('TypeScript'), skillByName('React'), skillByName('CSS'), skillByName('TypeScript')][i % 4] ?? null
    const session: FocusSession = {
      id: createId(),
      startTime: `${date}T09:00:00.000Z`,
      endTime: `${date}T10:00:00.000Z`,
      durationMinutes: minutes,
      taskId: null,
      goalId: careerGoal?.id ?? null,
      skillId,
      date,
      xpAwarded: focusXpForMinutes(minutes),
      isDemo: true,
    }
    state = {
      ...state,
      focusSessions: [...state.focusSessions, session],
    }
    state = awardXp(state, session.xpAwarded, 'focus', session.id, `Focus session (${minutes}m)`, true)
  }

  state = addChallenge(state, {
    name: '30 Days of Code',
    description: 'Write code every day. No zero days.',
    target: 30,
    unit: 'days',
    startDate: addDays(today, -16),
    endDate: addDays(today, 13),
    lifeAreaId: 'career',
  }, DEMO)
  const challenge = state.challenges[0]
  if (challenge) {
    for (let i = 16; i >= 0; i -= 1) {
      if (i === 4) continue
      state = toggleChallengeCheckin(state, challenge.id, addDays(today, -i))
    }
  }

  state = addRule(state, { text: 'No social media before 12:00', checkDaily: true }, DEMO)
  state = addRule(state, { text: 'No phone during deep work', checkDaily: true }, DEMO)
  state = addRule(state, { text: 'Code before gaming', checkDaily: true }, DEMO)
  state = addRule(state, { text: 'Prepare tomorrow’s priorities before bed', checkDaily: true }, DEMO)

  for (let i = 1; i <= 10; i += 1) {
    const date = addDays(today, -i)
    state = upsertDailyReview(state, {
      date,
      accomplished: i % 3 === 0 ? 'Shipped a feature slice and trained.' : 'Completed the deep work block and kept the morning rule.',
      wentWell: 'Protected the first focus session.',
      wastedTime: i % 4 === 0 ? 'Unplanned scrolling after lunch.' : 'Context switching between too many tabs.',
      avoided: 'The money review.',
      improve: 'Decide the three priorities the night before.',
      tomorrowPriorities: 'Deep work, training, one admin block.',
      rating: 6 + (i % 4),
    }, DEMO)
  }

  state = upsertWeeklyReview(state, {
    weekStart: addDays(today, -7),
    biggestWin: 'Kept a coding streak through a messy midweek.',
    biggestFailure: 'Skipped two training sessions after late nights.',
    stopDoing: 'Opening social feeds between focus blocks.',
    continueDoing: 'Starting the day with a single defined deep-work target.',
    changeNextWeek: 'Put Body back on the calendar before 18:00.',
  }, DEMO)

  state = addJournalEntry(state, {
    title: 'Why the frontend path',
    content:
      'I want a system that compounds. Shipping real interfaces, tightening TypeScript, and refusing to treat fitness and money as optional side quests.',
    date: addDays(today, -3),
    mood: 'good',
    tags: ['career', 'direction'],
  }, DEMO)
  state = addJournalEntry(state, {
    title: 'Energy notes',
    content: 'Sleep after 01:00 wrecks the next morning block. The 50-minute timer is the right default. 90 minutes only works when the task is already scoped.',
    date: addDays(today, -1),
    mood: 'ok',
    tags: ['body', 'focus'],
  }, DEMO)

  return { ...state, demoActive: true }
}
