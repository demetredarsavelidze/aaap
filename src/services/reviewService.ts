import type { AppState, DailyReview, JournalEntry, Mood, WeeklyReview } from '../types'
import { isoNow } from '../utils/dates'
import { createId } from '../utils/id'
import { awardXp, reverseXp } from './xpService'

export interface DailyReviewInput {
  date: string
  accomplished: string
  wentWell: string
  wastedTime: string
  avoided: string
  improve: string
  tomorrowPriorities: string
  rating: number
}

export function upsertDailyReview(state: AppState, input: DailyReviewInput, isDemo = false): AppState {
  const existing = state.dailyReviews.find((item) => item.date === input.date)
  const review: DailyReview = {
    id: existing?.id ?? createId(),
    date: input.date,
    accomplished: input.accomplished,
    wentWell: input.wentWell,
    wastedTime: input.wastedTime,
    avoided: input.avoided,
    improve: input.improve,
    tomorrowPriorities: input.tomorrowPriorities,
    rating: input.rating,
    createdAt: existing?.createdAt ?? isoNow(),
    updatedAt: isoNow(),
    isDemo: existing?.isDemo ?? isDemo,
  }
  const reviews = existing
    ? state.dailyReviews.map((item) => (item.id === existing.id ? review : item))
    : [...state.dailyReviews, review]
  let next: AppState = { ...state, dailyReviews: reviews }
  if (!existing) {
    next = awardXp(next, 10, 'review', `daily:${input.date}`, `Daily review ${input.date}`, isDemo)
  }
  return next
}

export function deleteDailyReview(state: AppState, id: string): AppState {
  const review = state.dailyReviews.find((item) => item.id === id)
  if (!review) return state
  const next = reverseXp(state, 'review', `daily:${review.date}`, 'Daily review deleted')
  return { ...next, dailyReviews: next.dailyReviews.filter((item) => item.id !== id) }
}

export interface WeeklyReviewInput {
  weekStart: string
  biggestWin: string
  biggestFailure: string
  stopDoing: string
  continueDoing: string
  changeNextWeek: string
}

export function upsertWeeklyReview(state: AppState, input: WeeklyReviewInput, isDemo = false): AppState {
  const existing = state.weeklyReviews.find((item) => item.weekStart === input.weekStart)
  const review: WeeklyReview = {
    id: existing?.id ?? createId(),
    weekStart: input.weekStart,
    biggestWin: input.biggestWin,
    biggestFailure: input.biggestFailure,
    stopDoing: input.stopDoing,
    continueDoing: input.continueDoing,
    changeNextWeek: input.changeNextWeek,
    createdAt: existing?.createdAt ?? isoNow(),
    updatedAt: isoNow(),
    isDemo: existing?.isDemo ?? isDemo,
  }
  const reviews = existing
    ? state.weeklyReviews.map((item) => (item.id === existing.id ? review : item))
    : [...state.weeklyReviews, review]
  return { ...state, weeklyReviews: reviews }
}

export interface JournalInput {
  title: string
  content: string
  date: string
  mood: Mood
  tags: string[]
}

export function addJournalEntry(state: AppState, input: JournalInput, isDemo = false): AppState {
  const entry: JournalEntry = {
    id: createId(),
    title: input.title.trim(),
    content: input.content,
    date: input.date,
    mood: input.mood,
    tags: input.tags.map((tag) => tag.trim()).filter(Boolean),
    createdAt: isoNow(),
    updatedAt: isoNow(),
    isDemo,
  }
  return { ...state, journalEntries: [...state.journalEntries, entry] }
}

export function updateJournalEntry(state: AppState, id: string, input: JournalInput): AppState {
  return {
    ...state,
    journalEntries: state.journalEntries.map((entry) =>
      entry.id === id
        ? {
            ...entry,
            title: input.title.trim(),
            content: input.content,
            date: input.date,
            mood: input.mood,
            tags: input.tags.map((tag) => tag.trim()).filter(Boolean),
            updatedAt: isoNow(),
          }
        : entry,
    ),
  }
}

export function deleteJournalEntry(state: AppState, id: string): AppState {
  return { ...state, journalEntries: state.journalEntries.filter((entry) => entry.id !== id) }
}
