import { xpToNextLevel } from '../constants'
import type { AppState, XPTransaction, XpSourceType } from '../types'
import { isoNow } from '../utils/dates'
import { createId } from '../utils/id'

export function totalXp(transactions: XPTransaction[]): number {
  return transactions.reduce((sum, tx) => sum + tx.amount, 0)
}

export function xpOnDate(transactions: XPTransaction[], dateKey: string): number {
  return transactions
    .filter((tx) => tx.timestamp.slice(0, 10) === dateKey)
    .reduce((sum, tx) => sum + tx.amount, 0)
}

export function netXpForSource(
  transactions: XPTransaction[],
  sourceType: XpSourceType,
  sourceId: string,
): number {
  return transactions
    .filter((tx) => tx.sourceType === sourceType && tx.sourceId === sourceId)
    .reduce((sum, tx) => sum + tx.amount, 0)
}

export interface LevelProgress {
  level: number
  currentXp: number
  nextLevelXp: number
  totalXp: number
}

export function levelFromXp(total: number): LevelProgress {
  let level = 1
  let remaining = Math.max(0, total)
  let needed = xpToNextLevel(level)
  while (remaining >= needed && level < 200) {
    remaining -= needed
    level += 1
    needed = xpToNextLevel(level)
  }
  return {
    level,
    currentXp: remaining,
    nextLevelXp: needed,
    totalXp: total,
  }
}

export function awardXp(
  state: AppState,
  amount: number,
  sourceType: XpSourceType,
  sourceId: string,
  description: string,
  isDemo = false,
): AppState {
  if (amount === 0) return state
  const existing = netXpForSource(state.xpTransactions, sourceType, sourceId)
  if (amount > 0 && existing > 0) return state
  if (amount < 0 && existing + amount < 0) return state

  const tx: XPTransaction = {
    id: createId(),
    amount,
    sourceType,
    sourceId,
    timestamp: isoNow(),
    description,
    isDemo,
  }
  return { ...state, xpTransactions: [...state.xpTransactions, tx] }
}

export function reverseXp(
  state: AppState,
  sourceType: XpSourceType,
  sourceId: string,
  description: string,
): AppState {
  const existing = netXpForSource(state.xpTransactions, sourceType, sourceId)
  if (existing <= 0) return state
  return awardXp(state, -existing, sourceType, sourceId, description)
}
